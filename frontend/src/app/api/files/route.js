// Path: frontend/src/app/api/files/route.js
// This route handles GET requests for listing all files/folders (file tree)
// using local filesystem utilities.
export const dynamic = 'force-dynamic';

import { buildFileTree, BASE_PATH } from '../../../lib/fs-utils.js';
// Note: Next.js 13+ App Router uses Response object, not NextResponse explicitly unless needed for specific features.
// Standard Response.json() is available globally.

export async function GET(request) {
  try {
    // BASE_PATH from fs-utils.js is the root of the vault.
    const tree = await buildFileTree(BASE_PATH);

    return Response.json({ files: tree });

  } catch (error) {
    console.error("Error in /api/files GET handler:", error);
    // Check if the error is a known type or has a specific message to customize client response
    if (error.message.includes("Access denied") || error.message.includes("Invalid path")) {
        return Response.json({ detail: error.message }, { status: 400 });
    }
    // For other errors, return a generic 500.
    return Response.json({ detail: "Internal server error: Could not build file tree." }, {
      status: 500,
    });
  }
}
