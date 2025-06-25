import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MarkdownPreview = ({ content }) => {
  return (
    <div className="flex-1 bg-zinc-950 border-l border-zinc-700/50 flex flex-col">
      <div className="h-11 bg-zinc-900/60 border-b border-zinc-700/50 flex items-center px-5">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Preview</span>
      </div>
      <div className="h-[calc(100%-44px)] p-5 overflow-y-auto prose prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  );
};

export default MarkdownPreview;
