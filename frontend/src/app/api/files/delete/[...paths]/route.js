// Path: frontend/src/app/api/files/delete/[...paths]/route.js
export const dynamic = 'force-dynamic'

const BACKEND_API_URL = "http://localhost:8000"; // TODO: Use environment variable

export async function DELETE(request, { params }) {
  try {
    const itemPath = params.paths?.join("/") || "";

    if (!itemPath) {
      return new Response(JSON.stringify({ detail: "Path is required for deletion" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Encode the path segments to ensure safe URL construction
    const encodedItemPath = itemPath.split('/').map(segment => encodeURIComponent(segment)).join('/');

    const backendResponse = await fetch(`${BACKEND_API_URL}/files/${encodedItemPath}`, {
      method: "DELETE",
    });

    // DELETE requests might not always return a JSON body (e.g., 204 No Content)
    // So, handle based on status or if content-type indicates JSON
    let responseBody;
    const contentType = backendResponse.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      responseBody = await backendResponse.json();
    } else {
      // For non-JSON responses (like plain text or empty), read as text.
      // If backend sends 204, text() will be empty string.
      responseBody = await backendResponse.text();
    }

    // If backendResponse was 204, responseBody might be empty.
    // If it was JSON, it's parsed. If plain text, it's here.
    // We should return JSON to our client, so stringify if it's not already an object (from json())
    const finalBody = (typeof responseBody === 'object') ? JSON.stringify(responseBody) : JSON.stringify({ message: responseBody });

    // Special case for 204 No Content, where body should be empty
    if (backendResponse.status === 204) {
        return new Response(null, { status: 204 });
    }

    return new Response(finalBody, {
      status: backendResponse.status,
      headers: { "Content-Type": "application/json" }, // Always return JSON
    });

  } catch (error) {
    console.error("Error in /api/files/delete proxy:", error);
    return new Response(JSON.stringify({ detail: "Internal server error in proxy" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
