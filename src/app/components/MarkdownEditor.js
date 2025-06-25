import React from 'react'


function MarkdownEditor({ content, onChange }) {
  return (
    <div className="flex-1 bg-zinc-950">
      <div className="h-11 bg-zinc-900/60 border-b border-zinc-700/50 flex items-center px-5">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Editor</span>
      </div>
      <textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-[calc(100%-44px)] bg-transparent text-zinc-100 font-mono text-sm leading-relaxed p-5 resize-none outline-none placeholder-zinc-500"
        placeholder="Start writing your markdown..."
      />
    </div>
  );
};

export default MarkdownEditor