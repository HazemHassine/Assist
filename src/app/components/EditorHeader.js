import React from 'react';
import { FileText, Bot, X } from 'lucide-react';

function EditorHeader({ openFiles, currentFileId, onTabSelect, onCloseTab, onAIToggle, aiOpen }) {
  return (
    <div className="h-14 bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-700/50 flex items-center px-4 gap-2">
      {/* File tabs */}
      <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar">
        {openFiles.map(file => (
          <div
            key={file.id}
            onClick={() => onTabSelect(file.id)}
            className={`flex items-center px-4 py-2 cursor-pointer transition-all relative whitespace-nowrap ${
              currentFileId === file.id
                ? 'bg-zinc-800 text-white font-semibold border-b-4 border-blue-500' // highlighted underline
                : 'bg-zinc-700/50 text-zinc-300 hover:bg-zinc-700/75 hover:text-white'
            }`}
          >
            <FileText
              size={16}
              className={`${currentFileId === file.id ? 'text-blue-400' : 'text-zinc-300'}`}
            />
            <span className="ml-2 text-sm">{file.name}</span>
            <button
              onClick={e => { e.stopPropagation(); onCloseTab(file.id); }}
              className="ml-2 p-1 rounded hover:bg-zinc-700/75 hover:text-red-500 transition-colors"
              aria-label={`Close ${file.name}`}
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>

      {/* AI Assistant toggle */}
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
}

export default EditorHeader;