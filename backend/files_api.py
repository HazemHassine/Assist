from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import os
import logging
import json

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
