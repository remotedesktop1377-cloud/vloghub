from pathlib import Path
from moviepy import VideoFileClip
from moviepy.video.fx.FadeIn import FadeIn
from moviepy.video.fx.FadeOut import FadeOut

# Get the project root directory (parent of backend)
project_root = Path(__file__).parent.parent
video_path = project_root / "exports" / "temp" / "video1.mp4"
output_path = project_root / "exports" / "output_fade.mp4"

if not video_path.exists():
    print(f"Error: Video file not found: {video_path}")
    exit(1)

print(f"Loading video from: {video_path}")
clip = VideoFileClip(str(video_path))

print(f"Original duration: {clip.duration}s")

# Apply a 1-second fade-in effect
print("Applying fade-in...")
fade_in_effect = FadeIn(duration=1)
clip = fade_in_effect.apply(clip)

# Apply a 1-second fade-out effect
print("Applying fade-out...")
fade_out_effect = FadeOut(duration=1)
clip = fade_out_effect.apply(clip)

# Write the result to a new file
print(f"Writing output to: {output_path}")
clip.write_videofile(
    str(output_path),
    codec="libx264",
    audio_codec="aac",
    temp_audiofile=str(project_root / "exports" / "temp" / "temp_audio.m4a"),
    remove_temp=True
)

print(f"Success! Output saved to: {output_path}")

# Clean up
clip.close()
