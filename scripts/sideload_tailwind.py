import os
import subprocess
import json
import sys

# Config
PACKAGES = ["tailwindcss", "postcss", "autoprefixer"]

# RAW for NPM (It might handle encoding internally or prefer raw in env?)
# Using raw '!!'
PROXY_URL_NPM = "http://thiago.tco:Aresluci01!!@proxy.pmfi.pr.gov.br:8080"

# ENCODED for CURL (Standard URL encoding)
PROXY_URL_CURL = "http://thiago.tco:Aresluci01%21%21@proxy.pmfi.pr.gov.br:8080"
PROXY_CMD = f"-x {PROXY_URL_CURL}"

CWD = os.path.join(os.getcwd(), "frontend_web")

# Prepare Env with Proxy for NPM
env = os.environ.copy()
env["HTTP_PROXY"] = PROXY_URL_NPM
env["HTTPS_PROXY"] = PROXY_URL_NPM
env["no_proxy"] = "localhost,127.0.0.1,.pmfi.pr.gov.br"

def run_command(cmd, capture_output=False):
    try:
        # Pass env to subprocess
        result = subprocess.run(
            cmd, shell=True, check=True, cwd=CWD, env=env,
            stdout=subprocess.PIPE if capture_output else None,
            stderr=subprocess.PIPE if capture_output else None,
            text=True
        )
        return result.stdout.strip() if capture_output else True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error running: {cmd}")
        if capture_output:
            print(e.stderr)
        return None

print("🔹 Iniciando instalação via Sideload (Raw Proxy for NPM)...")

for pkg in PACKAGES:
    print(f"\n📦 Processando: {pkg}")
    
    # 1. Get Metadata URL
    print(f"   ↳ Obtendo URL do tarball via curl...")
    # Curl uses PROXY_CMD (Encoded)
    json_str = run_command(f"curl -s {PROXY_CMD} https://registry.npmjs.org/{pkg}/latest", capture_output=True)
    
    if not json_str:
        print("   ❌ Falha ao obter metadata.")
        continue

    try:
        data = json.loads(json_str)
        tarball_url = data['dist']['tarball']
        version = data['version']
        filename = f"{pkg}-{version}.tgz"
        print(f"   ↳ Versão: {version}")
        print(f"   ↳ URL: {tarball_url}")
    except Exception as e:
        print(f"   ❌ Erro ao parsear JSON: {e}")
        continue

    # 2. Download Tarball
    print(f"   ↳ Baixando {filename}...")
    if not run_command(f"curl -L {PROXY_CMD} -o {filename} {tarball_url}"):
        print("   ❌ Falha no download.")
        continue

    # 3. NPM Install File
    print(f"   ↳ Instalando via npm...")
    # NPM uses 'env' (Raw)
    if run_command(f"npm install ./{filename} --save-dev --legacy-peer-deps --no-audit --no-fund"):
        print(f"   ✅ {pkg} instalado com sucesso!")
        os.remove(os.path.join(CWD, filename))
    else:
        print(f"   ❌ Falha no npm install do arquivo.")

print("\n🎉 Processo finalizado.")
