import os
import subprocess
import json
import urllib.parse
import sys

# CONFIG
ROOT_PACKAGES = [
    "lucide-react@latest",
    "tailwindcss@latest",
    "postcss@latest",
    "autoprefixer@latest"
]

PROXY_URL = "http://thiago.tco:Aresluci01%21%21@proxy.pmfi.pr.gov.br:8080"
PROXY_CMD = f"-x {PROXY_URL}"
REGISTRY = "https://registry.npmjs.org"
CWD = os.path.join(os.getcwd(), "frontend_web")
DOWNLOAD_DIR = os.path.join(CWD, "sideload_cache")

visited = set()
files_to_install = []

def run_command(cmd, capture_output=True):
    try:
        result = subprocess.run(
            cmd, shell=True, check=True, 
            stdout=subprocess.PIPE if capture_output else None,
            stderr=subprocess.PIPE if capture_output else None,
            text=True
        )
        return result.stdout.strip() if capture_output else True
    except subprocess.CalledProcessError as e:
        # print(f"CMD Error: {e}") 
        return None

def fetch_package(name, version_req):
    key = f"{name}" 
    if key in visited:
        return
    visited.add(key)

    print(f"🔎 Resolving: {name}")
    
    escaped_name = name
    if name.startswith("@"):
        escaped_name = name.replace("/", "%2f")

    # Fetch Config
    # Uses PROXY_CMD
    json_str = run_command(f"curl -s {PROXY_CMD} {REGISTRY}/{escaped_name}/latest", capture_output=True)
    
    if not json_str:
        print(f"❌ Failed metadata: {name}")
        return

    try:
        data = json.loads(json_str)
        
        version = data['version']
        tarball_url = data['dist']['tarball']
        filename = f"{name.replace('/', '-')}-{version}.tgz"
        filepath = os.path.join(DOWNLOAD_DIR, filename)

        # Track for install list
        files_to_install.append(filename)

        # Download
        if not os.path.exists(filepath):
            print(f"⬇️  Downloading {name}@{version}")
            # run_command returns True if capture_output=False and success
            if not run_command(f"curl -L {PROXY_CMD} -o {filepath} {tarball_url}", capture_output=False):
                print(f"❌ Failed download: {tarball_url}")
        else:
            print(f"✅ Cached: {name}@{version}")

        # Recurse Dependencies
        deps = data.get('dependencies', {})
        for dep_name, dep_ver in deps.items():
            fetch_package(dep_name, dep_ver)

    except Exception as e:
        print(f"❌ Error parsing {name}: {e}")

# MAIN
if not os.path.exists(DOWNLOAD_DIR):
    os.makedirs(DOWNLOAD_DIR)

print("🚀 Starting Recursive Sideload...")
for pkg in ROOT_PACKAGES:
    name = pkg.split('@')[0]
    fetch_package(name, "latest")

print(f"\n📦 Found {len(files_to_install)} packages.")

# Generate install script
# We reference files relative to install.sh script execution in DOWNLOAD_DIR
install_cmd = "npm install " + " ".join([f"./{f}" for f in files_to_install]) + " --save-dev --legacy-peer-deps --no-audit --no-fund"

script_path = os.path.join(DOWNLOAD_DIR, "install.sh")
with open(script_path, "w") as f:
    f.write("#!/bin/bash\n")
    # Clean possible interfering env vars for npm?
    # Ensure proxy is OFF for npm since we use local files
    f.write("npm config delete proxy\n")
    f.write("npm config delete https-proxy\n")
    f.write("unset HTTP_PROXY\n")
    f.write("unset HTTPS_PROXY\n")
    f.write(install_cmd)

os.chmod(script_path, 0o755)

print("\n📜 Install script generated at: " + script_path)
print("👉 Running installation...")

subprocess.run(["./install.sh"], cwd=DOWNLOAD_DIR, check=False)
