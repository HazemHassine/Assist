'use client';
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import EditorHeader from './components/EditorHeader';
import MarkdownEditor from './components/MarkdownEditor';
import MarkdownPreview from './components/MarkdownPreview';
import AIChat from './components/AIChat';


export default function Home() {
const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [activeFile, setActiveFile] = useState({ id: 1, name: 'README.md', type: 'file' });
  const [markdownContent, setMarkdownContent] = useState(`# Welcome to DocuMind

This is a powerful markdown editor with integrated AI assistance.

## Features

- **Real-time Preview**: See your markdown rendered instantly
- **AI Integration**: Ask questions about your documents  
- **File Management**: Organize your documents easily
- **Syntax Highlighting**: Clean, readable code blocks

## Getting Started

Simply start typing your markdown content. The preview will update automatically.

You can use the AI assistant to:
- Get help with markdown syntax
- Improve your writing
- Generate content ideas
- Review and edit your documents

\`\`\`javascript
// Example code block
function greetUser(name) {
    return \`Hello, \${name}! Welcome to DocuMind.\`;
}
\`\`\`

Happy writing! 🚀`);

  const user = {
    name: 'John Doe',
    email: 'john@example.com'
  };

  return (
    <div className="h-screen bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 text-zinc-100 flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeFile={activeFile}
        onFileSelect={setActiveFile}
        user={user}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <EditorHeader
          activeFile={activeFile}
          onAIToggle={() => setAiChatOpen(!aiChatOpen)}
          aiOpen={aiChatOpen}
        />

        {/* Editor Container */}
        <div className="flex-1 flex">
          <MarkdownEditor
            content={markdownContent}
            onChange={setMarkdownContent}
          />
          <MarkdownPreview content={markdownContent} />
        </div>
      </div>

      {/* AI Chat */}
      {aiChatOpen && (
        <AIChat
          isOpen={aiChatOpen}
          onClose={() => setAiChatOpen(false)}
          currentContent={markdownContent}
        />
      )}
    </div>
  );
};