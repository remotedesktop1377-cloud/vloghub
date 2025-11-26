import json
import requests
import shutil
import io
from pathlib import Path
from typing import Dict
from moviepy import VideoFileClip, ImageClip, CompositeVideoClip, AudioFileClip, concatenate_videoclips
from PIL import Image
import numpy as np
from backend.utils.helperFunctions import HelperFunctions
from rembg import remove, new_session

def download_media(url_or_path: str, output_path: Path, is_video: bool = False) -> str:
    """
    Download media from URL or use local path.
    
    Args:
        url_or_path: URL or local file path
        output_path: Path to save downloaded file (only used if downloading from URL)
        is_video: Whether this is a video file
        
    Returns:
        Path to the media file
    """
    # Check if it's a local file path (Windows or Unix style)
    local_path = Path(url_or_path)
    if local_path.exists() and local_path.is_file():
        print(f"Using local file: {url_or_path}")
        return str(local_path)
    
    # Check if it looks like a local path (starts with drive letter on Windows or / on Unix)
    if url_or_path.startswith(('D:/', 'C:/', 'E:/', 'F:/', '/', './', '../')) or ':\\' in url_or_path:
        # Try to resolve as local path
        if local_path.exists():
            print(f"Using local file: {url_or_path}")
            return str(local_path)
        else:
            raise FileNotFoundError(f"Local file not found: {url_or_path}")
    
    # Check if it's a Google Drive URL
    if "drive.google.com" in url_or_path:
        # Extract file ID from Google Drive URL
        if "/file/d/" in url_or_path:
            file_id = url_or_path.split("/file/d/")[1].split("/")[0]
            url_or_path = f"https://drive.google.com/uc?export=download&id={file_id}"
        elif "uc?id=" in url_or_path:
            # Already in the correct format
            pass
        elif "id=" in url_or_path:
            file_id = url_or_path.split("id=")[1].split("&")[0]
            url_or_path = f"https://drive.google.com/uc?export=download&id={file_id}"
    
    # Check if it's a valid URL (starts with http:// or https://)
    if not url_or_path.startswith(('http://', 'https://')):
        raise ValueError(f"Invalid URL or file path: {url_or_path}")
    
    # Download from URL
    try:
        response = requests.get(url_or_path, timeout=60, stream=True)
        response.raise_for_status()
        
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        print(f"Downloaded media from {url_or_path} to {output_path}")
        
        # Validate video file if it's a video
        if is_video:
            # Wait a moment to ensure file is fully written
            import time
            time.sleep(0.5)
            
            # Check file size
            file_size = output_path.stat().st_size
            if file_size == 0:
                raise ValueError(f"Downloaded video file is empty: {output_path}")
            
            try:
                # Try to open the video file to validate it
                test_clip = VideoFileClip(str(output_path))
                duration = test_clip.duration
                test_clip.close()
                print(f"✅ Video file validated: {output_path} (duration: {duration:.2f}s, size: {file_size} bytes)")
            except Exception as e:
                print(f"⚠️ Warning: Downloaded video file may be corrupted: {e}")
                print(f"File size: {file_size} bytes")
                # Try to re-download once
                print("Attempting to re-download...")
                if output_path.exists():
                    output_path.unlink()  # Delete corrupted file
                
                response = requests.get(url_or_path, timeout=120, stream=True)
                response.raise_for_status()
                
                with open(output_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                
                # Wait and validate again
                time.sleep(0.5)
                file_size = output_path.stat().st_size
                if file_size == 0:
                    raise ValueError(f"Re-downloaded video file is still empty: {output_path}")
                
                test_clip = VideoFileClip(str(output_path))
                duration = test_clip.duration
                test_clip.close()
                print(f"✅ Video file re-downloaded and validated: {output_path} (duration: {duration:.2f}s)")
        
        return str(output_path)
    except Exception as e:
        print(f"Error downloading media from {url_or_path}: {e}")
        raise

def get_logo_position(position: str, video_width: int, video_height: int, logo_width: int, logo_height: int) -> tuple:
    """
    Calculate logo position based on position string.
    
    Args:
        position: Position string like "top-right", "top-left", etc.
        video_width: Video width
        video_height: Video height
        logo_width: Logo width
        logo_height: Logo height
        
    Returns:
        Tuple of (x, y) position
    """
    margin = 20
    
    if position == "top-right":
        x = video_width - logo_width - margin
        y = margin
    elif position == "top-left":
        x = margin
        y = margin
    elif position == "bottom-right":
        x = video_width - logo_width - margin
        y = video_height - logo_height - margin
    elif position == "bottom-left":
        x = margin
        y = video_height - logo_height - margin
    elif position == "center":
        x = (video_width - logo_width) // 2
        y = (video_height - logo_height) // 2
    else:
        # Default to top-right
        x = video_width - logo_width - margin
        y = margin
    
    return (x, y)

def process_scene(
    scene_data: Dict,
    narrator_video_path: str,
    temp_dir: Path,
    scene_index: int
) -> str:
    """
    Process a single scene with all components.
    
    Args:
        scene_data: Scene data from JSON
        narrator_video_path: Path to narrator chroma key video
        temp_dir: Temporary directory for processing
        scene_index: Index of the scene
        
    Returns:
        Path to processed scene video
    """
    print(f"Processing scene {scene_index + 1}: {scene_data.get('id', 'unknown')}")
    
    # Get scene settings (use scene settings if available, otherwise project settings)
    scene_settings = scene_data.get("sceneSettings", {})
    if not isinstance(scene_settings, dict):
        scene_settings = {}
    
    # Extract timing information
    start_time = scene_data.get("startTime", 0)
    end_time = scene_data.get("endTime", scene_data.get("durationInSeconds", 0))
    
    # Load narrator video first to get actual duration
    narrator_clip = VideoFileClip(narrator_video_path)
    video_duration = narrator_clip.duration
    
    # Validate and adjust timings
    if start_time >= video_duration:
        narrator_clip.close()
        raise ValueError(f"Scene {scene_index + 1}: startTime ({start_time:.2f}s) is after video end ({video_duration:.2f}s)")
    
    if start_time < 0:
        print(f"⚠️ Scene {scene_index + 1}: startTime ({start_time:.2f}s) is negative, setting to 0")
        start_time = 0.0
    
    # Ensure end_time doesn't exceed video duration
    actual_end_time = min(end_time, video_duration)
    if end_time > video_duration:
        print(f"⚠️ Scene {scene_index + 1}: Adjusting endTime from {end_time:.2f}s to {actual_end_time:.2f}s (video duration: {video_duration:.2f}s)")
    
    scene_duration = actual_end_time - start_time
    
    if scene_duration <= 0:
        narrator_clip.close()
        raise ValueError(f"Scene {scene_index + 1}: Invalid scene duration ({scene_duration:.2f}s)")
    
    # Extract scene segment
    scene_narrator = narrator_clip.subclipped(start_time, actual_end_time)
    video_size = (scene_narrator.w, scene_narrator.h)
    
    # Download and prepare background video
    bg_video_url = scene_settings.get("videoBackgroundVideo", {}).get("webViewLink") or \
                   scene_settings.get("videoBackgroundVideo", {}).get("webContentLink") or \
                   scene_settings.get("videoBackgroundVideo", {}).get("name", "")
    
    bg_video_path = None
    if bg_video_url:
        bg_video_local = temp_dir / f"bg_video_scene_{scene_index}.mp4"
        bg_video_path = download_media(bg_video_url, bg_video_local, is_video=True)
        bg_video_clip = VideoFileClip(bg_video_path)
        
        # Resize background video to match scene dimensions
        bg_video_clip = bg_video_clip.resized(new_size=(video_size[0], video_size[1]))
        
        # Loop background video to match scene duration
        if bg_video_clip.duration < scene_duration:
            # Calculate how many loops we need
            loops_needed = int(np.ceil(scene_duration / bg_video_clip.duration))
            # Create a list of the same clip repeated
            bg_clips = [bg_video_clip] * loops_needed
            # Concatenate them
            bg_video_clip = concatenate_videoclips(bg_clips, method="compose")
        
        # Trim to exact scene duration
        bg_video_clip = bg_video_clip.subclipped(0, scene_duration)
        # Ensure it's exactly the scene duration
        if abs(bg_video_clip.duration - scene_duration) > 0.1:
            bg_video_clip = bg_video_clip.subclipped(0, scene_duration)
    else:
        # No background video, use black background
        bg_video_clip = ImageClip(np.zeros((video_size[1], video_size[0], 3), dtype=np.uint8), duration=scene_duration)
    
    # Process narrator video with transparency (same approach as manual processing)
    print(f"Processing narrator video with transparency (frame-by-frame)...")
    
    # Create rembg session for background removal
    session = new_session()
    
    # Process each frame to remove background and preserve transparency (same as manual processing)
    def process_frame_with_transparency(t):
        """Process a single frame to remove background with transparency"""
        try:
            # Get the frame at time t from the original narrator clip
            frame = scene_narrator.get_frame(t)
            
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
            frame = scene_narrator.get_frame(t)
            if frame.dtype != np.uint8:
                frame = (frame * 255).astype(np.uint8)
            frame = np.clip(frame, 0, 255).astype(np.uint8)
            # Add alpha channel (fully opaque)
            rgba_frame = np.dstack([frame, np.ones((frame.shape[0], frame.shape[1]), dtype=np.uint8) * 255])
            return rgba_frame.astype(np.uint8)
    
    # Create video clip with transparency (same as manual processing)
    print("Creating narrator video with transparency...")
    narrator_with_alpha = scene_narrator.with_updated_frame_function(process_frame_with_transparency)
    
    # Composite narrator on background video (narrator maintains its original position)
    composite_layers = [bg_video_clip, narrator_with_alpha]
    
    # Prepare logo if available (will be added to segments or composite)
    logo_clip = None
    logo_path_resized = None
    logo_settings = scene_settings.get("videoLogo", {})
    if logo_settings and logo_settings.get("url"):
        logo_url = logo_settings.get("url")
        logo_position = logo_settings.get("position", "top-right")
        
        logo_local = temp_dir / f"logo_scene_{scene_index}.png"
        logo_path = download_media(logo_url, logo_local)
        
        # Load and resize logo
        logo_img = Image.open(logo_path)
        # Resize logo to reasonable size (e.g., 15% of video width)
        logo_width = int(video_size[0] * 0.15)
        logo_height = int(logo_img.height * (logo_width / logo_img.width))
        logo_img = logo_img.resize((logo_width, logo_height), Image.Resampling.LANCZOS)
        
        logo_path_resized = temp_dir / f"logo_resized_scene_{scene_index}.png"
        logo_img.save(logo_path_resized)
        
        # Calculate position
        x, y = get_logo_position(logo_position, video_size[0], video_size[1], logo_width, logo_height)
        
        # Store logo info for later use
        logo_info = {
            "path": str(logo_path_resized),
            "position": (x, y),
            "size": (logo_width, logo_height)
        }
    else:
        logo_info = None
    
    # Process keyword images
    narration_text = scene_data.get("narration", "")
    keywords_selected = scene_data.get("keywordsSelected", [])
    
    if keywords_selected and narration_text:
        # Find keyword timestamps in narration
        # IMPORTANT: Use scene-relative timestamps (0 to scene_duration)
        # The narration text is for this scene only, so timestamps should be 0-based
        keyword_image_mappings = []
        for keyword_data in keywords_selected:
            keyword = keyword_data.get("modifiedKeyword") or keyword_data.get("suggestedKeyword", "")
            media_url = keyword_data.get("media", {}).get("highResMedia", "")
            
            if keyword and media_url:
                # Find timestamps for this keyword in the scene narration
                # narration_text is scene-specific, so timestamps will be 0-based relative to scene start
                timestamps = HelperFunctions.find_keyword_timestamps(
                    narration_text,
                    keyword,
                    scene_duration  # Total duration of this scene
                )
                
                if timestamps:
                    # Ensure timestamps are within scene bounds (0 to scene_duration)
                    # Filter out any timestamps that are outside the scene duration
                    scene_relative_timestamps = [
                        max(0.0, min(ts, scene_duration)) 
                        for ts in timestamps 
                        if 0 <= ts <= scene_duration
                    ]
                    
                    if scene_relative_timestamps:
                        keyword_image_mappings.append({
                            "keyword": keyword,
                            "image": media_url,
                            "timestamps": scene_relative_timestamps
                        })
                        print(f"Keyword '{keyword}' found at timestamps: {scene_relative_timestamps} (scene duration: {scene_duration}s)")
        
        # Add keyword images at timestamps (using same approach as manual processing)
        if keyword_image_mappings:
            print(f"Adding {len(keyword_image_mappings)} keyword images...")
            
            # Download keyword images
            downloaded_images = {}
            for mapping in keyword_image_mappings:
                image_url = mapping["image"]
                if image_url not in downloaded_images:
                    image_local = temp_dir / f"keyword_img_{len(downloaded_images)}_scene_{scene_index}.jpg"
                    image_path = download_media(image_url, image_local)
                    downloaded_images[image_url] = image_path
                mapping["image_path"] = downloaded_images[image_url]
            
            # Create timeline for keyword images (same as manual processing)
            # Structure: {start_time: (end_time, image_path)}
            image_timeline = {}
            image_duration = 3.0  # Show each image for 3 seconds
            
            for mapping in keyword_image_mappings:
                image_path = mapping["image_path"]
                timestamps = mapping.get("timestamps", [])
                
                # Add to timeline for each timestamp
                for timestamp in timestamps:
                    start_time = max(0.0, min(timestamp, scene_duration))
                    end_time = min(scene_duration, start_time + image_duration)
                    
                    # If there's already an image at this time, keep the later one (or extend)
                    if start_time in image_timeline:
                        existing_end = image_timeline[start_time][0]
                        if end_time > existing_end:
                            image_timeline[start_time] = (end_time, image_path)
                    else:
                        image_timeline[start_time] = (end_time, image_path)
            
            # Sort timeline by start time (same as manual processing)
            sorted_timeline = sorted(image_timeline.items())
            
            # Create segments for the video (same approach as manual processing)
            segments = []
            current_time = 0.0
            
            for start_time, (end_time, image_path) in sorted_timeline:
                # Add segment before this image (if any)
                if current_time < start_time:
                    segment_duration = start_time - current_time
                    video_segment = narrator_with_alpha.subclipped(current_time, start_time)
                    # Composite with background video for this segment
                    bg_segment = bg_video_clip.subclipped(current_time, start_time)
                    segment_layers = [bg_segment, video_segment]
                    
                    # Add logo to segment if available
                    if logo_info:
                        logo_seg_clip = ImageClip(logo_info["path"], duration=segment_duration)
                        def get_logo_pos(t):
                            return logo_info["position"]
                        logo_seg_clip = logo_seg_clip.with_position(get_logo_pos)
                        segment_layers.append(logo_seg_clip)
                    
                    segment_clip = CompositeVideoClip(segment_layers, size=video_size)
                    segments.append(segment_clip)
                
                # Add segment with keyword image background (same as manual processing)
                if start_time < scene_duration:
                    segment_duration = min(end_time, scene_duration) - start_time
                    
                    # Load and prepare keyword image
                    img = Image.open(image_path)
                    # Convert RGBA to RGB if necessary
                    if img.mode == 'RGBA':
                        rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                        rgb_img.paste(img, mask=img.split()[3])
                        img = rgb_img
                    elif img.mode != 'RGB':
                        img = img.convert('RGB')
                    img = img.resize(video_size, Image.Resampling.LANCZOS)
                    
                    # Save resized image as temporary file
                    img_path_temp = str(temp_dir / f"temp_keyword_bg_{start_time:.2f}_scene_{scene_index}.png")
                    img.save(img_path_temp)
                    
                    # Create background image clip for this segment
                    bg_img_clip = ImageClip(img_path_temp, duration=segment_duration)
                    
                    # Extract the corresponding video segment
                    video_segment = narrator_with_alpha.subclipped(start_time, min(end_time, scene_duration))
                    
                    # Composite keyword image background and video segment (same as manual processing)
                    segment_layers = [bg_img_clip, video_segment]
                    
                    # Add logo to segment if available
                    if logo_info:
                        logo_seg_clip = ImageClip(logo_info["path"], duration=segment_duration)
                        def get_logo_pos(t):
                            return logo_info["position"]
                        logo_seg_clip = logo_seg_clip.with_position(get_logo_pos)
                        segment_layers.append(logo_seg_clip)
                    
                    segment_clip = CompositeVideoClip(segment_layers, size=video_size)
                    segments.append(segment_clip)
                    
                    # Clean up temp image
                    if Path(img_path_temp).exists():
                        Path(img_path_temp).unlink()
                
                current_time = end_time
            
            # Add remaining video segment (if any)
            if current_time < scene_duration:
                video_segment = narrator_with_alpha.subclipped(current_time, scene_duration)
                bg_segment = bg_video_clip.subclipped(current_time, scene_duration)
                segment_layers = [bg_segment, video_segment]
                
                # Add logo to segment if available
                if logo_info:
                    remaining_duration = scene_duration - current_time
                    logo_seg_clip = ImageClip(logo_info["path"], duration=remaining_duration)
                    def get_logo_pos(t):
                        return logo_info["position"]
                    logo_seg_clip = logo_seg_clip.with_position(get_logo_pos)
                    segment_layers.append(logo_seg_clip)
                
                segment_clip = CompositeVideoClip(segment_layers, size=video_size)
                segments.append(segment_clip)
            
            # If segments were created, use them (same as manual processing)
            if segments:
                # Concatenate all segments (same as manual processing)
                print("Concatenating video segments with keyword images...")
                final_scene = concatenate_videoclips(segments, method="compose")
            else:
                # No keyword images, use original composite_layers approach
                # Add logo to composite_layers if not already added
                if logo_info and logo_info["path"] not in [str(layer.filename) if hasattr(layer, 'filename') else None for layer in composite_layers]:
                    logo_clip = ImageClip(logo_info["path"], duration=scene_duration)
                    def get_logo_pos(t):
                        return logo_info["position"]
                    logo_clip = logo_clip.with_position(get_logo_pos)
                    composite_layers.append(logo_clip)
                final_scene = CompositeVideoClip(composite_layers, size=video_size)
    else:
        # No keyword images, create final composite from layers
        # Add logo to composite_layers if available
        if logo_info:
            logo_clip = ImageClip(logo_info["path"], duration=scene_duration)
            def get_logo_pos(t):
                return logo_info["position"]
            logo_clip = logo_clip.with_position(get_logo_pos)
            composite_layers.append(logo_clip)
        final_scene = CompositeVideoClip(composite_layers, size=video_size)
    
    # Add background music if available
    bg_music_settings = scene_settings.get("videoBackgroundMusic", {})
    if bg_music_settings and bg_music_settings.get("webViewLink"):
        music_url = bg_music_settings.get("webViewLink") or bg_music_settings.get("webContentLink", "")
        if music_url:
            music_local = temp_dir / f"bg_music_scene_{scene_index}.mp3"
            music_path = download_media(music_url, music_local)
            
            try:
                audio_clip = AudioFileClip(music_path)
                # Loop or trim audio to match scene duration
                if audio_clip.duration < scene_duration:
                    loops_needed = int(scene_duration / audio_clip.duration) + 1
                    audio_clip = concatenate_videoclips([audio_clip] * loops_needed)
                
                audio_clip = audio_clip.subclipped(0, scene_duration)
                # Reduce volume to 30% - try different methods based on MoviePy version
                try:
                    audio_clip = audio_clip.volumex(0.3)  # Older MoviePy versions
                except AttributeError:
                    try:
                        audio_clip = audio_clip.with_volume(0.3)  # Newer MoviePy versions
                    except AttributeError:
                        # If neither works, use multiplier directly
                        audio_clip = audio_clip.multiply_volume(0.3)
                final_scene = final_scene.with_audio(audio_clip)
            except Exception as e:
                print(f"Warning: Could not add background music: {e}")
    
    # Save scene video
    scene_output_path = temp_dir / f"scene_{scene_index + 1:03d}.mp4"
    final_scene.write_videofile(
        str(scene_output_path),
        codec="libx264",
        audio_codec="aac",
        temp_audiofile=str(temp_dir / f"temp_audio_scene_{scene_index}.m4a"),
        remove_temp=True
    )
    
    # Clean up
    final_scene.close()
    narrator_clip.close()
    scene_narrator.close()
    narrator_with_alpha.close()
    if bg_video_path:
        bg_video_clip.close()
    
    return str(scene_output_path)

def process_project_json(json_path: str, output_path: str) -> Dict[str, str]:
    """
    Process a complete project from JSON file.
    
    Args:
        json_path: Path to project JSON file
        output_path: Path to save final combined video
        
    Returns:
        Dictionary with paths to individual scene videos and final combined video
        {
            "final_video": path to combined video,
            "scenes": [list of scene video paths]
        }
    """
    print(f"Processing project from JSON: {json_path}")
    
    # Load JSON
    with open(json_path, 'r', encoding='utf-8') as f:
        project_data = json.load(f)
    
    project = project_data.get("project", {})
    scenes = project_data.get("script", [])
    
    if not scenes:
        raise ValueError("No scenes found in project JSON")
    
    # Create temp directory
    temp_dir = Path("temp") / "project_processing"
    temp_dir.mkdir(parents=True, exist_ok=True)
    
    # Create exports directory for individual scenes
    exports_dir = Path(output_path).parent
    exports_dir.mkdir(parents=True, exist_ok=True)
    
    # Download narrator video
    narrator_url = project.get("narrator_chroma_key_link", "")
    if not narrator_url:
        raise ValueError("narrator_chroma_key_link not found in project")
    
    narrator_local = temp_dir / "narrator_video.mp4"
    narrator_path = download_media(narrator_url, narrator_local, is_video=True)
    
    # Validate narrator video before processing
    print("Validating narrator video file...")
    try:
        test_clip = VideoFileClip(narrator_path)
        narrator_duration = test_clip.duration
        size = test_clip.size
        test_clip.close()
        print(f"✅ Narrator video validated: duration={narrator_duration:.2f}s, size={size}")
    except Exception as e:
        error_msg = f"Narrator video file is corrupted or invalid: {e}"
        print(f"❌ {error_msg}")
        print(f"File path: {narrator_path}")
        print(f"File exists: {Path(narrator_path).exists()}")
        if Path(narrator_path).exists():
            print(f"File size: {Path(narrator_path).stat().st_size} bytes")
        raise ValueError(error_msg)
    
    # Validate and fix scene timings
    print("Validating scene timings...")
    valid_scenes = []
    for idx, scene in enumerate(scenes):
        start_time = scene.get("startTime", 0)
        end_time = scene.get("endTime", scene.get("durationInSeconds", 0))
        scene_duration = end_time - start_time
        
        # Check if start_time exceeds narrator video duration
        if start_time >= narrator_duration:
            print(f"⚠️ Scene {idx + 1} ({scene.get('id', 'unknown')}): startTime ({start_time:.2f}s) is after video end ({narrator_duration:.2f}s), skipping scene")
            continue
        
        # Check if start_time is valid
        if start_time < 0:
            print(f"⚠️ Scene {idx + 1}: startTime ({start_time:.2f}s) is negative, setting to 0")
            scene["startTime"] = 0.0
            start_time = 0.0
        
        # Check if end_time exceeds narrator video duration
        if end_time > narrator_duration:
            print(f"⚠️ Scene {idx + 1} ({scene.get('id', 'unknown')}): endTime ({end_time:.2f}s) exceeds video duration ({narrator_duration:.2f}s)")
            print(f"   Auto-correcting: setting endTime to {narrator_duration:.2f}s")
            scene["endTime"] = narrator_duration
            scene["durationInSeconds"] = narrator_duration - start_time
            # Update duration string if present
            if "duration" in scene:
                start_mins = int(start_time // 60)
                start_secs = int(start_time % 60)
                end_mins = int(narrator_duration // 60)
                end_secs = int(narrator_duration % 60)
                scene["duration"] = f"0:{start_mins:02d}:{start_secs:02d} - 0:{end_mins:02d}:{end_secs:02d}"
            end_time = narrator_duration
        
        # Check if scene duration is valid
        scene_duration = end_time - start_time
        if scene_duration <= 0:
            print(f"⚠️ Scene {idx + 1}: Invalid duration ({scene_duration:.2f}s), skipping...")
            continue
        
        # Update scene data with corrected values
        scene["startTime"] = start_time
        scene["endTime"] = end_time
        scene["durationInSeconds"] = scene_duration
        
        valid_scenes.append(scene)
        print(f"✅ Scene {idx + 1} ({scene.get('id', 'unknown')}): {start_time:.2f}s - {end_time:.2f}s (duration: {scene_duration:.2f}s)")
    
    # Update scenes list with only valid scenes
    if len(valid_scenes) < len(scenes):
        print(f"⚠️ Filtered out {len(scenes) - len(valid_scenes)} invalid scene(s)")
    scenes = valid_scenes
    
    if not scenes:
        raise ValueError("No valid scenes found after validation. All scenes were filtered out.")
    
    # Process each scene and save to exports directory
    scene_videos = []
    scene_output_paths = []
    
    for idx, scene in enumerate(scenes):
        # Process scene to temp location first
        temp_scene_path = process_scene(scene, narrator_path, temp_dir, idx)
        
        # Copy to exports directory with scene name
        scene_id = scene.get("id", f"scene_{idx + 1}")
        scene_output_path = exports_dir / f"{scene_id}.mp4"
        
        # Copy the file
        shutil.copy2(temp_scene_path, scene_output_path)
        
        scene_videos.append(temp_scene_path)  # Keep temp path for concatenation
        scene_output_paths.append(str(scene_output_path))
        
        print(f"Scene {idx + 1} saved to: {scene_output_path}")
    
    # Concatenate all scenes for final combined video
    print("Concatenating all scenes for final video...")
    scene_clips = [VideoFileClip(path) for path in scene_videos]
    final_video = concatenate_videoclips(scene_clips, method="compose")
    
    # Write final combined video
    print(f"Saving final combined video to: {output_path}")
    final_video.write_videofile(
        output_path,
        codec="libx264",
        audio_codec="aac",
        temp_audiofile=str(temp_dir / "temp_audio_final.m4a"),
        remove_temp=True
    )
    
    # Clean up
    final_video.close()
    for clip in scene_clips:
        clip.close()
    
    print(f"Project processing complete!")
    print(f"Final combined video: {output_path}")
    print(f"Individual scenes: {len(scene_output_paths)} scene(s) saved")
    
    return {
        "final_video": output_path,
        "scenes": scene_output_paths
    }

