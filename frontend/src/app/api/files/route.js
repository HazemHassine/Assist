// Path: frontend/src/app/api/files/route.js
// This route handles GET requests for listing all files/folders (file tree)
export const dynamic = 'force-dynamic'

const BACKEND_API_URL = "http://localhost:8000"; // TODO: Use environment variable

export async function GET(request) {
  try {
    const backendResponse = await fetch(`${BACKEND_API_URL}/files`, {
      method: "GET",
      // Potentially forward headers from the original request if needed, e.g., for auth
      // headers: request.headers,
    });

    const responseBody = await backendResponse.json();

    return new Response(JSON.stringify(responseBody), {
      status: backendResponse.status,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in /api/files GET proxy:", error);
    return new Response(JSON.stringify({ detail: "Internal server error in proxy" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
