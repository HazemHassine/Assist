'use client';
import React, { useState } from 'react';
import ActivityBar from './ActivityBar';
import QuickActions from './QuickActions';
import DriveSync from './DriveSync';
import SettingsPanel from './SettingsPanel';
import EditorHeader from './EditorHeader';
import MarkdownEditor from './MarkdownEditor';
import MarkdownPreview from './MarkdownPreview';
import AIChat from './AIChat';
import PDFPreview from './PDFPreview';

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

  const openFile = (file) => {
    setOpenFiles(prev => prev.find(f => f.id === file.id) ? prev : [...prev, file]);
    setCurrentFileId(file.id);
    setFileContents(prev => ({ ...prev, [file.id]: prev[file.id] ?? '' }));
  };

  const openDriveFile = (driveFile) => {
    // Check if file is already open
    const existingFile = openFiles.find(f => f.id === driveFile.id);
    if (existingFile) {
      setCurrentFileId(driveFile.id);
      return;
    }

    // Add the file to open files
    setOpenFiles(prev => [...prev, driveFile]);
    setCurrentFileId(driveFile.id);
    
    // Set the file content
    setFileContents(prev => ({ 
      ...prev, 
      [driveFile.id]: driveFile.content || '' 
    }));
  };

  const closeFile = (id) => {
    setOpenFiles(prev => prev.filter(f => f.id !== id));
    if (currentFileId === id) {
      const remaining = openFiles.filter(f => f.id !== id);
      setCurrentFileId(remaining.length ? remaining[remaining.length - 1].id : null);
    }
  };

  const updateContent = (content) => {
    setFileContents(prev => ({ ...prev, [currentFileId]: content }));
  };

  const currentFile = openFiles.find(f => f.id === currentFileId);
  const currentContent = fileContents[currentFileId] || '';

  return (
    <div className="h-screen flex overflow-hidden text-zinc-100 bg-gradient-to-br from-zinc-900 to-zinc-800">
      <ActivityBar collapsed={collapsed} activeTab={activeTab} onTabSelect={setActiveTab} />

      {activeTab === 'quick' && <QuickActions collapsed={() => collapsed('quick')} />}
      {activeTab === 'sync' && <DriveSync collapsed={() => collapsed('sync')} onFileOpen={openDriveFile} />}
      {activeTab === 'settings' && <SettingsPanel collapsed={() => collapsed('settings')} />}

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
          {currentFile && currentFile.mimeType === 'application/pdf' ? (
            <PDFPreview content={currentContent} name={currentFile.name} />
          ) : (
            <>
              <MarkdownEditor content={currentContent} onChange={updateContent} />
              <MarkdownPreview content={currentContent} />
            </>
          )}
        </div>
      </div>

      {aiChatOpen && <AIChat isOpen={aiChatOpen} onClose={() => setAiChatOpen(false)} currentContent={currentContent} />}
    </div>
  );
} 