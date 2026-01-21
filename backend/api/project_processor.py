import json
import requests
import shutil
import io
from pathlib import Path
from typing import Dict
from moviepy import VideoFileClip, ImageClip, CompositeVideoClip, AudioFileClip, concatenate_videoclips, TextClip

from moviepy.video.fx.AccelDecel import AccelDecel
from moviepy.video.fx.BlackAndWhite import BlackAndWhite
from moviepy.video.fx.Blink import Blink
from moviepy.video.fx.Crop import Crop
from moviepy.video.fx.CrossFadeIn import CrossFadeIn
from moviepy.video.fx.CrossFadeOut import CrossFadeOut
from moviepy.video.fx.EvenSize import EvenSize
from moviepy.video.fx.FadeIn import FadeIn
from moviepy.video.fx.FadeOut import FadeOut
from moviepy.video.fx.Freeze import Freeze
from moviepy.video.fx.FreezeRegion import FreezeRegion
from moviepy.video.fx.GammaCorrection import GammaCorrection
from moviepy.video.fx.HeadBlur import HeadBlur
from moviepy.video.fx.InvertColors import InvertColors
from moviepy.video.fx.Loop import Loop
from moviepy.video.fx.LumContrast import LumContrast
from moviepy.video.fx.MakeLoopable import MakeLoopable
from moviepy.video.fx.Margin import Margin
from moviepy.video.fx.MaskColor import MaskColor
from moviepy.video.fx.MasksAnd import MasksAnd
from moviepy.video.fx.MasksOr import MasksOr
from moviepy.video.fx.MirrorX import MirrorX
from moviepy.video.fx.MirrorY import MirrorY
from moviepy.video.fx.MultiplyColor import MultiplyColor
from moviepy.video.fx.MultiplySpeed import MultiplySpeed
from moviepy.video.fx.Painting import Painting
from moviepy.video.fx.Resize import Resize
from moviepy.video.fx.Rotate import Rotate
from moviepy.video.fx.Scroll import Scroll
from moviepy.video.fx.SlideIn import SlideIn
from moviepy.video.fx.SlideOut import SlideOut
from moviepy.video.fx.SuperSample import SuperSample
from moviepy.video.fx.TimeMirror import TimeMirror
from moviepy.video.fx.TimeSymmetrize import TimeSymmetrize

from PIL import Image
import numpy as np
from backend.utils.helperFunctions import HelperFunctions
from rembg import remove, new_session
from backend.api.compress_video import compress_video

def download_media(url_or_path: str, output_path: Path, is_video: bool) -> str:
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
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': 'https://www.google.com/',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }
        response = requests.get(url_or_path, headers=headers, timeout=60, stream=True)
        response.raise_for_status()
        
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        print(f"Downloaded media from {url_or_path} to {output_path}")
        
        # Check if it's an audio file (mp3, wav, etc.)
        is_audio = str(output_path).lower().endswith(('.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac', '.wma'))
        content_type = response.headers.get('Content-Type', '').lower()
        is_audio_by_type = 'audio' in content_type
        
        import time
        time.sleep(0.2)
        file_size = output_path.stat().st_size
        if file_size == 0:
            raise ValueError(f"Downloaded file is empty: {output_path}")
        
        # Handle audio files
        if is_audio or is_audio_by_type:
            print(f"✅ Audio file downloaded: {output_path} (size: {file_size} bytes, Content-Type: {content_type})")
        
        # Handle video files
        elif is_video:
            # Video validation happens below
            pass
        
        # Handle image files - only validate if it's actually an image
        else:
            # Check if it's actually an image by file extension
            is_image_file = str(output_path).lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.tiff', '.tif'))
            is_image_by_type = content_type.startswith('image/')
            
            if is_image_file or is_image_by_type:
                try:
                    print(f"✅ Image file found: {url_or_path}")
                    test_img = Image.open(output_path)
                    test_img.verify()
                    img_format = test_img.format
                    test_img.close()
                    print(f"✅ Image file validated: {output_path} (size: {file_size} bytes, format: {img_format})")
                except Exception as e:
                    print(f"⚠️ Warning: Downloaded image file may be corrupted or invalid: {e}")
                    print(f"File size: {file_size} bytes")
                    print(f"Content-Type from response: {content_type}")
                    
                    if output_path.exists():
                        try:
                            with open(output_path, 'rb') as f:
                                first_bytes = f.read(100)
                                print(f"First 100 bytes (hex): {first_bytes.hex()}")
                                print(f"First 100 bytes (text): {first_bytes[:50]}")
                        except Exception:
                            pass
                    
                    print("Attempting to re-download...")
                    if output_path.exists():
                        output_path.unlink()
                    
                    headers = {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Accept-Encoding': 'gzip, deflate, br',
                        'Referer': 'https://www.google.com/',
                        'Connection': 'keep-alive',
                        'Upgrade-Insecure-Requests': '1'
                    }
                    response = requests.get(url_or_path, headers=headers, timeout=120, stream=True)
                    response.raise_for_status()
                    
                    content_type = response.headers.get('Content-Type', '').lower()
                    if not content_type.startswith('image/'):
                        print(f"⚠️ Warning: Content-Type is not an image: {content_type}")
                    
                    with open(output_path, 'wb') as f:
                        for chunk in response.iter_content(chunk_size=8192):
                            f.write(chunk)
                    
                    time.sleep(0.2)
                    file_size = output_path.stat().st_size
                    if file_size == 0:
                        print(f"⚠️ Re-downloaded image file is still empty, skipping: {output_path}")
                        if output_path.exists():
                            output_path.unlink()
                        return str(output_path)
                    
                    try:
                        test_img = Image.open(output_path)
                        test_img.verify()
                        test_img.close()
                        print(f"✅ Image file re-downloaded and validated: {output_path} (size: {file_size} bytes)")
                    except Exception as e2:
                        print(f"⚠️ Re-downloaded image file is still invalid, skipping: {output_path}")
                        print(f"Re-download error: {e2}. Original error: {e}")
                        if output_path.exists():
                            output_path.unlink()
                        return str(output_path)
            else:
                print(f"✅ Non-image, non-video, non-audio file downloaded: {output_path} (size: {file_size} bytes, Content-Type: {content_type})")
        
        # Validate video file if it's a video
        if is_video:
            # Wait a moment to ensure file is fully written
            time.sleep(0.5)
            
            # Re-check file size for video (in case it changed or wasn't set)
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
                
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Referer': 'https://www.google.com/',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                }
                response = requests.get(url_or_path, headers=headers, timeout=120, stream=True)
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

