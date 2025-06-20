"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Resizable } from 're-resizable';
import Draggable from 'react-draggable';
import { X, RefreshCcw, Send, FileText, Search, MessageSquare, SquareArrowOutUpRight } from 'lucide-react';

const ChatPanel = ({ isOpen, onClose, currentFileName }) => {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [isFloatingMode, setIsFloatingMode] = useState(false);
  const resizableContainerRef = useRef(null); // Ref for the div that Draggable moves
  const conversationEndRef = useRef(null);
  const [panelSize, setPanelSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (isFloatingMode) {
      // Initialize size when floating mode is activated or when component mounts in floating mode
      // Ensure this runs client-side where window is available.
      setPanelSize({ width: window.innerWidth * 0.6, height: window.innerHeight - (2 * 16) }); // 16px = 1rem approx (for top-4)
    }
  }, [isFloatingMode]); // Re-calculate if isFloatingMode changes (e.g., to reset size)

  const handleResizeStop = (event, direction, ref, delta) => {
    setPanelSize(prevSize => ({
      width: prevSize.width + delta.width,
      height: prevSize.height + delta.height,
    }));
  };

  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (prompt.trim()) {
      const newMessage = { text: prompt.trim(), sender: 'user' };
      setMessages([...messages, newMessage]);
      setPrompt("");
      console.log(`Prompt for ${currentFileName}: ${prompt.trim()}`);
    }
  };

  useEffect(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollTop = conversationEndRef.current.scrollHeight;
    }
  }, [messages]);

  const handleClearContext = () => {
    setMessages([]);
    console.log("Chat context cleared.");
  };

  // Extracted panel content for clarity with Draggable
  function panelContent() {
    return <>
      {/* Conversation Area */}
      <div
        ref={conversationEndRef}
        className="flex-grow overflow-y-auto mb-3 p-3 bg-slate-900 rounded-md scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <MessageSquare size={48} className="mb-2"/>
            <span>No messages yet. Ask something!</span>
            {currentFileName && <span className="text-xs mt-1">Talking about: {currentFileName}</span>}
          </div>
        )}
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-3 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <span
              className={`px-4 py-2 rounded-lg inline-block max-w-[80%] whitespace-pre-wrap ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-slate-700 text-slate-200 rounded-bl-none'
              }`}
            >
              {msg.text}
            </span>
          </div>
        ))}
      </div>

      {/* Prompt Input */}
      <form onSubmit={handleSubmit} className="flex items-center mb-2">
        <div className="relative flex-grow mr-2">
          <FileText size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={prompt}
            onChange={handlePromptChange}
            placeholder={`Chat about ${currentFileName || "your code"}...`}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <button
          type="submit"
          title="Send Message"
          className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          <Send size={20} />
        </button>
      </form>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <button className="flex-1 p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-slate-100 rounded-md text-sm transition-colors">
          <FileText size={16} className="inline mr-1.5" /> Explain this file
        </button>
        <button className="flex-1 p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-slate-100 rounded-md text-sm transition-colors">
          <Search size={16} className="inline mr-1.5" /> Show TODOs
        </button>
      </div>
    </>;
  }

  return (
    isOpen && (
      <>
      {isFloatingMode && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[999]"
          onClick={() => setIsFloatingMode(false)}
        ></div>
      )}

      {isFloatingMode ? (
        // Draggable component itself is positioned by its defaultClassName.
        // It directly wraps the element that draggableRef points to.
        <Draggable
          nodeRef={resizableContainerRef}
          handle=".chat-panel-header"
          defaultClassName={`fixed top-4 left-[20%] z-[1000]`} // Only positioning. W/H comes from style on child.
        >
          {/* This is the div that Draggable moves. Its size is controlled by panelSize state. */}
          <div
            ref={resizableContainerRef}
            style={{ width: panelSize.width + 'px', height: panelSize.height + 'px' }}
          >
            <Resizable
              size={{ width: '100%', height: '100%' }} // Resizable fills the container div
              onResizeStop={handleResizeStop} // Updates panelSize state, which then updates container div
              minWidth={400}
              minHeight={300}
              enable={{ top:true, right:true, bottom:true, left:true, topRight:true, bottomRight:true, bottomLeft:true, topLeft:true }}
              className="flex flex-col bg-slate-800 text-slate-100 rounded-xl shadow-2xl border border-slate-700 p-4" // Visuals
            >
              {/* This inner div is the direct child of Resizable, taking up Resizable's full space */}
              <div className="flex flex-col h-full w-full">
              <div className="chat-panel-header flex justify-between items-center mb-3 cursor-grab active:cursor-grabbing">
                <h2 className="text-lg font-semibold text-slate-200">Chat with AI <span className="text-sm text-slate-400 normal-case">(Floating)</span></h2>
                <div className="flex items-center">
                  <button onClick={handleClearContext} title="Clear Chat History" className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded"><RefreshCcw size={18} /></button>
                  <button onClick={() => setIsFloatingMode(!isFloatingMode)} title={isFloatingMode ? "Dock Panel" : "Float Panel"} className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded"><SquareArrowOutUpRight size={18} /></button>
                  <button onClick={onClose} title="Close Panel" className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded"><X size={20} /></button>
                </div>
              </div>
              {/* Remainder of the panel content */}
              {panelContent()}
              </div>
            </Resizable>
          </div>
        </Draggable>
      ) : (
        <div className="fixed bottom-0 left-0 right-0 h-2/5 flex flex-col bg-slate-800 text-slate-100 z-[1000] p-4 border-t border-slate-700 shadow-[0_-2px_15px_rgba(0,0,0,0.3)] rounded-t-lg">
          {/* Header */}
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-slate-200">Chat with AI</h2>
            <div className="flex items-center">
               <button onClick={handleClearContext} title="Clear Chat History" className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded"><RefreshCcw size={18} /></button>
               <button onClick={() => setIsFloatingMode(!isFloatingMode)} title="Float Panel" className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded"><SquareArrowOutUpRight size={18} /></button>
               <button onClick={onClose} title="Close Panel" className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded"><X size={20} /></button>
            </div>
          </div>
          {panelContent()}
        </div>
      )}
      </>
    )
  );
};

export default ChatPanel;
