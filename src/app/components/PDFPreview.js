import React, { useState } from 'react';
import { FileText, Info, Eye, EyeOff } from 'lucide-react';

export default function PDFPreview({ content, name, summary, metadata }) {
  const [showPreview, setShowPreview] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

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

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-zinc-950 border-l border-zinc-700/50">
      <div className="h-11 bg-zinc-900/60 border-b border-zinc-700/50 flex items-center justify-between px-5 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            PDF Preview: {name}
          </span>
          {summary && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center space-x-1 px-2 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
              title="Toggle details"
            >
              <Info size={12} />
              <span>Details</span>
            </button>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center space-x-1 px-2 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
            title={showPreview ? "Hide preview" : "Show preview"}
          >
            {showPreview ? <EyeOff size={12} /> : <Eye size={12} />}
            <span>{showPreview ? "Hide" : "Show"}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden min-h-0">
        {/* PDF Details Panel */}
        {showDetails && summary && (
          <div className="h-1/3 bg-zinc-900/50 border-b border-zinc-700/50 overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* Summary */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-200 mb-2 flex items-center">
                  <FileText size={14} className="mr-2" />
                  Summary
                </h3>
                <p className="text-sm text-zinc-300 leading-relaxed">{summary}</p>
              </div>

              {/* Metadata */}
              {metadata && (
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200 mb-2">Metadata</h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {metadata.word_count && (
                      <div className="bg-zinc-800/50 rounded p-2">
                        <div className="text-zinc-400">Words</div>
                        <div className="text-zinc-200 font-medium">{metadata.word_count.toLocaleString()}</div>
                      </div>
                    )}
                    {metadata.total_pages && (
                      <div className="bg-zinc-800/50 rounded p-2">
                        <div className="text-zinc-400">Pages</div>
                        <div className="text-zinc-200 font-medium">{metadata.total_pages}</div>
                      </div>
                    )}
                    {metadata.author && (
                      <div className="bg-zinc-800/50 rounded p-2">
                        <div className="text-zinc-400">Author</div>
                        <div className="text-zinc-200 font-medium">{metadata.author}</div>
                      </div>
                    )}
                    {metadata.title && (
                      <div className="bg-zinc-800/50 rounded p-2">
                        <div className="text-zinc-400">Title</div>
                        <div className="text-zinc-200 font-medium">{metadata.title}</div>
                      </div>
                    )}
                    {metadata.creation_date && (
                      <div className="bg-zinc-800/50 rounded p-2">
                        <div className="text-zinc-400">Created</div>
                        <div className="text-zinc-200 font-medium">
                          {new Date(metadata.creation_date).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                    {metadata.modification_date && (
                      <div className="bg-zinc-800/50 rounded p-2">
                        <div className="text-zinc-400">Modified</div>
                        <div className="text-zinc-200 font-medium">
                          {new Date(metadata.modification_date).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PDF Preview */}
        {showPreview && (
          <div className={`overflow-hidden min-h-0 ${showDetails ? 'h-2/3' : 'h-full'}`}>
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
        )}

        {/* No Preview Message */}
        {!showPreview && (
          <div className="flex items-center justify-center h-full text-zinc-400">
            <div className="text-center">
              <EyeOff size={48} className="mx-auto mb-4 text-zinc-600" />
              <p>PDF preview is hidden</p>
              <p className="text-sm text-zinc-500 mt-1">Click "Show" to view the PDF</p>
            </div>
          </div>
        )}
      </div>  
    </div>
  );
} 