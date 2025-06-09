// Path: frontend/src/app/api/files/move/route.js
export const dynamic = 'force-dynamic';

import fs from 'fs/promises';
import path from 'path';
import { getValidatedPath, BASE_PATH } from '../../../lib/fs-utils.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { sourcePath: relativeSourcePath, destinationPath: relativeDestPath } = body;

    if (!relativeSourcePath || !relativeDestPath) {
      return Response.json({ detail: "Source and destination paths are required." }, { status: 400 });
    }
    if (relativeSourcePath === relativeDestPath) {
        return Response.json({ detail: "Source and destination paths cannot be the same." }, { status: 400 });
    }

    const validatedSourcePath = getValidatedPath(relativeSourcePath);
    const validatedDestPath = getValidatedPath(relativeDestPath);

    // Check if source exists
    let sourceStat;
    try {
      sourceStat = await fs.stat(validatedSourcePath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return Response.json({ detail: `Source path '${relativeSourcePath}' not found.` }, { status: 404 });
      }
      throw error; // Other fs.stat errors
    }

    // Crucial Check: Prevent moving a directory into itself or its own subdirectory
    if (sourceStat.isDirectory()) {
      // A destination path is "inside" a source path if it starts with the source path followed by a path separator.
      if (validatedDestPath.startsWith(validatedSourcePath + path.sep)) {
        return Response.json({ detail: "Cannot move a folder into itself or one of its own subfolders." }, { status: 400 });
      }
    }

    // Check if destination already exists
    try {
      await fs.access(validatedDestPath);
      // If access doesn't throw, item exists at destination
      return Response.json({ detail: `Destination path '${relativeDestPath}' already exists.` }, { status: 409 });
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error; // Other access errors (e.g., permissions)
      }
      // ENOENT is good, means destination path is available
    }

    // Ensure parent directory of validatedDestPath exists
    const destParentDir = path.dirname(validatedDestPath);
    // Only create if destParentDir is not the root of the vault itself, and is different from validatedDestPath
    // (i.e. not trying to create a parent for a top-level item in the vault)
    if (destParentDir !== BASE_PATH && destParentDir !== validatedDestPath) {
        await fs.mkdir(destParentDir, { recursive: true });
    }


    await fs.rename(validatedSourcePath, validatedDestPath); // fs.rename handles moving files/dirs

    return Response.json({ message: "Item moved successfully." }, { status: 200 });

  } catch (error) {
    console.error(`Error in /api/files/move: ${error.message}`);
    if (error.message.startsWith("Invalid path")) {
      return Response.json({ detail: error.message }, { status: 400 });
    } else if (error.code === 'EACCES') {
      return Response.json({ detail: "Permission denied." }, { status: 403 });
    } else if (error.code === 'ENOENT') {
      // This might occur if source was deleted between stat and rename, or if parent dir creation failed silently for some reason
      return Response.json({ detail: "Source not found or parent directory for destination does not exist." }, { status: 404 });
    } else if (error.code === 'EXDEV') {
        return Response.json({ detail: "Cannot move item across different filesystems/devices. (EXDEV)"}, {status: 400 });
    } else if (error.code === 'ENOTEMPTY' || error.code === 'EEXIST') { // EEXIST can happen if target is a non-empty dir on some OS for rename
        return Response.json({ detail: "Cannot move item: Destination directory is not empty or path conflict."}, {status: 409 });
    }
    return Response.json({ detail: "Internal server error while moving item." }, { status: 500 });
  }
}
