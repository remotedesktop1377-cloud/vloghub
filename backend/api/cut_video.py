from moviepy import (
  VideoFileClip,
  concatenate_videoclips
)

from backend.lib.llm import VideoEdit
from pathlib import Path
import json
import os
import httpx
from typing import Optional

async def generate_scene_folders(
    job_id: str,
    number_of_scenes: int,
    frontend_url: Optional[str] = None
) -> bool:
    """
    Generate scene folders in Google Drive before uploading clips.
    Returns True if successful, False otherwise.
    """
    try:
        # Get frontend URL from environment or use default
        if not frontend_url:
            frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        
        # Normalize URL (remove trailing slash if present) - do this early
        frontend_url = frontend_url.rstrip('/')
        
        print(f"🌐 Frontend URL for folder generation: {frontend_url}")
        
        # Prepare form data
        data = {
            'jobName': job_id,
            'numberOfScenes': str(number_of_scenes)
        }
        
        # Generate scene folders via frontend API
        upload_url = f"{frontend_url}/api/google-drive-generate-scene-folders"
        print(f"📡 Calling: {upload_url}")
        print(f"📋 Data: jobName={job_id}, numberOfScenes={number_of_scenes}")
        
        async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
            response = await client.post(upload_url, data=data)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print(f"Successfully generated {number_of_scenes} scene folders for job {job_id}")
                return True
            else:
                print(f"Failed to generate scene folders: {result.get('message', 'Unknown error')}")
                return False
        else:
            print(f"Failed to generate scene folders: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"Error generating scene folders: {e}")
        return False

def get_scene_folder_name(scene_id: str, scene_index: int, total_scenes: int) -> str:
    """
    Convert scene ID to folder name format (scene-1, scene-2, etc.)
    Handles various scene ID formats and maps them to the correct folder name.
    """
    # If scene_id is already in format "scene-1", "scene-2", etc., use it
    if scene_id.startswith('scene-'):
        return scene_id
    
    # If scene_id is just a number or "1", "2", etc., convert to scene-1, scene-2
    try:
        # Try to extract number from scene_id
        scene_num = int(scene_id.replace('scene-', '').replace('scene', ''))
        # Determine padding width based on total scenes
        width = 3 if total_scenes >= 100 else (2 if total_scenes >= 10 else 1)
        return f"scene-{str(scene_num).zfill(width)}"
    except (ValueError, AttributeError):
        # If we can't parse, use the scene_index (1-based)
        width = 3 if total_scenes >= 100 else (2 if total_scenes >= 10 else 1)
        return f"scene-{str(scene_index + 1).zfill(width)}"

async def upload_clip_to_google_drive(
    clip_path: str, 
    job_id: str, 
    scene_id: str,
    scene_index: int,
    total_scenes: int,
    frontend_url: Optional[str] = None
) -> Optional[str]:
    """
    Upload a clip file to Google Drive and return the webViewLink.
    Returns None if upload fails.
    """
    try:
        # Get frontend URL from environment or use default
        if not frontend_url:
            frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        
        # Normalize URL (remove trailing slash if present) - do this early
        frontend_url = frontend_url.rstrip('/')
        
        print(f"Attempting to upload clip {scene_id} to Google Drive...")
        print(f"Clip path: {clip_path}")
        print(f"Frontend URL: {frontend_url}")
        print(f"Job ID: {job_id}")
        
        # Test connection to frontend first (optional - we'll still try the upload)
        # This is just to give a helpful warning if the frontend isn't accessible
        try:
            async with httpx.AsyncClient(timeout=3.0, follow_redirects=True) as test_client:
                await test_client.get(frontend_url)
                print(f"✅ Frontend is accessible at {frontend_url}")
        except Exception as conn_test_err:
            print(f"⚠️ Warning: Cannot reach frontend at {frontend_url}")
            print(f"   This might be normal if the frontend isn't running.")
            print(f"   Will still attempt upload, but it will likely fail.")
            print(f"   To fix: Make sure frontend is running or set FRONTEND_URL environment variable.")
        
        # Check if file exists
        if not os.path.exists(clip_path):
            print(f"ERROR: Clip file does not exist: {clip_path}")
            return None
        
        # Read the clip file
        with open(clip_path, 'rb') as f:
            file_data = f.read()
        
        file_size_mb = len(file_data) / (1024 * 1024)
        print(f"File size: {file_size_mb:.2f} MB")
        
        # Get the correct scene folder name (scene-1, scene-2, etc.)
        scene_folder_name = get_scene_folder_name(scene_id, scene_index, total_scenes)
        print(f"Scene folder name: {scene_folder_name}")
        
        # Prepare form data for multipart upload
        # httpx expects files as a dict with tuple values: (filename, file_data, content_type)
        files = {
            'file': (os.path.basename(clip_path), file_data, 'video/mp4')
        }
        data = {
            'jobName': job_id,
            'targetFolder': scene_folder_name  # Upload to scene folder (e.g., "scene-1")
        }
        
        # Upload to Google Drive via frontend API using httpx
        upload_url = f"{frontend_url}/api/google-drive-media-upload"
        print(f"Upload URL: {upload_url}")
        
        async with httpx.AsyncClient(timeout=300.0, follow_redirects=True) as client:
            response = await client.post(upload_url, files=files, data=data)
        
        print(f"Upload response status: {response.status_code}")
        print(f"Final URL after redirects: {response.url}")
        
        # Accept both 200 (OK) and 201 (Created) as success
        if response.status_code in [200, 201]:
            result = response.json()
            print(f"Upload response: {result}")
            if result.get('success') and result.get('webViewLink'):
                print(f"✅ Successfully uploaded clip {scene_id} to Google Drive: {result['webViewLink']}")
                return result['webViewLink']
            else:
                print(f"⚠️ Upload succeeded but no webViewLink returned for {scene_id}")
                print(f"Response: {result}")
                return None
        else:
            error_text = response.text[:500] if len(response.text) > 500 else response.text
            print(f"❌ Failed to upload clip {scene_id}: {response.status_code}")
            print(f"Error response: {error_text}")
            return None
            
    except httpx.TimeoutException as e:
        print(f"❌ Timeout error uploading clip {scene_id} to Google Drive: {e}")
        return None
    except httpx.RequestError as e:
        print(f"❌ Request error uploading clip {scene_id} to Google Drive: {e}")
        print(f"Error type: {type(e).__name__}")
        return None
    except Exception as e:
        print(f"❌ Unexpected error uploading clip {scene_id} to Google Drive: {e}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        return None

async def cut_video_segments(video_path: str, edits: list[VideoEdit], job_id: Optional[str] = None) -> tuple[str, list[dict]]:
    """Cut video segments based on the provided edits."""
    try:
      # Handle case where edits might be a RunResult object
      if hasattr(edits, 'content') and hasattr(edits.content, 'edits'):
        actual_edits = edits.content.edits
      elif hasattr(edits, 'edits'):
        actual_edits = edits.edits
      else:
        actual_edits = edits
      
      # Generate scene folders in Google Drive first if job_id is provided
      if job_id and len(actual_edits) > 0:
        print(f"📁 Generating {len(actual_edits)} scene folders in Google Drive for job {job_id}...")
        folders_created = await generate_scene_folders(job_id, len(actual_edits))
        if not folders_created:
          print("⚠️ Warning: Failed to generate scene folders. Clips may not upload correctly.")
        else:
          print(f"✅ Successfully generated scene folders for job {job_id}")
      elif not job_id:
        print("⚠️ Warning: No job_id provided. Clips will not be uploaded to Google Drive.")

      # Create exports directory and clear previous segment files
      exports_dir = Path("frontend/exports").resolve()
      exports_dir.mkdir(exist_ok=True)
      for existing_segment in exports_dir.glob("segment_*.mp4"):
        try:
          existing_segment.unlink()
        except OSError as cleanup_error:
          print(f"Unable to delete old segment {existing_segment}: {cleanup_error}")

      # Load the video file
      video_clip = VideoFileClip(video_path)

      # Sort edits by start time to process them in order
      sorted_edits = sorted(actual_edits, key=lambda x: x.startTime)

      # Create a list to hold the clips to keep and export each segment
      clips_to_keep = []
      exported_files = []
      segment_transcriptions = []  # Store transcriptions for each segment
      
      previous_end_time = 0  # Track where the previous clip ended
      
      for i, edit in enumerate(sorted_edits, start=1):
          # Use the original start and end times from the edit
          original_start = edit.startTime
          original_end = edit.endTime
          
          # Determine the start time by respecting the first edit's original start
          # while ensuring subsequent edits begin where the previous clip ended.
          if i == 1:
            start_time = max(0, original_start)
          else:
            # Prevent overlaps by never starting earlier than the prior clip's end.
            # If there is a gap between the prior end and the requested start, we trust
            # the prior end to keep clips contiguous.
            start_time = max(previous_end_time, original_start)
          
          # End time should be the original end time, but ensure it's after start_time
          # This preserves the original end time while ensuring no overlaps
          if original_end > start_time:
            end_time = original_end
          else:
            # If original_end is before or equal to start_time, calculate based on duration
            original_duration = original_end - original_start
            end_time = start_time + original_duration
          
          # Ensure end time is within video bounds
          if end_time > video_clip.duration:
            end_time = video_clip.duration
          
          # If start time equals or exceeds end time, skip this segment
          if start_time >= end_time:
            print(f"Skipping segment {i}: start ({start_time}) >= end ({end_time})")
            continue
          
          # Ensure times are within bounds
          if start_time < 0:
            start_time = 0
          
          # Debug output
          print(f"Segment {i}: Original [{original_start:.1f}s-{original_end:.1f}s] -> Adjusted [{start_time:.1f}s-{end_time:.1f}s]")
          
          # Keep this segment
          if start_time < end_time:
            segment = video_clip.subclipped(start_time, end_time)
            
            # Export individual segment with audio
            # segment_filename = f"segment_{i:03d}_{start_time:.1f}s-{end_time:.1f}s.mp4"
            segment_filename = f"segment_{edit.id}.mp4"
            segment_path = exports_dir / segment_filename
            
            # Save individual clip
            segment.write_videofile(
              str(segment_path), 
              codec="libx264",
              audio_codec="aac",
              temp_audiofile='temp/temp-audio.m4a',
              remove_temp=True
            )
            
            # Reload the saved segment for concatenation (to avoid memory issues)
            saved_segment = VideoFileClip(str(segment_path))
            clips_to_keep.append(saved_segment)
            exported_files.append(str(segment_path))
            
            # Store segment information with transcription
            # Upload clip to Google Drive if job_id is provided
            clip_url = None
            if job_id:
                print(f"📤 Uploading clip for scene {edit.id} (index {i})...")
                # Use i (1-based) for folder naming - this matches the folder creation order
                # The get_scene_folder_name function will handle converting edit.id or use the index
                clip_url = await upload_clip_to_google_drive(
                    str(segment_path),
                    job_id,
                    edit.id,
                    i - 1,  # scene_index (0-based, but i is 1-based from enumerate)
                    len(sorted_edits)  # total_scenes (use original count for padding calculation)
                )
                if clip_url:
                    print(f"✅ Clip uploaded successfully, using Google Drive URL")
                else:
                    print(f"⚠️ Clip upload failed, falling back to local path")
            else:
                print(f"⚠️ No job_id provided, skipping Google Drive upload for scene {edit.id}")
            
            # Use Google Drive URL if available, otherwise fall back to local path
            # In serverless environments (Vercel), local paths won't work, so we need the Drive URL
            clip_path_to_save = clip_url if clip_url else str(segment_path.resolve())
            print(f"💾 Saving clip path for scene {edit.id}: {clip_path_to_save[:100]}...")
            
            segment_info = {
              "id": edit.id,
              "narration": edit.narration,
              "duration": edit.duration,
              "words": edit.words,
              "startTime": edit.startTime,
              "endTime": edit.endTime,
              "durationInSeconds": edit.durationInSeconds,
              "clip": clip_path_to_save,
            }
            segment_transcriptions.append(segment_info)
            
            # Update previous_end_time for next iteration
            previous_end_time = end_time
      
      # Concatenate the clips to keep for the main output
      if clips_to_keep:
        final_clip = concatenate_videoclips(clips_to_keep)
      else:
        final_clip = video_clip
          
      # Save the concatenated edited video
      output_path = str(video_path).replace(".mp4", "_edited.mp4")
      final_clip.write_videofile(
        output_path, 
        codec="libx264",
        audio_codec="aac",
        temp_audiofile='temp/temp-audio.m4a',
        remove_temp=True
      )
      
      # Close all clips to free up resources
      final_clip.close()
      for clip in clips_to_keep:
        clip.close()
      video_clip.close()
      
      # Save segment transcriptions to JSON file
      transcriptions_file = Path("temp/segment_transcriptions.json")
      with open(transcriptions_file, 'w', encoding='utf-8') as f:
        json.dump(segment_transcriptions, f, ensure_ascii=False, indent=2)
      
      print(f"Saved {len(segment_transcriptions)} segment transcriptions to {transcriptions_file}")

      # Update processed_result.json with clip paths
      processed_result_path = Path("temp/processed_result.json")
      if processed_result_path.exists():
        with open(processed_result_path, 'r', encoding='utf-8') as f:
          processed_result = json.load(f)
        
        # Create a mapping of id to clip path
        clip_map = {seg["id"]: seg["clip"] for seg in segment_transcriptions}
        
        # Update each scene with its clip path
        if isinstance(processed_result, list):
          for scene in processed_result:
            scene_id = scene.get("id")
            if scene_id in clip_map:
              scene["clip"] = clip_map[scene_id]
        
        # Write updated processed_result.json
        with open(processed_result_path, 'w', encoding='utf-8') as f:
          json.dump(processed_result, f, ensure_ascii=False, indent=4)
        
        print(f"Updated processed_result.json with clip paths")

      return output_path, segment_transcriptions
    
    except Exception as e:
      print(f"Error cutting video segments: {e}")
      raise


