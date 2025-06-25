"use client";
import React, { useState, useEffect } from 'react';
import { ChevronLeft, FileText, Folder, FolderOpen, Download, RefreshCw, ChevronRight } from 'lucide-react';

// Recursive component to render folder structure
const FolderItem = ({ item, level = 0, onDownload }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    onDownload(item.id, item.name);
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
      className="flex items-center justify-between p-2 hover:bg-zinc-700/50 transition-colors"
      style={{ paddingLeft: `${level * 16 + 8}px` }}
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
 */
export default function DriveSync({ collapsed }) {
  const [folderStructure, setFolderStructure] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);

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

  useEffect(() => {
    // Only check connection status, don't load files automatically
    const checkConnectionStatus = async () => {
      try {
        const response = await fetch('/api/drive/files');
        if (response.ok) {
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      } catch (error) {
        setIsConnected(false);
      }
    };
    
    checkConnectionStatus();
  }, []);

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
              <span className="text-sm text-green-400">● Connected</span>
              <button
                onClick={fetchFiles}
                disabled={loading}
                className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded transition-colors"
                title="Refresh files"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
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
