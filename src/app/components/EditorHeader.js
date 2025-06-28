import React, { useRef, useState, useEffect } from 'react';
import { FileText, Bot, X, ChevronLeft, ChevronRight } from 'lucide-react';

function EditorHeader({ openFiles, currentFileId, onTabSelect, onCloseTab, onAIToggle, aiOpen, onReorderTabs, graphFullScreen }) {
  const tabsContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [draggedTab, setDraggedTab] = useState(null);
  const [dragOverTab, setDragOverTab] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dropPosition, setDropPosition] = useState(null); // 'before' or 'after'

  // Check scroll position and update scroll buttons
  const checkScrollPosition = () => {
    if (tabsContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  // Scroll tabs left or right
  const scrollTabs = (direction) => {
    if (tabsContainerRef.current) {
      const scrollAmount = 200; // Adjust this value for scroll distance
      const newScrollLeft = tabsContainerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      
      tabsContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  // Scroll to active tab if it's not visible
  const scrollToActiveTab = () => {
    if (tabsContainerRef.current && currentFileId) {
      const activeTab = tabsContainerRef.current.querySelector(`[data-file-id="${currentFileId}"]`);
      if (activeTab) {
        const containerRect = tabsContainerRef.current.getBoundingClientRect();
        const tabRect = activeTab.getBoundingClientRect();
        
        // Check if tab is outside visible area
        if (tabRect.left < containerRect.left || tabRect.right > containerRect.right) {
          activeTab.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest'
          });
        }
      }
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e, fileId) => {
    setDraggedTab(fileId);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    
    // Add dragging class to the dragged element
    e.target.style.opacity = '0.5';
    e.target.style.transform = 'rotate(2deg)';
  };

  const handleDragEnd = (e) => {
    setDraggedTab(null);
    setDragOverTab(null);
    setIsDragging(false);
    setDropPosition(null);
    
    // Remove dragging styles
    e.target.style.opacity = '';
    e.target.style.transform = '';
  };

  const handleDragOver = (e, fileId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (fileId !== draggedTab) {
      setDragOverTab(fileId);
      
      // Determine drop position based on mouse position relative to tab center
      const tabElement = e.currentTarget;
      const rect = tabElement.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const mouseX = e.clientX;
      
      setDropPosition(mouseX < centerX ? 'before' : 'after');
    }
  };

  const handleDragLeave = (e) => {
    // Only clear if we're leaving the tab area completely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverTab(null);
      setDropPosition(null);
    }
  };

  const handleDrop = (e, targetFileId) => {
    e.preventDefault();
    
    if (draggedTab && targetFileId && draggedTab !== targetFileId && onReorderTabs) {
      const draggedIndex = openFiles.findIndex(file => file.id === draggedTab);
      const targetIndex = openFiles.findIndex(file => file.id === targetFileId);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newFiles = [...openFiles];
        const [draggedFile] = newFiles.splice(draggedIndex, 1);
        
        // Adjust target index based on drop position
        let finalTargetIndex = targetIndex;
        if (dropPosition === 'after' && draggedIndex < targetIndex) {
          finalTargetIndex = targetIndex;
        } else if (dropPosition === 'before' && draggedIndex > targetIndex) {
          finalTargetIndex = targetIndex;
        } else if (dropPosition === 'after' && draggedIndex > targetIndex) {
          finalTargetIndex = targetIndex + 1;
        } else if (dropPosition === 'before' && draggedIndex < targetIndex) {
          finalTargetIndex = targetIndex;
        }
        
        newFiles.splice(finalTargetIndex, 0, draggedFile);
        onReorderTabs(newFiles);
      }
    }
    
    setDraggedTab(null);
    setDragOverTab(null);
    setIsDragging(false);
    setDropPosition(null);
  };

  // Update scroll position on mount and when files change
  useEffect(() => {
    checkScrollPosition();
    scrollToActiveTab();
  }, [openFiles, currentFileId]);

  // Add scroll event listener
  useEffect(() => {
    const container = tabsContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      return () => container.removeEventListener('scroll', checkScrollPosition);
    }
  }, []);

  return (
    <div className="h-14 bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-700/50 flex items-center px-4 gap-2 relative">
      {/* Show tabs only when not in full screen graph mode */}
      {!graphFullScreen && (
        <>
          {/* Scroll left button */}
          <div className={`absolute left-4 z-10 transition-all duration-300 ease-in-out ${canScrollLeft ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 pointer-events-none'}`}>
            <button
              onClick={() => scrollTabs('left')}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-900/90 hover:bg-zinc-800/90 text-zinc-300 hover:text-white transition-all duration-200 backdrop-blur-sm border border-zinc-700/50 shadow-lg"
              aria-label="Scroll tabs left"
            >
              <ChevronLeft size={16} />
            </button>
          </div>

          {/* File tabs container */}
          <div 
            ref={tabsContainerRef}
            className="flex items-center space-x-1 overflow-x-auto no-scrollbar tabs-container flex-1 min-w-0"
            style={{ paddingLeft: canScrollLeft ? '3rem' : '0', paddingRight: canScrollRight ? '3rem' : '0' }}
          >
            {openFiles.map(file => (
              <div
                key={file.id}
                data-file-id={file.id}
                draggable
                onDragStart={(e) => handleDragStart(e, file.id)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, file.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, file.id)}
                onClick={() => onTabSelect(file.id)}
                className={`flex items-center px-4 py-2 cursor-pointer transition-all relative whitespace-nowrap flex-shrink-0 min-w-0 ${
                  currentFileId === file.id
                    ? 'bg-zinc-800 text-white font-semibold border-b-4 border-blue-500' // highlighted underline
                    : 'bg-zinc-700/50 text-zinc-300 hover:bg-zinc-700/75 hover:text-white'
                } ${
                  draggedTab === file.id ? 'opacity-50 scale-95' : ''
                }`}
              >
                {/* Drop indicator line */}
                {dragOverTab === file.id && dropPosition === 'before' && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-400 z-10" />
                )}
                {dragOverTab === file.id && dropPosition === 'after' && (
                  <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-blue-400 z-10" />
                )}
                
                <FileText
                  size={16}
                  className={`flex-shrink-0 ${currentFileId === file.id ? 'text-blue-400' : 'text-zinc-300'}`}
                />
                <span className="ml-2 text-sm truncate max-w-32">{file.name}</span>
                <button
                  onClick={e => { e.stopPropagation(); onCloseTab(file.id); }}
                  className="ml-2 p-1 rounded hover:bg-zinc-700/75 hover:text-red-500 transition-colors flex-shrink-0"
                  aria-label={`Close ${file.name}`}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* Scroll right button */}
          <div className={`absolute z-10 transition-all duration-300 ease-in-out ${canScrollRight ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'}`} style={{ right: 'calc(120px + 1rem)' }}>
            <button
              onClick={() => scrollTabs('right')}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-900/90 hover:bg-zinc-800/90 text-zinc-300 hover:text-white transition-all duration-200 backdrop-blur-sm border border-zinc-700/50 shadow-lg"
              aria-label="Scroll tabs right"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* AI Assistant toggle */}
          <button
            onClick={onAIToggle}
            className={`ml-auto flex items-center gap-2 px-4 py-2 rounded-lg transition-all flex-shrink-0 ${
              aiOpen
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/20'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg hover:shadow-blue-500/25'
            }`}
          >
            <Bot size={16} />
            <span className="text-sm font-medium">AI Assistant</span>
          </button>
        </>
      )}
    </div>
  );
}

export default EditorHeader;