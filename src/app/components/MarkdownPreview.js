import React from "react";


const MarkdownPreview = ({ content }) => {
  const renderMarkdown = (text) => {
    if (!text) return '';
    
    return text
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-white mb-4">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold text-zinc-100 mb-3 mt-6">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium text-zinc-200 mb-2 mt-4">$1</h3>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold text-white">$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>')
      .replace(/```([\s\S]*?)```/gim, '<pre class="bg-zinc-800/50 p-4 rounded-lg my-4 overflow-x-auto"><code class="text-sm font-mono text-zinc-300">$1</code></pre>')
      .replace(/`([^`]+)`/gim, '<code class="bg-zinc-700/50 px-2 py-1 rounded text-sm font-mono text-zinc-300">$1</code>')
      .replace(/^- (.*$)/gim, '<li class="ml-4 mb-1">$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 mb-1">$1</li>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-blue-400 hover:text-blue-300 underline">$1</a>')
      .replace(/\n\n/gim, '</p><p class="mb-4">')
      .replace(/\n/gim, '<br>')
      .replace(/^/, '<p class="mb-4">')
      .replace(/$/, '</p>')
      .replace(/<p class="mb-4"><\/p>/g, '');
  };

  return (
    <div className="flex-1 bg-zinc-950 border-l border-zinc-700/50">
      <div className="h-11 bg-zinc-900/60 border-b border-zinc-700/50 flex items-center px-5">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Preview</span>
      </div>
      <div 
        className="h-[calc(100%-44px)] p-5 overflow-y-auto text-zinc-300 leading-relaxed prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
      />
    </div>
  );
};
export default MarkdownPreview;