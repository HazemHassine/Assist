// "use client"

// import { useState } from "react"
// import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from "lucide-react"
// import { Button } from "@/components/ui/button"
// import { cn } from "@/lib/utils"

// function TreeNode({ item, level, onFileSelect }) {
//   const [isExpanded, setIsExpanded] = useState(false)
//   const paddingLeft = level * 16 + 8

//   // Toggle expand/collapse only for directories
//   const handleToggle = () => {
//     if (item.type === "directory") {
//       setIsExpanded(!isExpanded)
//     } else if (item.type === "file") {
//       onFileSelect(item.name) // Pass file name back
//     }
//   }

//   return (
//     <div>
//       <Button
//         variant="ghost"
//         className={cn(
//           "w-full justify-start h-8 px-2 text-gray-300 hover:bg-gray-800 hover:text-gray-100 rounded-lg",
//           item.type === "file" && "text-gray-400",
//         )}
//         style={{ paddingLeft }}
//         onClick={handleToggle}
//       >
//         <div className="flex items-center gap-2 min-w-0 flex-1">
//           {item.type === "directory" && (
//             <>
//               {isExpanded ? (
//                 <ChevronDown className="w-4 h-4 flex-shrink-0" />
//               ) : (
//                 <ChevronRight className="w-4 h-4 flex-shrink-0" />
//               )}
//               {isExpanded ? (
//                 <FolderOpen className="w-4 h-4 flex-shrink-0 text-blue-400" />
//               ) : (
//                 <Folder className="w-4 h-4 flex-shrink-0 text-blue-400" />
//               )}
//             </>
//           )}
//           {item.type === "file" && <File className="w-4 h-4 flex-shrink-0 text-gray-400" />}
//           <span className="truncate text-sm">{item.name}</span>
//         </div>
//       </Button>

//       {/* If directory and expanded, show children */}
//       {isExpanded && item.children && (
//         <div>
//           {item.children.map((child) => (
//             <TreeNode key={child.name} item={child} level={level + 1} onFileSelect={onFileSelect} />
//           ))}
//         </div>
//       )}
//     </div>
//   )
// }

// export function FileExplorer({ files, onFileSelect }) {
//   if (!files || files.length === 0) {
//     return (
//       <div className="p-4 text-center text-gray-500">
//         <Folder className="w-12 h-12 mx-auto mb-4 text-gray-600" />
//         <p>No files found. Reload or select a folder.</p>
//       </div>
//     )
//   }

//   return (
//     <div className="p-2 h-full overflow-auto">
//       <div className="mb-4">
//         <h3 className="text-sm font-medium text-gray-400 mb-2">Files</h3>
//         <div className="space-y-1">
//           {files.map((file) => (
//             <TreeNode key={file.name} item={file} level={0} onFileSelect={onFileSelect} />
//           ))}
//         </div>
//       </div>
//     </div>
//   )
// }

"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function TreeNode({ item, level, onFileSelect, parentPath = "" }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const paddingLeft = level * 16 + 8

  const handleToggle = () => {
    if (item.type === "directory") {
      setIsExpanded(!isExpanded)
    } else if (item.type === "file") {
      // Compose full relative path to pass up
      const fullPath = parentPath ? `${parentPath}/${item.name}` : item.name
      onFileSelect(fullPath)
    }
  }

  return (
    <div>
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start h-8 px-2 text-gray-300 hover:bg-gray-800 hover:text-gray-100 rounded-lg",
          item.type === "file" && "text-gray-400",
        )}
        style={{ paddingLeft }}
        onClick={handleToggle}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {item.type === "directory" && (
            <>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 flex-shrink-0" />
              )}
              {isExpanded ? (
                <FolderOpen className="w-4 h-4 flex-shrink-0 text-blue-400" />
              ) : (
                <Folder className="w-4 h-4 flex-shrink-0 text-blue-400" />
              )}
            </>
          )}
          {item.type === "file" && <File className="w-4 h-4 flex-shrink-0 text-gray-400" />}
          <span className="truncate text-sm">{item.name}</span>
        </div>
      </Button>

      {isExpanded && item.children && (
        <div>
          {item.children.map((child) => (
            <TreeNode
              key={child.name}
              item={child}
              level={level + 1}
              onFileSelect={onFileSelect}
              parentPath={parentPath ? `${parentPath}/${item.name}` : item.name}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function FileExplorer({ files, onFileSelect }) {
  if (!files || files.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <Folder className="w-12 h-12 mx-auto mb-4 text-gray-600" />
        <p>No files found. Reload or select a folder.</p>
      </div>
    )
  }

  return (
    <div className="p-2 h-full overflow-auto">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-400 mb-2">Files</h3>
        <div className="space-y-1">
          {files.map((file) => (
            <TreeNode key={file.name} item={file} level={0} onFileSelect={onFileSelect} />
          ))}
        </div>
      </div>
    </div>
  )
}
