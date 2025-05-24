"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"

export function MarkdownPreview({ content }) {
  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Preview Header */}
      <div className="border-b border-gray-800 p-3 bg-gray-900">
        <span className="text-sm text-gray-400">Preview</span>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-none prose prose-invert prose-gray">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "")
                return !inline && match ? (
                  <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" className="rounded-lg" {...props}>
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                ) : (
                  <code className="bg-gray-800 px-1 py-0.5 rounded text-sm" {...props}>
                    {children}
                  </code>
                )
              },
              h1: ({ children }) => (
                <h1 className="text-3xl font-bold text-gray-100 mb-6 pb-2 border-b border-gray-700">{children}</h1>
              ),
              h2: ({ children }) => <h2 className="text-2xl font-semibold text-gray-100 mb-4 mt-8">{children}</h2>,
              h3: ({ children }) => <h3 className="text-xl font-semibold text-gray-200 mb-3 mt-6">{children}</h3>,
              p: ({ children }) => <p className="text-gray-300 mb-4 leading-relaxed">{children}</p>,
              ul: ({ children }) => <ul className="text-gray-300 mb-4 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="text-gray-300 mb-4 space-y-1">{children}</ol>,
              li: ({ children }) => <li className="ml-4">{children}</li>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-gray-800 rounded-r-lg">
                  {children}
                </blockquote>
              ),
              a: ({ children, href }) => (
                <a
                  href={href}
                  className="text-blue-400 hover:text-blue-300 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto mb-4">
                  <table className="min-w-full border border-gray-700 rounded-lg">{children}</table>
                </div>
              ),
              th: ({ children }) => (
                <th className="border border-gray-700 px-4 py-2 bg-gray-800 text-gray-200 font-semibold text-left">
                  {children}
                </th>
              ),
              td: ({ children }) => <td className="border border-gray-700 px-4 py-2 text-gray-300">{children}</td>,
            }}
          >
            {content || "*Start typing to see preview...*"}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
