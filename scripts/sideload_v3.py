import os
import subprocess
import json
import urllib.parse
import re

# CONFIG: Explicitly requesting Stable v3
ROOT_PACKAGES = [
    ("ts-interface-checker", "latest"), # Missing transitive dep
    ("nanoid", "3.3.8"),          # Force compatible version for postcss
    ("lucide-react", "0.469.0"), 
    ("tailwindcss", "3.4.17"),   # Stable v3
    ("postcss", "8.4.33"),       # Stable
    ("autoprefixer", "10.4.17")  # Stable
]

PROXY_URL = "http://thiago.tco:Aresluci01%21%21@proxy.pmfi.pr.gov.br:8080"
PROXY_CMD = f"-x {PROXY_URL}"
REGISTRY = "https://registry.npmjs.org"
CWD = os.path.join(os.getcwd(), "frontend_web")
DOWNLOAD_DIR = os.path.join(CWD, "sideload_deps_v3")

visited = {} 
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
    except subprocess.CalledProcessError:
        return None

def parse_semver(req):
    # Matches simple 1.2.3 or 1.2
    clean = re.sub(r'[\^~>=<v]', '', req)
    parts = clean.split('.')
    try:
        return tuple(map(int, parts))
    except:
        return None

def find_best_version(versions, req):
    if not req or req == "latest" or req == "*":
        return "latest"
    
    # Try to clean
    clean_req = re.sub(r'[\^~>=<v]', '', req)
    target_v = parse_semver(clean_req)
    if not target_v: return "latest"
    
    major = target_v[0]
    
    candidates = []
    for v in versions:
        parsed = parse_semver(v)
        # Match Major version (simple logic)
        if parsed and parsed[0] == major:
            candidates.append(v)
    
    if not candidates:
        return "latest" # Fallback
    
    # Sort descending
    candidates.sort(key=lambda s: parse_semver(s) or (0,0,0), reverse=True)
    return candidates[0]

def fetch_package(name, version_req):
    if name in visited: return
    
    print(f"🔎 Resolving: {name} (req: {version_req})")
    escaped_name = name.replace("/", "%2f") if name.startswith("@") else name

    # Fetch Metadata
    json_str = run_command(f"curl -s {PROXY_CMD} {REGISTRY}/{escaped_name}", capture_output=True)
    if not json_str:
        print(f"❌ Failed metadata: {name}")
        return

    try:
        data = json.loads(json_str)
        available_versions = list(data.get('versions', {}).keys())

        chosen_version = None
        # Smart Select
        if version_req == "latest":
             chosen_version = data.get('dist-tags', {}).get('latest')
        else:
             chosen_version = find_best_version(available_versions, version_req)
             if chosen_version == "latest":
                 chosen_version = data.get('dist-tags', {}).get('latest')
        
        visited[name] = chosen_version
        print(f"   🎯 Picked: {chosen_version}")

        ver_data = data['versions'][chosen_version]
        tarball_url = ver_data['dist']['tarball']
        filename = f"{name.replace('/', '-')}-{chosen_version}.tgz"
        filepath = os.path.join(DOWNLOAD_DIR, filename)

        files_to_install.append(filename)

        if not os.path.exists(filepath):
            print(f"   ⬇️  Downloading...")
            if not run_command(f"curl -s -L {PROXY_CMD} -o {filepath} {tarball_url}", capture_output=False):
                print(f"   ❌ Failed download.")
        else:
            print(f"   ✅ Cached.")

        deps = ver_data.get('dependencies', {})
        for dep_name, dep_ver in deps.items():
            fetch_package(dep_name, dep_ver)

    except Exception as e:
        print(f"❌ Error logic {name}: {e}")

if not os.path.exists(DOWNLOAD_DIR):
    os.makedirs(DOWNLOAD_DIR)

print("🚀 Starting Sideload v3 (Smart)...")
for pkg_name, pkg_ver in ROOT_PACKAGES:
    fetch_package(pkg_name, pkg_ver)

print(f"\n📦 Found {len(files_to_install)} packages.")

install_cmd = "npm install " + " ".join([f"./{f}" for f in files_to_install]) + " --save-dev --legacy-peer-deps --no-audit --no-fund --offline --verbose"

script_path = os.path.join(DOWNLOAD_DIR, "install.sh")
with open(script_path, "w") as f:
    f.write("#!/bin/bash\n")
    # Clean env
    f.write("npm config delete proxy\n")
    f.write("npm config delete https-proxy\n")
    f.write("unset HTTP_PROXY\n")
    f.write("unset HTTPS_PROXY\n")
    f.write(install_cmd)
os.chmod(script_path, 0o755)

print("👉 Running installation...")
subprocess.run(["./install.sh"], cwd=DOWNLOAD_DIR, check=False)
