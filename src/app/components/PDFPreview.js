import React from 'react';

export default function PDFPreview({ content, name }) {
  // Create a blob URL from the base64 content
  const createPdfBlobUrl = () => {
    if (!content) return null;
    
    try {
      // Convert base64 to blob
      const byteCharacters = atob(content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error creating PDF blob:', error);
      return null;
    }
  };

  const pdfUrl = createPdfBlobUrl();

  // Cleanup blob URL when component unmounts
  React.useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-zinc-950 border-l border-zinc-700/50">
      <div className="h-11 bg-zinc-900/60 border-b border-zinc-700/50 flex items-center px-5 flex-shrink-0">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          PDF Preview: {name}
        </span>
      </div>
      <div className="flex-1 overflow-hidden min-h-0">
        {pdfUrl ? (
          <iframe
            src={pdfUrl}
            className="w-full h-full border-0"
            title={`PDF Preview: ${name}`}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-zinc-400">
            Failed to load PDF
          </div>
        )}
      </div>  
    </div>
  );
} 