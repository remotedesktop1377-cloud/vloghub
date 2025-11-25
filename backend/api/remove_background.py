import numpy as np
from moviepy import VideoFileClip
from rembg import remove, new_session
from PIL import Image
import io
from pathlib import Path

def remove_video_background(video_file_path: str, output_video_path: str) -> str:
    """
    Remove background from video file using rembg.
    Processes video frame by frame to remove background.
    
    Args:
        video_file_path: Path to input video file
        output_video_path: Path to save output video with removed background
        
    Returns:
        Path to the output video file
    """
    try:
        print(f"Removing background from video: {video_file_path}")
        
        # Load the video
        video_clip = VideoFileClip(video_file_path)
        
        # Create rembg session for better performance
        session = new_session()
        
        # Process each frame to remove background
        def process_frame(t):
            """Process a single frame to remove background"""
            try:
                # Get the frame at time t
                frame = video_clip.get_frame(t)
                
                # Ensure frame is in correct format
                if frame.dtype != np.uint8:
                    frame = (frame * 255).astype(np.uint8)
                
                # Clip values to valid range
                frame = np.clip(frame, 0, 255).astype(np.uint8)
                
                frame_image = Image.fromarray(frame, 'RGB')
                
                # Convert PIL Image to bytes
                img_bytes = io.BytesIO()
                frame_image.save(img_bytes, format='PNG')
                img_bytes.seek(0)
                
                # Remove background using rembg with session for better performance
                output_bytes = remove(img_bytes.read(), session=session)
                
                # Convert back to numpy array
                output_image = Image.open(io.BytesIO(output_bytes))
                
                # Convert RGBA to RGB with white background
                if output_image.mode == 'RGBA':
                    # Create a white background
                    background = Image.new('RGB', output_image.size, (255, 255, 255))
                    # Paste the image with alpha channel as mask
                    background.paste(output_image, mask=output_image.split()[3])
                    output_array = np.array(background)
                else:
                    output_array = np.array(output_image.convert('RGB'))
                
                return output_array.astype(np.uint8)
                
            except Exception as e:
                print(f"Error processing frame at time {t}: {e}")
                # Return original frame if processing fails
                return video_clip.get_frame(t)
        
        # Apply background removal to all frames using with_updated_frame_function
        print("Processing frames to remove background...")
        processed_clip = video_clip.with_updated_frame_function(process_frame)
        
        # Preserve audio if available
        if video_clip.audio is not None:
            processed_clip = processed_clip.with_audio(video_clip.audio)
        
        # Write the processed video
        print(f"Saving background-removed video to: {output_video_path}")
        processed_clip.write_videofile(
            str(output_video_path),
            codec="libx264",
            audio_codec="aac",
            temp_audiofile='temp/temp-audio-bg-removed.m4a',
            remove_temp=True
        )
        
        # Close clips
        processed_clip.close()
        video_clip.close()
        
        print(f"Background removed video saved to: {output_video_path}")
        return str(output_video_path)
        
    except Exception as e:
        print(f"Error removing background: {e}")
        raise

