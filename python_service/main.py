from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
import io
from typing import Optional, Dict, Any
import logging

from config import Config
from services.pdf_processor import PDFProcessor
from services.embedding_service import EmbeddingService
from services.enhanced_graph_builder import EnhancedGraphBuilder
from services.text_compressor import TextCompressor
from services.openrouter_service import OpenRouterService

# Configure logging
logging.basicConfig(
    level=getattr(logging, Config.LOG_LEVEL),
    format=Config.LOG_FORMAT
)
logger = logging.getLogger(__name__)

# Validate configuration
if not Config.validate():
    logger.error("Configuration validation failed")
    exit(1)

# Print configuration
Config.print_config()

app = FastAPI(
    title="Enhanced Document Processing Service", 
    version="2.0.0",
    description="AI-powered document processing with text compression and OpenRouter integration"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=Config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
pdf_processor = PDFProcessor()
embedding_service = EmbeddingService()
text_compressor = TextCompressor()

# Initialize enhanced graph builder with OpenRouter integration
enhanced_graph_builder = EnhancedGraphBuilder(
    use_openrouter=Config.USE_OPENROUTER,
    compression_target=Config.COMPRESSION_TARGET
)

# Initialize OpenRouter service for direct API calls
openrouter_service = None
if Config.USE_OPENROUTER:
    openrouter_config = Config.get_openrouter_config()
    openrouter_service = OpenRouterService(
        api_key=openrouter_config["api_key"],
        site_url=openrouter_config["site_url"],
        site_name=openrouter_config["site_name"]
    )

class ProcessRequest(BaseModel):
    file_id: str
    content: str  # base64 encoded content
    mime_type: str
    filename: str

class SummarizeRequest(BaseModel):
    text: str
    max_length: int = 200
    filename: Optional[str] = None
    use_ai: bool = True

class CompressRequest(BaseModel):
    text: str
    target_length: int = Config.COMPRESSION_TARGET
    method: str = Config.COMPRESSION_METHOD

class ProcessResponse(BaseModel):
    file_id: str
    text_content: str
    metadata: Dict[str, Any]
    embeddings: Optional[Dict[str, Any]] = None
    graph_data: Optional[Dict[str, Any]] = None
    processing_time: float
    compression_info: Optional[Dict[str, Any]] = None
    ai_used: bool = False

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Starting Enhanced Document Processing Service")
    logger.info(f"OpenRouter integration: {'Enabled' if Config.USE_OPENROUTER else 'Disabled'}")
    logger.info(f"Text compression target: {Config.COMPRESSION_TARGET} characters")

@app.get("/")
async def root():
    return {
        "message": "Enhanced Document Processing Service is running",
        "version": "2.0.0",
        "features": {
            "text_compression": True,
            "openrouter_integration": Config.USE_OPENROUTER,
            "enhanced_graph_building": True,
            "ai_powered_summarization": Config.USE_OPENROUTER
        },
        "configuration": {
            "compression_target": Config.COMPRESSION_TARGET,
            "compression_method": Config.COMPRESSION_METHOD,
            "max_graph_nodes": Config.MAX_GRAPH_NODES,
            "max_graph_edges": Config.MAX_GRAPH_EDGES
        }
    }

@app.get("/health")
async def health_check():
    services_status = {
        "pdf_processor": "ready",
        "embedding_service": "ready",
        "enhanced_graph_builder": "ready",
        "text_compressor": "ready"
    }
    
    if openrouter_service:
        try:
            # Test OpenRouter connection
            if openrouter_service.api_key:
                services_status["openrouter_service"] = "ready"
            else:
                services_status["openrouter_service"] = "no_api_key"
        except Exception as e:
            services_status["openrouter_service"] = f"error: {str(e)}"
    else:
        services_status["openrouter_service"] = "disabled"
    
    return {"status": "healthy", "services": services_status}

@app.get("/config")
async def get_config():
    """Get current configuration (without sensitive data)"""
    return {
        "openrouter_enabled": Config.USE_OPENROUTER,
        "compression_target": Config.COMPRESSION_TARGET,
        "compression_method": Config.COMPRESSION_METHOD,
        "max_graph_nodes": Config.MAX_GRAPH_NODES,
        "max_graph_edges": Config.MAX_GRAPH_EDGES,
        "api_host": Config.API_HOST,
        "api_port": Config.API_PORT,
        "log_level": Config.LOG_LEVEL
    }

@app.post("/compress-text")
async def compress_text(request: CompressRequest):
    """Compress text to reduce API usage"""
    try:
        # Validate text length
        if len(request.text) > Config.MAX_TEXT_LENGTH:
            raise HTTPException(
                status_code=400, 
                detail=f"Text too long. Maximum allowed: {Config.MAX_TEXT_LENGTH} characters"
            )
        
        result = text_compressor.compress_text(
            request.text,
            target_length=request.target_length,
            method=request.method
        )
        
        return {
            "compressed_text": result["compressed_text"],
            "original_length": result["original_length"],
            "compressed_length": result["compressed_length"],
            "compression_ratio": result["compression_ratio"],
            "method": result["method"],
            "preserved_elements": result["preserved_elements"]
        }
        
    except Exception as e:
        logger.error(f"Text compression failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Text compression failed: {str(e)}")

@app.post("/summarize")
async def summarize_text(request: SummarizeRequest):
    """Generate a summary of the provided text"""
    try:
        # Validate text length
        if len(request.text) > Config.MAX_TEXT_LENGTH:
            raise HTTPException(
                status_code=400, 
                detail=f"Text too long. Maximum allowed: {Config.MAX_TEXT_LENGTH} characters"
            )
        
        if request.use_ai and openrouter_service:
            try:
                # Use AI-powered summarization
                result = openrouter_service.generate_summary(request.text, request.max_length)
                return {
                    "summary": result["summary"],
                    "original_length": result["original_length"],
                    "summary_length": result["summary_length"],
                    "filename": request.filename,
                    "method": "ai",
                    "generated_at": result["generated_at"]
                }
            except Exception as e:
                logger.warning(f"AI summarization failed: {str(e)}, falling back to extractive method")
                # Fallback to extractive summarization
                pass
        
        # Extractive summarization fallback
        sentences = request.text.split('. ')
        summary = '. '.join(sentences[:3]) + '.'
        
        # Truncate if too long
        if len(summary) > request.max_length:
            summary = summary[:request.max_length-3] + '...'
        
        return {
            "summary": summary,
            "original_length": len(request.text),
            "summary_length": len(summary),
            "filename": request.filename,
            "method": "extractive"
        }
        
    except Exception as e:
        logger.error(f"Summarization failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")

@app.post("/extract-entities")
async def extract_entities(request: SummarizeRequest):
    """Extract entities and relationships from text using AI"""
    try:
        if not openrouter_service:
            raise HTTPException(status_code=400, detail="OpenRouter service not available")
        
        # Validate text length
        if len(request.text) > Config.MAX_TEXT_LENGTH:
            raise HTTPException(
                status_code=400, 
                detail=f"Text too long. Maximum allowed: {Config.MAX_TEXT_LENGTH} characters"
            )
        
        # Compress text first to reduce API usage
        compressed_result = text_compressor.compress_text(request.text, target_length=1500)
        compressed_text = compressed_result["compressed_text"]
        
        # Extract entities using AI
        result = openrouter_service.extract_entities_and_relationships(compressed_text)
        
        return {
            "entities": result["entities"],
            "relationships": result["relationships"],
            "keywords": result["keywords"],
            "compression_info": compressed_result,
            "original_length": len(request.text),
            "compressed_length": len(compressed_text)
        }
        
    except Exception as e:
        logger.error(f"Entity extraction failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Entity extraction failed: {str(e)}")

@app.post("/process-pdf", response_model=ProcessResponse)
async def process_pdf(request: ProcessRequest):
    """Process a PDF file and extract text, metadata, embeddings, and enhanced graph data"""
    try:
        import time
        start_time = time.time()
        
        logger.info(f"Processing PDF: {request.filename}")
        
        # Decode base64 content
        pdf_content = base64.b64decode(request.content)
        pdf_stream = io.BytesIO(pdf_content)
        
        # Process PDF
        text_content, metadata = await pdf_processor.process_pdf(pdf_stream)
        logger.info(f"PDF processed - Text length: {len(text_content)} characters")
        
        # Compress text for graph generation
        compression_result = text_compressor.compress_text(
            text_content, 
            target_length=Config.COMPRESSION_TARGET,
            method=Config.COMPRESSION_METHOD
        )
        compressed_text = compression_result["compressed_text"]
        
        logger.info(f"Text compressed - Ratio: {compression_result['compression_ratio']:.2f}")
        
        # Generate embeddings
        embeddings = await embedding_service.generate_embeddings(text_content)
        logger.info("Embeddings generated")
        
        # Build enhanced knowledge graph
        graph_data = await enhanced_graph_builder.build_graph(text_content, metadata)
        logger.info(f"Graph built - Nodes: {graph_data['total_nodes']}, Edges: {graph_data['total_edges']}")
        
        processing_time = time.time() - start_time
        
        return ProcessResponse(
            file_id=request.file_id,
            text_content=text_content,
            metadata=metadata,
            embeddings=embeddings,
            graph_data=graph_data,
            processing_time=processing_time,
            compression_info=compression_result,
            ai_used=graph_data.get('ai_used', False)
        )
        
    except Exception as e:
        logger.error(f"PDF processing failed: {str(e)}")
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
        logger.error(f"Text extraction failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Text extraction failed: {str(e)}")

@app.post("/generate-graph")
async def generate_graph(request: SummarizeRequest):
    """Generate a knowledge graph from text content"""
    try:
        # Validate text length
        if len(request.text) > Config.MAX_TEXT_LENGTH:
            raise HTTPException(
                status_code=400, 
                detail=f"Text too long. Maximum allowed: {Config.MAX_TEXT_LENGTH} characters"
            )
        
        # Compress text first
        compression_result = text_compressor.compress_text(
            request.text, 
            target_length=Config.COMPRESSION_TARGET,
            method=Config.COMPRESSION_METHOD
        )
        
        # Generate graph
        graph_data = await enhanced_graph_builder.build_graph(request.text, {})
        
        return {
            "graph_data": graph_data["graph_data"],
            "analysis": graph_data["analysis"],
            "compression_info": compression_result,
            "ai_used": graph_data.get('ai_used', False),
            "processing_time": graph_data.get('processing_time', 0)
        }
        
    except Exception as e:
        logger.error(f"Graph generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Graph generation failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app, 
        host=Config.API_HOST, 
        port=Config.API_PORT,
        workers=Config.API_WORKERS
    ) 