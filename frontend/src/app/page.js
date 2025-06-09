"use client"

import { useState, useCallback, useEffect } from "react"
import { FileExplorer } from "@/components/file-explorer"
import FileEditor from "@/components/file-editor"
import { MarkdownPreview } from "@/components/markdown-preview"
import { Button } from "@/components/ui/button"
import { FolderOpen } from "lucide-react"
import { ToastContainer, toast, Bounce } from 'react-toastify'

const encodePath = (path) =>
  path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")

export default function Home() {
  const [files, setFiles] = useState([])
  const [currentFileName, setCurrentFileName] = useState("")
  const [content, setContent] = useState("")

  const loadFiles = async () => {
    try {
      const res = await fetch("/api/files")
      if (!res.ok) throw new Error("Failed to fetch files")
      const data = await res.json()
      setFiles(data.files || [])
    } catch {
      setFiles([])
    }
  }

  const openFile = async (filePath) => {
    try {
      const res = await fetch(`/api/files/${encodePath(filePath)}`)
      if (!res.ok) throw new Error("Failed to fetch file")
      const data = await res.json()
      setCurrentFileName(filePath)
      setContent(data.content)
    } catch {
      setCurrentFileName("")
      setContent("")
      toast.error("Failed to open file", { position: "top-right", theme: "dark", transition: Bounce })
    }
  }

  const saveFile = async () => {
    if (!currentFileName) return
    try {
      const res = await fetch(`/api/files/${encodePath(currentFileName)}`, {
        method: "PUT",
        headers: { "Content-Type": "text/plain" },
        body: content,
      })
      if (!res.ok) throw new Error("Failed to save file")
      toast.success("File saved!", { position: "top-right", theme: "dark", transition: Bounce })
    } catch {
      toast.error("Failed to save file", { position: "top-right", theme: "dark", transition: Bounce })
    }
  }

  const handleRename = async (newName) => {
    if (!currentFileName || newName === currentFileName) return
    try {
      const res = await fetch(`/api/files/${encodePath(currentFileName)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newName }),
      })
      if (!res.ok) throw new Error("Rename failed")
      setCurrentFileName(newName)
      loadFiles()
      toast.success("File renamed!", { position: "top-right", theme: "dark", transition: Bounce })
    } catch {
      toast.error("Failed to rename file", { position: "top-right", theme: "dark", transition: Bounce })
    }
  }

  const handleKeyDown = useCallback(
    (event) => {
      if (event.ctrlKey && (event.key === "s" || event.key === "S")) {
        event.preventDefault()
        saveFile()
      }
    },
    [content, currentFileName]
  )

  useEffect(() => {
    loadFiles()
  }, [])

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="h-screen bg-gray-950 text-gray-100 flex flex-col">
      <ToastContainer />
      <div className="border-b border-gray-800 p-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Assist</h1>
        <Button onClick={loadFiles} variant="outline" className="bg-gray-900 border-gray-700 hover:bg-gray-800">
          <FolderOpen className="w-4 h-4 mr-2" />
          Reload Files
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 border-r border-gray-800 bg-gray-950">
          <FileExplorer files={files} onFileSelect={openFile} />
        </div>

        <div className="flex-1 flex">
          <div className="flex-1 border-r border-gray-800">
            <FileEditor
              content={content}
              onChange={setContent}
              fileName={currentFileName || "Untitled"}
              onRename={handleRename}
            />
          </div>
          <div className="flex-1">
            <MarkdownPreview content={content} />
          </div>
        </div>
      </div>
    </div>
  )
}
