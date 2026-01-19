import google.generativeai as genai
import os
import requests

# Load config locally
API_KEY = "AIzaSyBPno1C1fvuvQx1vUKFTlWxwZHa9JWvJx0"
PROXY = "http://thiago.tco:Aresluci01%21%21@proxy.pmfi.pr.gov.br:8080"

# Set Proxy Env Vars for the process
os.environ["HTTP_PROXY"] = PROXY
os.environ["HTTPS_PROXY"] = PROXY
os.environ["http_proxy"] = PROXY
os.environ["https_proxy"] = PROXY

print(f"Testing Gemini Key: {API_KEY[:5]}...")
print(f"Using Proxy: {PROXY}")

# 1. Test basic connectivity to Google (via Requests)
try:
    print("1. Testing connection to google.com...")
    r = requests.get("https://www.google.com", timeout=5)
    print(f"   Success! Status: {r.status_code}")
except Exception as e:
    print(f"   Failed to connect to Google: {e}")

# 2. Configure Gemini
genai.configure(api_key=API_KEY)

# 3. List Models
try:
    print("2. Listing Gemini Models...")
    models = [m.name for m in genai.list_models()]
    print(f"   Found {len(models)} models.")
    for m in models:
        print(f"   - {m}")
except Exception as e:
    print(f"   Failed to list models: {e}")

# 4. Test Generation (Pro 1.5)
try:
    print("3. Testing Content Generation (gemini-1.5-pro)...")
    model = genai.GenerativeModel('gemini-1.5-pro')
    response = model.generate_content("Hello, this is a test.")
    print(f"   Success! Response: {response.text}")
except Exception as e:
    print(f"   Failed generation: {e}")