def get_text_position(position: str, video_width: int, video_height: int, text_width: int, text_height: int, custom_pos: dict = None) -> tuple:
    """
    Calculate text overlay position based on position string or custom position.
    
    Args:
        position: Position string like "top-right", "bottom-center", etc.
        video_width: Video width
        video_height: Video height
        text_width: Text width (estimated)
        text_height: Text height (estimated)
        custom_pos: Custom position dict with x, y, usePercentage
        
    Returns:
        Tuple of (x, y) position
    """
    margin = 20
    
    if position == "top-left":
        x = margin
        y = margin
    elif position == "top-center":
        x = (video_width - text_width) // 2
        y = margin
    elif position == "top-right":
        x = video_width - text_width - margin
        y = margin
    elif position == "center":
        x = (video_width - text_width) // 2
        y = (video_height - text_height) // 2
    elif position == "bottom-left":
        x = margin
        y = video_height - text_height - margin
    elif position == "bottom-center":
        x = (video_width - text_width) // 2
        y = video_height - text_height - margin
    elif position == "bottom-right":
        x = video_width - text_width - margin
        y = video_height - text_height - margin
    elif position == "custom" and custom_pos:
        if custom_pos.get("usePercentage", True):
            x = int((custom_pos.get("x", 50) / 100) * video_width)
            y = int((custom_pos.get("y", 50) / 100) * video_height)
        else:
            x = int(custom_pos.get("x", 0))
            y = int(custom_pos.get("y", 0))
    else:
        # Default to bottom-center
        x = (video_width - text_width) // 2
        y = video_height - text_height - margin
    
    return (x, y)

