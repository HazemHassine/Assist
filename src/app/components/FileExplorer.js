import React from 'react';
import { FileText, Folder, ChevronRight } from 'lucide-react';

const FileExplorer = ({ collapsed, activeFileId, onFileSelect }) => {
  const files = [
    { id: 1, name: 'README.md', type: 'file' },
    { id: 2, name: 'project-notes.md', type: 'file' },
    { id: 3, name: 'documentation.md', type: 'file' },
    { id: 4, name: 'drafts', type: 'folder' },
    { id: 5, name: 'api-guide.md', type: 'file' },
  ];

  return (
    <aside className="flex flex-col h-full bg-zinc-900/95 backdrop-blur-xl border-r border-zinc-700/50 transition-all duration-300 w-72">
      <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-700/50">
        <span className="text-sm font-semibold text-zinc-100">File Explorer</span>
        <button onClick={collapsed} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded-lg transition-colors">
          <ChevronRight size={20} className="rotate-180" />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {files.map(file => (
          <button
            key={file.id}
            onClick={() => onFileSelect(file)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
              activeFileId === file.id
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20'
                : 'hover:bg-zinc-700/50 text-zinc-300 hover:text-white'
            }`}
          >
            {file.type === 'folder' ? <Folder size={16} /> : <FileText size={16} />}
            <span className="text-sm">{file.name}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default FileExplorer;
