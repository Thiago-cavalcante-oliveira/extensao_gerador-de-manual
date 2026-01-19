import os
import subprocess
import json
import urllib.parse
import re

# CONFIG
ROOT_PACKAGES = [
    ("lucide-react", "latest"),
    ("tailwindcss", "latest"),
    ("@tailwindcss/postcss", "latest"),
    ("postcss", "latest"),
    ("autoprefixer", "latest"),
    ("lightningcss-linux-x64-gnu", "latest"),
    ("@rollup/rollup-linux-x64-gnu", "latest"),
    ("@esbuild/linux-x64", "latest")
]

PROXY_URL = "http://thiago.tco:Aresluci01%21%21@proxy.pmfi.pr.gov.br:8080"
PROXY_CMD = f"-x {PROXY_URL}"
REGISTRY = "https://registry.npmjs.org"
CWD = os.path.join(os.getcwd(), "frontend_web")
DOWNLOAD_DIR = os.path.join(CWD, "sideload_deps")

visited = {} # pkg -> version
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
    # Very naive SemVer parser for MVP
    # Returns (major, minor, patch) tuple or None
    # req: "^3.3.7", "~1.2", "4.1.18"
    clean = re.sub(r'[\^~>=<]', '', req)
    parts = clean.split('.')
    try:
        return tuple(map(int, parts))
    except:
        return None

def find_best_version(versions, req):
    # versions: list of version strings ['1.0.0', '1.0.1', ...]
    # req: semver range string
    
    if req == "latest" or req == "*" or not req:
        return "latest" # caller handles this by looking up dist-tags
    
    # Naive logic:
    # 1. Clean req
    clean_req = re.sub(r'[\^~]', '', req)
    
    # Filter versions that match major
    target_v = parse_semver(clean_req)
    if not target_v: 
        return "latest"

    major = target_v[0]
    
    candidates = []
    for v in versions:
        parsed = parse_semver(v)
        if parsed and parsed[0] == major:
            candidates.append(v)
    
    if not candidates:
        # Fallback: exact match in list?
        if clean_req in versions:
            return clean_req
        return "latest" # Failed to match
    
    # Sort candidates semantically(ish)
    # Just lexical sort works for numbers mostly, but 3.10 > 3.2
    # Let's sort by tuple
    candidates.sort(key=lambda s: parse_semver(s) or (0,0,0), reverse=True)
    return candidates[0]

def fetch_package(name, version_req):
    # Check if already visited specific version?
    # Or visited generic name?
    # Dependency resolution usually requires tracking name -> resolved_version
    if name in visited:
        # We already picked a version for this package. 
        # In a real installer we'd check if visited[name] satisfies version_req.
        # Here we just assume "first come first served" MVP.
        return
    
    print(f"🔎 Resolving: {name} (req: {version_req})")
    
    escaped_name = name
    if name.startswith("@"):
        escaped_name = name.replace("/", "%2f")

    # Fetch FULL Metadata
    json_str = run_command(f"curl -s {PROXY_CMD} {REGISTRY}/{escaped_name}", capture_output=True)
    
    if not json_str:
        print(f"❌ Failed metadata: {name}")
        return

    try:
        data = json.loads(json_str)
        
        # Resolve Version
        available_versions = list(data.get('versions', {}).keys())
        
        chosen_version = None
        if version_req == "latest":
            chosen_version = data.get('dist-tags', {}).get('latest')
        else:
            chosen_version = find_best_version(available_versions, version_req)
            if chosen_version == "latest":
                chosen_version = data.get('dist-tags', {}).get('latest')
        
        if not chosen_version:
             print(f"❌ Failed resolution: {name}")
             return

        visited[name] = chosen_version
        print(f"   🎯 Picked: {chosen_version}")

        # Get Dist Data
        ver_data = data['versions'][chosen_version]
        tarball_url = ver_data['dist']['tarball']
        filename = f"{name.replace('/', '-')}-{chosen_version}.tgz"
        filepath = os.path.join(DOWNLOAD_DIR, filename)

        files_to_install.append(filename)

        # Download
        if not os.path.exists(filepath):
            print(f"   ⬇️  Downloading...")
            if not run_command(f"curl -s -L {PROXY_CMD} -o {filepath} {tarball_url}", capture_output=False):
                print(f"   ❌ Failed download.")
        else:
            print(f"   ✅ Cached.")

        # Recurse Dependencies
        deps = ver_data.get('dependencies', {})
        for dep_name, dep_ver in deps.items():
            fetch_package(dep_name, dep_ver)

    except Exception as e:
        print(f"❌ Error logic {name}: {e}")

# MAIN
if os.path.exists(DOWNLOAD_DIR):
    # shutil.rmtree(DOWNLOAD_DIR) # Keep cache?
    pass
else:
    os.makedirs(DOWNLOAD_DIR)

print("🚀 Starting Smart Recursive Sideload...")
for pkg_name, pkg_ver in ROOT_PACKAGES:
    fetch_package(pkg_name, pkg_ver)

print(f"\n📦 Found {len(files_to_install)} packages.")

# Generate install script with offline flag
install_cmd = "npm install " + " ".join([f"./{f}" for f in files_to_install]) + " --save-dev --legacy-peer-deps --no-audit --no-fund --offline --verbose"

script_path = os.path.join(DOWNLOAD_DIR, "install.sh")
with open(script_path, "w") as f:
    f.write("#!/bin/bash\n")
    f.write("npm config delete proxy\n")
    f.write("npm config delete https-proxy\n")
    f.write("unset HTTP_PROXY\n")
    f.write("unset HTTPS_PROXY\n")
    f.write(install_cmd)

os.chmod(script_path, 0o755)

print("\n📜 Install script generated at: " + script_path)
print("👉 Running installation...")

subprocess.run(["./install.sh"], cwd=DOWNLOAD_DIR, check=False)
