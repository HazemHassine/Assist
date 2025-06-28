# Document Processing Service

A Python FastAPI service for processing PDF documents with AI-powered text extraction, embeddings, and knowledge graph generation.

## Features

- **PDF Text Extraction**: Using PyPDF2 and pdfplumber
- **AI Embeddings**: Sentence transformers for vector embeddings
- **Knowledge Graph**: NetworkX-based graph construction
- **REST API**: FastAPI endpoints for document processing
- **Docker Support**: Containerized deployment

## Quick Start

### Option 1: Docker (Recommended)

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or run just the Python service
cd python_service
docker build -t document-processor .
docker run -p 8000:8000 document-processor
```

### Option 2: Local Development

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download spaCy model
python -m spacy download en_core_web_sm

# Run the service
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## API Endpoints

### Health Check
```bash
GET /health
```

### Process PDF
```bash
POST /process-pdf
Content-Type: application/json

{
  "file_id": "unique_id",
  "content": "base64_encoded_pdf_content",
  "mime_type": "application/pdf",
  "filename": "document.pdf"
}
```

### Extract Text Only
```bash
POST /extract-text
Content-Type: application/json

{
  "file_id": "unique_id",
  "content": "base64_encoded_pdf_content",
  "mime_type": "application/pdf",
  "filename": "document.pdf"
}
```

## Testing

Run the test script to verify the service is working:

```bash
python test_service.py
```

## Integration with Next.js

The service is designed to work with your existing Next.js application. The Next.js API route `/api/documents/process` will call this Python service to process PDFs.

## Architecture

```
Next.js App (Port 3000)
    ↓
/api/documents/process
    ↓
Python Service (Port 8000)
    ↓
PDF Processing → Embeddings → Knowledge Graph
```

## Services

### PDFProcessor
- Extracts text from PDF files
- Extracts metadata (title, author, pages, etc.)
- Fallback between pdfplumber and PyPDF2

### EmbeddingService
- Generates vector embeddings using sentence-transformers
- Splits text into chunks for better processing
- Calculates similarity between embeddings

### GraphBuilder
- Builds knowledge graphs from text content
- Extracts entities and relationships
- Analyzes graph structure and centrality

## Environment Variables

- `PYTHON_SERVICE_URL`: URL of the Python service (default: http://localhost:8000)

## Development

### Adding New Features

1. **New Document Types**: Extend `PDFProcessor` class
2. **New Embedding Models**: Modify `EmbeddingService` class
3. **Enhanced Graph Analysis**: Extend `GraphBuilder` class

### Testing

```bash
# Run tests
python test_service.py

# Test specific endpoint
curl -X POST http://localhost:8000/process-pdf \
  -H "Content-Type: application/json" \
  -d '{"file_id": "test", "content": "base64_content", "mime_type": "application/pdf", "filename": "test.pdf"}'
```

## Troubleshooting

### Common Issues

1. **Port 8000 already in use**: Change port in `main.py` or Docker configuration
2. **spaCy model not found**: Run `python -m spacy download en_core_web_sm`
3. **Memory issues**: Reduce chunk size in `EmbeddingService`

### Logs

Check logs for detailed error information:
```bash
# Docker logs
docker-compose logs python-service

# Local logs
uvicorn main:app --log-level debug
``` 