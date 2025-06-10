"use client"

import { useState, useCallback, useEffect, version } from "react"
import { FileExplorer } from "@/components/file-explorer"
import FileEditor from "@/components/file-editor"
import ChatPanel from "@/components/ChatPanel" // Import ChatPanel
import { MarkdownPreview } from "@/components/markdown-preview"
import { Button } from "@/components/ui/button"
import { FolderOpen, PanelLeftClose, PanelLeftOpen, MessageSquare } from "lucide-react" // Re-adding PanelLeftClose and PanelLeftOpen
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
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false)

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

  const handleRename = async (oldPath, newName) => {
    // oldPath is the full path e.g., "folder/file.txt"
    // newName is just the new name, e.g., "newfile.txt"
    if (!oldPath || !newName || oldPath.substring(oldPath.lastIndexOf('/') + 1) === newName) {
      // If old name and new name are the same, do nothing
      // Or if oldPath or newName is not provided
      return;
    }
    try {
      const res = await fetch(`/api/files/rename/${encodePath(oldPath)}`, {
        method: "POST", // Changed from PATCH to POST
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_name: newName }), // Backend expects new_name
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: "Rename failed" }));
        throw new Error(errorData.detail || "Rename failed");
      }
      const result = await res.json();

      // If the renamed item was the currently open file, update its state
      if (currentFileName === oldPath) {
        setCurrentFileName(result.new_name); // new_name is the full new path relative to BASE_PATH
      }

      loadFiles(); // Refresh file explorer
      toast.success(`Item renamed to ${result.new_name}!`, { position: "top-right", theme: "dark", transition: Bounce });
    } catch (error) {
      toast.error(String(error), { position: "top-right", theme: "dark", transition: Bounce });
    }
  };

  const handleDelete = async (path) => {
    if (!path) {
      toast.error("Path is required to delete an item.", { position: "top-right", theme: "dark", transition: Bounce });
      return;
    }
    try {
      const res = await fetch(`/api/files/${encodePath(path)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: "Failed to delete item" }));
        throw new Error(errorData.detail || "Failed to delete item");
      }
      const result = await res.json();

      // If the deleted item was the currently open file, clear editor state
      if (currentFileName === path) {
         setCurrentFileName("");
         setContent("");
         toast.info("The currently open file has been deleted.", { position: "top-right", theme: "dark", transition: Bounce });
      }

      loadFiles(); // Refresh file explorer
      toast.success(result.message || "Item deleted successfully!", { position: "top-right", theme: "dark", transition: Bounce });
    } catch (error) {
      toast.error(String(error), { position: "top-right", theme: "dark", transition: Bounce });
    }
  };

  const handleMoveItem = async (sourcePath, destinationPath) => {
    if (!sourcePath || !destinationPath) {
      toast.error("Source and destination paths are required to move an item.", { position: "top-right", theme: "dark", transition: Bounce });
      return;
    }
    // Prevent moving item into itself or to the same location
    if (destinationPath.startsWith(sourcePath + '/') || sourcePath === destinationPath) {
        toast.warn("Cannot move an item into itself or to the same location.", { position: "top-right", theme: "dark", transition: Bounce });
        return;
    }

    try {
      const res = await fetch(`/api/files/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourcePath, destinationPath }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: "Failed to move item" }));
        throw new Error(errorData.detail || "Failed to move item");
      }
      const result = await res.json();

      // If the moved item was the currently open file, update its path
      if (currentFileName === sourcePath) {
        // The destinationPath from the input might be a folder if moving into a folder.
        // The actual new path of the file will be destinationPath + original_basename if destinationPath is a folder.
        // For simplicity, we can try to open the new path, or rely on the user to re-open.
        // The backend could return the new full path of the item for clarity.
        // Assuming backend returns the final new path or we can deduce it:
        // For now, let's assume destinationPath is the new full path of the item.
        // This might need adjustment based on how FileExplorer determines destinationPath.
        // A robust way: backend returns the exact new path of the moved item.
        // For now, just clear current file if it was moved. User can re-open.
         setCurrentFileName(""); // Clear current file name
         setContent(""); // Clear content
         toast.info("The currently open file was moved. Please reopen it from its new location if needed.", { position: "top-right", theme: "dark", transition: Bounce });
      }

      loadFiles(); // Refresh file explorer
      toast.success(result.message || "Item moved successfully!", { position: "top-right", theme: "dark", transition: Bounce });
    } catch (error) {
      toast.error(String(error), { position: "top-right", theme: "dark", transition: Bounce });
    }
  };

  const handleCreateFileOrFolder = async (path, type) => {
    // path is the full path for the new item e.g., "newfolder" or "folder/newfile.txt"
    // type is "file" or "folder"
    if (!path || !type) {
      toast.error("Path and type are required to create an item.", { position: "top-right", theme: "dark", transition: Bounce });
      return;
    }
    try {
      const res = await fetch(`/api/files/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, type }), // Backend expects path and type
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: `Failed to create ${type}` }));
        throw new Error(errorData.detail || `Failed to create ${type}`);
      }
      const result = await res.json();
      loadFiles(); // Refresh file explorer
      toast.success(result.message || `${type.charAt(0).toUpperCase() + type.slice(1)} created successfully!`, { position: "top-right", theme: "dark", transition: Bounce });

      // Optionally, open the new file if it's a file
      // if (type === "file") {
      //   openFile(path);
      // }
    } catch (error) {
      toast.error(String(error), { position: "top-right", theme: "dark", transition: Bounce });
    }
  };

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
        <div className="flex items-center gap-2"> {/* Adjusted gap-4 to gap-2 to make space for button */}
          <Button
            onClick={() => setIsFileExplorerVisible(!isFileExplorerVisible)}
            variant="ghost" // Using ghost variant
            size="icon" // Using icon size
            className="text-gray-400 hover:text-gray-100 hover:bg-gray-800" // Styling similar to FileExplorer's old button
          >
            {isFileExplorerVisible ? (
              <>
                {/* Adjusted icon size to w-5 h-5 to match previous header button */}
                <PanelLeftClose className="w-5 h-5" />
              </>
            ) : (
              <PanelLeftOpen className="w-5 h-5" />
            )}
          </Button>
          <h1 className="text-xl font-semibold">Assist</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={loadFiles} variant="outline" className="bg-gray-900 border-gray-700 hover:bg-gray-800">
            <FolderOpen className="w-4 h-4 mr-2" />
            Reload Files
          </Button>
          <Button onClick={() => setIsChatPanelOpen(!isChatPanelOpen)} variant="outline" className="bg-gray-900 border-gray-700 hover:bg-gray-800">
            <MessageSquare className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <PanelGroup direction="horizontal" className="flex-1">
          {isFileExplorerVisible && (
            <Panel defaultSize={20} minSize={10} collapsible={true} collapsed={!isFileExplorerVisible ? true : undefined} onCollapse={() => setIsFileExplorerVisible(false)}>

              <div className="h-full border-r border-gray-800 bg-gray-950 overflow-y-auto">
                <FileExplorer
                  files={files}
                  onFileSelect={openFile}
                   onCreate={handleCreateFileOrFolder}
                   onMove={handleMoveItem}
                   onRename={handleRename}
                   onDelete={handleDelete}
                />
              </div>
            </Panel>
          )}
          {isFileExplorerVisible && (
            <PanelResizeHandle className="resize-handle-outer">
              <div className="resize-handle-inner" />
            </PanelResizeHandle>
          )}
          <Panel defaultSize={isFileExplorerVisible ? 80 : 100}>
            <PanelGroup direction="horizontal" className="flex-1">
              <Panel defaultSize={isFileExplorerVisible ? 50 : 100} minSize={20}>
                <div className="h-full border-r border-gray-800">
                  <FileEditor
                    content={content}
                    onChange={setContent}
                    fileName={currentFileName || "Untitled"}
                    // The FileEditor's onRename expects a function that takes only the newName (basename)
                    // We need to adapt handleRename or provide a new function for FileEditor if its behavior is different
                    // For now, let's assume FileEditor's onRename will be updated or this handleRename is primarily for FileExplorer
                    // If FileEditor calls this, it should pass currentFileName as oldPath
                    onRename={(newName) => handleRename(currentFileName, newName)}
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
      {/* Render ChatPanel conditionally */}
      <ChatPanel
        isOpen={isChatPanelOpen}
        onClose={() => setIsChatPanelOpen(false)}
        currentFileName={currentFileName}
      />
    </div>
  )
}
