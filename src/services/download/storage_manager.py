"""
Storage manager for handling file storage across different providers.
"""
import logging
import os
import shutil
from typing import List, Dict, Any, Optional
from pathlib import Path
from datetime import datetime

from .models import StorageProvider, StorageConfig

logger = logging.getLogger(__name__)


class StorageManager:
    """Manager for file storage operations."""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize storage manager.
        
        Args:
            config: Configuration parameters.
        """
        self.config = config or {}
        self.local_base_path = self.config.get("local_base_path", "downloads")
        self.naming_pattern = self.config.get("naming_pattern", "{video_id}_{timestamp}")
        
        # Ensure local base path exists
        Path(self.local_base_path).mkdir(parents=True, exist_ok=True)
    
    async def store_files(
        self, 
        file_paths: List[str], 
        provider: StorageProvider,
        storage_path: Optional[str] = None
    ) -> List[str]:
        """
        Store files using specified provider.
        
        Args:
            file_paths: List of file paths to store.
            provider: Storage provider.
            storage_path: Optional custom storage path.
            
        Returns:
            List of stored file paths/URLs.
        """
        if provider == StorageProvider.LOCAL:
            return await self._store_local(file_paths, storage_path)
        elif provider == StorageProvider.AWS_S3:
            return await self._store_s3(file_paths, storage_path)
        elif provider == StorageProvider.GOOGLE_DRIVE:
            return await self._store_google_drive(file_paths, storage_path)
        else:
            raise ValueError(f"Unsupported storage provider: {provider}")
    
    async def _store_local(self, file_paths: List[str], storage_path: Optional[str] = None) -> List[str]:
        """Store files locally."""
        stored_files = []
        
        # Determine target directory
        if storage_path:
            target_dir = Path(self.local_base_path) / storage_path
        else:
            # Generate path based on timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            target_dir = Path(self.local_base_path) / timestamp
        
        target_dir.mkdir(parents=True, exist_ok=True)
        
        for file_path in file_paths:
            if not os.path.exists(file_path):
                logger.warning(f"Source file not found: {file_path}")
                continue
            
            filename = os.path.basename(file_path)
            target_path = target_dir / filename
            
            # Copy file
            try:
                shutil.copy2(file_path, target_path)
                stored_files.append(str(target_path))
                logger.info(f"Stored file locally: {target_path}")
            except Exception as e:
                logger.error(f"Failed to store file locally {file_path}: {e}")
        
        return stored_files
    
    async def _store_s3(self, file_paths: List[str], storage_path: Optional[str] = None) -> List[str]:
        """Store files in AWS S3."""
        try:
            import boto3
            from botocore.exceptions import NoCredentialsError
        except ImportError:
            raise ImportError("boto3 package required for S3 storage")
        
        # Get S3 configuration
        s3_config = self.config.get("aws_config", {})
        bucket_name = s3_config.get("bucket_name")
        region = s3_config.get("region", "us-east-1")
        
        if not bucket_name:
            raise ValueError("S3 bucket name not configured")
        
        try:
            s3_client = boto3.client('s3', region_name=region)
            stored_files = []
            
            for file_path in file_paths:
                if not os.path.exists(file_path):
                    logger.warning(f"Source file not found: {file_path}")
                    continue
                
                filename = os.path.basename(file_path)
                
                # Generate S3 key
                if storage_path:
                    s3_key = f"{storage_path}/{filename}"
                else:
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    s3_key = f"downloads/{timestamp}/{filename}"
                
                # Upload file
                try:
                    s3_client.upload_file(file_path, bucket_name, s3_key)
                    s3_url = f"s3://{bucket_name}/{s3_key}"
                    stored_files.append(s3_url)
                    logger.info(f"Stored file in S3: {s3_url}")
                except Exception as e:
                    logger.error(f"Failed to upload file to S3 {file_path}: {e}")
            
            return stored_files
            
        except NoCredentialsError:
            raise RuntimeError("AWS credentials not found")
        except Exception as e:
            logger.error(f"S3 storage failed: {e}")
            raise
    
    async def _store_google_drive(self, file_paths: List[str], storage_path: Optional[str] = None) -> List[str]:
        """Store files in Google Drive."""
        try:
            from googleapiclient.discovery import build
            from googleapiclient.http import MediaFileUpload
            from google.oauth2.credentials import Credentials
        except ImportError:
            raise ImportError("google-api-python-client package required for Google Drive storage")
        
        # Get Google Drive configuration
        drive_config = self.config.get("google_drive_config", {})
        credentials_path = drive_config.get("credentials_path")
        folder_id = drive_config.get("folder_id")
        
        if not credentials_path:
            raise ValueError("Google Drive credentials not configured")
        
        try:
            # Load credentials
            creds = Credentials.from_authorized_user_file(credentials_path)
            service = build('drive', 'v3', credentials=creds)
            
            stored_files = []
            
            # Create folder if storage_path specified
            parent_folder_id = folder_id
            if storage_path:
                parent_folder_id = await self._create_drive_folder(service, storage_path, folder_id)
            
            for file_path in file_paths:
                if not os.path.exists(file_path):
                    logger.warning(f"Source file not found: {file_path}")
                    continue
                
                filename = os.path.basename(file_path)
                
                # Upload file
                try:
                    file_metadata = {
                        'name': filename,
                        'parents': [parent_folder_id] if parent_folder_id else []
                    }
                    
                    media = MediaFileUpload(file_path, resumable=True)
                    file = service.files().create(
                        body=file_metadata,
                        media_body=media,
                        fields='id'
                    ).execute()
                    
                    file_id = file.get('id')
                    drive_url = f"https://drive.google.com/file/d/{file_id}/view"
                    stored_files.append(drive_url)
                    logger.info(f"Stored file in Google Drive: {drive_url}")
                    
                except Exception as e:
                    logger.error(f"Failed to upload file to Google Drive {file_path}: {e}")
            
            return stored_files
            
        except Exception as e:
            logger.error(f"Google Drive storage failed: {e}")
            raise
    
    async def _create_drive_folder(self, service, folder_name: str, parent_id: Optional[str] = None) -> str:
        """Create a folder in Google Drive."""
        file_metadata = {
            'name': folder_name,
            'mimeType': 'application/vnd.google-apps.folder',
            'parents': [parent_id] if parent_id else []
        }
        
        file = service.files().create(body=file_metadata, fields='id').execute()
        return file.get('id')
    
    def get_local_storage_info(self) -> Dict[str, Any]:
        """Get local storage information."""
        base_path = Path(self.local_base_path)
        
        total_size = 0
        file_count = 0
        
        if base_path.exists():
            for file_path in base_path.rglob('*'):
                if file_path.is_file():
                    total_size += file_path.stat().st_size
                    file_count += 1
        
        return {
            "base_path": str(base_path),
            "total_files": file_count,
            "total_size_bytes": total_size,
            "total_size_mb": round(total_size / 1024 / 1024, 2),
            "exists": base_path.exists()
        }
    
    def cleanup_local_files(self, older_than_days: int = 7) -> int:
        """
        Clean up local files older than specified days.
        
        Args:
            older_than_days: Number of days.
            
        Returns:
            Number of files deleted.
        """
        base_path = Path(self.local_base_path)
        if not base_path.exists():
            return 0
        
        import time
        cutoff_time = time.time() - (older_than_days * 24 * 60 * 60)
        deleted_count = 0
        
        for file_path in base_path.rglob('*'):
            if file_path.is_file():
                try:
                    if file_path.stat().st_mtime < cutoff_time:
                        file_path.unlink()
                        deleted_count += 1
                        logger.info(f"Deleted old file: {file_path}")
                except Exception as e:
                    logger.error(f"Failed to delete file {file_path}: {e}")
        
        # Remove empty directories
        try:
            for dir_path in base_path.rglob('*'):
                if dir_path.is_dir() and not any(dir_path.iterdir()):
                    dir_path.rmdir()
                    logger.info(f"Removed empty directory: {dir_path}")
        except Exception as e:
            logger.error(f"Failed to remove empty directories: {e}")
        
        logger.info(f"Cleaned up {deleted_count} old files")
        return deleted_count 