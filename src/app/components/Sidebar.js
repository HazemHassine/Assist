import React from 'react';
import { 
  FileText, 
  Folder, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
} from 'lucide-react';


// Sidebar Component
const Sidebar = ({ isCollapsed, onToggle, activeFile, onFileSelect, user }) => {
  const files = [
    { id: 1, name: 'README.md', type: 'file' },
    { id: 2, name: 'project-notes.md', type: 'file' },
    { id: 3, name: 'documentation.md', type: 'file' },
    { id: 4, name: 'drafts', type: 'folder' },
    { id: 5, name: 'api-guide.md', type: 'file' },
  ];

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-72'} transition-all duration-300 bg-zinc-900/95 backdrop-blur-xl border-r border-zinc-700/50 flex flex-col h-full`}>
      {/* Header */}
      <div className="p-4 border-b border-zinc-700/50 flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
          DM
        </div>
        {!isCollapsed && <span className="text-lg font-semibold text-white">DocuMind</span>}
        <button
          onClick={onToggle}
          className="ml-auto p-2 hover:bg-zinc-700/50 rounded-lg transition-colors text-zinc-400 hover:text-white"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* File Explorer */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {files.map((file) => (
            <button
              key={file.id}
              onClick={() => onFileSelect(file)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                activeFile?.id === file.id 
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' 
                  : 'hover:bg-zinc-700/50 text-zinc-300 hover:text-white'
              }`}
            >
              {file.type === 'folder' ? <Folder size={16} /> : <FileText size={16} />}
              {!isCollapsed && <span className="text-sm">{file.name}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-zinc-700/50 flex items-center gap-3">
        <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
          {user.name.split(' ').map(n => n[0]).join('')}
        </div>
        {!isCollapsed && (
          <div className="flex-1">
            <div className="text-sm font-medium text-white">{user.name}</div>
            <div className="text-xs text-zinc-400">{user.email}</div>
          </div>
        )}
        <button className="p-2 hover:bg-zinc-700/50 rounded-lg transition-colors text-zinc-400 hover:text-white">
          <Settings size={16} />
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 