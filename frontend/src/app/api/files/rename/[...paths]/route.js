// Path: frontend/src/app/api/files/rename/[...paths]/route.js
export const dynamic = 'force-dynamic';

import fs from 'fs/promises';
import path from 'path';
import { getValidatedPath, BASE_PATH } from '../../../lib/fs-utils.js';

export async function POST(request, { params }) {
  try {
    const oldRelativePath = params.paths?.join("/") || "";
    if (!oldRelativePath) {
      return Response.json({ detail: "Original path is required for renaming." }, { status: 400 });
    }

    const body = await request.json();
    const { new_name } = body;

    if (!new_name || typeof new_name !== 'string') {
      return Response.json({ detail: "New name is required and must be a string." }, { status: 400 });
    }
    if (new_name.includes('/') || new_name.includes('\\')) {
      return Response.json({ detail: "New name cannot contain slashes." }, { status: 400 });
    }
    if (new_name.trim() === "" || new_name === "." || new_name === "..") {
        return Response.json({ detail: "New name is invalid." }, { status: 400 });
    }
    // Add a length check for new_name if desired, e.g., max 255 characters

    const oldValidatedPath = getValidatedPath(oldRelativePath); // Validates old path

    // Construct and validate the new path
    const parentDir = path.dirname(oldValidatedPath);
    const newValidatedPath = path.join(parentDir, new_name);

    // Security check for the new path: ensure it's still within BASE_PATH.
    // getValidatedPath expects a path relative to BASE_PATH.
    // So, we convert newValidatedPath to be relative to BASE_PATH first.
    const newRelativePathForValidation = path.relative(BASE_PATH, newValidatedPath);

    // Now, use getValidatedPath on this new relative path.
    // This ensures that if new_name had ".." or other tricky sequences,
    // the final resolved path is still validated against the same rules.
    // Note: getValidatedPath will throw if newRelativePathForValidation tries to go above BASE_PATH.
    // We also need to ensure that the validated path from this step is indeed newValidatedPath.
    const revalidatedNewPath = getValidatedPath(newRelativePathForValidation);
    if (revalidatedNewPath !== newValidatedPath) {
        // This case should ideally be caught by getValidatedPath(newRelativePathForValidation) throwing an error
        // if new_name is malicious (e.g. "../outside_vault_file").
        // This is an extra sanity check.
        return Response.json({ detail: "Constructed new path is invalid or outside allowed directory after validation." }, { status: 400 });
    }

    // Check if old path exists
    try {
      await fs.access(oldValidatedPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return Response.json({ detail: `Source item '${oldRelativePath}' not found.` }, { status: 404 });
      }
      throw error; // Other access errors
    }

    // Check if new path already exists
    try {
      await fs.access(newValidatedPath);
      // If access doesn't throw, item exists at new path
      return Response.json({ detail: `Item with name '${new_name}' already exists at this location.` }, { status: 409 });
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error; // Other access errors
      }
      // ENOENT is good, means new path is available
    }

    await fs.rename(oldValidatedPath, newValidatedPath);

    const finalNewRelativePath = path.join(path.dirname(oldRelativePath), new_name);

    return Response.json({
      message: "Item renamed successfully",
      old_name: oldRelativePath, // Keep consistent with backend key "old_name"
      new_name: finalNewRelativePath, // Keep consistent with backend key "new_name"
    }, { status: 200 });

  } catch (error) {
    console.error(`Error in /api/files/rename: ${error.message}`);
    if (error.message.startsWith("Invalid path")) {
      return Response.json({ detail: error.message }, { status: 400 });
    } else if (error.code === 'EACCES') {
      return Response.json({ detail: "Permission denied." }, { status: 403 });
    } else if (error.code === 'ENOENT') { // Should be caught by explicit checks, but as a fallback
      return Response.json({ detail: "Source path not found or parent directory for new path does not exist." }, { status: 404 });
    }
    // Add more specific error handling if needed
    return Response.json({ detail: "Internal server error while renaming item." }, { status: 500 });
  }
}
