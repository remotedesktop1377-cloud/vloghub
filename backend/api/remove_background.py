import numpy as np
from moviepy import VideoFileClip, ImageClip, CompositeVideoClip, concatenate_videoclips
from rembg import remove, new_session
from PIL import Image
import io
from pathlib import Path
import requests
from urllib.parse import urlparse

def add_background_image_to_video(video_file_path: str, background_image_path: str, output_video_path: str) -> str:
    """
    Add a background image to a video. 
    Re-processes the video to remove background with transparency, then composites with background image.
    
    Args:
        video_file_path: Path to input video file
        background_image_path: Path to background image file
        output_video_path: Path to save output video with background image
        
    Returns:
        Path to the output video file
    """
    try:
        print(f"Adding background image to video: {video_file_path}")
        
        # Load the original video
        video_clip = VideoFileClip(video_file_path)
        
        # Load and prepare background image
        bg_image = Image.open(background_image_path)
        # Resize background to match video dimensions
        video_size = (video_clip.w, video_clip.h)
        bg_image = bg_image.resize(video_size, Image.Resampling.LANCZOS)
        
        # Save resized background as temporary file
        temp_dir = Path(output_video_path).parent
        temp_dir.mkdir(exist_ok=True)
        bg_image_path_temp = str(temp_dir / "temp_bg_resized.png")
        bg_image.save(bg_image_path_temp)
        
        # Create background image clip
        # Image is already resized to match video dimensions, so no positioning needed
        bg_clip = ImageClip(bg_image_path_temp, duration=video_clip.duration)
        
        # Create rembg session for background removal
        session = new_session()
        
        # Process each frame to remove background and preserve transparency
        def process_frame_with_transparency(t):
            """Process a single frame to remove background with transparency"""
            try:
                # Get the frame at time t
                frame = video_clip.get_frame(t)
                
                # Ensure frame is in correct format
                if frame.dtype != np.uint8:
                    frame = (frame * 255).astype(np.uint8)
                
                frame = np.clip(frame, 0, 255).astype(np.uint8)
                frame_image = Image.fromarray(frame, 'RGB')
                
                # Convert PIL Image to bytes
                img_bytes = io.BytesIO()
                frame_image.save(img_bytes, format='PNG')
                img_bytes.seek(0)
                
                # Remove background using rembg
                output_bytes = remove(img_bytes.read(), session=session)
                output_image = Image.open(io.BytesIO(output_bytes))
                
                # Preserve RGBA for compositing
                if output_image.mode == 'RGBA':
                    return np.array(output_image).astype(np.uint8)
                else:
                    # Convert to RGBA if not already
                    rgba_image = output_image.convert('RGBA')
                    return np.array(rgba_image).astype(np.uint8)
                
            except Exception as e:
                print(f"Error processing frame at time {t}: {e}")
                # Return original frame with alpha channel
                frame = video_clip.get_frame(t)
                if frame.dtype != np.uint8:
                    frame = (frame * 255).astype(np.uint8)
                frame = np.clip(frame, 0, 255).astype(np.uint8)
                # Add alpha channel (fully opaque)
                rgba_frame = np.dstack([frame, np.ones((frame.shape[0], frame.shape[1]), dtype=np.uint8) * 255])
                return rgba_frame.astype(np.uint8)
        
        # Create video clip with transparency
        print("Processing video frames with transparency...")
        video_with_alpha = video_clip.with_updated_frame_function(process_frame_with_transparency)
        
        # Composite background and video using MoviePy's CompositeVideoClip
        print("Compositing video with background image...")
        final_clip = CompositeVideoClip([bg_clip, video_with_alpha])
        
        # Preserve audio if available
        if video_clip.audio is not None:
            final_clip = final_clip.with_audio(video_clip.audio)
        
        # Write the composite video
        print(f"Saving video with background to: {output_video_path}")
        final_clip.write_videofile(
            str(output_video_path),
            codec="libx264",
            audio_codec="aac",
            temp_audiofile='temp/temp-audio-bg-added.m4a',
            remove_temp=True
        )
        
        # Clean up temp background image
        if Path(bg_image_path_temp).exists():
            Path(bg_image_path_temp).unlink()
        
        # Close clips
        final_clip.close()
        video_clip.close()
        bg_clip.close()
        video_with_alpha.close()
        
        print(f"Video with background image saved to: {output_video_path}")
        return str(output_video_path)
        
    except Exception as e:
        print(f"Error adding background image: {e}")
        raise

