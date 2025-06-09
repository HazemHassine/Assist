// Path: frontend/src/app/api/files/move/route.js
export const dynamic = 'force-dynamic'

const BACKEND_API_URL = "http://localhost:8000"; // TODO: Use environment variable

export async function POST(request) {
  try {
    const body = await request.json();
    const { sourcePath, destinationPath } = body;

    if (!sourcePath || !destinationPath) {
      return new Response(JSON.stringify({ detail: "Source and destination paths are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const backendResponse = await fetch(`${BACKEND_API_URL}/files/move`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sourcePath, destinationPath }),
    });

    const responseBody = await backendResponse.json();

    return new Response(JSON.stringify(responseBody), {
      status: backendResponse.status,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in /api/files/move proxy:", error);
    return new Response(JSON.stringify({ detail: "Internal server error in proxy" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
