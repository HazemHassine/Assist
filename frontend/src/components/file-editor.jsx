"use client"

import { useRef } from "react"
import { Editor } from "@monaco-editor/react"
import { Save } from "lucide-react"

export default function FileEditor({ content, onChange, fileName }) {
  const editorRef = useRef(null)

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor

    // Define a dark theme for Monaco Editor
    monaco.editor.defineTheme("obsidian-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6B7280" },
        { token: "keyword", foreground: "8B5CF6" },
        { token: "string", foreground: "10B981" },
        { token: "number", foreground: "F59E0B" },
      ],
      colors: {
        "editor.background": "#0F172A",
        "editor.foreground": "#F1F5F9",
        "editorLineNumber.foreground": "#475569",
        "editor.selectionBackground": "#334155",
        "editor.lineHighlightBackground": "#1E293B",
      },
    })

    monaco.editor.setTheme("obsidian-dark")
  }

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Header */}
      <div className="border-b border-gray-800 p-3 flex items-center justify-between bg-slate-900">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="ml-4 text-sm text-gray-400 truncate max-w-xs">{fileName}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 select-none">
          <Save className="w-3 h-3" />
          <span>Ctrl+S to save</span>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage="markdown"
          value={content}
          onChange={(value) => onChange(value || "")}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineHeight: 1.6,
            padding: { top: 16, bottom: 16 },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            lineNumbers: "on",
            glyphMargin: false,
            folding: true,
            lineDecorationsWidth: 0,
            lineNumbersMinChars: 3,
            renderLineHighlight: "line",
            scrollbar: {
              vertical: "auto",
              horizontal: "auto",
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
          }}
        />
      </div>
    </div>
  )
}