def remove_video_background(video_file_path: str, output_video_path: str, preserve_transparency: bool = False) -> str:
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
                
                # Convert RGBA to RGB with white background (or preserve transparency)
                if output_image.mode == 'RGBA':
                    if preserve_transparency:
                        # Preserve RGBA for later compositing
                        output_array = np.array(output_image)
                    else:
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

def add_multiple_background_images_to_video(video_file_path: str, background_image_paths: list[str], output_video_path: str) -> str:
    """
    Add multiple background images to a video, switching between them sequentially.
    Each image will be displayed for an equal duration (video_duration / number_of_images).
    
    Args:
        video_file_path: Path to input video file
        background_image_paths: List of paths to background image files
        output_video_path: Path to save output video with background images
        
    Returns:
        Path to the output video file
    """
    try:
        print(f"Adding {len(background_image_paths)} background images to video: {video_file_path}")
        
        # Load the original video
        video_clip = VideoFileClip(video_file_path)
        video_duration = video_clip.duration
        video_size = (video_clip.w, video_clip.h)
        
        # Calculate duration per image
        duration_per_image = video_duration / len(background_image_paths)
        print(f"Video duration: {video_duration:.2f}s, Duration per image: {duration_per_image:.2f}s")
        
        # Create rembg session for background removal (reused for all frames)
        session = new_session()
        
        # Process each frame to remove background and preserve transparency
        def process_frame_with_transparency(t):
            """Process a single frame to remove background with transparency"""
            try:
                # Get the frame at time t
                frame = video_clip.get_frame(t)
                
                # Ensure frame is in correct format
                if frame.dtype != np.uint8:
                    frame = (frame * 255).astype(np.uint8)
                
                frame = np.clip(frame, 0, 255).astype(np.uint8)
                frame_image = Image.fromarray(frame, 'RGB')
                
                # Convert PIL Image to bytes
                img_bytes = io.BytesIO()
                frame_image.save(img_bytes, format='PNG')
                img_bytes.seek(0)
                
                # Remove background using rembg
                output_bytes = remove(img_bytes.read(), session=session)
                output_image = Image.open(io.BytesIO(output_bytes))
                
                # Preserve RGBA for compositing
                if output_image.mode == 'RGBA':
                    return np.array(output_image).astype(np.uint8)
                else:
                    # Convert to RGBA if not already
                    rgba_image = output_image.convert('RGBA')
                    return np.array(rgba_image).astype(np.uint8)
                
            except Exception as e:
                print(f"Error processing frame at time {t}: {e}")
                # Return original frame with alpha channel
                frame = video_clip.get_frame(t)
                if frame.dtype != np.uint8:
                    frame = (frame * 255).astype(np.uint8)
                frame = np.clip(frame, 0, 255).astype(np.uint8)
                # Add alpha channel (fully opaque)
                rgba_frame = np.dstack([frame, np.ones((frame.shape[0], frame.shape[1]), dtype=np.uint8) * 255])
                return rgba_frame.astype(np.uint8)
        
        # Create video clip with transparency
        print("Processing video frames with transparency...")
        video_with_alpha = video_clip.with_updated_frame_function(process_frame_with_transparency)
        
        # Prepare temporary directory
        temp_dir = Path(output_video_path).parent
        temp_dir.mkdir(exist_ok=True)
        
        # Create segments for each background image
        segments = []
        temp_bg_paths = []
        
        for idx, bg_image_path in enumerate(background_image_paths):
            print(f"Processing background image {idx + 1}/{len(background_image_paths)}: {bg_image_path}")
            
            # Load and prepare background image
            bg_image = Image.open(bg_image_path)
            # Resize background to match video dimensions
            bg_image = bg_image.resize(video_size, Image.Resampling.LANCZOS)
            
            # Save resized background as temporary file
            bg_image_path_temp = str(temp_dir / f"temp_bg_resized_{idx}.png")
            bg_image.save(bg_image_path_temp)
            temp_bg_paths.append(bg_image_path_temp)
            
            # Calculate start and end time for this segment
            start_time = idx * duration_per_image
            end_time = min((idx + 1) * duration_per_image, video_duration)
            segment_duration = end_time - start_time
            
            # Create background image clip for this segment
            bg_clip = ImageClip(bg_image_path_temp, duration=segment_duration)
            
            # Extract the corresponding video segment
            video_segment = video_with_alpha.subclipped(start_time, end_time)
            
            # Composite background and video segment
            segment_clip = CompositeVideoClip([bg_clip, video_segment])
            segments.append(segment_clip)
        
        # Concatenate all segments
        print("Concatenating video segments...")
        final_clip = concatenate_videoclips(segments, method="compose")
        
        # Preserve audio if available
        if video_clip.audio is not None:
            final_clip = final_clip.with_audio(video_clip.audio)
        
        # Write the composite video
        print(f"Saving video with multiple background images to: {output_video_path}")
        final_clip.write_videofile(
            str(output_video_path),
            codec="libx264",
            audio_codec="aac",
            temp_audiofile='temp/temp-audio-bg-added.m4a',
            remove_temp=True
        )
        
        # Clean up temp background images
        for bg_path in temp_bg_paths:
            if Path(bg_path).exists():
                Path(bg_path).unlink()
        
        # Close clips
        final_clip.close()
        video_clip.close()
        video_with_alpha.close()
        for segment in segments:
            segment.close()
        
        print(f"Video with multiple background images saved to: {output_video_path}")
        return str(output_video_path)
        
    except Exception as e:
        print(f"Error adding multiple background images: {e}")
        raise