def create_text_overlay(text_overlay_data: dict, duration: float, video_size: tuple):
    """
    Create a text overlay clip using MoviePy's TextClip (simpler and more reliable approach).
    
    Args:
        text_overlay_data: Dictionary with text, position, fontSize, fontColor, backgroundColor, etc.
        duration: Duration of the text overlay
        video_size: Tuple of (width, height) for the video
        
    Returns:
        TextClip object
    """
    text = text_overlay_data.get("text", "")
    font_size = text_overlay_data.get("fontSize", 48)
    font_color = text_overlay_data.get("fontColor", "#FFFFFF")
    bg_color = text_overlay_data.get("backgroundColor", "#00000080")
    position = text_overlay_data.get("position", "bottom-center")
    custom_pos = text_overlay_data.get("customPosition")
    
    print(f"[DEBUG] Creating text overlay: '{text[:50]}...' (font_size={font_size}, position={position}, duration={duration}s)")
    
    # try:
    #     # Parse background color and opacity
    #     bg_opacity = 1.0
    #     bg_color_parsed = None
        
    #     if bg_color:
    #         if len(bg_color) > 7:  # Has alpha channel
    #             try:
    #                 bg_opacity = int(bg_color[-2:], 16) / 255.0
    #                 bg_color_parsed = bg_color[:-2] if bg_opacity > 0 else None
    #             except (ValueError, IndexError):
    #                 bg_color_parsed = bg_color if len(bg_color) == 7 else bg_color[:7]
    #         else:
    #             bg_color_parsed = bg_color
        
    #     # Convert position string to MoviePy position format
    #     if position == "top-left":
    #         pos_str = ('left', 'top')
    #     elif position == "top-center":
    #         pos_str = ('center', 'top')
    #     elif position == "top-right":
    #         pos_str = ('right', 'top')
    #     elif position == "center":
    #         pos_str = 'center'
    #     elif position == "bottom-left":
    #         pos_str = ('left', 'bottom')
    #     elif position == "bottom-center":
    #         pos_str = ('center', 'bottom')
    #     elif position == "bottom-right":
    #         pos_str = ('right', 'bottom')
    #     elif position == "custom" and custom_pos:
    #         # Use custom position
    #         if custom_pos.get("usePercentage", True):
    #             x = int((custom_pos.get("x", 50) / 100) * video_size[0])
    #             y = int((custom_pos.get("y", 50) / 100) * video_size[1])
    #         else:
    #             x = int(custom_pos.get("x", 0))
    #             y = int(custom_pos.get("y", 0))
    #         pos_str = (x, y)
    #     else:
    #         pos_str = ('center', 'bottom')  # Default
        
    #     # Create TextClip - MoviePy TextClip signature: text, font_size (not fontsize), color, bg_color, size, method
    #     print(f"[DEBUG] Creating TextClip with text: '{text}', font_size: {font_size}, color: {font_color}, bg_color: {bg_color_parsed}")
        
    #     # Use correct parameter names: text= and font_size=
    #     txt_clip = (TextClip("BREAKING NEWS: Gaza Conflict",
    #             fontsize=80, color='white')
    #    .set_position(("center","top"))
    #    .set_duration(5))
        
    #     # Set duration and position
    #     txt_clip = txt_clip.set_duration(duration).set_position(pos_str)
        
    #     # Apply opacity if needed
    #     if bg_opacity < 1.0:
    #         txt_clip = txt_clip.set_opacity(bg_opacity)
        
    #     print(f"[DEBUG] ✓ Successfully created text overlay: '{text[:50]}...' at position {pos_str}, duration {duration}s")
    #     return txt_clip
        
    # except Exception as e:
    #     print(f"[ERROR] Could not create text overlay: {e}")
    #     import traceback
    #     traceback.print_exc()
    #     return None

