import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkBreaks from 'remark-breaks';
import remarkEmoji from 'remark-emoji';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const MarkdownPreview = ({ content }) => (
  <div className="flex-1 flex flex-col min-h-0 bg-zinc-950 border-l border-zinc-700/50">
    <div className="h-11 bg-zinc-900/60 border-b border-zinc-700/50 flex items-center px-5 flex-shrink-0">
      <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Preview</span>
    </div>
    <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
      <div className="p-5">
        <ReactMarkdown
          remarkPlugins={[
            remarkGfm,
            remarkMath,
            remarkBreaks,
            remarkEmoji,
          ]}
          rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeKatex]}
          components={{
            // Headings
            h1: ({node, ...props}) => <h1 className="text-3xl font-bold mt-6 mb-3 text-white" {...props} />, 
            h2: ({node, ...props}) => <h2 className="text-2xl font-semibold mt-5 mb-2 text-white" {...props} />, 
            h3: ({node, ...props}) => <h3 className="text-xl font-semibold mt-4 mb-2 text-white" {...props} />, 
            // Paragraphs
            p: ({node, ...props}) => <p className="mb-4 leading-relaxed text-zinc-200" {...props} />, 
            // Links
            a: ({node, ...props}) => <a className="text-blue-400 hover:underline" {...props} />, 
            // Lists
            ul: ({ node, ...props }) => (
              <ul className="ml-5 mb-4 space-y-1 list-disc list-inside marker:text-zinc-400 marker:text-base" {...props} />
            ),
            ol: ({ node, ...props }) => (
              <ol className="ml-5 mb-4 space-y-1 list-decimal list-inside marker:text-zinc-400 marker:text-base" {...props} />
            ),
            li: ({ node, checked, ...props }) => {
              if (checked === null || checked === undefined) {
                // regular list item or nested
                return <li className="mb-2" {...props} />;
              }
              // checklist item
              return (
                <li className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={checked}
                    readOnly
                    className="mr-2 w-4 h-4 text-blue-600 bg-zinc-800 border-zinc-600 rounded"
                  />
                  <span {...props} />
                </li>
              );
            },
            // Blockquotes
            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-zinc-700 pl-4 italic my-4 text-zinc-300" {...props} />, 
            // Tables
            table: ({node, ...props}) => <table className="min-w-full mb-4 table-auto border-collapse" {...props} />, 
            thead: ({node, ...props}) => <thead className="bg-zinc-800" {...props} />, 
            tbody: ({node, ...props}) => <tbody {...props} />, 
            tr: ({node, isHeader, ...props}) => <tr className="border-b border-zinc-700 last:border-none" {...props} />, 
            th: ({node, ...props}) => <th className="px-3 py-2 text-left text-sm font-semibold text-white" {...props} />, 
            td: ({node, isHeader, ...props}) => <td className="px-3 py-2 text-sm text-zinc-200" {...props} />, 
            // Horizontal rule
            hr: () => <hr className="my-6 border-zinc-700" />, 
            // Images
            img: ({node, ...props}) => <img className="max-w-full mx-auto my-4 rounded" {...props} />, 
            // Code blocks and inline code
            code({node, inline, className, children, ...props}){
              return inline ? (
                <code className="bg-zinc-800 px-1 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>
              ) : (
                <pre className="bg-zinc-900 p-4 rounded my-4 overflow-x-auto"><code className={className} {...props}>{children}</code></pre>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  </div>
);

export default MarkdownPreview;
