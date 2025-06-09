"use client"

import { useState, useCallback, useEffect } from "react"
import { FileExplorer } from "@/components/file-explorer"
import FileEditor from "@/components/file-editor"
import { MarkdownPreview } from "@/components/markdown-preview"
import { Button } from "@/components/ui/button"
import { FolderOpen, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { ToastContainer, toast, Bounce } from 'react-toastify'
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"

const encodePath = (path) =>
  path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")

export default function Home() {
  const [files, setFiles] = useState([])
  const [currentFileName, setCurrentFileName] = useState("")
  const [content, setContent] = useState("")
  const [isFileExplorerVisible, setIsFileExplorerVisible] = useState(true)

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
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setIsFileExplorerVisible(!isFileExplorerVisible)}
            variant="outline"
            size="icon"
            className="bg-gray-900 border-gray-700 hover:bg-gray-800"
          >
            {isFileExplorerVisible ? (
              <PanelLeftClose className="w-5 h-5" />
            ) : (
              <PanelLeftOpen className="w-5 h-5" />
            )}
          </Button>
          <h1 className="text-xl font-semibold">Assist</h1>
        </div>
        <Button onClick={loadFiles} variant="outline" className="bg-gray-900 border-gray-700 hover:bg-gray-800">
          <FolderOpen className="w-4 h-4 mr-2" />
          Reload Files
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <PanelGroup direction="horizontal" className="flex-1">
          {isFileExplorerVisible && (
            <Panel defaultSize={20} minSize={10} collapsible={true} collapsed={!isFileExplorerVisible} onCollapse={setIsFileExplorerVisible}>
              <div className="h-full border-r border-gray-800 bg-gray-950 overflow-y-auto">
                <FileExplorer files={files} onFileSelect={openFile} />
              </div>
            </Panel>
          )}
          {isFileExplorerVisible && (
            <PanelResizeHandle className="resize-handle-outer">
              <div className="resize-handle-inner" />
            </PanelResizeHandle>
          )}
          <Panel>
            <PanelGroup direction="horizontal" className="flex-1">
              <Panel defaultSize={isFileExplorerVisible ? 50 : 100} minSize={20}>
                <div className="h-full border-r border-gray-800">
                  <FileEditor
                    content={content}
                    onChange={setContent}
                    fileName={currentFileName || "Untitled"}
                    onRename={handleRename}
                  />
                </div>
              </Panel>
              <PanelResizeHandle className="resize-handle-outer">
                <div className="resize-handle-inner" />
              </PanelResizeHandle>
              <Panel defaultSize={50} minSize={20}>
                <div className="h-full">
                  <MarkdownPreview content={content} />
                </div>
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  )
}
