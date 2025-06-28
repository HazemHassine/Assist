"use client";
import React, { useState, useEffect } from 'react';
import { ChevronLeft, FileText, Folder, FolderOpen, Download, RefreshCw, ChevronRight } from 'lucide-react';

// Recursive component to render folder structure
const FolderItem = ({ item, level = 0, onDownload, onFileOpen }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    onDownload(item.id, item.name);
  };

  const handleFileClick = (e) => {
    e.stopPropagation();
    if (item.type === 'file') {
      onFileOpen(item);
    }
  };

  if (item.type === 'folder') {
    return (
      <div>
        <div
          className="flex items-center justify-between p-2 hover:bg-zinc-700/50 transition-colors cursor-pointer"
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={toggleExpanded}
        >
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <ChevronRight 
              size={14} 
              className={`text-zinc-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
            />
            {isExpanded ? (
              <FolderOpen size={16} className="text-blue-400 flex-shrink-0" />
            ) : (
              <Folder size={16} className="text-blue-400 flex-shrink-0" />
            )}
            <span className="text-sm text-zinc-200 truncate">{item.name}</span>
          </div>
        </div>
        
        {isExpanded && item.children && (
          <div>
            {item.children.map((child) => (
              <FolderItem
                key={child.id}
                item={child}
                level={level + 1}
                onDownload={onDownload}
                onFileOpen={onFileOpen}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // File item
  return (
    <div
      className="flex items-center justify-between p-2 hover:bg-zinc-700/50 transition-colors cursor-pointer"
      style={{ paddingLeft: `${level * 16 + 8}px` }}
      onClick={handleFileClick}
    >
      <div className="flex items-center space-x-2 flex-1 min-w-0">
        <div className="w-4 flex-shrink-0" /> {/* Spacer for alignment */}
        <FileText size={16} className="text-zinc-400 flex-shrink-0" />
        <span className="text-sm text-zinc-200 truncate">{item.name}</span>
      </div>
      <button
        onClick={handleDownload}
        className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded transition-colors flex-shrink-0"
        title="Download file"
      >
        <Download size={14} />
      </button>
    </div>
  );
};

/**
 * DriveSync UI component (no API logic)
 * 
 * Props:
 * - collapsed: callback to toggle the panel
 * - onFileOpen: callback to open a file in the editor
 * - openFiles: array of currently open files to avoid duplicate API requests
 */
export default function DriveSync({ collapsed, onFileOpen, openFiles = [] }) {
  const [folderStructure, setFolderStructure] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  // Load cached data from localStorage on component mount
  useEffect(() => {
    const loadCachedData = () => {
      try {
        const cachedConnection = localStorage.getItem('driveSync_connected');
        const cachedStructure = localStorage.getItem('driveSync_folderStructure');
        const cachedTimestamp = localStorage.getItem('driveSync_timestamp');
        
        // Check if cache is less than 1 hour old
        const isCacheValid = cachedTimestamp && (Date.now() - parseInt(cachedTimestamp)) < 60 * 60 * 1000;
        
        if (cachedConnection === 'true' && cachedStructure && isCacheValid) {
          const parsedStructure = JSON.parse(cachedStructure);
          setFolderStructure(parsedStructure);
          setIsConnected(true);
          console.log('Loaded cached folder structure from localStorage');
        }
      } catch (error) {
        console.error('Error loading cached data:', error);
      }
    };

    loadCachedData();
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (folderStructure && isConnected) {
      try {
        localStorage.setItem('driveSync_connected', 'true');
        localStorage.setItem('driveSync_folderStructure', JSON.stringify(folderStructure));
        localStorage.setItem('driveSync_timestamp', Date.now().toString());
        console.log('Saved folder structure to localStorage');
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }
  }, [folderStructure, isConnected]);

  // Clear cache when connection is lost
  useEffect(() => {
    if (!isConnected) {
      try {
        localStorage.removeItem('driveSync_connected');
        localStorage.removeItem('driveSync_folderStructure');
        localStorage.removeItem('driveSync_timestamp');
        console.log('Cleared localStorage cache due to connection loss');
      } catch (error) {
        console.error('Error clearing localStorage:', error);
      }
    }
  }, [isConnected]);

  const checkConnection = async () => {
    try {
      const response = await fetch('/api/drive/files');
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.rootFolder) {
          setFolderStructure(data.rootFolder);
          setIsConnected(true);
          return true;
        } else {
          setIsConnected(false);
          return false;
        }
      } else {
        setIsConnected(false);
        return false;
      }
    } catch (error) {
      setIsConnected(false);
      return false;
    }
  };

  const connectToGoogleDrive = () => {
    window.location.href = '/api/auth/google';
  };

  const clearCache = () => {
    try {
      localStorage.removeItem('driveSync_connected');
      localStorage.removeItem('driveSync_folderStructure');
      localStorage.removeItem('driveSync_timestamp');
      setFolderStructure(null);
      setIsConnected(false);
      console.log('Manually cleared localStorage cache');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  const fetchFiles = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/drive/files');
      const data = await response.json();
      
      if (response.ok) {
        if (data.rootFolder) {
          setFolderStructure(data.rootFolder);
          setIsConnected(true);
        } else {
          setError('No folder structure received from API');
          setIsConnected(false);
        }
      } else {
        setError(data.error || 'Failed to fetch files');
        setIsConnected(false);
      }
    } catch (error) {
      setError('Failed to connect to Google Drive');
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (fileId, fileName) => {
    try {
      const response = await fetch(`/api/drive/files/${fileId}`);
      const data = await response.json();
      
      if (response.ok) {
        // Create a blob and download the file
        const blob = new Blob([data.content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError('Failed to download file');
      }
    } catch (error) {
      setError('Failed to download file');
    }
  };

  const handleFileOpen = async (file) => {
    // Check if file type is supported
    const supportedTypes = [
      'text/plain',
      'text/markdown',
      'application/vnd.google-apps.document',
      'application/pdf'
    ];
    
    if (!supportedTypes.includes(file.mimeType)) {
      alert(`Cannot open file type: ${file.mimeType}\n\nSupported types:\n- Text files (.txt)\n- Markdown files (.md)\n- Google Docs\n- PDF files (.pdf)`);
      return;
    }

    // Check if file is already open by comparing IDs
    const fileId = `drive-${file.id}`;
    const isAlreadyOpen = openFiles.some(openFile => openFile.id === fileId);
    
    if (isAlreadyOpen) {
      // File is already open, just call onFileOpen to switch to it
      // The parent component will handle switching to the already-open file
      const existingFile = openFiles.find(openFile => openFile.id === fileId);
      if (onFileOpen) {
        onFileOpen(existingFile);
      }
      return;
    }

    try {
      // Fetch file content only for newly opened files
      const response = await fetch(`/api/drive/files/${file.id}`);
      const data = await response.json();
      
      if (response.ok) {
        let cleanedContent = data.content;
        // Clean up excessive empty lines only for text/markdown/doc
        if (
          file.mimeType === 'text/plain' ||
          file.mimeType === 'text/markdown' ||
          file.mimeType === 'application/vnd.google-apps.document'
        ) {
          cleanedContent = cleanExcessiveEmptyLines(data.content);
        }

        // For PDFs, automatically process them to create summaries and extract metadata
        if (file.mimeType === 'application/pdf') {
          try {
            console.log(`Processing PDF: ${file.name}`);
            const processResponse = await fetch('/api/documents/process', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                fileId: fileId,
                content: data.content, // Base64 encoded PDF content
                mimeType: file.mimeType,
                filename: file.name,
                filePath: file.path || file.name // Include file path for graph analysis
              }),
            });

            if (processResponse.ok) {
              const processResult = await processResponse.json();
              console.log(`PDF processed successfully: ${file.name}`, processResult);
              
              // Add processing metadata to the file object
              file.processedData = processResult.data;
              file.summary = processResult.data.summary;
              file.metadata = processResult.data.metadata;
            } else {
              console.warn(`Failed to process PDF: ${file.name}`);
            }
          } catch (processError) {
            console.error(`Error processing PDF ${file.name}:`, processError);
          }
        }

        // Create a file object for the editor
        const editorFile = {
          id: fileId,
          name: file.name,
          type: 'file',
          content: cleanedContent,
          path: file.path,
          mimeType: file.mimeType,
          // Include processing data for PDFs
          processedData: file.processedData,
          summary: file.summary,
          metadata: file.metadata
        };
        
        // Call the parent's onFileOpen function
        if (onFileOpen) {
          onFileOpen(editorFile);
        }
      } else {
        setError('Failed to load file content');
      }
    } catch (error) {
      setError('Failed to load file content');
    }
  };

  // Function to clean up excessive empty lines
  const cleanExcessiveEmptyLines = (content) => {
    if (!content) return content;
    
    // Split content into lines
    const lines = content.split('\n');
    const cleanedLines = [];
    let consecutiveEmptyLines = 0;
    
    for (const line of lines) {
      const isEmpty = line.trim() === '';
      
      if (isEmpty) {
        consecutiveEmptyLines++;
        // Only add empty line if we haven't exceeded the limit (2)
        if (consecutiveEmptyLines <= 2) {
          cleanedLines.push(line);
        }
        // If we exceed 2, we skip adding this empty line
      } else {
        // Reset counter when we encounter a non-empty line
        consecutiveEmptyLines = 0;
        cleanedLines.push(line);
      }
    }
    
    return cleanedLines.join('\n');
  };

  return (
    <aside className="flex flex-col h-full bg-zinc-900/95 backdrop-blur-xl border-r border-zinc-700/50 transition-all duration-300 w-72">
      <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-700/50">
        <span className="text-sm font-semibold text-zinc-100">Drive Sync</span>
        <div className="flex items-center space-x-2">
          <button 
            onClick={checkConnection}
            className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded transition-colors"
            title="Check connection"
          >
            <RefreshCw size={16} />
          </button>
          <button onClick={collapsed} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded-lg transition-colors">
            <ChevronLeft size={20} />
          </button>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-auto">
        {!isConnected ? (
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">Connect to Google Drive to access your files.</p>
            <button
              onClick={connectToGoogleDrive}
              className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-sm text-white rounded transition-colors"
            >
              Connect Google Drive
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-green-400">● Connected</span>
                {folderStructure && (
                  <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                    Cached
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={fetchFiles}
                  disabled={loading}
                  className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded transition-colors"
                  title="Refresh files"
                >
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
                {folderStructure && (
                  <button
                    onClick={clearCache}
                    className="p-1 text-zinc-400 hover:text-red-400 hover:bg-zinc-700/50 rounded transition-colors"
                    title="Clear cache"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
            
            {error && <p className="text-sm text-red-400">{error}</p>}
            
            {loading ? (
              <p className="text-sm text-zinc-400">Loading files...</p>
            ) : (
              <div className="space-y-1">
                {!folderStructure ? (
                  <div className="space-y-3">
                    <p className="text-sm text-zinc-400">Click the button below to load your files.</p>
                    <button
                      onClick={fetchFiles}
                      className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-sm text-white rounded transition-colors"
                    >
                      Load Files
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center space-x-2 p-2 bg-zinc-800/50 rounded mb-2">
                      <Folder size={16} className="text-blue-400" />
                      <span className="text-sm font-medium text-zinc-200">{folderStructure.name}</span>
                    </div>
                    {folderStructure.children && folderStructure.children.length > 0 ? (
                      folderStructure.children.map((item) => (
                        <FolderItem
                          key={item.id}
                          item={item}
                          onDownload={downloadFile}
                          onFileOpen={handleFileOpen}
                        />
                      ))
                    ) : (
                      <p className="text-sm text-zinc-400 pl-4">No files or folders found.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-zinc-700/50">
        <input
          type="file"
          disabled
          className="w-full text-sm text-zinc-200 file:bg-zinc-700 file:text-zinc-100 file:rounded file:px-3 cursor-not-allowed opacity-50"
        />
      </div>
    </aside>
  );
}
