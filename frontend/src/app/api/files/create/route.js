// Path: frontend/src/app/api/files/create/route.js
export const dynamic = 'force-dynamic';

import fs from 'fs/promises';
import path from 'path';
import { getValidatedPath, BASE_PATH } from '../../../lib/fs-utils.js'; // Assuming fs-utils is in src/lib

export async function POST(request) {
  try {
    const body = await request.json();
    const { path: relativePath, type } = body;

    if (!relativePath || !type) {
      return Response.json({ detail: "Path and type are required" }, { status: 400 });
    }

    if (type !== 'file' && type !== 'folder') {
      return Response.json({ detail: "Invalid type: must be 'file' or 'folder'" }, { status: 400 });
    }

    const fullPath = getValidatedPath(relativePath); // Validates path, throws on error

    // Check if item already exists
    try {
      await fs.access(fullPath);
      // If fs.access doesn't throw, the item exists
      return Response.json({ detail: `Item '${relativePath}' already exists` }, { status: 409 }); // 409 Conflict
    } catch (error) {
      // ENOENT means file/directory does not exist, which is what we want.
      // Other errors during access check should be re-thrown or handled.
      if (error.code !== 'ENOENT') {
        throw error; // e.g., EACCES permission error
      }
    }

    // Ensure parent directory exists.
    // This is important for creating files/folders in nested paths where parents might not exist.
    // For a top-level item, path.dirname(fullPath) would be BASE_PATH.
    // fs.mkdir with recursive:true on BASE_PATH is safe.
    const parentDir = path.dirname(fullPath);
    // Check if parentDir is not the same as fullPath (e.g. creating 'folder1' directly under BASE_PATH)
    // and if parentDir is not BASE_PATH itself (already exists or should).
    // A simpler approach is just to call mkdir on parentDir, it's idempotent for existing dirs.
    if (parentDir !== BASE_PATH && parentDir !== fullPath) { // Avoid trying to create BASE_PATH itself if path is like "file.txt"
         await fs.mkdir(parentDir, { recursive: true });
    }


    if (type === 'file') {
      await fs.writeFile(fullPath, '', 'utf8'); // Create an empty file
    } else if (type === 'folder') {
      await fs.mkdir(fullPath); // Create the directory. No { recursive: true } needed here as parent is ensured.
                                // If fullPath itself already existed, fs.access would have caught it.
    }

    return Response.json({ message: `${type.charAt(0).toUpperCase() + type.slice(1)} '${relativePath}' created successfully` }, { status: 201 });

  } catch (error) {
    console.error(`Error in /api/files/create: ${error.message}`);
    if (error.message.startsWith("Invalid path")) {
      return Response.json({ detail: error.message }, { status: 400 });
    } else if (error.code === 'EACCES') {
      return Response.json({ detail: "Permission denied" }, { status: 403 });
    } else if (error.code === 'ENOENT' && error.syscall === 'mkdir' && error.path === path.dirname(getValidatedPath(JSON.parse(error.config.data).path))) {
      // This case might be complex to reliably catch if getValidatedPath itself fails due to non-existent intermediate for relative path.
      // However, getValidatedPath primarily forms the path string; fs operations later reveal non-existence.
      // The fs.access check is more direct for the final path.
      // If mkdir on parentDir fails with ENOENT, it's an unexpected issue if not caught by getValidatedPath logic.
      return Response.json({ detail: "Parent directory could not be created or found." }, { status: 500});
    }
    // Add more specific error handling if needed
    return Response.json({ detail: "Internal server error while creating item." }, { status: 500 });
  }
}