def download_image_from_url(image_url: str, output_path: str) -> str:
    """
    Download an image from a URL and save it locally.
    
    Args:
        image_url: URL of the image to download
        output_path: Path where to save the downloaded image
        
    Returns:
        Path to the downloaded image file
    """
    try:
        response = requests.get(image_url, timeout=30)
        response.raise_for_status()
        
        with open(output_path, 'wb') as f:
            f.write(response.content)
        
        print(f"Downloaded image from {image_url} to {output_path}")
        return output_path
    except Exception as e:
        print(f"Error downloading image from {image_url}: {e}")
        raise

def add_background_images_at_timestamps(
    video_file_path: str, 
    keyword_image_mappings: list[dict], 
    output_video_path: str,
    image_duration: float = 3.0
) -> str:
    """
    Add background images to a video at specific timestamps based on keyword detection.
    Each image will be displayed for a specified duration when its keyword is detected.
    
    Args:
        video_file_path: Path to input video file
        keyword_image_mappings: List of dicts with 'keyword', 'image' (URL), and 'timestamps' keys
        output_video_path: Path to save output video with background images
        image_duration: Duration in seconds to show each image (default: 3.0)
        
    Returns:
        Path to the output video file
    """
    try:
        print(f"Adding background images at specific timestamps: {video_file_path}")
        
        # Load the original video
        video_clip = VideoFileClip(video_file_path)
        video_duration = video_clip.duration
        video_size = (video_clip.w, video_clip.h)
        
        # Create rembg session for background removal (reused for all frames)
        session = new_session()
        
        # Process each frame to remove background and preserve transparency
        def process_frame_with_transparency(t):
            """Process a single frame to remove background with transparency"""
            try:
                # Get the frame at time t
                frame = video_clip.get_frame(t)
                
                # Ensure frame is in correct format
                if frame.dtype != np.uint8:
                    frame = (frame * 255).astype(np.uint8)
                
                frame = np.clip(frame, 0, 255).astype(np.uint8)
                frame_image = Image.fromarray(frame, 'RGB')
                
                # Convert PIL Image to bytes
                img_bytes = io.BytesIO()
                frame_image.save(img_bytes, format='PNG')
                img_bytes.seek(0)
                
                # Remove background using rembg
                output_bytes = remove(img_bytes.read(), session=session)
                output_image = Image.open(io.BytesIO(output_bytes))
                
                # Preserve RGBA for compositing
                if output_image.mode == 'RGBA':
                    return np.array(output_image).astype(np.uint8)
                else:
                    # Convert to RGBA if not already
                    rgba_image = output_image.convert('RGBA')
                    return np.array(rgba_image).astype(np.uint8)
                
            except Exception as e:
                print(f"Error processing frame at time {t}: {e}")
                # Return original frame with alpha channel
                frame = video_clip.get_frame(t)
                if frame.dtype != np.uint8:
                    frame = (frame * 255).astype(np.uint8)
                frame = np.clip(frame, 0, 255).astype(np.uint8)
                # Add alpha channel (fully opaque)
                rgba_frame = np.dstack([frame, np.ones((frame.shape[0], frame.shape[1]), dtype=np.uint8) * 255])
                return rgba_frame.astype(np.uint8)
        
        # Create video clip with transparency
        print("Processing video frames with transparency...")
        video_with_alpha = video_clip.with_updated_frame_function(process_frame_with_transparency)
        
        # Prepare temporary directory
        temp_dir = Path(output_video_path).parent
        temp_dir.mkdir(exist_ok=True)
        
        # Create a timeline of which image to show at each time
        # Structure: {start_time: (end_time, image_path)}
        image_timeline = {}
        
        # Download images and build timeline
        downloaded_images = {}
        for mapping in keyword_image_mappings:
            image_url = mapping["image"]
            timestamps = mapping.get("timestamps", [])
            
            # Download image if not already downloaded
            if image_url not in downloaded_images:
                # Create a safe filename from URL
                parsed_url = urlparse(image_url)
                image_filename = Path(parsed_url.path).name or "image.jpg"
                image_path = temp_dir / f"downloaded_{len(downloaded_images)}_{image_filename}"
                
                download_image_from_url(image_url, str(image_path))
                downloaded_images[image_url] = str(image_path)
            
            image_path = downloaded_images[image_url]
            
            # Add to timeline for each timestamp
            for timestamp in timestamps:
                start_time = max(0, timestamp)
                end_time = min(video_duration, start_time + image_duration)
                
                # If there's already an image at this time, keep the later one (or extend)
                if start_time in image_timeline:
                    existing_end = image_timeline[start_time][0]
                    if end_time > existing_end:
                        image_timeline[start_time] = (end_time, image_path)
                else:
                    image_timeline[start_time] = (end_time, image_path)
        
        # Sort timeline by start time
        sorted_timeline = sorted(image_timeline.items())
        
        # Create segments for the video
        segments = []
        current_time = 0.0
        
        for start_time, (end_time, image_path) in sorted_timeline:
            # Add segment before this image (if any)
            if current_time < start_time:
                segment_duration = start_time - current_time
                video_segment = video_with_alpha.subclipped(current_time, start_time)
                segments.append(video_segment)
            
            # Add segment with background image
            if start_time < video_duration:
                segment_duration = min(end_time, video_duration) - start_time
                
                # Load and prepare background image
                bg_image = Image.open(image_path)
                bg_image = bg_image.resize(video_size, Image.Resampling.LANCZOS)
                
                # Save resized background as temporary file
                bg_image_path_temp = str(temp_dir / f"temp_bg_{start_time}.png")
                bg_image.save(bg_image_path_temp)
                
                # Create background image clip for this segment
                bg_clip = ImageClip(bg_image_path_temp, duration=segment_duration)
                
                # Extract the corresponding video segment
                video_segment = video_with_alpha.subclipped(start_time, min(end_time, video_duration))
                
                # Composite background and video segment
                segment_clip = CompositeVideoClip([bg_clip, video_segment])
                segments.append(segment_clip)
                
                # Clean up temp background image
                if Path(bg_image_path_temp).exists():
                    Path(bg_image_path_temp).unlink()
            
            current_time = end_time
        
        # Add remaining video segment (if any)
        if current_time < video_duration:
            video_segment = video_with_alpha.subclipped(current_time, video_duration)
            segments.append(video_segment)
        
        # If no images were added, just use the video with alpha
        if not segments:
            segments.append(video_with_alpha)
        
        # Concatenate all segments
        print("Concatenating video segments...")
        final_clip = concatenate_videoclips(segments, method="compose")
        
        # Preserve audio if available
        if video_clip.audio is not None:
            final_clip = final_clip.with_audio(video_clip.audio)
        
        # Write the composite video
        print(f"Saving video with keyword-triggered background images to: {output_video_path}")
        final_clip.write_videofile(
            str(output_video_path),
            codec="libx264",
            audio_codec="aac",
            temp_audiofile='temp/temp-audio-bg-added.m4a',
            remove_temp=True
        )
        
        # Clean up downloaded images
        for image_path in downloaded_images.values():
            if Path(image_path).exists():
                Path(image_path).unlink()
        
        # Close clips
        final_clip.close()
        video_clip.close()
        video_with_alpha.close()
        for segment in segments:
            segment.close()
        
        print(f"Video with keyword-triggered background images saved to: {output_video_path}")
        return str(output_video_path)
        
    except Exception as e:
        print(f"Error adding background images at timestamps: {e}")
        raise