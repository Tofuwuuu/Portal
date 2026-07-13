from pathlib import Path
import uuid

from fastapi import HTTPException, UploadFile, status

UPLOAD_DIR = Path("uploads/submissions")
ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx"}
ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def ensure_upload_dir() -> None:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def validate_submission_file(file: UploadFile) -> str:
    filename = file.filename or ""
    extension = Path(filename).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF and DOC/DOCX files are allowed",
        )
    return extension


async def save_submission_file(file: UploadFile, assignment_id: int, student_id: int) -> tuple[str, str, str]:
    """Save uploaded file and return (original_name, stored_path, content_type)."""
    ensure_upload_dir()
    extension = validate_submission_file(file)

    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty",
        )
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is too large (max 10 MB)",
        )

    content_type = file.content_type or "application/octet-stream"
    if content_type not in ALLOWED_CONTENT_TYPES and content_type != "application/octet-stream":
        # Some browsers send octet-stream; still allow if extension is valid
        if content_type not in ALLOWED_CONTENT_TYPES:
            pass

    stored_name = f"{assignment_id}_{student_id}_{uuid.uuid4().hex}{extension}"
    stored_path = UPLOAD_DIR / stored_name
    stored_path.write_bytes(content)

    original_name = Path(file.filename or stored_name).name
    return original_name, str(stored_path).replace("\\", "/"), content_type


def delete_file_if_exists(path: str | None) -> None:
    if not path:
        return
    file_path = Path(path)
    if file_path.exists() and file_path.is_file():
        file_path.unlink()
