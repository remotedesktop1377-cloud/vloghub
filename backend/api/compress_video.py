from pathlib import Path
import shutil
from moviepy import VideoFileClip

def compress_video(input_path: str, output_path: str, target_size_mb: float = 50.0) -> str:
    """
    Compress video to reduce file size while maintaining reasonable quality.
    
    Args:
        input_path: Path to input video file
        output_path: Path to save compressed video
        target_size_mb: Target file size in MB (default: 50MB)
        
    Returns:
        Path to compressed video file
    """
    input_file = Path(input_path)
    if not input_file.exists():
        raise FileNotFoundError(f"Input video not found: {input_path}")
    
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    print(f"Compressing video: {input_path} -> {output_path}")
    
    video_clip = VideoFileClip(input_path)
    original_duration = video_clip.duration
    original_size_mb = input_file.stat().st_size / (1024 * 1024)
    
    print(f"Original video: {original_size_mb:.2f} MB, duration: {original_duration:.2f}s")
    
    # if original_size_mb <= target_size_mb:
    #     print(f"Video is already under target size ({original_size_mb:.2f} MB <= {target_size_mb} MB), copying without compression")
    #     video_clip.close()
    #     shutil.copy2(input_path, output_path)
    #     return output_path
    
    target_bitrate = (target_size_mb * 8 * 1024 * 1024) / original_duration
    target_bitrate = max(500, min(target_bitrate, 5000))
    
    print(f"Target bitrate: {target_bitrate:.0f} kbps")
    
    try:
        video_clip.write_videofile(
            str(output_path),
            codec="libx264",
            audio_codec="aac",
            ffmpeg_params=[
                "-crf", "23",
                "-preset", "medium",
                "-b:v", f"{int(target_bitrate)}k",
                "-movflags", "+faststart"
            ],
            temp_audiofile=str(output_file.parent / f"temp_audio_{output_file.stem}.m4a"),
            remove_temp=True
        )
        
        compressed_size_mb = output_file.stat().st_size / (1024 * 1024)
        compression_ratio = (1 - compressed_size_mb / original_size_mb) * 100
        
        print(f"Compressed video: {compressed_size_mb:.2f} MB ({compression_ratio:.1f}% reduction)")
        
        return output_path
    finally:
        video_clip.close()

