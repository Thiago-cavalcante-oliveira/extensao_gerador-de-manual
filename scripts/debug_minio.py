import asyncio
from app.services.storage import storage
import io

async def debug_minio():
    print(f"DEBUG SETTINGS:")
    print(f"  ENDPOINT: {settings.MINIO_ENDPOINT}")
    print(f"  ACCESS_KEY: {settings.MINIO_ACCESS_KEY}")
    print(f"  SECURE: {settings.MINIO_SECURE}")
    
    print(f"Testing MinIO connection to bucket: {storage.bucket_name}")
    try:
        exists = storage.client.bucket_exists(storage.bucket_name)
        print(f"Bucket exists: {exists}")
        if not exists:
            print("Creating bucket...")
            storage.client.make_bucket(storage.bucket_name)
            
        print("Uploading test file...")
        data = b"Hello World"
        storage.client.put_object(
            storage.bucket_name,
            "test_debug.txt",
            io.BytesIO(data),
            len(data),
            content_type="text/plain"
        )
        print("Upload successful!")
        
    except Exception as e:
        print(f"MinIO Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_minio())
