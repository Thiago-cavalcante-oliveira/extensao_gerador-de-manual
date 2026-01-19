from app.core.config import settings

def debug_settings():
    print(f"DEBUG SETTINGS LOADED:")
    print(f"MINIO_ENDPOINT='{settings.MINIO_ENDPOINT}'")
    print(f"MINIO_ACCESS_KEY='{settings.MINIO_ACCESS_KEY}'")
    print(f"MINIO_SECURE='{settings.MINIO_SECURE}' (Type: {type(settings.MINIO_SECURE)})")

if __name__ == "__main__":
    debug_settings()
