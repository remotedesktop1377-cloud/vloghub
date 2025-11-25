import zipfile
import os
from pathlib import Path
from typing import Optional

async def zip_and_download_files(
  exports_directory: str,
  temp_directory: str = "temp",
  scene_json_path: Optional[str] = None
) -> str:
  """Zip the exported clips and optional scene JSON, return the zip file path."""

  zip_file_path = Path(temp_directory) / "processed_files.zip"

  with zipfile.ZipFile(zip_file_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, _, files in os.walk(exports_directory):
      for file in files:
        file_path = Path(root) / file
        zipf.write(file_path, file_path.relative_to(exports_directory))

    if scene_json_path:
      scene_file = Path(scene_json_path)
      if scene_file.exists():
        zipf.write(scene_file, scene_file.name)

  return str(zip_file_path)