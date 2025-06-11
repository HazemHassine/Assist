"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, MoreVertical, FilePlus, FolderPlus, Edit3, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu" // Assuming this exists based on Shadcn UI patterns

function TreeNode({
  item,
  level,
  onFileSelect,
  parentPath = "",
  onCreate,
  onRename,
  onDelete,
  onMove,
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(item.name);

  // ADD THIS LOG HERE:
  console.log(`TreeNode render: item.name = ${item.name}, isRenaming = ${isRenaming}, renameValue = ${renameValue}`);

  const paddingLeft = level * 16 + 8 // Original padding + 8 for base indent
  const currentPath = parentPath ? `${parentPath}/${item.name}` : item.name;

  const handleDragStart = (e) => {
    e.dataTransfer.setData("text/plain", currentPath);
    e.dataTransfer.effectAllowed = "move";
    // Optional: add a visual cue
    // e.target.style.opacity = '0.5';
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necessary to allow dropping
    // Optional: add a visual cue on the target
    // e.target.closest('.tree-node-button').style.backgroundColor = 'rgba(255,255,255,0.1)';
  };

  const handleDragLeave = (e) => {
    // Optional: remove visual cue
    // e.target.closest('.tree-node-button').style.backgroundColor = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    // Optional: remove visual cue
    // e.target.closest('.tree-node-button').style.backgroundColor = '';
    const draggedPath = e.dataTransfer.getData("text/plain");

    if (draggedPath && draggedPath !== currentPath) {
      let destinationPath = currentPath;
      if (item.type === "file") { // If dropped onto a file, use its parent folder
        destinationPath = parentPath; // "" if root
      }
      // Ensure destinationPath is not empty for root, or append '/'
      const finalDestinationPath = destinationPath ? `${destinationPath}/${draggedPath.substring(draggedPath.lastIndexOf('/') + 1)}` : draggedPath.substring(draggedPath.lastIndexOf('/') + 1);

      // Prevent dropping a folder into its own child or itself
      if (draggedPath === destinationPath || (item.type === "directory" && destinationPath.startsWith(draggedPath + '/'))) {
        alert("Cannot move a folder into itself or one of its subfolders.");
        return;
      }
      onMove(draggedPath, finalDestinationPath);
    }
  };

  const handleToggle = () => {
    if (item.type === "directory") {
      setIsExpanded(!isExpanded)
    } else if (item.type === "file") {
      onFileSelect(currentPath)
    }
  }

  const handleCreateFile = () => {
    const newFileName = prompt("Enter name for the new file (e.g., newfile.txt):");
    if (newFileName) {
      const pathForCreation = item.type === "directory" ? `${currentPath}/${newFileName}` : `${parentPath ? parentPath + '/' : ''}${newFileName}`;
      onCreate(pathForCreation, "file");
    }
  };

  const handleCreateFolder = () => {
    const newFolderName = prompt("Enter name for the new folder:");
    if (newFolderName) {
      const pathForCreation = item.type === "directory" ? `${currentPath}/${newFolderName}` : `${parentPath ? parentPath + '/' : ''}${newFolderName}`;
      onCreate(pathForCreation, "folder");
    }
  };

  const handleRename = () => {
    console.log(`handleRename called for item: ${item.name}. Current isRenaming before set: ${isRenaming}`);
    setRenameValue(item.name);
    setIsRenaming(true);
    console.log(`handleRename: setIsRenaming(true) was called. Expecting re-render for ${item.name} with isRenaming = true.`);
  };

  const handleDelete = () => {
    onDelete(currentPath); // Directly call onDelete
    console.log(`handleDelete: Deleting ${currentPath} without confirmation.`); // Optional: for feedback
  };

  const handleRenameSubmit = () => {
    console.log(`handleRenameSubmit ACTUALLY RUNNING for ${item.name}. Current renameValue: "${renameValue}"`);
    if (renameValue.trim() && renameValue.trim() !== item.name) {
      console.log(`Calling onRename with path: "${currentPath}" and new name: "${renameValue.trim()}"`);
      onRename(currentPath, renameValue.trim()); // RESTORE THIS
    } else {
      console.log(`Rename condition not met: renameValue (trimmed): "${renameValue.trim()}", item.name: "${item.name}"`);
    }
    setIsRenaming(false); // RESTORE THIS
  };

  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only proceed if renaming is active and the click is outside the input
      if (isRenaming && inputRef.current && !inputRef.current.contains(event.target)) {
        console.log("Click outside detected. Calling handleRenameSubmit.");
        handleRenameSubmit();
      }
    };

    if (isRenaming) {
      document.addEventListener("mousedown", handleClickOutside);
      console.log("useEffect: Added mousedown listener for click outside.");
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
      console.log("useEffect: Cleaned up mousedown listener (isRenaming false).");
    }

    // Cleanup function for when the component unmounts or before re-running the effect
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      console.log("useEffect: Cleaned up mousedown listener (component unmount/re-effect).");
    };
  }, [isRenaming, handleRenameSubmit]);

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start h-8 px-2 text-gray-300 hover:bg-gray-800 hover:text-gray-100 rounded-lg tree-node-button", // Added class for styling drag cues
              item.type === "file" && "text-gray-400",
            )}
            style={{ paddingLeft }}
            onClick={handleToggle}
            draggable="true"
            onDragStart={handleDragStart}
            onDragOver={handleDragOver} // Allow dropping on this item
            onDragLeave={handleDragLeave} // For visual cues
            onDrop={handleDrop} // Handle the drop
          >
            <div className={`flex items-center gap-2 min-w-0 flex-1 ${isRenaming ? '' : 'pointer-events-none'}`}> {/* pointer-events-none for children to ensure button gets drag events */}
              {item.type === "directory" && (
                <>
                  {isExpanded ? <ChevronDown className="w-4 h-4 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 flex-shrink-0" />}
                  {isExpanded ? <FolderOpen className="w-4 h-4 flex-shrink-0 text-blue-400" /> : <Folder className="w-4 h-4 flex-shrink-0 text-blue-400" />}
                </>
              )}
              {item.type === "file" && <File className="w-4 h-4 flex-shrink-0 text-gray-400" />}
              {isRenaming ? (
                <input
                  ref={inputRef} // Assign the ref here
                  type="text"
                  value={renameValue}
                  onChange={(e) => {
                    console.log(`Input onChange: old value: "${renameValue}", new value from input: "${e.target.value}"`);
                    setRenameValue(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      console.log(`Input KeyDown: Enter pressed for ${item.name}. Calling handleRenameSubmit().`);
                      handleRenameSubmit(); // RESTORE THIS
                    } else if (e.key === "Escape") {
                      console.log(`Input KeyDown: Escape pressed for ${item.name}. Resetting value and closing input.`);
                      setRenameValue(item.name);
                      setIsRenaming(false);
                    }
                  }}
                  // onBlur={handleRenameSubmit} // COMMENT THIS OUT AGAIN
                  className="bg-gray-700 text-gray-100 text-sm p-0.5 border border-gray-600 rounded" // Basic styling
                  style={{ width: 'calc(100% - 20px)' }} // Adjust width as needed
                  autoFocus // Automatically focus the input
                  onFocus={(e) => {
                    e.target.select();
                    console.log("Input field focused and text selected.");
                  }} // Select text on focus
                />
              ) : (
                <span className="truncate text-sm">{item.name}</span>
              )}
            </div>
            {/* Optional: Add a MoreVertical icon for discoverability of context menu, though right-click is standard */}
            {/* <MoreVertical className="w-4 h-4 ml-auto text-gray-500" /> */}
          </Button>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48 bg-gray-800 border-gray-700 text-gray-200">
          <ContextMenuItem onClick={handleCreateFile} className="hover:bg-gray-700">
            <FilePlus className="w-4 h-4 mr-2" /> New File
          </ContextMenuItem>
          <ContextMenuItem onClick={handleCreateFolder} className="hover:bg-gray-700">
            <FolderPlus className="w-4 h-4 mr-2" /> New Folder
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => {
              console.log("Rename ContextMenuItem clicked directly! Now calling handleRename...");
              handleRename(); // UNCOMMENT THIS LINE
            }}
            className="hover:bg-gray-700"
          >
            <Edit3 className="w-4 h-4 mr-2" /> Rename
          </ContextMenuItem>
          <ContextMenuSeparator className="bg-gray-700" />
          <ContextMenuItem onClick={handleDelete} className="text-red-400 hover:bg-red-500 hover:text-red-100">
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {isExpanded && item.children && (
        <div>
          {item.children.map((child) => (
            <TreeNode
              key={child.name} // Using child.name might be problematic if names are not unique within a folder
              item={child}
              level={level + 1}
              onFileSelect={onFileSelect}
              parentPath={currentPath}
              onCreate={onCreate}
              onRename={onRename}
              onDelete={onDelete}
              onMove={onMove}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function FileExplorer({ files, onFileSelect, onCreate, onRename, onMove, onDelete }) {
  // Context menu for the root area
  const handleRootCreateFile = () => {
    const newFileName = prompt("Enter name for the new file at root (e.g., newfile.txt):");
    if (newFileName) {
      onCreate(newFileName, "file");
    }
  };

  const handleRootCreateFolder = () => {
    const newFolderName = prompt("Enter name for the new folder at root:");
    if (newFolderName) {
      onCreate(newFolderName, "folder");
    }
  };

  if (!files || files.length === 0) {
    return (
      <ContextMenu>
        <ContextMenuTrigger>
          <div className="p-4 text-center text-gray-500 h-full flex flex-col justify-center items-center">
            <Folder className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p>No files found.</p>
            <p className="text-xs text-gray-600 mt-2">Right-click to create a new file or folder.</p>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48 bg-gray-800 border-gray-700 text-gray-200">
          <ContextMenuItem onClick={handleRootCreateFile} className="hover:bg-gray-700">
            <FilePlus className="w-4 h-4 mr-2" /> New File
          </ContextMenuItem>
          <ContextMenuItem onClick={handleRootCreateFolder} className="hover:bg-gray-700">
            <FolderPlus className="w-4 h-4 mr-2" /> New Folder
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    )
  }

  // Helper to build unique key for tree nodes
  const getNodeKey = (item, parentPath, level = 0) => { // Added level default
    const path = parentPath ? `${parentPath}/${item.name}` : item.name;
    // Ensure item and item.type are defined to prevent errors if files structure is ever malformed
    const type = item && item.type ? item.type : 'unknown';
    return `${path}-${type}-${level}`;
  };

  const handleRootDrop = (e) => {
    e.preventDefault();
    const draggedPath = e.dataTransfer.getData("text/plain");
    if (draggedPath) {
        const itemName = draggedPath.substring(draggedPath.lastIndexOf('/') + 1);
        const newRootPath = itemName; // Moving to root, new path is just the name
        if (draggedPath === newRootPath) return; // Already at root or trying to drop on itself at root
        onMove(draggedPath, newRootPath);
    }
  };

  const handleRootDragOver = (e) => {
    e.preventDefault(); // Allow dropping
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          className="p-2 h-full overflow-auto"
          tabIndex={-1}
          onDrop={handleRootDrop}
          onDragOver={handleRootDragOver}
        >
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Files</h3>
            <div className="space-y-1">
              {files.map((file) => (
                <TreeNode
                  key={getNodeKey(file, "", 0)}
                  item={file}
                  level={0}
                  onFileSelect={onFileSelect}
                  onCreate={onCreate}
                  onRename={onRename}
                  onDelete={onDelete}
                  onMove={onMove}
                />
              ))}
            </div>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48 bg-gray-800 border-gray-700 text-gray-200">
         <ContextMenuItem onClick={handleRootCreateFile} className="hover:bg-gray-700">
            <FilePlus className="w-4 h-4 mr-2" /> New File at Root
          </ContextMenuItem>
          <ContextMenuItem onClick={handleRootCreateFolder} className="hover:bg-gray-700">
            <FolderPlus className="w-4 h-4 mr-2" /> New Folder at Root
          </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
