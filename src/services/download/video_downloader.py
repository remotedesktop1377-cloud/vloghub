"""
YouTube video downloader using yt-dlp.
"""
import os
import logging
import tempfile
import asyncio
from typing import Dict, Any, Optional, Callable
from pathlib import Path
import yt_dlp

from .models import DownloadRequest, DownloadProgress, VideoFormat, VideoQuality

logger = logging.getLogger(__name__)


class YouTubeVideoDownloader:
    """YouTube video downloader using yt-dlp."""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the YouTube video downloader.
        
        Args:
            config: Configuration parameters.
        """
        self.config = config or {}
        self.download_dir = self.config.get("download_dir", tempfile.gettempdir())
        
        # Ensure download directory exists
        Path(self.download_dir).mkdir(parents=True, exist_ok=True)
    
    async def download_video(
        self, 
        video_id: str, 
        request: DownloadRequest,
        progress_callback: Optional[Callable[[DownloadProgress], None]] = None
    ) -> Dict[str, Any]:
        """
        Download a YouTube video.
        
        Args:
            video_id: YouTube video ID.
            request: Download request parameters.
            progress_callback: Optional callback for progress updates.
            
        Returns:
            Dictionary with download information.
        """
        url = f"https://www.youtube.com/watch?v={video_id}"
        output_path = os.path.join(self.download_dir, f"{video_id}.%(ext)s")
        
        # Configure yt-dlp options
        ydl_opts = self._get_ydl_options(request, output_path, progress_callback)
        
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                # Extract video info first
                info = await asyncio.get_event_loop().run_in_executor(
                    None, ydl.extract_info, url, False
                )
                
                # Download the video
                await asyncio.get_event_loop().run_in_executor(
                    None, ydl.download, [url]
                )
                
                # Find the downloaded file
                downloaded_files = self._find_downloaded_files(video_id)
                
                return {
                    "video_id": video_id,
                    "title": info.get("title", "Unknown"),
                    "duration": info.get("duration", 0),
                    "format": info.get("format", "unknown"),
                    "file_size": info.get("filesize", 0),
                    "downloaded_files": downloaded_files,
                    "metadata": {
                        "uploader": info.get("uploader"),
                        "upload_date": info.get("upload_date"),
                        "view_count": info.get("view_count"),
                        "description": info.get("description", "")[:500],  # Truncate
                    }
                }
                
        except Exception as e:
            logger.error(f"Error downloading video {video_id}: {e}")
            raise
    
    def _get_ydl_options(
        self, 
        request: DownloadRequest, 
        output_path: str,
        progress_callback: Optional[Callable[[DownloadProgress], None]] = None
    ) -> Dict[str, Any]:
        """Get yt-dlp options based on request."""
        
        # Format selector based on quality and format
        format_selector = self._get_format_selector(request.quality, request.format)
        
        options = {
            'outtmpl': output_path,
            'format': format_selector,
            'writesubtitles': request.include_subtitles,
            'writeautomaticsub': request.include_subtitles,
            'subtitleslangs': request.subtitle_languages,
            'ignoreerrors': False,
            'no_warnings': False,
            'extractflat': False,
        }
        
        # Add progress hook if callback provided
        if progress_callback:
            options['progress_hooks'] = [
                lambda d: self._progress_hook(d, progress_callback)
            ]
        
        return options
    
    def _get_format_selector(self, quality: VideoQuality, format_type: VideoFormat) -> str:
        """Get format selector string for yt-dlp."""
        
        if quality == VideoQuality.BEST:
            return f"best[ext={format_type.value}]/best"
        elif quality == VideoQuality.WORST:
            return f"worst[ext={format_type.value}]/worst"
        else:
            # Extract height from quality (e.g., "720p" -> "720")
            height = quality.value.replace('p', '')
            return f"best[height<={height}][ext={format_type.value}]/best[height<={height}]"
    
    def _progress_hook(self, d: Dict[str, Any], callback: Callable[[DownloadProgress], None]):
        """Progress hook for yt-dlp."""
        if d['status'] == 'downloading':
            progress = DownloadProgress(
                downloaded_bytes=d.get('downloaded_bytes', 0),
                total_bytes=d.get('total_bytes'),
                percentage=d.get('_percent_str', '0%').replace('%', ''),
                speed=d.get('speed'),
                eta=d.get('eta')
            )
            
            try:
                progress.percentage = float(progress.percentage)
            except (ValueError, TypeError):
                progress.percentage = 0.0
            
            callback(progress)
    
    def _find_downloaded_files(self, video_id: str) -> list[str]:
        """Find files downloaded for a video ID."""
        download_path = Path(self.download_dir)
        files = []
        
        # Look for files starting with video_id
        for file_path in download_path.glob(f"{video_id}.*"):
            if file_path.is_file():
                files.append(str(file_path))
        
        return files
    
    async def get_video_info(self, video_id: str) -> Dict[str, Any]:
        """
        Get video information without downloading.
        
        Args:
            video_id: YouTube video ID.
            
        Returns:
            Video information dictionary.
        """
        url = f"https://www.youtube.com/watch?v={video_id}"
        
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
        }
        
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = await asyncio.get_event_loop().run_in_executor(
                    None, ydl.extract_info, url, False
                )
                
                return {
                    "video_id": video_id,
                    "title": info.get("title", "Unknown"),
                    "description": info.get("description", ""),
                    "duration": info.get("duration", 0),
                    "uploader": info.get("uploader", "Unknown"),
                    "upload_date": info.get("upload_date"),
                    "view_count": info.get("view_count", 0),
                    "thumbnail": info.get("thumbnail"),
                    "formats": [
                        {
                            "format_id": fmt.get("format_id"),
                            "ext": fmt.get("ext"),
                            "resolution": fmt.get("resolution"),
                            "filesize": fmt.get("filesize"),
                        }
                        for fmt in info.get("formats", [])
                        if fmt.get("vcodec") != "none"  # Video formats only
                    ]
                }
                
        except Exception as e:
            logger.error(f"Error getting video info for {video_id}: {e}")
            raise
    
    def cleanup_downloads(self, video_id: Optional[str] = None):
        """
        Clean up downloaded files.
        
        Args:
            video_id: Specific video ID to clean up, or None for all.
        """
        download_path = Path(self.download_dir)
        
        if video_id:
            # Clean up files for specific video
            for file_path in download_path.glob(f"{video_id}.*"):
                try:
                    file_path.unlink()
                    logger.info(f"Deleted file: {file_path}")
                except Exception as e:
                    logger.error(f"Error deleting file {file_path}: {e}")
        else:
            # Clean up all download files
            for file_path in download_path.glob("*"):
                if file_path.is_file():
                    try:
                        file_path.unlink()
                        logger.info(f"Deleted file: {file_path}")
                    except Exception as e:
                        logger.error(f"Error deleting file {file_path}: {e}")
    
    def get_download_dir(self) -> str:
        """Get the download directory path."""
        return self.download_dir 