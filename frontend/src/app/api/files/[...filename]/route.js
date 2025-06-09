// Path: frontend/src/app/api/files/[...filename]/route.js
// This route handles GET for reading files and PUT for writing files (forwarded as POST to backend)
export const dynamic = 'force-dynamic'

const BACKEND_API_URL = "http://localhost:8000"; // TODO: Use environment variable

// GET /api/files/{path} - Reads a file
export async function GET(request, { params }) {
  try {
    const filePath = params.filename?.join("/") || "";

    if (!filePath) {
      return new Response(JSON.stringify({ detail: "File path is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const encodedFilePath = filePath.split('/').map(segment => encodeURIComponent(segment)).join('/');
    const backendResponse = await fetch(`${BACKEND_API_URL}/files/${encodedFilePath}`, {
      method: "GET",
    });

    const responseBody = await backendResponse.json();

    return new Response(JSON.stringify(responseBody), {
      status: backendResponse.status,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in /api/files/[...filename] GET proxy:", error);
    return new Response(JSON.stringify({ detail: "Internal server error in proxy" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// PUT /api/files/{path} - Writes a file (frontend's saveFile uses PUT)
// This will be translated to a POST request to the backend's /files/{path} endpoint
export async function PUT(request, { params }) {
  try {
    const filePath = params.filename?.join("/") || "";

    if (!filePath) {
      return new Response(JSON.stringify({ detail: "File path is required for saving" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const content = await request.text(); // Content is sent as plain text by the frontend

    const encodedFilePath = filePath.split('/').map(segment => encodeURIComponent(segment)).join('/');

    // Backend's write_file endpoint is POST /files/{filename:path} and expects JSON { "content": "..." }
    const backendResponse = await fetch(`${BACKEND_API_URL}/files/${encodedFilePath}`, {
      method: "POST", // Frontend uses PUT, backend expects POST for this operation
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }), // Backend expects a JSON object with a content field
    });

    const responseBody = await backendResponse.json();

    return new Response(JSON.stringify(responseBody), {
      status: backendResponse.status,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in /api/files/[...filename] PUT proxy:", error);
    return new Response(JSON.stringify({ detail: "Internal server error in proxy" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Other methods like PATCH, POST (if not for writing) are removed as they are either
// handled by more specific routes (e.g., rename) or not aligned with the BFF proxy model for this path.
// The original POST in this file expected JSON {content: ""}, which is now effectively handled by PUT.
// The original PATCH was for rename, now at /api/files/rename/[...paths].
