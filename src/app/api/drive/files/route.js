import { google } from 'googleapis';
import { cookies } from 'next/headers';

// Helper function to recursively fetch folders and files
async function fetchFolderContents(drive, folderId, folderName = '') {
  const items = [];
  
  try {
    // Get all items in the current folder
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType, modifiedTime, size, parents)',
      pageSize: 1000
    });

    const files = response.data.files || [];

    for (const file of files) {
      if (file.mimeType === 'application/vnd.google-apps.folder') {
        // It's a folder, recursively fetch its contents
        const subItems = await fetchFolderContents(drive, file.id, file.name);
        items.push({
          ...file,
          type: 'folder',
          path: folderName ? `${folderName}/${file.name}` : file.name,
          children: subItems
        });
      } else if (
        file.mimeType === 'text/plain' || 
        file.mimeType === 'text/markdown' || 
        file.mimeType === 'application/vnd.google-apps.document' ||
        file.mimeType === 'application/pdf'
      ) {
        // It's a supported file type (including PDF)
        items.push({
          ...file,
          type: 'file',
          path: folderName ? `${folderName}/${file.name}` : file.name
        });
      }
    }
  } catch (error) {
    console.error(`Error fetching contents of folder ${folderName}:`, error);
  }

  return items;
}

export async function GET() {
  try {
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

    // First, find the folder ID for 'Master Passau SoSe 25'
    const folderResponse = await drive.files.list({
      q: "name='Master Passau SoSe 25' and mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: 'files(id, name)',
      pageSize: 1
    });

    const folder = folderResponse.data.files?.[0];
    
    if (!folder) {
      return new Response(JSON.stringify({ error: 'Folder "Master Passau SoSe 25" not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Recursively fetch all folders and files
    const folderStructure = await fetchFolderContents(drive, folder.id, folder.name);
    
    console.log(`Fetched hierarchical structure from folder: ${folder.name}`);

    const responseData = { 
      rootFolder: {
        ...folder,
        type: 'folder',
        children: folderStructure
      }
    };

    return new Response(JSON.stringify(responseData), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching Google Drive files:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch files' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 