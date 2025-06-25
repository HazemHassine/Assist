import { google } from 'googleapis';
import { cookies } from 'next/headers';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
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
    } else if (fileMetadata.data.mimeType === 'application/pdf') {
      // For PDFs, download using raw HTTP request to get binary data
      try {
        // Use the raw HTTP request method to get binary data
        const response = await drive.files.get({
          fileId: id,
          alt: 'media'
        });
        
        console.log('PDF response data type:', typeof response.data);
        console.log('PDF response data constructor:', response.data?.constructor?.name);
        
        // Since we're getting a Blob with no properties, try a different approach
        // Use the raw HTTP request to get the binary data directly
        const rawResponse = await oauth2Client.request({
          url: `https://www.googleapis.com/drive/v3/files/${id}?alt=media`,
          method: 'GET',
          responseType: 'arraybuffer'
        });
        
        console.log('Raw response data type:', typeof rawResponse.data);
        console.log('Raw response data constructor:', rawResponse.data?.constructor?.name);
        
        let buffer;
        if (rawResponse.data instanceof ArrayBuffer) {
          buffer = Buffer.from(rawResponse.data);
        } else if (typeof rawResponse.data === 'string') {
          buffer = Buffer.from(rawResponse.data, 'binary');
        } else {
          buffer = Buffer.from(rawResponse.data);
        }
        
        content = buffer.toString('base64');
        
      } catch (error) {
        console.error('Error downloading PDF:', error);
        return new Response(JSON.stringify({ error: 'Failed to download PDF' }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
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