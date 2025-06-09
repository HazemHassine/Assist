// Path: frontend/src/app/api/files/rename/[...paths]/route.js
export const dynamic = 'force-dynamic'

const BACKEND_API_URL = "http://localhost:8000"; // TODO: Use environment variable

export async function POST(request, { params }) {
  try {
    const oldPath = params.paths?.join("/") || "";
    const body = await request.json();
    const { new_name } = body; // Client sends new_name, which backend expects

    if (!oldPath) {
      return new Response(JSON.stringify({ detail: "Original path is required for renaming" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (!new_name) {
      return new Response(JSON.stringify({ detail: "New name is required for renaming" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const encodedOldPath = oldPath.split('/').map(segment => encodeURIComponent(segment)).join('/');

    const backendResponse = await fetch(`${BACKEND_API_URL}/files/rename/${encodedOldPath}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ new_name }), // Backend expects new_name field
    });

    const responseBody = await backendResponse.json();

    return new Response(JSON.stringify(responseBody), {
      status: backendResponse.status,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in /api/files/rename proxy:", error);
    return new Response(JSON.stringify({ detail: "Internal server error in proxy" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