def process_scene(
    scene_data: Dict,
    narrator_video_path: str,
    temp_dir: Path,
    scene_index: int,
    project_settings: Dict = None
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
    
    # Determine background type (image or video)
    background_type = scene_settings.get("backgroundType", "video")
    # Fallback: if backgroundType is not set, infer from videoBackgroundImage presence
    if background_type not in ["image", "video"]:
        background_type = "image" if scene_settings.get("videoBackgroundImage") else "video"
    
    # Download and prepare background (image or video)
    bg_video_clip = None
    bg_video_path = None  # Initialize for cleanup later
    
    if background_type == "image":
        # Handle image background
        video_bg_image = scene_settings.get("videoBackgroundImage", {})
        print(f"DEBUG: videoBackgroundImage data: {video_bg_image}")
        
        # Try webContentLink first (for direct download), then webViewLink, then name/id
        bg_image_url = video_bg_image.get("webContentLink") or \
                      video_bg_image.get("webViewLink") or \
                      video_bg_image.get("name") or \
                      (f"https://drive.google.com/uc?id={video_bg_image.get('id')}" if video_bg_image.get("id") else "")
        
        print(f"DEBUG: background_type={background_type}, bg_image_url={bg_image_url}")
        
        if bg_image_url:
            try:
                print(f"Using image background for scene {scene_index + 1}: {bg_image_url}")
                bg_image_local = temp_dir / f"bg_image_scene_{scene_index}.png"
                bg_image_path = download_media(bg_image_url, bg_image_local, is_video=False)
                print(f"Downloaded image to: {bg_image_path}")
                
                # Load and resize image
                bg_image = Image.open(bg_image_path)
                print(f"Original image size: {bg_image.size}, target size: {video_size}")
                bg_image = bg_image.resize((video_size[0], video_size[1]), Image.Resampling.LANCZOS)
                
                # Save resized image
                bg_image_resized_path = temp_dir / f"bg_image_scene_{scene_index}_resized.png"
                bg_image.save(bg_image_resized_path)
                print(f"Saved resized image to: {bg_image_resized_path}")
                
                # Create image clip with scene duration and ensure it matches video size
                bg_video_clip = ImageClip(str(bg_image_resized_path), duration=scene_duration)
                # Ensure the clip size matches video dimensions
                if bg_video_clip.size != video_size:
                    print(f"Resizing ImageClip from {bg_video_clip.size} to {video_size}")
                    bg_video_clip = bg_video_clip.resized(new_size=video_size)
                print(f"Created ImageClip with duration: {scene_duration}s, size: {bg_video_clip.size}")
            except Exception as e:
                print(f"ERROR: Failed to process image background: {e}")
                import traceback
                traceback.print_exc()
                # Fallback to black background on error
                bg_video_clip = ImageClip(np.zeros((video_size[1], video_size[0], 3), dtype=np.uint8), duration=scene_duration)
        else:
            print(f"WARNING: No image background URL found in videoBackgroundImage: {video_bg_image}, using black background")
            bg_video_clip = ImageClip(np.zeros((video_size[1], video_size[0], 3), dtype=np.uint8), duration=scene_duration)
    else:
        # Handle video background (original logic)
        bg_video_url = scene_settings.get("videoBackgroundVideo", {}).get("webViewLink") or \
                      scene_settings.get("videoBackgroundVideo", {}).get("webContentLink") or \
                      scene_settings.get("videoBackgroundVideo", {}).get("name", "")
        
        if bg_video_url:
            print(f"Using video background for scene {scene_index + 1}")
            bg_video_local = temp_dir / f"bg_video_scene_{scene_index}.mp4"
            bg_video_path = download_media(bg_video_url, bg_video_local, is_video=True)
            
            # Compress background video if it's too large
            original_size_mb = Path(bg_video_path).stat().st_size / (1024 * 1024)
            target_size_mb = 20.0
            if original_size_mb > target_size_mb:
                print(f"Compressing background video from {original_size_mb:.2f} MB to target {target_size_mb} MB...")
                bg_video_compressed = temp_dir / f"bg_video_scene_{scene_index}_compressed.mp4"
                try:
                    compressed_path = compress_video(str(bg_video_path), str(bg_video_compressed), target_size_mb)
                    bg_video_path = compressed_path
                    compressed_size_mb = Path(compressed_path).stat().st_size / (1024 * 1024)
                    print(f"Background video compressed: {compressed_size_mb:.2f} MB")
                except Exception as e:
                    print(f"Warning: Failed to compress background video, using original: {e}")
            
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
            print(f"No video background URL found, using black background")
            bg_video_clip = ImageClip(np.zeros((video_size[1], video_size[0], 3), dtype=np.uint8), duration=scene_duration)
    
    # Ensure bg_video_clip is set (should not be None at this point)
    if bg_video_clip is None:
        print(f"ERROR: bg_video_clip is None! Creating black background as fallback.")
        bg_video_clip = ImageClip(np.zeros((video_size[1], video_size[0], 3), dtype=np.uint8), duration=scene_duration)
    
    print(f"DEBUG: bg_video_clip type: {type(bg_video_clip)}, duration: {bg_video_clip.duration if hasattr(bg_video_clip, 'duration') else 'N/A'}, size: {bg_video_clip.size if hasattr(bg_video_clip, 'size') else 'N/A'}")
    
    # Process narrator video with transparency (same approach as manual processing)
    print("Processing narrator video with transparency (frame-by-frame)...")
    
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
        logo_path = download_media(logo_url, logo_local, is_video=False)
        
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
    
    # Process keyword images and text overlays (and optional gammaPreviewImage fallback)
    narration_text = scene_data.get("narration", "")
    gamma_preview_image = scene_data.get("previewImage", "")
    keywords_selected = scene_data.get("keywordsSelected", [])

    keyword_image_mappings = []
    text_overlay_mappings = []

    if keywords_selected and narration_text:
        # Find keyword timestamps in narration
        # IMPORTANT: Use scene-relative timestamps (0 to scene_duration)
        # The narration text is for this scene only, so timestamps should be 0-based
        for keyword_data in keywords_selected:
            keyword = keyword_data.get("suggestedKeyword", "")
            media_url = keyword_data.get("media", {}).get("highResMedia", "")
            text_overlay = keyword_data.get("textOverlay")
            
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
            
            # Process text overlay if present (works independently of images)
            if keyword and text_overlay:
                print(f"[DEBUG] Processing text overlay for keyword: '{keyword}'")
                print(f"[DEBUG] Narration text length: {len(narration_text)} chars")
                print(f"[DEBUG] Narration text (first 200 chars): '{narration_text[:200]}...'")
                print(f"[DEBUG] Scene duration: {scene_duration}s")
                
                timestamps = HelperFunctions.find_keyword_timestamps(
                    narration_text,
                    keyword,
                    scene_duration
                )
                
                print(f"[DEBUG] Found timestamps for keyword '{keyword}': {timestamps}")
                
                if timestamps:
                    scene_relative_timestamps = [
                        max(0.0, min(ts, scene_duration)) 
                        for ts in timestamps 
                        if 0 <= ts <= scene_duration
                    ]
                    
                    if scene_relative_timestamps:
                        text_overlay_mappings.append({
                            "textOverlay": text_overlay,
                            "timestamps": scene_relative_timestamps,
                            "startTime": text_overlay.get("startTime")  # Use custom start time if provided
                        })
                        print(f"✓ Text overlay '{text_overlay.get('text', '')}' for keyword '{keyword}' found at timestamps: {scene_relative_timestamps}")
                    else:
                        print("[DEBUG] All timestamps were out of bounds, using scene start")
                        text_overlay_mappings.append({
                            "textOverlay": text_overlay,
                            "timestamps": [0.0],
                            "startTime": text_overlay.get("startTime", 0.0)
                        })
                        print(f"✓ Text overlay '{text_overlay.get('text', '')}' scheduled at scene start (0.0s)")
                else:
                    # If keyword not found in narration, use start of scene as fallback
                    print(f"[DEBUG] Keyword '{keyword}' not found in narration, using scene start (0.0s) for text overlay")
                    text_overlay_mappings.append({
                        "textOverlay": text_overlay,
                        "timestamps": [0.0],
                        "startTime": text_overlay.get("startTime", 0.0)
                    })
                    print(f"✓ Text overlay '{text_overlay.get('text', '')}' scheduled at scene start (0.0s)")

    # Create timeline for text overlays (works independently of keyword images)
    text_overlay_timeline = {}
    if text_overlay_mappings:
        print(f"Processing {len(text_overlay_mappings)} text overlay(s)...")
        for mapping in text_overlay_mappings:
            text_overlay_data = mapping["textOverlay"]
            timestamps = mapping.get("timestamps", [])
            duration = text_overlay_data.get("duration", 3.0)
            
            # If no timestamps found, use scene start as fallback
            if not timestamps:
                print(f"Warning: No timestamps found for text overlay '{text_overlay_data.get('text', '')}', using scene start (0.0s)")
                timestamps = [0.0]
            
            for timestamp in timestamps:
                start_time = mapping.get("startTime")
                if start_time is None:
                    start_time = max(0.0, min(timestamp, scene_duration))
                else:
                    start_time = max(0.0, min(start_time, scene_duration))
                end_time = min(scene_duration, start_time + duration)
                
                if start_time not in text_overlay_timeline:
                    text_overlay_timeline[start_time] = []
                text_overlay_timeline[start_time].append({
                    "end_time": end_time,
                    "data": text_overlay_data
                })
                print(f"Text overlay '{text_overlay_data.get('text', '')}' scheduled: {start_time}s - {end_time}s")

    def add_text_overlays_to_segment(segment_layers, segment_start, segment_duration):
        """Helper function to add text overlays to a segment"""
        for text_start, text_overlays in text_overlay_timeline.items():
            if text_start >= segment_start and text_start < segment_start + segment_duration:
                for text_overlay_info in text_overlays:
                    text_end = text_overlay_info["end_time"]
                    if text_end <= segment_start + segment_duration:
                        overlay_duration = text_end - text_start
                        text_clip = create_text_overlay(text_overlay_info["data"], overlay_duration, video_size)
                        if text_clip:
                            text_clip = text_clip.set_start(text_start - segment_start)
                            segment_layers.append(text_clip)
                            print(f"Added text overlay '{text_overlay_info['data'].get('text', '')}' to segment at {text_start - segment_start}s")
                        else:
                            print(f"Warning: Failed to create text overlay for '{text_overlay_info['data'].get('text', '')}'")

    # Check if media is scheduled in the first 3 seconds (0.0 to 3.0)
    # This determines if we should show the preview image at the start
    has_media_in_first_3_seconds = False
    for mapping in keyword_image_mappings:
        timestamps = mapping.get("timestamps", [])
        # Check if any timestamp falls within the first 3 seconds
        for timestamp in timestamps:
            if 0.0 <= timestamp < 3.0:
                has_media_in_first_3_seconds = True
                break
        if has_media_in_first_3_seconds:
            break
    
    # If no media in first 3 seconds and preview image is enabled, show preview image
    # Check showPreviewImageAtStart setting (scene settings first, then project settings, default to True)
    show_preview_image = scene_settings.get("showPreviewImageAtStart")
    if show_preview_image is None and project_settings:
        show_preview_image = project_settings.get("showPreviewImageAtStart")
    if show_preview_image is None:
        show_preview_image = True  # Default to True to maintain current behavior
    
    if not has_media_in_first_3_seconds and gamma_preview_image and show_preview_image:
        keyword_image_mappings.append({
            "keyword": "__gamma_default__",
            "image": gamma_preview_image,
            "timestamps": [0.0]
        })
        print(f"Using gammaPreviewImage for 3 seconds at start of scene {scene_index + 1} (no media in first 3 seconds)")
    elif not has_media_in_first_3_seconds and gamma_preview_image and not show_preview_image:
        print(f"Preview image available but showPreviewImageAtStart is disabled for scene {scene_index + 1}")
    elif has_media_in_first_3_seconds and gamma_preview_image:
        print(f"Media already scheduled in first 3 seconds for scene {scene_index + 1}, skipping preview image")

    # Add keyword images at timestamps (using same approach as manual processing)
    if keyword_image_mappings:
        print(f"Adding {len(keyword_image_mappings)} keyword images...")
        
        # Download keyword images and videos
        downloaded_images = {}
        for mapping in keyword_image_mappings:
            image_url = mapping["image"]
            is_video = HelperFunctions.is_video_url(image_url)
            
            if image_url not in downloaded_images:
                if is_video:
                    image_local = temp_dir / f"keyword_vid_{len(downloaded_images)}_scene_{scene_index}.mp4"
                else:
                    image_local = temp_dir / f"keyword_img_{len(downloaded_images)}_scene_{scene_index}.jpg"
                print(f"Downloading media. URL: {image_url} → Local path: {image_local} (is_video={is_video})")
                image_path = download_media(image_url, image_local, is_video)
                downloaded_images[image_url] = image_path
            
            mapping["image_path"] = downloaded_images[image_url]
            mapping["is_video"] = is_video  
        # Create timeline for keyword images (same as manual processing)
        # Structure: {start_time: (end_time, image_path)}
        image_timeline = {}
        base_image_duration = 3.0  # Default duration for keyword images - 3 seconds
        base_video_duration = 10.0  # Default duration for keyword videos - 10 seconds
        
        for mapping in keyword_image_mappings:
            image_path = mapping["image_path"]
            is_video = mapping.get("is_video", False)

            # Skip mappings where media could not be downloaded or validated
            if not image_path or not Path(image_path).exists():
                print(f"⚠️ Skipping keyword media with missing or invalid file: {image_path}")
                continue
            timestamps = mapping.get("timestamps", [])
            
            # Use different duration based on media type
            media_duration = base_video_duration if is_video else base_image_duration
            
            # Add to timeline for each timestamp
            for timestamp in timestamps:
                start_time = max(0.0, min(timestamp, scene_duration))
                end_time = min(scene_duration, start_time + media_duration)
                
                # If there's already an image at this time, keep the later one (or extend)
                if start_time in image_timeline:
                    existing_end, existing_path, existing_is_video = image_timeline[start_time]
                    if end_time > existing_end:
                        image_timeline[start_time] = (end_time, image_path, is_video)
                else:
                    image_timeline[start_time] = (end_time, image_path, is_video)
        
        # Sort timeline by start time (same as manual processing)
        sorted_timeline = sorted(image_timeline.items())
        
        # Create segments for the video (same approach as manual processing)
        segments = []
        current_time = 0.0
        
        for start_time, (end_time, image_path, is_video) in sorted_timeline:
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
                
                # Add text overlays to segment
                add_text_overlays_to_segment(segment_layers, current_time, segment_duration)
                
                segment_clip = CompositeVideoClip(segment_layers, size=video_size)
                segments.append(segment_clip)
            
            # Add segment with keyword image/video background (same as manual processing)
            if start_time < scene_duration:
                segment_duration = min(end_time, scene_duration) - start_time
                
                # Double-check if it's a video by file extension (in case is_video flag wasn't set correctly)
                is_video_file = str(image_path).lower().endswith(('.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv', '.m4v'))
                print(f"[DEBUG] Processing media at {start_time:.2f}s: path={image_path}, is_video={is_video}, is_video_file={is_video_file}")
                
                if is_video or is_video_file:
                    if not is_video:
                        print(f"⚠️ Warning: is_video flag was False but file extension indicates video: {image_path}. Correcting...")
                    is_video = True
                
                if is_video:
                    # Handle video background
                    print(f"Using video background: {image_path} for segment {start_time:.2f}s - {end_time:.2f}s")
                    bg_video_clip_keyword = VideoFileClip(image_path)
                    bg_video_clip_keyword = bg_video_clip_keyword.resized(new_size=(video_size[0], video_size[1]))
                    
                    # Loop or trim video to match segment duration
                    if bg_video_clip_keyword.duration < segment_duration:
                        loops_needed = int(np.ceil(segment_duration / bg_video_clip_keyword.duration))
                        bg_clips = [bg_video_clip_keyword] * loops_needed
                        bg_video_clip_keyword = concatenate_videoclips(bg_clips, method="compose")
                    
                    # Trim to exact segment duration
                    bg_video_clip_keyword = bg_video_clip_keyword.subclipped(0, segment_duration)
                    bg_media_clip = bg_video_clip_keyword
                else:
                    # Handle image background
                    try:
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
                        bg_media_clip = ImageClip(img_path_temp, duration=segment_duration)
                    except Exception as e:
                        print(f"❌ Error opening image file: {image_path}")
                        print(f"Error: {e}")
                        print(f"File exists: {Path(image_path).exists()}")
                        if Path(image_path).exists():
                            file_size = Path(image_path).stat().st_size
                            print(f"File size: {file_size} bytes")
                        raise ValueError(f"Cannot open image file {image_path}: {e}")
                
                # Extract the corresponding video segment
                video_segment = narrator_with_alpha.subclipped(start_time, min(end_time, scene_duration))
                
                # Composite keyword image/video background and video segment (same as manual processing)
                segment_layers = [bg_media_clip, video_segment]
                
                # Add logo to segment if available
                if logo_info:
                    logo_seg_clip = ImageClip(logo_info["path"], duration=segment_duration)
                    def get_logo_pos(t):
                        return logo_info["position"]
                    logo_seg_clip = logo_seg_clip.with_position(get_logo_pos)
                    segment_layers.append(logo_seg_clip)
                
                # Add text overlays to segment
                add_text_overlays_to_segment(segment_layers, start_time, segment_duration)
                
                segment_clip = CompositeVideoClip(segment_layers, size=video_size)
                segments.append(segment_clip)
                
                # Clean up temp image if it was created
                if not is_video:
                    img_path_temp = str(temp_dir / f"temp_keyword_bg_{start_time:.2f}_scene_{scene_index}.png")
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
            
            # Add text overlays to segment
            add_text_overlays_to_segment(segment_layers, current_time, scene_duration - current_time)
            
            segment_clip = CompositeVideoClip(segment_layers, size=video_size)
            segments.append(segment_clip)
        
        # If segments were created, use them without transitions
        # Transitions are only applied at scene level (first scene start, last scene end)
        if segments:
            print("Concatenating video segments with keyword images (no transitions on keyword media)...")
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
            
            # Add text overlays to composite if no segments (use timeline)
            for text_start, text_overlays in text_overlay_timeline.items():
                for text_overlay_info in text_overlays:
                    text_end = text_overlay_info["end_time"]
                    overlay_duration = text_end - text_start
                    text_clip = create_text_overlay(text_overlay_info["data"], overlay_duration, video_size)
                    if text_clip:
                        text_clip = text_clip.set_start(text_start)
                        composite_layers.append(text_clip)
                        print(f"Added text overlay '{text_overlay_info['data'].get('text', '')}' to composite at {text_start}s")
                    else:
                        print(f"Warning: Failed to create text overlay for '{text_overlay_info['data'].get('text', '')}'")
            
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
        
        # Add text overlays to composite (use timeline)
        for text_start, text_overlays in text_overlay_timeline.items():
            for text_overlay_info in text_overlays:
                text_end = text_overlay_info["end_time"]
                overlay_duration = text_end - text_start
                text_clip = create_text_overlay(text_overlay_info["data"], overlay_duration, video_size)
                if text_clip:
                    text_clip = text_clip.set_start(text_start)
                    composite_layers.append(text_clip)
                    print(f"Added text overlay '{text_overlay_info['data'].get('text', '')}' to composite at {text_start}s")
                else:
                    print(f"Warning: Failed to create text overlay for '{text_overlay_info['data'].get('text', '')}'")
        
        final_scene = CompositeVideoClip(composite_layers, size=video_size)
    
    # Add background music if available
    bg_music_settings = scene_settings.get("videoBackgroundMusic", {})
    if bg_music_settings and bg_music_settings.get("webViewLink"):
        music_url = bg_music_settings.get("webViewLink") or bg_music_settings.get("webContentLink", "")
        if music_url:
            music_local = temp_dir / f"bg_music_scene_{scene_index}.mp3"
            music_path = download_media(music_url, music_local, is_video=False)
            
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
    if bg_video_clip:
        bg_video_clip.close()
    
    return str(scene_output_path)

def process_project_json(temp_dir: Path, exports_dir: Path, json_path: str, output_path: str) -> Dict[str, str]:
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
    
    # Get project settings for passing to process_scene
    project_settings = project_data.get("project", {}).get("projectSettings", {})
    
    for idx, scene in enumerate(scenes):
        # Process scene to temp location first
        temp_scene_path = process_scene(scene, narrator_path, temp_dir, idx, project_settings)
        
        # Copy to exports directory with scene name
        scene_id = scene.get("id", f"scene_{idx + 1}")
        scene_output_path = exports_dir / f"{scene_id}.mp4"
        
        # Copy the file
        shutil.copy2(temp_scene_path, scene_output_path)
        
        scene_videos.append(temp_scene_path)  # Keep temp path for concatenation
        scene_output_paths.append(str(scene_output_path))
        
        print(f"Scene {idx + 1} saved to: {scene_output_path}")
    
    # Concatenate all scenes for final combined video with transitions
    print("Concatenating all scenes for final video...")
    scene_clips = [VideoFileClip(path) for path in scene_videos]
    
    # Get transition settings from project or first scene (project_settings already loaded above)
    transition_effect = project_settings.get("videoTransitionEffect", {})
    if not transition_effect and scenes:
        first_scene_settings = scenes[0].get("sceneSettings", {})
        transition_effect = first_scene_settings.get("videoTransitionEffect", {})
    
    transition_type = transition_effect.get("id", "fade_dissolve") if isinstance(transition_effect, dict) else "fade_dissolve"
    transition_duration = transition_effect.get("duration", 1.5) if isinstance(transition_effect, dict) else 1.5
    
    # Apply transitions only on first scene (start) and last scene (end)
    # No transitions on keyword media segments or between middle scenes
    if transition_type and transition_type != 'none':
        print(f"Applying transitions only on video start and end (type: {transition_type}, duration: {transition_duration}s)...")
        transitioned_scenes = []
        
        for i, clip in enumerate(scene_clips):
            # Only apply transitions to first scene (start) and last scene (end)
            if transition_type == 'fade_in':
                if i == 0:
                    fade_in = FadeIn(duration=min(transition_duration, clip.duration * 0.5))
                    clip = fade_in.apply(clip)
            elif transition_type == 'fade_out':
                if i == len(scene_clips) - 1:
                    fade_out = FadeOut(duration=min(transition_duration, clip.duration * 0.5))
                    clip = fade_out.apply(clip)
            elif transition_type in ['fade_dissolve', 'cross_dissolve']:
                # Apply fade-in only to first scene
                if i == 0:
                    fade_in = FadeIn(duration=min(transition_duration, clip.duration * 0.5))
                    clip = fade_in.apply(clip)
                # Apply fade-out only to last scene
                if i == len(scene_clips) - 1:
                    fade_out = FadeOut(duration=min(transition_duration, clip.duration * 0.5))
                    clip = fade_out.apply(clip)
            elif transition_type == 'fade_to_black':
                if i == len(scene_clips) - 1:
                    fade_out = FadeOut(duration=min(transition_duration, clip.duration * 0.5))
                    clip = fade_out.apply(clip)
            elif transition_type.startswith('slide_in_'):
                side = transition_type.replace('slide_in_', '')
                if i == 0:
                    slide_in = SlideIn(duration=min(transition_duration, clip.duration * 0.5), side=side)
                    clip = CompositeVideoClip([slide_in.apply(clip)], size=(clip.w, clip.h))
            elif transition_type.startswith('slide_out_'):
                side = transition_type.replace('slide_out_', '')
                if i == len(scene_clips) - 1:
                    slide_out = SlideOut(duration=min(transition_duration, clip.duration * 0.5), side=side)
                    clip = CompositeVideoClip([slide_out.apply(clip)], size=(clip.w, clip.h))
            
            transitioned_scenes.append(clip)
        
        print("Concatenating scenes with start/end transitions only...")
        final_video = concatenate_videoclips(transitioned_scenes, method="compose")
    else:
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
    
    print("Project processing complete!")
    print(f"Final combined video: {output_path}")
    print(f"Individual scenes: {len(scene_output_paths)} scene(s) saved")
    
    return {
        "final_video": output_path,
        "scenes": scene_output_paths
    }

