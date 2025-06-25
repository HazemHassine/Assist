'use client';
import React, { useState } from 'react';
import ActivityBar from './ActivityBar';
import FileExplorer from './FileExplorer';
import QuickActions from './QuickActions';
import DriveSync from './DriveSync';
import SettingsPanel from './SettingsPanel';
import EditorHeader from './EditorHeader';
import MarkdownEditor from './MarkdownEditor';
import MarkdownPreview from './MarkdownPreview';
import AIChat from './AIChat';

export default function HomeClient() {
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [openFiles, setOpenFiles] = useState([{ id: 1, name: 'README.md', type: 'file' }]);
  const [fileContents, setFileContents] = useState({ 1: '# Welcome to Assist...' });
  const [currentFileId, setCurrentFileId] = useState(1);
  const [activeTab, setActiveTab] = useState('explorer');

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

  const currentContent = fileContents[currentFileId] || '';

  return (
    <div className="h-screen flex overflow-hidden text-zinc-100 bg-gradient-to-br from-zinc-900 to-zinc-800">
      <ActivityBar collapsed={collapsed} activeTab={activeTab} onTabSelect={setActiveTab} />

      {activeTab === 'explorer' && (
        <FileExplorer
          collapsed={() => collapsed('explorer')}
          activeFileId={currentFileId}
          onFileSelect={openFile}
        />
      )}
      {activeTab === 'quick' && <QuickActions collapsed={() => collapsed('quick')} />}
      {activeTab === 'sync' && <DriveSync collapsed={() => collapsed('sync')} />}
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
        <div className="flex-1 flex">
          <MarkdownEditor content={currentContent} onChange={updateContent} />
          <MarkdownPreview content={currentContent} />
        </div>
      </div>

      {aiChatOpen && <AIChat isOpen={aiChatOpen} onClose={() => setAiChatOpen(false)} currentContent={currentContent} />}
    </div>
  );
} 