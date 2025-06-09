"use client";

import { useState, useEffect, useRef } from "react";
import { Editor } from "@monaco-editor/react";
import { Save } from "lucide-react";

export default function FileEditor({ content, onChange, fileName, onRename }) {
  const editorRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState(
    fileName === "Untitled" ? "Untitled" : fileName.split("/").pop()
  );
  const inputRef = useRef(null);

  useEffect(() => {
    setEditingName(
      fileName === "Untitled" ? "Untitled" : fileName.split("/").pop()
    );
  }, [fileName]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const finish = (save) => {
    setIsEditing(false);
    if (fileName === "Untitled") return; // Do nothing if no file is selected
    const original = fileName.split("/").pop();
    if (save && editingName && editingName !== original) {
      onRename(editingName);
    } else {
      setEditingName(original);
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter") finish(true);
    if (e.key === "Escape") finish(false);
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
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
    });
    monaco.editor.setTheme("obsidian-dark");
  };

  return (
    <div className="h-full flex flex-col bg-slate-900">
      <div className="border-b border-gray-800 p-3 flex items-center justify-between bg-slate-900">
        {fileName === "Untitled" ? (
          <div className="ml-4 text-sm text-gray-400">
            Select a file to start editing
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {isEditing ? (
              <input
                ref={inputRef}
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={() => finish(true)}
                onKeyDown={onKey}
                className="ml-4 text-sm bg-slate-800 text-gray-200 truncate max-w-xs"
              />
            ) : (
              <span
                onClick={() => setIsEditing(true)}
                className="ml-4 text-sm text-gray-400 truncate max-w-xs cursor-text"
              >
                {editingName}
              </span>
            )}
          </div>
        )}
        {fileName !== "Untitled" && (
          <div className="flex items-center gap-2 text-xs text-gray-500 select-none">
            <Save className="w-3 h-3" />
            <span>Ctrl+S to save</span>
          </div>
        )}
      </div>
      <div className="flex-1">
        {fileName === "Untitled" ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              color: "#9CA3AF", // Equivalent to text-gray-400
              fontSize: "1.125rem", // Equivalent to text-lg
            }}
          >
            No file selected. Please choose a file from the explorer.
          </div>
        ) : (
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
        ) {/* This closes the false case of the ternary operator */}
      </div>
    </div>
  );
}
