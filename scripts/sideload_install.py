import os
import subprocess
import json
import urllib.request
import sys

# Config
PACKAGES = ["lucide-react", "recharts"]
PROXY_CMD = "-x http://thiago.tco:Aresluci01!!@proxy.pmfi.pr.gov.br:8080"
CWD = os.path.join(os.getcwd(), "frontend_web")

def run_command(cmd, capture_output=False):
    try:
        result = subprocess.run(
            cmd, shell=True, check=True, cwd=CWD, 
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

print("🔹 Iniciando instalação via Sideload (bypass npm proxy)...")

for pkg in PACKAGES:
    print(f"\n📦 Processando: {pkg}")
    
    # 1. Get Metadata URL
    print(f"   ↳ Obtendo URL do tarball via curl...")
    # Curl returns JSON. We grep for tarball if we want to be hacky, or just parse Python side if we can get the string.
    # Let's try to get the JSON string via curl
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
    if run_command(f"npm install ./{filename} --legacy-peer-deps"):
        print(f"   ✅ {pkg} instalado com sucesso!")
        # Cleanup
        os.remove(os.path.join(CWD, filename))
    else:
        print(f"   ❌ Falha no npm install do arquivo.")

print("\n🎉 Processo finalizado.")
