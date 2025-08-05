"""
Clip processor for extracting video segments using FFmpeg.
"""
import logging
import os
import subprocess
import tempfile
from typing import List, Dict, Any, Optional
from pathlib import Path

from .models import ClipRequest, VideoFormat

logger = logging.getLogger(__name__)


class ClipProcessor:
    """Processor for extracting video clips using FFmpeg."""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize clip processor.
        
        Args:
            config: Configuration parameters.
        """
        self.config = config or {}
        self.ffmpeg_path = self.config.get("ffmpeg_path", "ffmpeg")
        self.output_dir = self.config.get("output_dir", tempfile.gettempdir())
        self.quality_settings = self.config.get("quality_settings", {
            "720p": ["-vf", "scale=1280:720", "-crf", "23"],
            "480p": ["-vf", "scale=854:480", "-crf", "25"],
            "360p": ["-vf", "scale=640:360", "-crf", "28"]
        })
        
        # Ensure output directory exists
        Path(self.output_dir).mkdir(parents=True, exist_ok=True)
    
    async def process_clips(
        self, 
        input_file: str, 
        clips: List[ClipRequest],
        output_format: VideoFormat = VideoFormat.MP4
    ) -> List[str]:
        """
        Process video clips from input file.
        
        Args:
            input_file: Path to input video file.
            clips: List of clip requests.
            output_format: Output video format.
            
        Returns:
            List of output file paths.
        """
        if not os.path.exists(input_file):
            raise FileNotFoundError(f"Input file not found: {input_file}")
        
        output_files = []
        
        for i, clip in enumerate(clips):
            try:
                output_file = await self._extract_clip(
                    input_file, 
                    clip, 
                    output_format,
                    f"clip_{i+1:03d}"
                )
                output_files.append(output_file)
                logger.info(f"Successfully extracted clip {clip.clip_id}")
                
            except Exception as e:
                logger.error(f"Failed to extract clip {clip.clip_id}: {e}")
                # Continue with other clips
        
        return output_files
    
    async def _extract_clip(
        self, 
        input_file: str, 
        clip: ClipRequest, 
        output_format: VideoFormat,
        filename_prefix: str
    ) -> str:
        """
        Extract a single clip from video.
        
        Args:
            input_file: Input video file path.
            clip: Clip request.
            output_format: Output format.
            filename_prefix: Prefix for output filename.
            
        Returns:
            Output file path.
        """
        # Generate output filename
        safe_title = self._sanitize_filename(clip.title or "clip")
        output_filename = f"{filename_prefix}_{safe_title}.{output_format.value}"
        output_path = os.path.join(self.output_dir, output_filename)
        
        # Calculate duration
        duration = clip.end_time - clip.start_time
        
        # Build FFmpeg command
        cmd = [
            self.ffmpeg_path,
            "-i", input_file,
            "-ss", str(clip.start_time),
            "-t", str(duration),
            "-c", "copy",  # Copy streams without re-encoding for speed
            "-avoid_negative_ts", "make_zero",
            "-y",  # Overwrite output file
            output_path
        ]
        
        # Add quality settings if re-encoding is needed
        if self.config.get("force_reencode", False):
            cmd.remove("-c")
            cmd.remove("copy")
            quality_preset = self.config.get("quality", "720p")
            if quality_preset in self.quality_settings:
                cmd.extend(self.quality_settings[quality_preset])
        
        try:
            # Run FFmpeg
            logger.info(f"Extracting clip: {' '.join(cmd)}")
            
            process = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )
            
            if process.returncode != 0:
                raise RuntimeError(f"FFmpeg failed: {process.stderr}")
            
            if not os.path.exists(output_path):
                raise RuntimeError("Output file was not created")
            
            logger.info(f"Successfully extracted clip to {output_path}")
            return output_path
            
        except subprocess.TimeoutExpired:
            raise RuntimeError("Clip extraction timed out")
        except Exception as e:
            # Clean up partial file
            if os.path.exists(output_path):
                os.unlink(output_path)
            raise
    
    def _sanitize_filename(self, filename: str) -> str:
        """Sanitize filename for filesystem compatibility."""
        # Remove or replace problematic characters
        invalid_chars = '<>:"/\\|?*'
        for char in invalid_chars:
            filename = filename.replace(char, '_')
        
        # Limit length
        filename = filename[:50]
        
        # Remove leading/trailing spaces and dots
        filename = filename.strip(' .')
        
        # Ensure non-empty
        if not filename:
            filename = "clip"
        
        return filename
    
    async def merge_clips(
        self, 
        clip_files: List[str], 
        output_path: str,
        add_transitions: bool = False
    ) -> str:
        """
        Merge multiple clips into a single video.
        
        Args:
            clip_files: List of clip file paths.
            output_path: Output file path.
            add_transitions: Whether to add transitions between clips.
            
        Returns:
            Output file path.
        """
        if not clip_files:
            raise ValueError("No clips to merge")
        
        if len(clip_files) == 1:
            # Just copy the single file
            import shutil
            shutil.copy2(clip_files[0], output_path)
            return output_path
        
        # Create concat file list
        concat_file = os.path.join(self.output_dir, "concat_list.txt")
        
        try:
            with open(concat_file, 'w') as f:
                for clip_file in clip_files:
                    f.write(f"file '{clip_file}'\n")
            
            # Build FFmpeg concat command
            cmd = [
                self.ffmpeg_path,
                "-f", "concat",
                "-safe", "0",
                "-i", concat_file,
                "-c", "copy",
                "-y",
                output_path
            ]
            
            # Add transitions if requested
            if add_transitions and len(clip_files) > 1:
                # This would require more complex FFmpeg filter graphs
                # For now, just do simple concatenation
                pass
            
            logger.info(f"Merging clips: {' '.join(cmd)}")
            
            process = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=600  # 10 minute timeout
            )
            
            if process.returncode != 0:
                raise RuntimeError(f"FFmpeg merge failed: {process.stderr}")
            
            if not os.path.exists(output_path):
                raise RuntimeError("Merged output file was not created")
            
            logger.info(f"Successfully merged clips to {output_path}")
            return output_path
            
        finally:
            # Clean up concat file
            if os.path.exists(concat_file):
                os.unlink(concat_file)
    
    def get_video_info(self, video_path: str) -> Dict[str, Any]:
        """
        Get video information using FFprobe.
        
        Args:
            video_path: Path to video file.
            
        Returns:
            Video information dictionary.
        """
        cmd = [
            "ffprobe",
            "-v", "quiet",
            "-print_format", "json",
            "-show_format",
            "-show_streams",
            video_path
        ]
        
        try:
            process = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if process.returncode != 0:
                raise RuntimeError(f"FFprobe failed: {process.stderr}")
            
            import json
            return json.loads(process.stdout)
            
        except Exception as e:
            logger.error(f"Failed to get video info: {e}")
            return {}
    
    def cleanup_files(self, file_paths: List[str]):
        """Clean up temporary files."""
        for file_path in file_paths:
            try:
                if os.path.exists(file_path):
                    os.unlink(file_path)
                    logger.info(f"Cleaned up file: {file_path}")
            except Exception as e:
                logger.error(f"Failed to clean up file {file_path}: {e}") 