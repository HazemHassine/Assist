'use client';
import React, { useState } from 'react';
import ActivityBar from './components/ActivityBar';
import FileExplorer from './components/FileExplorer';
import QuickActions from './components/QuickActions';
import DriveSync from './components/DriveSync';
import SettingsPanel from './components/SettingsPanel';
import EditorHeader from './components/EditorHeader';
import MarkdownEditor from './components/MarkdownEditor';
import MarkdownPreview from './components/MarkdownPreview';
import AIChat from './components/AIChat';

export default function Home() {
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [activeFile, setActiveFile] = useState({ id: 1, name: 'README.md', type: 'file' });
  const [activeTab, setActiveTab] = useState('explorer');
  const [markdownContent, setMarkdownContent] = useState('# Welcome to Assist...');

const collapsed = (id) => {
  if (activeTab === id) {
    // clicked the same tab → collapse
    setActiveTab('');
  } else {
    // clicked a different (or no) tab → open that one
    setActiveTab(id);
  }
};


  return (
    <div className="h-screen flex overflow-hidden text-zinc-100 bg-gradient-to-br from-zinc-900 to-zinc-800">
      <ActivityBar
        collapsed={collapsed}
        activeTab={activeTab}
        onTabSelect={setActiveTab}
      />
  
      {/* Dynamic panels */}
      {activeTab === 'explorer' && (
        <FileExplorer
          collapsed={collapsed}
          activeFile={activeFile}
          onFileSelect={setActiveFile}
        />
      )}
      {activeTab === 'quick' && <QuickActions collapsed={collapsed}/>}
      {activeTab === 'sync' && <DriveSync collapsed={collapsed}/>}
      {activeTab === 'settings' && <SettingsPanel collapsed={collapsed}/>}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <EditorHeader
          activeFile={activeFile}
          onAIToggle={() => setAiChatOpen(prev => !prev)}
          aiOpen={aiChatOpen}
        />
        <div className="flex-1 flex">
          <MarkdownEditor content={markdownContent} onChange={setMarkdownContent} />
          <MarkdownPreview content={markdownContent} />
        </div>
      </div>

      {aiChatOpen && <AIChat isOpen={aiChatOpen} onClose={() => setAiChatOpen(false)} currentContent={markdownContent} />}
    </div>
  );
}
