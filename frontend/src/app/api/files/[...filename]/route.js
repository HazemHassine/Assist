// Path: frontend/src/app/api/files/[...filename]/route.js
// This route handles GET for reading files and PUT for writing files (forwarded as POST to backend)
export const dynamic = 'force-dynamic'

import fs from 'fs/promises';
import path from 'path'; // Import path module
import { getValidatedPath } from '../../../lib/fs-utils.js';

// BACKEND_API_URL is removed as neither GET nor PUT will use it.

// GET /api/files/{path} - Reads a file using local filesystem
export async function GET(request, { params }) {
  try {
    const relativePath = params.filename?.join("/") || "";

    if (!relativePath) {
      return Response.json({ detail: "File path is required" }, { status: 400 });
    }

    // Throws error if path is invalid (e.g., traversal, not string, absolute)
    const fullPath = getValidatedPath(relativePath);

    // Check if it's actually a file (getValidatedPath doesn't check type)
    // Although fs.readFile will also fail, this gives a clearer error earlier for directories.
    const stat = await fs.stat(fullPath);
    if (stat.isDirectory()) {
      return Response.json({ detail: "Path is a directory, not a file" }, { status: 400 });
    }

    const content = await fs.readFile(fullPath, 'utf8');

    return Response.json({ content });

  } catch (error) {
    console.error(`Error in /api/files/[...filename] GET local: ${error.message}`);
    if (error.message.startsWith("Invalid path") || error.message.includes("outside the allowed directory")) {
      return Response.json({ detail: error.message }, { status: 400 });
    } else if (error.code === 'ENOENT') {
      return Response.json({ detail: "File not found" }, { status: 404 });
    } else if (error.code === 'EISDIR') { // Should be caught by explicit stat check, but as fallback
      return Response.json({ detail: "Path is a directory, not a file" }, { status: 400 });
    }
    return Response.json({ detail: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/files/{path} - Writes a file (frontend's saveFile uses PUT)
// This will be translated to a POST request to the backend's /files/{path} endpoint
// Now uses local filesystem
export async function PUT(request, { params }) {
  try {
    const relativePath = params.filename?.join("/") || "";

    if (!relativePath) {
      return Response.json({ detail: "File path is required for saving" }, { status: 400 });
    }

    const fullPath = getValidatedPath(relativePath); // Validates path, throws on error

    // Before writing, ensure it's not a directory.
    // fs.writeFile will write to a directory path on some OS if not checked, which is not desired.
    try {
      const stat = await fs.stat(fullPath);
      if (stat.isDirectory()) {
        return Response.json({ detail: "Path is a directory, cannot overwrite with a file." }, { status: 400 });
      }
    } catch (statError) {
      if (statError.code !== 'ENOENT') { // If error is not "not found", then it's some other issue.
        throw statError; // Re-throw other stat errors
      }
      // If ENOENT, it's fine, means we are creating a new file.
    }

    const content = await request.text();

    // Ensure parent directories exist
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    // Write the file
    await fs.writeFile(fullPath, content, 'utf8');

    return Response.json({ message: "File saved successfully" }, { status: 200 });

  } catch (error) {
    console.error(`Error in /api/files/[...filename] PUT local: ${error.message}`);
    if (error.message.startsWith("Invalid path") || error.message.includes("outside the allowed directory")) {
      return Response.json({ detail: error.message }, { status: 400 });
    } else if (error.code === 'EISDIR') { // Error during writeFile if somehow it's a directory
        return Response.json({ detail: "Cannot write to a directory path." }, { status: 400 });
    }
    // Add more specific error handling if needed, e.g., EACCES for permissions
    return Response.json({ detail: "Internal server error while saving file." }, { status: 500 });
  }
}

// Other methods like PATCH, POST (if not for writing) are removed as they are either
// handled by more specific routes (e.g., rename) or not aligned with the BFF proxy model for this path.
// The original POST in this file expected JSON {content: ""}, which is now effectively handled by PUT.
// The original PATCH was for rename, now at /api/files/rename/[...paths].
