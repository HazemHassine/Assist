// Path: frontend/src/app/api/files/create/route.js
export const dynamic = 'force-dynamic' // Ensures the route is not statically cached

const BACKEND_API_URL = "http://localhost:8000"; // TODO: Use environment variable

export async function POST(request) {
  try {
    const body = await request.json();
    const { path, type } = body;

    if (!path || !type) {
      return new Response(JSON.stringify({ detail: "Path and type are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const backendResponse = await fetch(`${BACKEND_API_URL}/files/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ path, type }),
    });

    const responseBody = await backendResponse.json();

    return new Response(JSON.stringify(responseBody), {
      status: backendResponse.status,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in /api/files/create proxy:", error);
    return new Response(JSON.stringify({ detail: "Internal server error in proxy" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
