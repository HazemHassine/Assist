// Path: frontend/src/app/api/files/delete/[...paths]/route.js
export const dynamic = 'force-dynamic';

import fs from 'fs/promises';
import { getValidatedPath, BASE_PATH } from '../../../../lib/fs-utils.js'; // Corrected path

export async function DELETE(request, { params }) {
  try {
    const relativePath = params.paths?.join("/") || "";

    if (!relativePath) {
      return Response.json({ detail: "Path is required for deletion." }, { status: 400 });
    }

    const validatedPath = getValidatedPath(relativePath);

    // Crucial Check: Prevent deletion of the entire vault root
    if (validatedPath === BASE_PATH) {
      return Response.json({ detail: "Cannot delete the root vault directory." }, { status: 400 });
    }

    let stat;
    try {
      stat = await fs.stat(validatedPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return Response.json({ detail: `Item '${relativePath}' not found.` }, { status: 404 });
      }
      // Other fs.stat errors (e.g., EACCES)
      console.error(`Error stating item ${validatedPath}: ${error.message}`);
      throw error;
    }

    if (stat.isFile()) {
      await fs.unlink(validatedPath);
    } else if (stat.isDirectory()) {
      // Use fs.rm for recursive directory removal (available in Node.js v14.14.0+)
      // force: true - suppresses errors if path does not exist (already handled by stat),
      // but primarily useful for ignoring errors during recursive deletion of contents.
      // We've already confirmed existence with stat.
      await fs.rm(validatedPath, { recursive: true, force: true });
    } else {
      // Should not happen if stat succeeded and it's not file/dir (e.g. symlink not resolved, etc.)
      return Response.json({ detail: "Item is not a file or directory." }, { status: 400 });
    }

    // Consider returning 204 No Content for DELETE operations if no body is needed
    return Response.json({ message: `Item '${relativePath}' deleted successfully.` }, { status: 200 });
    // Alternatively, for 204: return new Response(null, { status: 204 });

  } catch (error) {
    console.error(`Error in /api/files/delete: ${error.message}`);
    if (error.message.startsWith("Invalid path")) {
      return Response.json({ detail: error.message }, { status: 400 });
    } else if (error.code === 'EACCES') {
      return Response.json({ detail: "Permission denied." }, { status: 403 });
    } else if (error.code === 'ENOENT') { // Fallback if somehow stat passed but unlink/rm failed with ENOENT
      return Response.json({ detail: "Item not found during deletion process." }, { status: 404 });
    }
    // For other errors (e.g. EBUSY, ENOTEMPTY if force:false was used for rmdir)
    return Response.json({ detail: "Internal server error while deleting item." }, { status: 500 });
  }
}
