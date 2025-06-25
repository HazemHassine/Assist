import React from 'react'

import { 
  FileText, 
  Folder, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  Bot,
  X,
  Send,
  User
} from 'lucide-react';


function EditorHeader({ activeFile, onAIToggle, aiOpen }) {
  return (
    <div className="h-14 bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-700/50 flex items-center px-6 gap-4">
      {/* File Tabs */}
      <div className="flex gap-2">
        {activeFile && (
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/20">
            <FileText size={14} />
            <span className="text-sm">{activeFile.name}</span>
          </div>
        )}
      </div>

      {/* AI Toggle */}
      <button
        onClick={onAIToggle}
        className={`ml-auto flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
          aiOpen 
            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/20' 
            : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg hover:shadow-blue-500/25'
        }`}
      >
        <Bot size={16} />
        <span className="text-sm font-medium">AI Assistant</span>
      </button>
    </div>
  );
};

export default EditorHeader