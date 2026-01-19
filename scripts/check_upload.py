import os
import asyncio

# Force Environment Variables BEFORE importing app settings
# to override any shell leakage
os.environ["MINIO_ENDPOINT"] = "minio-s3.pmfi.pr.gov.br"
os.environ["MINIO_ACCESS_KEY"] = "soSMaREjMMZA2afS8p3a"
os.environ["MINIO_SECRET_KEY"] = "kvDotAz0i6W59Rjw4V3plTzC7XpWjlUVcDltDXkz"
os.environ["MINIO_BUCKET_RAW"] = "documentacao"
os.environ["MINIO_SECURE"] = "true"
os.environ["HTTP_PROXY"] = "http://thiago.tco:Aresluci01%21%21@proxy.pmfi.pr.gov.br:8080"
os.environ["HTTPS_PROXY"] = "http://thiago.tco:Aresluci01%21%21@proxy.pmfi.pr.gov.br:8080"

# Now import
from app.services.storage import storage
import io

async def check_upload_local():
    print("Initializing Storage Service...")
    print(f"Endpoint: {storage.client._base_url}")
    
    try:
        data = b"Test Upload Content"
        filename = "test_upload_debug.txt"
        print(f"Uploading {filename}...")
        
        path = storage.save_video(data, filename, "text/plain")
        print(f"Success! Path: {path}")
        
    except Exception as e:
        print(f"FAILED: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_upload_local())
