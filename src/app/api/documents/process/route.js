import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

// In-memory cache for processed PDFs (in production, use Redis or database)
const processedPdfsCache = new Map();

export async function POST(request) {
  try {
    const { fileId, content, mimeType, filename, filePath } = await request.json();

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

    // Check cache first
    if (processedPdfsCache.has(fileId)) {
      console.log(`Returning cached result for PDF: ${filename} (${fileId})`);
      return new Response(JSON.stringify({
        success: true,
        data: processedPdfsCache.get(fileId),
        message: `Retrieved cached data for ${filename}`,
        cached: true
      }), {
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

    // Create a comprehensive summary
    const summary = await createSummary(processingResult.text_content, filename);

    // Enhance the result with additional metadata
    const enhancedResult = {
      ...processingResult,
      summary: summary,
      file_path: filePath,
      processed_at: new Date().toISOString(),
      file_id: fileId,
      filename: filename
    };

    // Cache the result
    processedPdfsCache.set(fileId, enhancedResult);

    // Store to persistent storage (JSON file for now, use database in production)
    await storeProcessedPdf(enhancedResult);

    console.log(`Successfully processed PDF: ${filename}`);
    console.log(`Processing time: ${processingResult.processing_time}s`);
    console.log(`Extracted ${processingResult.metadata.word_count} words`);
    console.log(`Summary length: ${summary.length} characters`);

    return new Response(JSON.stringify({
      success: true,
      data: enhancedResult,
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

async function createSummary(textContent, filename) {
  try {
    // Use the Python service to generate a summary
    const summaryResponse = await fetch(`${PYTHON_SERVICE_URL}/summarize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: textContent,
        max_length: 200, // Keep summary concise
        filename: filename
      }),
    });

    if (summaryResponse.ok) {
      const summaryResult = await summaryResponse.json();
      return summaryResult.summary;
    }
  } catch (error) {
    console.warn('Failed to generate AI summary, using fallback:', error);
  }

  // Fallback: create a simple summary from the first few sentences
  const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const summary = sentences.slice(0, 3).join('. ') + '.';
  
  return summary.length > 200 ? summary.substring(0, 200) + '...' : summary;
}

async function storeProcessedPdf(pdfData) {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'processed_pdfs.json');
    const dataDir = path.dirname(dataPath);
    
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    let pdfs = [];
    if (fs.existsSync(dataPath)) {
      pdfs = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    }

    // Update existing or add new
    const existingIndex = pdfs.findIndex(pdf => pdf.file_id === pdfData.file_id);
    if (existingIndex >= 0) {
      pdfs[existingIndex] = pdfData;
    } else {
      pdfs.push(pdfData);
    }

    fs.writeFileSync(dataPath, JSON.stringify(pdfs, null, 2));
  } catch (error) {
    console.error('Error storing processed PDF:', error);
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
      python_service: pythonHealth,
      cached_pdfs: processedPdfsCache.size
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