import os
from pathlib import Path
from typing import Dict, Any

import logging

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

logger = logging.getLogger(__name__)

def _load_drive_service():
    base_dir = Path(__file__).resolve().parent.parent
    credentials_paths = [
        base_dir / "frontend" / "src" / "config" / "gen-lang-client-0211941879-57f306607431.json",
        base_dir / "backend" / "config" / "gen-lang-client-0211941879-57f306607431.json",
        os.getenv("GOOGLE_DRIVE_CREDENTIALS_PATH"),
        Path("gen-lang-client-0211941879-57f306607431.json"),
    ]
    credentials_path = None
    for path_str in credentials_paths:
        if not path_str:
            continue
        path_obj = Path(path_str)
        if path_obj.exists():
            credentials_path = path_obj
            break
    if not credentials_path:
        raise RuntimeError("Google Drive credentials file not found")
    credentials = service_account.Credentials.from_service_account_file(
        str(credentials_path),
        scopes=["https://www.googleapis.com/auth/drive"],
    )
    service = build("drive", "v3", credentials=credentials)
    return service

def _find_or_create_folder(drive, name: str, parent_id: str) -> str:
    query = (
        f"'{parent_id}' in parents and name = '{name}' "
        "and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
    )
    results = (
        drive.files()
        .list(
            q=query,
            spaces="drive",
            fields="files(id, name)",
            includeItemsFromAllDrives=True,
            supportsAllDrives=True,
            corpora="allDrives",
        )
        .execute()
    )
    files = results.get("files", [])
    if files:
        return files[0]["id"]
    folder_metadata = {
        "name": name,
        "mimeType": "application/vnd.google-apps.folder",
        "parents": [parent_id],
    }
    created = (
        drive.files()
        .create(
            body=folder_metadata,
            fields="id",
            supportsAllDrives=True,
        )
        .execute()
    )
    return created["id"]

def upload_media_to_google_drive(
    file_path: str,
    job_name: str,
    target_folder: str,
) -> Dict[str, Any]:
    import time
    from googleapiclient.errors import HttpError
    
    drive = _load_drive_service()
    root_id = os.getenv("GOOGLE_DRIVE_FOLDER_ID")
    if not root_id:
        raise RuntimeError("GOOGLE_DRIVE_FOLDER_ID environment variable is not set")
    
    project_folder_id = _find_or_create_folder(drive, job_name, root_id)
    segments = [seg for seg in target_folder.split("/") if seg]
    current_parent = project_folder_id
    for seg in segments:
        current_parent = _find_or_create_folder(drive, seg, current_parent)
    
    path_obj = Path(file_path)
    if not path_obj.exists():
        raise FileNotFoundError(f"File not found: {file_path}")
    
    file_size_mb = path_obj.stat().st_size / (1024 * 1024)
    logger.info(f"Uploading file: {path_obj.name} ({file_size_mb:.2f} MB)")
    
    mime_type = "video/mp4"
    
    # Use resumable upload for files larger than 5MB
    use_resumable = file_size_mb > 5.0
    chunk_size = 10 * 1024 * 1024  # 10MB chunks for resumable uploads
    
    metadata = {
        "name": path_obj.name,
        "parents": [current_parent],
        "mimeType": mime_type,
    }
    
    # Retry logic with exponential backoff
    max_retries = 3
    retry_delay = 2
    
    for attempt in range(max_retries):
        try:
            if use_resumable:
                logger.info(f"Using resumable upload (attempt {attempt + 1}/{max_retries})")
                media = MediaFileUpload(
                    str(path_obj),
                    mimetype=mime_type,
                    resumable=True,
                    chunksize=chunk_size
                )
            else:
                logger.info(f"Using simple upload (attempt {attempt + 1}/{max_retries})")
                media = MediaFileUpload(str(path_obj), mimetype=mime_type, resumable=False)
            
            request = drive.files().create(
                body=metadata,
                media_body=media,
                fields="id,name,webViewLink",
                supportsAllDrives=True,
            )
            
            if use_resumable:
                # Handle resumable upload with progress
                response = None
                while response is None:
                    status, response = request.next_chunk()
                    if status:
                        progress = int(status.progress() * 100)
                        logger.info(f"Upload progress: {progress}%")
                created = response
            else:
                created = request.execute()
            
            file_id = created.get("id")
            if not file_id:
                raise RuntimeError("Upload succeeded but no file ID returned")
            
            logger.info(f"✅ File uploaded successfully: {file_id}")
            
            # Set permissions with retry
            for perm_attempt in range(max_retries):
                try:
                    drive.permissions().create(
                        fileId=file_id,
                        body={
                            "role": "reader",
                            "type": "anyone",
                            "allowFileDiscovery": False,
                        },
                        supportsAllDrives=True,
                    ).execute()
                    logger.info(f"✅ Set public permissions for file: {file_id}")
                    break
                except HttpError as e:
                    if perm_attempt < max_retries - 1:
                        logger.warning(f"Permission setting failed (attempt {perm_attempt + 1}), retrying...")
                        time.sleep(retry_delay)
                    else:
                        logger.exception("❌ Failed to set Drive permissions after retries")
            
            # Update file metadata
            try:
                drive.files().update(
                    fileId=file_id,
                    body={
                        "copyRequiresWriterPermission": False,
                    },
                    supportsAllDrives=True,
                ).execute()
            except Exception as e:
                logger.warning(f"Failed to update file metadata: {e}")
            
            return {
                "projectFolderId": project_folder_id,
                "targetFolderId": current_parent,
                "fileId": file_id,
                "fileName": created.get("name"),
                "webViewLink": created.get("webViewLink"),
            }
            
        except HttpError as e:
            error_details = e.error_details if hasattr(e, 'error_details') else str(e)
            logger.error(f"Upload attempt {attempt + 1} failed: {error_details}")
            
            if attempt < max_retries - 1:
                wait_time = retry_delay * (2 ** attempt)
                logger.info(f"Retrying in {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                raise RuntimeError(f"Failed to upload file after {max_retries} attempts: {error_details}")
        
        except Exception as e:
            logger.error(f"Upload attempt {attempt + 1} failed with unexpected error: {e}")
            if attempt < max_retries - 1:
                wait_time = retry_delay * (2 ** attempt)
                logger.info(f"Retrying in {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                raise RuntimeError(f"Failed to upload file after {max_retries} attempts: {str(e)}")
    
    raise RuntimeError("Upload failed after all retry attempts")


