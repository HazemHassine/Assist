'use client';
import React, { useState, useMemo, useCallback } from 'react';
import ActivityBar from './ActivityBar';
import QuickActions from './QuickActions';
import DriveSync from './DriveSync';
import SettingsPanel from './SettingsPanel';
import Graph from './Graph';
import EditorHeader from './EditorHeader';
import MarkdownEditor from './MarkdownEditor';
import MarkdownPreview from './MarkdownPreview';
import AIChat from './AIChat';
import PDFPreview from './PDFPreview';

// Memoized editor components to prevent unnecessary rerenders
const MemoizedPDFEditor = React.memo(({ content, pdfContent, fileName }) => (
  <>
    <MarkdownEditor content={content} />
    <PDFPreview content={pdfContent} name={fileName} />
  </>
));

const MemoizedMarkdownEditor = React.memo(({ content, onChange }) => (
  <>
    <MarkdownEditor content={content} onChange={onChange} />
    <MarkdownPreview content={content} />
  </>
));

export default function HomeClient() {
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [openFiles, setOpenFiles] = useState([{ id: 1, name: 'README.md', type: 'file' }]);
  const [fileContents, setFileContents] = useState({ 1: '# Welcome to Assist...' });
  const [currentFileId, setCurrentFileId] = useState(1);
  const [activeTab, setActiveTab] = useState('sync');

  const collapsed = (id) => {
    if (activeTab === id) {
      setActiveTab('');
    } else {
      setActiveTab(id);
    }
  };

  // Memoize collapsed callbacks to prevent unnecessary rerenders
  const collapsedQuick = useCallback(() => collapsed('quick'), []);
  const collapsedSync = useCallback(() => collapsed('sync'), []);
  const collapsedGraph = useCallback(() => collapsed('graph'), []);
  const collapsedSettings = useCallback(() => collapsed('settings'), []);

  const openFile = (file) => {
    setOpenFiles(prev => prev.find(f => f.id === file.id) ? prev : [...prev, file]);
    setCurrentFileId(file.id);
    setFileContents(prev => ({ ...prev, [file.id]: prev[file.id] ?? '' }));
  };

  const openDriveFile = useCallback((driveFile) => {
    // Use functional state update to check for duplicates with current state
    setOpenFiles(prev => {
      // Check if file is already open
      const existingFile = prev.find(f => f.id === driveFile.id);
      if (existingFile) {
        // File already exists, just switch to it
        setCurrentFileId(driveFile.id);
        return prev; // Return same array to prevent re-render
      }

      // File doesn't exist, add it
      setCurrentFileId(driveFile.id);
      
      // Only set file content for newly opened files
      // For PDF files, initialize with empty content for note-taking
      // The PDF content will be used for preview only
      if (driveFile.mimeType === 'application/pdf') {
        setFileContents(prevContent => ({ 
          ...prevContent, 
          [driveFile.id]: `# Notes on ${driveFile.name}\n\n` // Helpful header for note-taking
        }));
      } else {
        // For non-PDF files, use the original content
        setFileContents(prevContent => ({ 
          ...prevContent, 
          [driveFile.id]: driveFile.content || '' 
        }));
      }
      
      return [...prev, driveFile];
    });
  }, []);

  const closeFile = (id) => {
    setOpenFiles(prev => {
      const remaining = prev.filter(f => f.id !== id);
      if (currentFileId === id) {
        setCurrentFileId(remaining.length ? remaining[remaining.length - 1].id : null);
      }
      return remaining;
    });
  };

  const updateContent = (content) => {
    setFileContents(prev => ({ ...prev, [currentFileId]: content }));
  };

  const memoizedUpdateContent = useCallback(updateContent, [currentFileId]);

  const currentFile = openFiles.find(f => f.id === currentFileId);
  const currentContent = fileContents[currentFileId] || '';

  // Memoize sidebar panels to prevent rerenders
  const sidebarPanels = useMemo(() => ({
    quick: activeTab === 'quick' && <QuickActions collapsed={collapsedQuick} />,
    sync: activeTab === 'sync' && <DriveSync collapsed={collapsedSync} onFileOpen={openDriveFile} openFiles={openFiles} />,
    graph: activeTab === 'graph' && <Graph collapsed={collapsedGraph} />,
    settings: activeTab === 'settings' && <SettingsPanel collapsed={collapsedSettings} />
  }), [activeTab, collapsedQuick, collapsedSync, collapsedGraph, collapsedSettings, openDriveFile, openFiles]);

  // Memoize the editor content to prevent rerenders
  const editorContent = useMemo(() => {
    if (currentFile && currentFile.mimeType === 'application/pdf') {
      return (
        <MemoizedPDFEditor 
          content={currentContent} 
          pdfContent={currentFile.content} 
          fileName={currentFile.name} 
        />
      );
    } else {
      return (
        <MemoizedMarkdownEditor 
          content={currentContent} 
          onChange={memoizedUpdateContent} 
        />
      );
    }
  }, [currentFile, currentContent, memoizedUpdateContent]);

  return (
    <div className="h-screen flex overflow-hidden text-zinc-100 bg-gradient-to-br from-zinc-900 to-zinc-800">
      <ActivityBar collapsed={collapsed} activeTab={activeTab} onTabSelect={setActiveTab} />

      {sidebarPanels.quick}
      {sidebarPanels.sync}
      {sidebarPanels.graph}
      {sidebarPanels.settings}

      <div className="flex-1 flex flex-col min-w-0">
        <EditorHeader
          openFiles={openFiles}
          currentFileId={currentFileId}
          onTabSelect={setCurrentFileId}
          onCloseTab={closeFile}
          onAIToggle={() => setAiChatOpen(prev => !prev)}
          aiOpen={aiChatOpen}
        />
        <div className="flex-1 flex min-h-0">
          {editorContent}
        </div>
      </div>

      {/* AI Chat as overlay */}
      {aiChatOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setAiChatOpen(false)}
          />
          {/* AI Chat Panel */}
          <div className="fixed top-0 right-0 h-full z-50">
            <AIChat isOpen={aiChatOpen} onClose={() => setAiChatOpen(false)} currentContent={currentContent} />
          </div>
        </>
      )}
    </div>
  );
} 