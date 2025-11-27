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
    target_folder: str = "output",
) -> Dict[str, Any]:
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
        raise FileNotFoundError(str(path_obj))
    mime_type = "video/mp4"
    media = MediaFileUpload(str(path_obj), mimetype=mime_type, resumable=False)
    metadata = {
        "name": path_obj.name,
        "parents": [current_parent],
        "mimeType": mime_type,
    }
    created = (
        drive.files()
        .create(
            body=metadata,
            media_body=media,
            fields="id,name,webViewLink",
            supportsAllDrives=True,
        )
        .execute()
    )
    file_id = created.get("id")
    if file_id:
        try:
            drive.permissions().create(
                fileId=file_id,
                body={
                    "role": "reader",
                    "type": "anyone",
                },
                supportsAllDrives=True,
            ).execute()
        except Exception as e:
            logger.exception("Failed to set Drive permissions")
    return {
        "projectFolderId": project_folder_id,
        "targetFolderId": current_parent,
        "fileId": created.get("id"),
        "fileName": created.get("name"),
        "webViewLink": created.get("webViewLink"),
    }


