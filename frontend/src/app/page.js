"use client"

import { useState, useCallback, useEffect } from "react"
import { FileExplorer } from "@/components/file-explorer"
import FileEditor from "@/components/file-editor"
import { MarkdownPreview } from "@/components/markdown-preview"
import { Button } from "@/components/ui/button"
import { FolderOpen } from "lucide-react"
import { ToastContainer, toast, Bounce } from 'react-toastify';

// Helper to encode full paths correctly (encode segments but keep slashes)
const encodePath = (path) =>
  path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")

export default function Home() {
  const [files, setFiles] = useState([])
  const [currentFile, setCurrentFile] = useState(null)
  const [content, setContent] = useState("")

  // Load file list from backend API
  const loadFiles = async () => {
    try {
      const res = await fetch("http://localhost:8000/files")
      if (!res.ok) throw new Error("Failed to fetch files")
      const data = await res.json()
      setFiles(data.files || ["test.md", "example.md"]) // fallback
    } catch (error) {
      console.error("Failed to load files", error)
      setFiles([])
    }
  }

  // Load content of a selected file
  const openFile = async (filePath) => {
    try {
      const res = await fetch(`http://localhost:8000/files/${encodePath(filePath)}`)
      console.log(res)
      if (!res.ok) throw new Error("Failed to fetch file content")
      const data = await res.json()
      setCurrentFile({ name: filePath })
      setContent(data.content)
    } catch (error) {
      console.error("Failed to open file", error)
      setCurrentFile(null)
      setContent("")
    }
  }

  // Save content back to backend API
  const saveFile = async () => {
    if (!currentFile) return

    try {
      const res = await fetch(`http://localhost:8000/files/${encodePath(currentFile.name)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) throw new Error("Failed to save file")
      toast.success("File saved successfully!", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Bounce
      })
    } catch (error) {
      console.error("Failed to save file", error)
      toast.error("Failed to save file", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Bounce
      })
    }
  }

  useEffect(() => {
    loadFiles()
  }, [])

  const handleKeyDown = useCallback(
    (event) => {
      if (event.ctrlKey && (event.key === "s" || event.key === "S")) {
        event.preventDefault()
        saveFile()
      }
    },
    [content, currentFile],
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleKeyDown])

  return (
    <div className="h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Header */}
      <ToastContainer />
      <div className="border-b border-gray-800 p-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Assist</h1>
        <Button
          onClick={loadFiles}
          variant="outline"
          className="bg-gray-900 border-gray-700 hover:bg-gray-800"
          title="Reload file list from backend"
        >
          <FolderOpen className="w-4 h-4 mr-2" />
          Reload Files
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer */}
        <div className="w-80 border-r border-gray-800 bg-gray-950">
          <FileExplorer
            files={files}
            directoryHandle={null} // not used in backend mode
            onFileSelect={openFile}
            onDirectoryLoad={() => { }} // no-op
          />
        </div>

        {/* Editor and Preview */}
        <div className="flex-1 flex">
          <div className="flex-1 border-r border-gray-800">
            <FileEditor content={content} onChange={setContent} fileName={currentFile?.name || "Untitled"} />
          </div>

          <div className="flex-1">
            <MarkdownPreview content={content} />
          </div>
        </div>
      </div>
    </div>
  )
}
