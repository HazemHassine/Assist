from fastapi import FastAPI, HTTPException, Path, Body, Request
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import os
import logging
import json
import shutil

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_PATH = "../vault"  # Root folder you want to expose

def build_file_tree(path: str):
    """
    Recursively builds a nested dict/list representing files and directories.
    """
    try:
        entries = os.listdir(path)
    except Exception as e:
        logger.error(f"Failed to list directory {path}: {e}")
        return []

    items = []
    for entry in entries:
        full_path = os.path.join(path, entry)
        if os.path.isdir(full_path):
            items.append({
                "name": entry,
                "type": "directory",
                "children": build_file_tree(full_path),
            })
        else:
            items.append({
                "name": entry,
                "type": "file",
            })
    # Optional: sort directories first, then files alphabetically
    items.sort(key=lambda x: (x["type"] != "directory", x["name"].lower()))
    return items

@app.get("/files")
def list_files(request: Request):
    logger.info(f"Received request to list files from {request.client.host}")
    try:
        tree = build_file_tree(BASE_PATH)
        logger.debug(f"Returning file tree: {tree}")
        return {"files": tree}
    except Exception as e:
        logger.error(f"Error listing files: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/files/{filename:path}")
def read_file(filename: str, request: Request):
    full_path = os.path.normpath(os.path.join(BASE_PATH, filename))
    reqq = request.query_params.get("req", "")
    logger.info(f"Received request to read file: {full_path} with query {reqq}")
    if not full_path.startswith(BASE_PATH):
        logger.warning(f"Invalid file path attempt: {full_path}")
        raise HTTPException(status_code=400, detail="Invalid file path")

    if not os.path.isfile(full_path):
        raise HTTPException(status_code=404, detail="File not found")

    with open(full_path, "r", encoding="utf-8") as f:
        content = f.read()
    return {"content": content}

@app.post("/files/{filename:path}")
async def write_file(filename: str, request: Request):
    full_path = os.path.normpath(os.path.join(BASE_PATH, filename))
    # if not full_path .startswith(os.path.abspath(BASE_PATH)):
        # raise HTTPException(status_code=400, detail="Invalid file path")

    payload = await request.json()
    content = payload.get("content", "")
    os.makedirs(os.path.dirname(full_path), exist_ok=True)

    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)
    return {"message": "File saved"}

class RenameRequest(BaseModel):
    new_name: str

@app.post("/files/rename/{filename:path}")
async def rename_item(
    filename: str = Path(..., description="Original name with optional subpath"),
    payload: RenameRequest = Body(...),
):
    # build and normalize full source path
    src_path = os.path.normpath(os.path.join(BASE_PATH, filename))
    new_name = payload.new_name.strip()
    logger.info(f"Renaming {src_path} to {new_name}")
    # ensure new_name is non-empty
    if not new_name:
        raise HTTPException(status_code=400, detail="`new_name` must be non-empty")

    # build and normalize full destination path (same dir as source)
    dest_path = os.path.normpath(os.path.join(os.path.dirname(src_path), new_name))

    # ensure both live under BASE_PATH
    # os.path.abspath is used to resolve any `..` in the path
    if not (os.path.abspath(src_path).startswith(os.path.abspath(BASE_PATH)) and \
            os.path.abspath(dest_path).startswith(os.path.abspath(BASE_PATH))):
        logger.warning(f"Invalid path attempt: src_path={src_path}, dest_path={dest_path}, BASE_PATH={BASE_PATH}")
        raise HTTPException(status_code=400, detail="Invalid path. Paths must be within the base directory.")

    # ensure source exists
    if not os.path.exists(src_path): # Check for file or folder
        raise HTTPException(status_code=404, detail=f"Source '{filename}' not found")

    # ensure destination doesn't already exist
    if os.path.exists(dest_path):
        raise HTTPException(
            status_code=409,
            detail=f"An item named '{new_name}' already exists in this directory"
        )

    # perform the rename
    try:
        os.rename(src_path, dest_path)
        logger.info(f"Successfully renamed {src_path} to {dest_path}")
    except OSError as e:
        logger.error(f"Rename failed for {src_path} to {dest_path}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Rename failed: {e}")

    # return both old and new for client bookkeeping
    return {
        "old_name": filename,
        "new_name": os.path.relpath(dest_path, BASE_PATH)
    }

class CreateRequest(BaseModel):
    path: str # Full path for the new file or folder, relative to BASE_PATH
    type: str # "file" or "folder"

