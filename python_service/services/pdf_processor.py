import PyPDF2
import pdfplumber
import io
from typing import Tuple, Dict, Any
import re

class PDFProcessor:
    def __init__(self):
        self.supported_mime_types = ['application/pdf']
    
    async def process_pdf(self, pdf_stream: io.BytesIO) -> Tuple[str, Dict[str, Any]]:
        """
        Process a PDF file and extract text content and metadata
        
        Args:
            pdf_stream: BytesIO stream containing PDF data
            
        Returns:
            Tuple of (text_content, metadata)
        """
        try:
            # Reset stream position
            pdf_stream.seek(0)
            
            # Extract text using pdfplumber (more reliable for complex PDFs)
            text_content = ""
            metadata = {}
            
            with pdfplumber.open(pdf_stream) as pdf:
                # Extract metadata
                metadata = self._extract_metadata(pdf)
                
                # Extract text from all pages
                for page_num, page in enumerate(pdf.pages):
                    page_text = page.extract_text()
                    if page_text:
                        text_content += f"\n--- Page {page_num + 1} ---\n"
                        text_content += page_text
                        text_content += "\n"
            
            # Clean up text
            text_content = self._clean_text(text_content)
            
            # Add processing metadata
            metadata.update({
                'total_pages': len(pdf.pages) if 'pdf' in locals() else 0,
                'text_length': len(text_content),
                'word_count': len(text_content.split()),
                'processing_method': 'pdfplumber'
            })
            
            return text_content, metadata
            
        except Exception as e:
            # Fallback to PyPDF2 if pdfplumber fails
            try:
                return await self._fallback_pypdf2(pdf_stream)
            except Exception as fallback_error:
                raise Exception(f"PDF processing failed with both methods: {str(e)}, fallback: {str(fallback_error)}")
    
    def _extract_metadata(self, pdf) -> Dict[str, Any]:
        """Extract metadata from PDF"""
        metadata = {}
        
        try:
            if pdf.metadata:
                metadata.update({
                    'title': pdf.metadata.get('Title', ''),
                    'author': pdf.metadata.get('Author', ''),
                    'subject': pdf.metadata.get('Subject', ''),
                    'creator': pdf.metadata.get('Creator', ''),
                    'producer': pdf.metadata.get('Producer', ''),
                    'creation_date': pdf.metadata.get('CreationDate', ''),
                    'modification_date': pdf.metadata.get('ModDate', '')
                })
        except Exception:
            pass
        
        return metadata
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize extracted text"""
        if not text:
            return ""
        
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove page markers
        text = re.sub(r'--- Page \d+ ---', '', text)
        
        # Remove excessive newlines
        text = re.sub(r'\n\s*\n\s*\n', '\n\n', text)
        
        # Strip leading/trailing whitespace
        text = text.strip()
        
        return text
    
    async def _fallback_pypdf2(self, pdf_stream: io.BytesIO) -> Tuple[str, Dict[str, Any]]:
        """Fallback method using PyPDF2"""
        pdf_stream.seek(0)
        
        text_content = ""
        metadata = {}
        
        try:
            pdf_reader = PyPDF2.PdfReader(pdf_stream)
            
            # Extract metadata
            if pdf_reader.metadata:
                metadata.update({
                    'title': pdf_reader.metadata.get('/Title', ''),
                    'author': pdf_reader.metadata.get('/Author', ''),
                    'subject': pdf_reader.metadata.get('/Subject', ''),
                    'creator': pdf_reader.metadata.get('/Creator', ''),
                    'producer': pdf_reader.metadata.get('/Producer', ''),
                    'creation_date': pdf_reader.metadata.get('/CreationDate', ''),
                    'modification_date': pdf_reader.metadata.get('/ModDate', '')
                })
            
            # Extract text from all pages
            for page_num, page in enumerate(pdf_reader.pages):
                page_text = page.extract_text()
                if page_text:
                    text_content += f"\n--- Page {page_num + 1} ---\n"
                    text_content += page_text
                    text_content += "\n"
            
            # Clean up text
            text_content = self._clean_text(text_content)
            
            # Add processing metadata
            metadata.update({
                'total_pages': len(pdf_reader.pages),
                'text_length': len(text_content),
                'word_count': len(text_content.split()),
                'processing_method': 'PyPDF2_fallback'
            })
            
            return text_content, metadata
            
        except Exception as e:
            raise Exception(f"PyPDF2 fallback failed: {str(e)}")
    
    def get_supported_formats(self) -> list:
        """Get list of supported MIME types"""
        return self.supported_mime_types.copy() 