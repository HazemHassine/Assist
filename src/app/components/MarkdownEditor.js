import React from 'react'
import dynamic from 'next/dynamic'

const Editor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.default),
  { ssr: false }
)

function MarkdownEditor({ content, onChange }) {
  const options = {
    selectOnLineNumbers: true,
    automaticLayout: true,
    wordWrap: 'on',
    minimap: { enabled: false },
  }

  return (
    <div className="flex-1 bg-zinc-950 flex flex-col">
      <div className="h-11 bg-zinc-900/60 border-b border-zinc-700/50 flex items-center px-5">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          Editor
        </span>
      </div>
      <Editor
        height="calc(100% - 44px)"
        defaultLanguage="markdown"
        theme="vs-dark"
        options={options}
        value={content}              
        onChange={(val) => onChange(val || '')}
      />
    </div>
  )
}

export default MarkdownEditor
