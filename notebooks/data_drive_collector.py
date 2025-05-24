import os
import io
import hashlib
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials

from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from googleapiclient.errors import HttpError

SCOPES = ["https://www.googleapis.com/auth/drive.readonly", "https://www.googleapis.com/auth/drive", "https://www.googleapis.com/auth/drive.file"]
LOCAL_SYNC_FOLDER = "data"
TARGET_FOLDER_NAME = "Master Passau SoSe 25"

google_docs_export_mimes = {
    "application/vnd.google-apps.document": ("application/pdf", ".pdf"),
    "application/vnd.google-apps.spreadsheet": ("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ".xlsx"),
    "application/vnd.google-apps.presentation": ("application/pdf", ".pdf"),
}


def get_folder_id(service, folder_name):
    query = (
        f"name = '{folder_name}' and "
        "mimeType = 'application/vnd.google-apps.folder' and trashed = false"
    )
    results = (
        service.files()
        .list(q=query, fields="files(id, name)", spaces="drive")
        .execute()
    )
    folders = results.get("files", [])
    if not folders:
        print(f"Folder '{folder_name}' not found.")
        return None
    folder_id = folders[0]["id"]
    print(f"Found folder '{folder_name}' with ID: {folder_id}")
    return folder_id


def list_files_in_folder(service, folder_id):
    query = f"'{folder_id}' in parents and trashed = false"
    results = (
        service.files()
        .list(
            q=query,
            fields="files(id, name, mimeType, modifiedTime, md5Checksum)",
            spaces="drive",
        )
        .execute()
    )
    return results.get("files", [])


def md5sum(filename):
    hash_md5 = hashlib.md5()
    with open(filename, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()


def file_needs_update(local_path, remote_md5):
    if not os.path.exists(local_path):
        return True
    local_md5 = md5sum(local_path)
    return local_md5 != remote_md5


def download_file(service, file, local_folder):
    file_id = file["id"]
    file_name = file["name"]
    mime_type = file["mimeType"]

    if mime_type in google_docs_export_mimes:
        export_mime, ext = google_docs_export_mimes[mime_type]
        local_path = os.path.join(local_folder, file_name + ext)
        print(f"Exporting Google Docs file '{file_name}' as {ext}...")
        request = service.files().export_media(fileId=file_id, mimeType=export_mime)
    else:
        local_path = os.path.join(local_folder, file_name)
        print(f"Downloading binary file '{file_name}'...")
        request = service.files().get_media(fileId=file_id)

    fh = io.FileIO(local_path, "wb")
    downloader = MediaIoBaseDownload(fh, request)
    done = False
    while not done:
        status, done = downloader.next_chunk()
        if status:
            print(f"Downloading {file_name}: {int(status.progress() * 100)}%")
    fh.close()


def sync_folder(service, folder_id, local_folder):
    if not os.path.exists(local_folder):
        os.makedirs(local_folder)

    files = list_files_in_folder(service, folder_id)
    print(f"Found {len(files)} items in folder '{local_folder}'.")

    for file in files:
        if file["mimeType"] == "application/vnd.google-apps.folder":
            # It's a subfolder — recurse
            subfolder_local = os.path.join(local_folder, file["name"])
            print(f"Recursing into folder: {file['name']}")
            sync_folder(service, file["id"], subfolder_local)
        else:
            remote_md5 = file.get("md5Checksum")
            if remote_md5:
                local_path = os.path.join(local_folder, file["name"])
                needs_update = file_needs_update(local_path, remote_md5)
            else:
                # For Google Docs files md5Checksum is None; always update
                needs_update = True

            if needs_update:
                download_file(service, file, local_folder)
            else:
                print(f"Skipping up-to-date file: {file['name']}")


def main():
    creds = None
    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
            creds = flow.run_local_server(port=0)
        with open("token.json", "w") as token:
            token.write(creds.to_json())

    try:
        service = build("drive", "v3", credentials=creds)

        root_folder_id = get_folder_id(service, TARGET_FOLDER_NAME)
        if not root_folder_id:
            return

        sync_folder(service, root_folder_id, LOCAL_SYNC_FOLDER)

    except HttpError as error:
        print(f"An error occurred: {error}")


if __name__ == "__main__":
    main()
