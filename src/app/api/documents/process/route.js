import { cookies } from 'next/headers';

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

export async function POST(request) {
  try {
    const { fileId, content, mimeType, filename } = await request.json();

    if (!fileId || !content || !mimeType) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: fileId, content, mimeType' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if it's a PDF file
    if (mimeType !== 'application/pdf') {
      return new Response(JSON.stringify({ 
        error: 'Only PDF files are currently supported for processing' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`Processing PDF: ${filename} (${fileId})`);

    // Call Python service
    const pythonResponse = await fetch(`${PYTHON_SERVICE_URL}/process-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_id: fileId,
        content: content,
        mime_type: mimeType,
        filename: filename
      }),
    });

    if (!pythonResponse.ok) {
      const errorData = await pythonResponse.text();
      console.error('Python service error:', errorData);
      return new Response(JSON.stringify({ 
        error: `Python service error: ${pythonResponse.status}` 
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const processingResult = await pythonResponse.json();

    // Here you could store the results in your database
    // For now, we'll just return the processed data
    console.log(`Successfully processed PDF: ${filename}`);
    console.log(`Processing time: ${processingResult.processing_time}s`);
    console.log(`Extracted ${processingResult.metadata.word_count} words`);

    return new Response(JSON.stringify({
      success: true,
      data: processingResult,
      message: `Successfully processed ${filename}`
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing document:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process document',
      details: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function GET() {
  try {
    // Health check endpoint
    const pythonHealthResponse = await fetch(`${PYTHON_SERVICE_URL}/health`);
    
    if (!pythonHealthResponse.ok) {
      return new Response(JSON.stringify({ 
        status: 'unhealthy',
        python_service: 'unavailable'
      }), { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const pythonHealth = await pythonHealthResponse.json();

    return new Response(JSON.stringify({
      status: 'healthy',
      nextjs: 'running',
      python_service: pythonHealth
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Health check error:', error);
    return new Response(JSON.stringify({ 
      status: 'unhealthy',
      error: error.message 
    }), { 
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 