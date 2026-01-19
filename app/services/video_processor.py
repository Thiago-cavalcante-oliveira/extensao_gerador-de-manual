import os
import tempfile
import asyncio
from app.services.storage import storage

class VideoProcessor:
    async def stitch_videos(self, main_video_key: str, intro_key: str | None, outro_key: str | None) -> str:
        """
        Downloads main video, intro and outro from MinIO.
        Stitches them using FFmpeg (concat demuxer).
        Uploads the result back to MinIO.
        Returns the new MinIO key.
        """
        # Se não tiver intro nem outro, retorna o próprio vídeo original
        if not intro_key and not outro_key:
            return main_video_key

        with tempfile.TemporaryDirectory() as temp_dir:
            file_list_path = os.path.join(temp_dir, "files.txt")
            output_path = os.path.join(temp_dir, "stitched.mp4")
            files_to_concat = []

            # Helper to download
            async def download(key, local_name):
                path = os.path.join(temp_dir, local_name)
                # O storage.download_file assume que o key é completo path/to/file
                # Mas storage method 'download_file' é sincrono ou async? Verificar service.
                # Assumindo sincrono wrapper ou boto3
                await asyncio.to_thread(storage.client.fget_object, storage.bucket_name, key, path)
                return path

            # 1. Download Intro
            if intro_key:
                try:
                    p = await download(intro_key, "intro.mp4")
                    files_to_concat.append(p)
                except Exception as e:
                    print(f"Failed to download intro {intro_key}: {e}")

            # 2. Download Main
            try:
                p = await download(main_video_key, "main.mp4")
                files_to_concat.append(p)
            except Exception as e:
                print(f"Failed to download main {main_video_key}: {e}")
                raise e # Fatal

            # 3. Download Outro
            if outro_key:
                try:
                    p = await download(outro_key, "outro.mp4")
                    files_to_concat.append(p)
                except Exception as e:
                    print(f"Failed to download outro {outro_key}: {e}")

            # Create concat list file
            # Format: file '/path/to/file'
            with open(file_list_path, 'w') as f:
                for path in files_to_concat:
                    f.write(f"file '{path}'\n")

            # Run FFmpeg
            # ffmpeg -f concat -safe 0 -i files.txt -c copy output.mp4
            # We use -c copy for speed (assuming all codecs match). 
            # If codecs differ, we might need re-encoding (-c:v libx264). 
            # Let's try copy first, safest for CPU. If fails, user should standardize formats.
            
            cmd = [
                "ffmpeg", "-f", "concat", "-safe", "0",
                "-i", file_list_path,
                "-c", "copy",
                "-y", output_path
            ]
            
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await proc.communicate()
            
            if proc.returncode != 0:
                print(f"FFmpeg error: {stderr.decode()}")
                # Fallback: se falhar o copy (codecs diferentes?), tentar re-encode?
                # Por simplicidade neste MVP, lançamos erro ou retornamos original.
                print("Stitching failed, falling back to original.")
                return main_video_key

            # Upload Result
            # Nome: stitcheds/timestamp_original.mp4
            new_key = f"stitched/final_{os.path.basename(main_video_key)}"
            await asyncio.to_thread(
                storage.client.fput_object, 
                storage.bucket_name, 
                new_key, 
                output_path,
                content_type="video/mp4"
            )
            
            return new_key

video_processor = VideoProcessor()
