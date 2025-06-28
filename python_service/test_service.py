#!/usr/bin/env python3
"""
Test script for the Document Processing Service
"""

import requests
import base64
import json
import time
import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

# Service URL
SERVICE_URL = "http://localhost:8000"

def test_health():
    """Test the health endpoint"""
    print("Testing health endpoint...")
    try:
        response = requests.get(f"{SERVICE_URL}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            print(json.dumps(response.json(), indent=2))
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def create_test_pdf_content():
    """Create a simple test PDF content (base64 encoded)"""
    # Create a PDF in memory using reportlab
    buffer = io.BytesIO()
    
    # Create the PDF object using the BytesIO object as its "file."
    p = canvas.Canvas(buffer, pagesize=letter)
    
    # Add content to the PDF
    p.drawString(100, 750, "Test Document for Processing")
    p.drawString(100, 720, "This is a test document created for testing the PDF processing service.")
    p.drawString(100, 690, "")
    p.drawString(100, 660, "Key concepts include:")
    p.drawString(120, 630, "- Machine Learning")
    p.drawString(120, 600, "- Artificial Intelligence")
    p.drawString(120, 570, "- Data Science")
    p.drawString(120, 540, "- Natural Language Processing")
    p.drawString(100, 510, "")
    p.drawString(100, 480, "The document contains important information about AI systems.")
    p.drawString(100, 450, "Machine Learning is a subset of Artificial Intelligence.")
    p.drawString(100, 420, "Data Science involves analyzing large datasets.")
    p.drawString(100, 390, "Natural Language Processing enables computers to understand human language.")
    
    # Close the PDF object cleanly
    p.showPage()
    p.save()
    
    # Get the value of the BytesIO buffer
    pdf_content = buffer.getvalue()
    buffer.close()
    
    # Encode as base64
    return base64.b64encode(pdf_content).decode()

def test_pdf_processing():
    """Test PDF processing endpoint"""
    print("\nTesting PDF processing...")
    
    test_data = {
        "file_id": "test_123",
        "content": create_test_pdf_content(),
        "mime_type": "application/pdf",
        "filename": "test_document.pdf"
    }
    
    try:
        start_time = time.time()
        response = requests.post(f"{SERVICE_URL}/process-pdf", json=test_data)
        end_time = time.time()
        
        if response.status_code == 200:
            result = response.json()
            print("✅ PDF processing successful")
            print(f"Processing time: {result.get('processing_time', 'N/A')}s")
            print(f"Text length: {len(result.get('text_content', ''))} characters")
            print(f"Word count: {result.get('metadata', {}).get('word_count', 'N/A')}")
            print(f"Graph nodes: {result.get('graph_data', {}).get('total_nodes', 'N/A')}")
            print(f"Graph edges: {result.get('graph_data', {}).get('total_edges', 'N/A')}")
            return True
        else:
            print(f"❌ PDF processing failed: {response.status_code}")
            print(response.text)
            return False
            
    except Exception as e:
        print(f"❌ PDF processing error: {e}")
        return False

def test_text_extraction():
    """Test text extraction endpoint"""
    print("\nTesting text extraction...")
    
    test_data = {
        "file_id": "test_456",
        "content": create_test_pdf_content(),
        "mime_type": "application/pdf",
        "filename": "test_document.pdf"
    }
    
    try:
        response = requests.post(f"{SERVICE_URL}/extract-text", json=test_data)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Text extraction successful")
            print(f"Text length: {len(result.get('text_content', ''))} characters")
            print(f"Word count: {result.get('metadata', {}).get('word_count', 'N/A')}")
            return True
        else:
            print(f"❌ Text extraction failed: {response.status_code}")
            print(response.text)
            return False
            
    except Exception as e:
        print(f"❌ Text extraction error: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing Document Processing Service")
    print("=" * 50)
    
    # Test health endpoint
    if not test_health():
        print("❌ Service is not healthy. Please start the service first.")
        return
    
    # Test PDF processing
    test_pdf_processing()
    
    # Test text extraction
    test_text_extraction()
    
    print("\n" + "=" * 50)
    print("✅ All tests completed!")

if __name__ == "__main__":
    main() 