import os
import subprocess
import json
import shutil

# 1. Packages to bypass proxy for
PACKAGES = [
    "lucide-react",
    "tailwindcss", 
    "postcss", 
    "autoprefixer"
]

# 2. Config
PROXY_URL_CURL = "http://thiago.tco:Aresluci01%21%21@proxy.pmfi.pr.gov.br:8080"
PROXY_CMD = f"-x {PROXY_URL_CURL}"
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
        return None

print("🔹 Iniciando FULL Sideload...")

downloaded_files = []

for pkg in PACKAGES:
    print(f"\n📦 Metadata: {pkg}")
    json_str = run_command(f"curl -s {PROXY_CMD} https://registry.npmjs.org/{pkg}/latest", capture_output=True)
    
    if not json_str:
        print("   ❌ Falha ao obter metadata.")
        continue

    try:
        data = json.loads(json_str)
        tarball_url = data['dist']['tarball']
        version = data['version']
        filename = f"{pkg}-{version}.tgz"
        print(f"   ↳ URL: {tarball_url}")
    except Exception as e:
        print(f"   ❌ Erro JSON: {e}")
        continue

    print(f"   ↳ Download: {filename}")
    if run_command(f"curl -L {PROXY_CMD} -o {filename} {tarball_url}"):
        downloaded_files.append(filename)
    else:
        print("   ❌ Download falhou.")

if downloaded_files:
    print("\n📦 Instalando arquivos locais...")
    # Install dependencies first (lucide) then devDeps
    # We install all at once to let npm resolve peer deps if possible
    files_str = " ".join([f"./{f}" for f in downloaded_files])
    
    # --no-audit --no-fund to avoid network calls
    # --legacy-peer-deps to ignore conflicts
    if run_command(f"npm install {files_str} --save --no-audit --no-fund --legacy-peer-deps"):
        print("✅ Sucesso!")
        for f in downloaded_files:
            os.remove(os.path.join(CWD, f))
    else:
        print("❌ Instalação falhou.")
else:
    print("Nenhum arquivo baixado.")