@app.post("/files/create")
async def create_item(payload: CreateRequest = Body(...)):
    create_path_str = payload.path.strip()
    item_type = payload.type.strip().lower()

    logger.info(f"Request to create '{item_type}' at '{create_path_str}'")

    if not create_path_str:
        raise HTTPException(status_code=400, detail="Path cannot be empty")

    if item_type not in ["file", "folder"]:
        raise HTTPException(status_code=400, detail="Invalid type. Must be 'file' or 'folder'")

    full_path = os.path.normpath(os.path.join(BASE_PATH, create_path_str))

    # Security check: Ensure the path is within BASE_PATH
    if not os.path.abspath(full_path).startswith(os.path.abspath(BASE_PATH)):
        logger.warning(f"Invalid path attempt for create: {full_path}, BASE_PATH={BASE_PATH}")
        raise HTTPException(status_code=400, detail="Invalid path. Path must be within the base directory.")

    if os.path.exists(full_path):
        raise HTTPException(status_code=409, detail=f"Item '{create_path_str}' already exists.")

    try:
        if item_type == "folder":
            os.makedirs(full_path, exist_ok=True)
            logger.info(f"Folder created: {full_path}")
            return {"message": f"Folder '{create_path_str}' created successfully."}
        elif item_type == "file":
            # Create parent directories if they don't exist
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, "w", encoding="utf-8") as f:
                f.write("") # Create an empty file
            logger.info(f"File created: {full_path}")
            return {"message": f"File '{create_path_str}' created successfully."}
    except OSError as e:
        logger.error(f"Error creating item {full_path}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create item: {e}")

class MoveRequest(BaseModel):
    sourcePath: str
    destinationPath: str

@app.post("/files/move")
async def move_item(payload: MoveRequest = Body(...)):
    source_str = payload.sourcePath.strip()
    destination_str = payload.destinationPath.strip()

    logger.info(f"Request to move '{source_str}' to '{destination_str}'")

    if not source_str or not destination_str:
        raise HTTPException(status_code=400, detail="Source and destination paths cannot be empty")

    source_full_path = os.path.normpath(os.path.join(BASE_PATH, source_str))
    destination_full_path = os.path.normpath(os.path.join(BASE_PATH, destination_str))

    # Security check: Ensure paths are within BASE_PATH
    if not (os.path.abspath(source_full_path).startswith(os.path.abspath(BASE_PATH)) and \
            os.path.abspath(destination_full_path).startswith(os.path.abspath(BASE_PATH))):
        logger.warning(f"Invalid path attempt for move: src={source_full_path}, dest={destination_full_path}, BASE_PATH={BASE_PATH}")
        raise HTTPException(status_code=400, detail="Invalid paths. Paths must be within the base directory.")

    if not os.path.exists(source_full_path):
        raise HTTPException(status_code=404, detail=f"Source path '{source_str}' not found.")

    if os.path.exists(destination_full_path):
        raise HTTPException(status_code=409, detail=f"Destination path '{destination_str}' already exists.")

    try:
        # Ensure destination directory exists for files, or if the destination is a directory itself
        destination_parent_dir = os.path.dirname(destination_full_path)
        if not os.path.exists(destination_parent_dir):
             os.makedirs(destination_parent_dir, exist_ok=True)
        shutil.move(source_full_path, destination_full_path)
        logger.info(f"Successfully moved '{source_full_path}' to '{destination_full_path}'")
        return {"message": f"Successfully moved '{source_str}' to '{destination_str}'."}
    except Exception as e:
        logger.error(f"Error moving item from {source_full_path} to {destination_full_path}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to move item: {e}")

@app.delete("/files/{item_path:path}")
async def delete_item(item_path: str = Path(..., description="Path of the file or folder to delete")):
    path_to_delete_str = item_path.strip()
    logger.info(f"Request to delete item: '{path_to_delete_str}'")

    if not path_to_delete_str:
        raise HTTPException(status_code=400, detail="Path cannot be empty")

    full_path = os.path.normpath(os.path.join(BASE_PATH, path_to_delete_str))

    # Security check: Ensure the path is within BASE_PATH and does not try to go up a level if BASE_PATH is a symlink
    if not os.path.abspath(full_path).startswith(os.path.abspath(BASE_PATH)):
        logger.warning(f"Invalid path attempt for delete: {full_path}, resolved to {os.path.abspath(full_path)}, BASE_PATH resolved to {os.path.abspath(BASE_PATH)}")
        raise HTTPException(status_code=400, detail="Invalid path. Path must be within the base directory.")

    # Prevent deleting the root folder itself
    if os.path.abspath(full_path) == os.path.abspath(BASE_PATH):
        logger.warning(f"Attempt to delete root BASE_PATH blocked: {full_path}")
        raise HTTPException(status_code=400, detail="Cannot delete the root directory.")

    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail=f"Item '{path_to_delete_str}' not found.")

    try:
        if os.path.isfile(full_path) or os.path.islink(full_path): # Handle files and symlinks
            os.remove(full_path)
            logger.info(f"File deleted: {full_path}")
            return {"message": f"File '{path_to_delete_str}' deleted successfully."}
        elif os.path.isdir(full_path):
            shutil.rmtree(full_path)
            logger.info(f"Folder deleted: {full_path}")
            return {"message": f"Folder '{path_to_delete_str}' and its contents deleted successfully."}
        else:
            # Should not happen if os.path.exists was true
            logger.error(f"Item '{path_to_delete_str}' is neither a file nor a folder: {full_path}")
            raise HTTPException(status_code=500, detail="Item is not a file or folder.")
    except OSError as e:
        logger.error(f"Error deleting item {full_path}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete item: {e}")
