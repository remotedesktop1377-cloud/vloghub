"""
Video background removal service using RobustVideoMatting.
"""
import os
import logging
import tempfile
import shutil
import re
import json
from typing import Optional, Dict, Any
from pathlib import Path
import torch
import requests
from urllib.parse import urlparse, parse_qs

logger = logging.getLogger(__name__)

# Google Drive API imports
try:
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaIoBaseDownload
    import io
    GOOGLE_DRIVE_AVAILABLE = True
except ImportError:
    GOOGLE_DRIVE_AVAILABLE = False
    logger.warning("Google Drive API libraries not available. Install with: pip install google-api-python-client google-auth")

class VideoBackgroundProcessingService:
    """
    Service for removing video backgrounds using RobustVideoMatting.
    """
    
    def __init__(self):
        """Initialize the video background removal service."""
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        logger.info(f"Initializing VideoBackgroundProcessingService on device: {self.device}")
        self.model = None
        self.convert_video = None
        self.drive_service = None
        self._init_google_drive()
    
    def _init_google_drive(self):
        """Initialize Google Drive API client if credentials are available."""
        if not GOOGLE_DRIVE_AVAILABLE:
            logger.warning("Google Drive API not available. Will use unauthenticated download.")
            return
        
        try:
            # Try to find credentials file in multiple locations
            credentials_paths = [
                # Frontend config location (relative to project root)
                Path(__file__).resolve().parent.parent.parent / "frontend" / "src" / "config" / "gen-lang-client-0211941879-57f306607431.json",
                # Backend config location
                Path(__file__).resolve().parent.parent / "config" / "gen-lang-client-0211941879-57f306607431.json",
                # Environment variable
                os.getenv("GOOGLE_DRIVE_CREDENTIALS_PATH"),
                # Current directory
                Path("gen-lang-client-0211941879-57f306607431.json"),
            ]
            
            credentials_path = None
            for path_str in credentials_paths:
                if path_str:
                    path_obj = Path(path_str)
                    logger.debug(f"Checking credentials path: {path_obj} (exists: {path_obj.exists()})")
                    if path_obj.exists():
                        credentials_path = path_obj
                        break
            
            if not credentials_path:
                logger.warning("Google Drive credentials file not found in any of these locations:")
                for path_str in credentials_paths:
                    if path_str:
                        logger.warning(f"  - {path_str}")
                logger.warning("Will use unauthenticated download.")
                return
            
            logger.info(f"Loading Google Drive credentials from: {credentials_path}")
            logger.info(f"Credentials file absolute path: {credentials_path.resolve()}")
            
            # Load credentials
            credentials = service_account.Credentials.from_service_account_file(
                str(credentials_path),
                scopes=['https://www.googleapis.com/auth/drive']
            )
            
            # Build Drive service
            self.drive_service = build('drive', 'v3', credentials=credentials)
            logger.info("Google Drive API client initialized successfully")
            
            # Test the service by making a simple API call
            try:
                test_response = self.drive_service.about().get(fields='user').execute()
                logger.info(f"Google Drive API test successful. Authenticated as: {test_response.get('user', {}).get('emailAddress', 'Unknown')}")
            except Exception as test_error:
                logger.warning(f"Google Drive API test failed: {test_error}. Service may still work for file downloads.")
            
        except Exception as e:
            logger.warning(f"Failed to initialize Google Drive API: {e}. Will use unauthenticated download.")
            self.drive_service = None
    
    def _load_model(self, model_name: str = 'mobilenetv3'):
        """
        Load the RobustVideoMatting model.
        
        Args:
            model_name: Model name ('mobilenetv3' or 'resnet50')
        """
        if self.model is None:
            try:
                logger.info(f"Loading RobustVideoMatting model: {model_name}")
                self.model = torch.hub.load("PeterL1n/RobustVideoMatting", model_name)
                if self.device == 'cuda':
                    self.model = self.model.cuda()
                else:
                    self.model = self.model.cpu()
                logger.info(f"Model loaded successfully on {self.device}")
            except Exception as e:
                logger.error(f"Failed to load model: {e}")
                raise
    
    def _load_converter(self):
        """Load the video converter from RobustVideoMatting."""
        if self.convert_video is None:
            try:
                logger.info("Loading RobustVideoMatting converter")
                self.convert_video = torch.hub.load("PeterL1n/RobustVideoMatting", "converter")
                logger.info("Converter loaded successfully")
            except Exception as e:
                logger.error(f"Failed to load converter: {e}")
                raise
    
    def _extract_file_id(self, drive_url: str) -> str:
        """
        Extract file ID from various Google Drive URL formats.
        
        Args:
            drive_url: Google Drive URL
            
        Returns:
            File ID
        """
        file_id = None
        parsed_url = urlparse(drive_url)
        
        # Try query parameter first (for /uc?id= or /open?id=)
        query_params = parse_qs(parsed_url.query)
        file_id = query_params.get('id', [None])[0]
        
        # If not found, try path format: /file/d/FILE_ID/ or /file/d/FILE_ID/view
        if not file_id:
            path_parts = [p for p in parsed_url.path.split('/') if p]  # Remove empty strings
            if 'd' in path_parts:
                idx = path_parts.index('d')
                if idx + 1 < len(path_parts):
                    file_id = path_parts[idx + 1]
        
        # Also try regex pattern as fallback
        if not file_id:
            file_id_match = re.search(r'/file/d/([a-zA-Z0-9_-]+)', drive_url)
            if file_id_match:
                file_id = file_id_match.group(1)
        
        if not file_id:
            raise ValueError(f"Could not extract file ID from Google Drive URL: {drive_url}")
        
        return file_id
    
    def _download_video_from_drive(self, drive_url: str, output_path: str) -> str:
        """
        Download video from Google Drive URL using authenticated API if available,
        otherwise falls back to unauthenticated download.
        
        Args:
            drive_url: Google Drive URL
            output_path: Path to save the downloaded video
            
        Returns:
            Path to the downloaded video file
        """
        try:
            # Extract file ID
            file_id = self._extract_file_id(drive_url)
            logger.info(f"Downloading video from Google Drive: {file_id}")
            logger.info(f"Drive service available: {self.drive_service is not None}")
            
            # Try authenticated download first if Drive service is available
            if self.drive_service:
                try:
                    logger.info("Attempting authenticated download using Google Drive API...")
                    return self._download_video_authenticated(file_id, output_path)
                except Exception as auth_error:
                    logger.error(f"Authenticated download failed: {type(auth_error).__name__}: {str(auth_error)}")
                    logger.warning("Falling back to unauthenticated download...")
                    import traceback
                    logger.debug(f"Traceback: {traceback.format_exc()}")
            else:
                logger.warning("Google Drive service not initialized. Using unauthenticated download...")
            
            # Fallback to unauthenticated download
            logger.info("Using unauthenticated download method...")
            return self._download_video_unauthenticated(file_id, output_path)
            
        except Exception as e:
            logger.error(f"Failed to download video from Drive: {e}")
            # Clean up partial download
            if os.path.exists(output_path):
                try:
                    os.remove(output_path)
                except:
                    pass
            raise
    
    def _download_video_authenticated(self, file_id: str, output_path: str) -> str:
        """
        Download video using authenticated Google Drive API.
        
        Args:
            file_id: Google Drive file ID
            output_path: Path to save the downloaded video
            
        Returns:
            Path to the downloaded video file
        """
        if not self.drive_service:
            raise ValueError("Google Drive service not initialized")
        
        try:
            logger.info(f"Fetching file metadata for file ID: {file_id}")
            # Get file metadata first to get the filename
            # Use supportsAllDrives=True to access files in shared drives
            file_metadata = self.drive_service.files().get(
                fileId=file_id,
                fields='name, mimeType, size',
                supportsAllDrives=True
            ).execute()
            
            file_name = file_metadata.get('name', 'video.mp4')
            file_size = int(file_metadata.get('size', 0))
            logger.info(f"File metadata retrieved - Name: {file_name}, Size: {file_size / (1024*1024):.2f} MB")
            
            # Download file using Drive API
            # Use supportsAllDrives=True to access files in shared drives
            logger.info("Starting authenticated download from Google Drive API...")
            request = self.drive_service.files().get_media(fileId=file_id)
            
            # Download with progress tracking
            total_size = 0
            with open(output_path, 'wb') as fh:
                downloader = MediaIoBaseDownload(fh, request)
                done = False
                chunk_count = 0
                while done is False:
                    status, done = downloader.next_chunk()
                    if status:
                        total_size = int(status.resumable_progress)
                        progress = status.progress() * 100
                        chunk_count += 1
                        
                        # Log progress every 10% or every 50 chunks
                        if chunk_count % 50 == 0 or int(progress) % 10 == 0:
                            if file_size > 0:
                                logger.info(f"Download progress: {progress:.1f}% ({total_size / (1024*1024):.2f} MB)")
                            else:
                                logger.info(f"Downloaded: {total_size / (1024*1024):.2f} MB")
            
            # Verify file was downloaded
            file_size_downloaded = os.path.getsize(output_path)
            if file_size_downloaded == 0:
                raise ValueError("Downloaded file is empty")
            
            logger.info(f"Video downloaded successfully via authenticated API: {file_size_downloaded / (1024*1024):.2f} MB")
            return output_path
            
        except Exception as e:
            error_type = type(e).__name__
            error_msg = str(e)
            logger.error(f"Authenticated download failed: {error_type}: {error_msg}")
            
            # Check for specific error types
            if '404' in error_msg or 'not found' in error_msg.lower():
                raise ValueError(f"File not found or not accessible: {error_msg}")
            elif '403' in error_msg or 'permission' in error_msg.lower() or 'forbidden' in error_msg.lower():
                raise ValueError(f"Permission denied. The file may not be accessible with the current credentials: {error_msg}")
            elif '401' in error_msg or 'unauthorized' in error_msg.lower():
                raise ValueError(f"Authentication failed. Please check Google Drive credentials: {error_msg}")
            
            # Re-raise for other errors
            raise
    
    def _download_video_unauthenticated(self, file_id: str, output_path: str) -> str:
        """
        Download video using unauthenticated HTTP requests (fallback method).
        
        Args:
            file_id: Google Drive file ID
            output_path: Path to save the downloaded video
            
        Returns:
            Path to the downloaded video file
        """
        try:
            # Create a session to handle cookies and redirects
            session = requests.Session()
            session.headers.update({
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            })
            
            # First, make a HEAD request to check content type (doesn't work for Drive, so skip)
            # Method 1: Try direct download with confirm=t (works for most files)
            download_url = f"https://drive.google.com/uc?export=download&id={file_id}&confirm=t"
            logger.info(f"Attempting download from: {download_url}")
            
            # Make initial request to check if we get HTML or video
            initial_response = session.get(download_url, stream=False, allow_redirects=True, timeout=30)
            initial_response.raise_for_status()
            
            # Check content type
            content_type = initial_response.headers.get('Content-Type', '').lower()
            is_html = 'text/html' in content_type
            
            # Check response text if it's HTML
            response_text = ''
            if is_html:
                response_text = initial_response.text
                logger.info("Received HTML response, likely virus scan warning")
            
            # If we got HTML, handle virus scan warning
            if is_html or 'virus scan warning' in response_text.lower() or 'download anyway' in response_text.lower():
                logger.info("Large file detected, handling virus scan warning...")
                
                # Use the response text we already have, or get it if we don't
                if not response_text:
                    warning_url = f"https://drive.google.com/uc?export=download&id={file_id}"
                    warning_response = session.get(warning_url, allow_redirects=True, timeout=30)
                    warning_text = warning_response.text
                else:
                    warning_text = response_text
                
                # Extract confirm token using multiple patterns
                confirm_token = None
                
                # Pattern 1: confirm=TOKEN
                confirm_match = re.search(r'confirm=([a-zA-Z0-9_-]+)', warning_text)
                if confirm_match:
                    confirm_token = confirm_match.group(1)
                    logger.info(f"Found confirm token: {confirm_token}")
                
                # Pattern 2: href with confirm parameter
                if not confirm_token:
                    href_match = re.search(r'href="[^"]*confirm=([a-zA-Z0-9_-]+)[^"]*"', warning_text)
                    if href_match:
                        confirm_token = href_match.group(1)
                        logger.info(f"Found confirm token in href: {confirm_token}")
                
                # Pattern 3: Try to find download link
                if not confirm_token:
                    download_link_match = re.search(r'action="([^"]*uc[^"]*)"', warning_text)
                    if download_link_match:
                        action_url = download_link_match.group(1)
                        if 'confirm=' in action_url:
                            confirm_match = re.search(r'confirm=([a-zA-Z0-9_-]+)', action_url)
                            if confirm_match:
                                confirm_token = confirm_match.group(1)
                                logger.info(f"Found confirm token in action: {confirm_token}")
                
                # Use confirm token or fallback to 't'
                if confirm_token:
                    download_url = f"https://drive.google.com/uc?export=download&id={file_id}&confirm={confirm_token}"
                else:
                    logger.warning("Could not extract confirm token, using 't' as fallback")
                    download_url = f"https://drive.google.com/uc?export=download&id={file_id}&confirm=t"
                
                # Retry download with confirm token
                logger.info(f"Retrying download with confirm token: {download_url}")
                response = session.get(download_url, stream=True, allow_redirects=True, timeout=300)
                response.raise_for_status()
                
                # Final check: verify we got video content, not HTML
                final_content_type = response.headers.get('Content-Type', '').lower()
                if 'text/html' in final_content_type:
                    # Try alternative download method using /open endpoint
                    logger.info("Trying alternative download method using /open endpoint...")
                    alt_download_url = f"https://drive.google.com/uc?export=download&id={file_id}"
                    alt_response = session.get(alt_download_url, stream=True, allow_redirects=True, timeout=300)
                    alt_response.raise_for_status()
                    alt_content_type = alt_response.headers.get('Content-Type', '').lower()
                    if 'text/html' in alt_content_type:
                        raise ValueError(
                            f"Received HTML instead of video file. The file may require authentication or have sharing restrictions. "
                            f"File ID: {file_id}. Please ensure the file is publicly accessible or use file upload instead of Drive URL."
                        )
                    # Use the alternative response
                    response = alt_response
            else:
                # We got the video directly, but we consumed it in the initial request
                # Need to make a new streaming request
                logger.info("Direct download successful, making streaming request...")
                response = session.get(download_url, stream=True, allow_redirects=True, timeout=300)
                response.raise_for_status()
                
                # Verify content type
                final_content_type = response.headers.get('Content-Type', '').lower()
                if 'text/html' in final_content_type:
                    raise ValueError("Received HTML instead of video file. The file may not be accessible or the download link is invalid.")
            
            # Save video file with progress tracking and verification
            total_size = 0
            expected_size = int(response.headers.get('Content-Length', 0))
            
            logger.info(f"Starting download. Expected size: {expected_size / (1024*1024):.2f} MB" if expected_size > 0 else "Starting download. Size unknown.")
            
            with open(output_path, 'wb') as f:
                chunk_count = 0
                for chunk in response.iter_content(chunk_size=8192 * 8):  # 64KB chunks for better performance
                    if chunk:
                        f.write(chunk)
                        total_size += len(chunk)
                        chunk_count += 1
                        
                        # Log progress every 50 chunks or 10% if we know the size
                        if expected_size > 0:
                            progress = (total_size / expected_size) * 100
                            if chunk_count % 50 == 0 or int(progress) % 10 == 0:
                                logger.info(f"Download progress: {progress:.1f}% ({total_size / (1024*1024):.2f} MB)")
                        elif chunk_count % 100 == 0:  # Log every 100 chunks if size unknown
                            logger.info(f"Downloaded: {total_size / (1024*1024):.2f} MB")
            
            # Verify file was downloaded completely
            file_size = os.path.getsize(output_path)
            if file_size == 0:
                raise ValueError("Downloaded file is empty")
            
            # Check file size matches expected (with tolerance)
            if expected_size > 0:
                size_diff = abs(file_size - expected_size)
                size_diff_percent = (size_diff / expected_size) * 100
                if size_diff_percent > 5:  # More than 5% difference
                    logger.warning(f"File size mismatch: expected {expected_size} bytes, got {file_size} bytes ({size_diff_percent:.1f}% difference)")
                    # For video files, this might be okay (compression), but log it
            
            file_size_mb = file_size / (1024 * 1024)
            logger.info(f"Video downloaded successfully: {file_size_mb:.2f} MB")
            
            # Verify it's a valid video file by checking file signature (magic bytes)
            # MP4 files start with specific bytes
            with open(output_path, 'rb') as f:
                first_bytes = f.read(12)
                # MP4 files typically start with ftyp box
                if not (first_bytes[4:8] == b'ftyp' or first_bytes[0:4] == b'\x00\x00\x00\x20' or first_bytes[4:8] in [b'isom', b'mp41', b'mp42', b'avc1']):
                    logger.warning(f"File may not be a valid MP4. First bytes: {first_bytes[:12].hex()}")
                    # Don't fail here, let the video processor try it
            
            return output_path
            
        except Exception as e:
            logger.error(f"Failed to download video from Drive: {e}")
            # Clean up partial download
            if os.path.exists(output_path):
                try:
                    os.remove(output_path)
                except:
                    pass
            raise
    
    def remove_background_from_file(
        self,
        input_file_path: str,
        job_id: str,
        model: str = 'mobilenetv3',
        downsample_ratio: Optional[float] = None,
        output_video_mbps: int = 4,
        seq_chunk: int = 12,
        num_workers: int = 1
    ) -> Dict[str, Any]:
        """
        Remove background from a local video file using RobustVideoMatting.
        
        Args:
            input_file_path: Path to the input video file
            job_id: Job ID for tracking
            model: Model name ('mobilenetv3' or 'resnet50')
            downsample_ratio: Downsample ratio (None for auto)
            output_video_mbps: Output video bitrate in Mbps
            seq_chunk: Number of frames to process at once
            num_workers: Number of worker threads
            
        Returns:
            Dictionary with output file paths
        """
        temp_dir = None
        try:
            # Verify input file exists
            if not os.path.exists(input_file_path):
                raise ValueError(f"Input file not found: {input_file_path}")
            
            file_size = os.path.getsize(input_file_path) / (1024 * 1024)  # MB
            logger.info(f"Processing local video file: {input_file_path}, size: {file_size:.2f} MB")
            
            # Create temporary directory for output files
            temp_dir = tempfile.mkdtemp(prefix=f"video_bg_removal_{job_id}_")
            logger.info(f"Created temporary directory: {temp_dir}")
            
            # Load model and converter
            self._load_model(model)
            self._load_converter()
            
            # Set up output paths
            output_composition = os.path.join(temp_dir, "com.mp4")
            output_alpha = os.path.join(temp_dir, "pha.mp4")
            output_foreground = os.path.join(temp_dir, "fgr.mp4")
            
            # Process video
            logger.info("Starting video background removal...")
            self.convert_video(
                self.model,
                input_source=input_file_path,
                downsample_ratio=downsample_ratio,
                output_type='video',
                output_composition=output_composition,
                output_alpha=output_alpha,
                output_foreground=output_foreground,
                output_video_mbps=output_video_mbps,
                seq_chunk=seq_chunk,
                num_workers=num_workers,
                progress=True
            )
            
            logger.info("Video background removal completed successfully")
            
            # Return file paths
            return {
                'success': True,
                'output_composition': output_composition,
                'output_alpha': output_alpha,
                'output_foreground': output_foreground,
                'temp_dir': temp_dir
            }
            
        except Exception as e:
            logger.error(f"Error in video background removal: {e}")
            # Cleanup on error
            if temp_dir and os.path.exists(temp_dir):
                try:
                    shutil.rmtree(temp_dir)
                except:
                    pass
            raise
    
    def remove_background(
        self,
        drive_url: str,
        job_id: str,
        model: str = 'mobilenetv3',
        downsample_ratio: Optional[float] = None,
        output_video_mbps: int = 4,
        seq_chunk: int = 12,
        num_workers: int = 1
    ) -> Dict[str, Any]:
        """
        Remove background from video using RobustVideoMatting.
        
        Args:
            drive_url: Google Drive URL of the input video
            job_id: Job ID for tracking
            model: Model name ('mobilenetv3' or 'resnet50')
            downsample_ratio: Downsample ratio (None for auto)
            output_video_mbps: Output video bitrate in Mbps
            seq_chunk: Number of frames to process at once
            num_workers: Number of worker threads
            
        Returns:
            Dictionary with output file paths and Drive URLs
        """
        temp_dir = None
        try:
            # Create temporary directory for processing
            temp_dir = tempfile.mkdtemp(prefix=f"video_bg_removal_{job_id}_")
            logger.info(f"Created temporary directory: {temp_dir}")
            
            # Download video from Drive
            input_path = os.path.join(temp_dir, "input.mp4")
            self._download_video_from_drive(drive_url, input_path)
            
            # Load model and converter
            self._load_model(model)
            self._load_converter()
            
            # Set up output paths
            output_composition = os.path.join(temp_dir, "com.mp4")
            output_alpha = os.path.join(temp_dir, "pha.mp4")
            output_foreground = os.path.join(temp_dir, "fgr.mp4")
            
            # Process video
            logger.info("Starting video background removal...")
            self.convert_video(
                self.model,
                input_source=input_path,
                downsample_ratio=downsample_ratio,
                output_type='video',
                output_composition=output_composition,
                output_alpha=output_alpha,
                output_foreground=output_foreground,
                output_video_mbps=output_video_mbps,
                seq_chunk=seq_chunk,
                num_workers=num_workers,
                progress=True
            )
            
            logger.info("Video background removal completed successfully")
            
            # Return file paths (these will need to be uploaded to Drive by the route)
            return {
                'success': True,
                'output_composition': output_composition,
                'output_alpha': output_alpha,
                'output_foreground': output_foreground,
                'temp_dir': temp_dir
            }
            
        except Exception as e:
            logger.error(f"Error in video background removal: {e}")
            # Cleanup on error
            if temp_dir and os.path.exists(temp_dir):
                try:
                    shutil.rmtree(temp_dir)
                except:
                    pass
            raise

