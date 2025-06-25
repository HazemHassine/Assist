import { google } from 'googleapis';
import { cookies } from 'next/headers';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('google_access_token');

    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'Not authenticated with Google Drive' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken.value });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // First get file metadata
    const fileMetadata = await drive.files.get({
      fileId: id,
      fields: 'id, name, mimeType'
    });

    let content = '';

    if (fileMetadata.data.mimeType === 'application/vnd.google-apps.document') {
      // For Google Docs, export as markdown
      const response = await drive.files.export({
        fileId: id,
        mimeType: 'text/plain'
      });
      content = response.data;
    } else {
      // For regular files, download content
      const response = await drive.files.get({
        fileId: id,
        alt: 'media'
      });
      content = response.data;
    }

    console.log('Fetched file content:', fileMetadata.data.name);

    return new Response(JSON.stringify({ 
      content,
      name: fileMetadata.data.name,
      mimeType: fileMetadata.data.mimeType
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching Google Drive file:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch file content' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 