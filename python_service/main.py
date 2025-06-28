from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
import io
from typing import Optional, Dict, Any

from services.pdf_processor import PDFProcessor
from services.embedding_service import EmbeddingService
from services.graph_builder import GraphBuilder

app = FastAPI(title="Document Processing Service", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Your Next.js app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
pdf_processor = PDFProcessor()
embedding_service = EmbeddingService()
graph_builder = GraphBuilder()

class ProcessRequest(BaseModel):
    file_id: str
    content: str  # base64 encoded content
    mime_type: str
    filename: str

class ProcessResponse(BaseModel):
    file_id: str
    text_content: str
    metadata: Dict[str, Any]
    embeddings: Optional[Dict[str, Any]] = None
    graph_data: Optional[Dict[str, Any]] = None
    processing_time: float

@app.get("/")
async def root():
    return {"message": "Document Processing Service is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "services": {
        "pdf_processor": "ready",
        "embedding_service": "ready",
        "graph_builder": "ready"
    }}

@app.post("/process-pdf", response_model=ProcessResponse)
async def process_pdf(request: ProcessRequest):
    """Process a PDF file and extract text, metadata, embeddings, and graph data"""
    try:
        import time
        start_time = time.time()
        
        # Decode base64 content
        pdf_content = base64.b64decode(request.content)
        pdf_stream = io.BytesIO(pdf_content)
        
        # Process PDF
        text_content, metadata = await pdf_processor.process_pdf(pdf_stream)
        
        # Generate embeddings
        embeddings = await embedding_service.generate_embeddings(text_content)
        
        # Build knowledge graph
        graph_data = await graph_builder.build_graph(text_content, metadata)
        
        processing_time = time.time() - start_time
        
        return ProcessResponse(
            file_id=request.file_id,
            text_content=text_content,
            metadata=metadata,
            embeddings=embeddings,
            graph_data=graph_data,
            processing_time=processing_time
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@app.post("/extract-text")
async def extract_text(request: ProcessRequest):
    """Extract only text content from PDF"""
    try:
        # Decode base64 content
        pdf_content = base64.b64decode(request.content)
        pdf_stream = io.BytesIO(pdf_content)
        
        # Process PDF for text only
        text_content, metadata = await pdf_processor.process_pdf(pdf_stream)
        
        return {
            "file_id": request.file_id,
            "text_content": text_content,
            "metadata": metadata
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text extraction failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 