"use client"

import React, { useState } from 'react';
import { X, RefreshCcw, Send, FileText, Search, MessageSquare } from 'lucide-react'; // Added Send, FileText, Search, MessageSquare

const ChatPanel = ({ isOpen, onClose, currentFileName }) => {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]); // { text: string, sender: 'user' | 'ai' }[]

  if (!isOpen) {
    return null;
  }

  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (prompt.trim()) {
      // For now, just add to messages array. AI response will be handled later.
      setMessages([...messages, { text: prompt, sender: 'user' }]);
      setPrompt("");
      console.log(`Prompt for ${currentFileName}: ${prompt}`);
    }
  };

  // Placeholder for clearing context
  const handleClearContext = () => {
    setMessages([]);
    console.log("Chat context cleared.");
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-2/5 bg-slate-800 border-t border-slate-700 text-slate-100 flex flex-col z-[1000] p-4 shadow-[0_-2px_15px_rgba(0,0,0,0.3)] rounded-t-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-slate-200">Chat with AI</h2>
        <div className="flex items-center">
          <button
            onClick={handleClearContext}
            title="Clear Chat History"
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded"
          >
            <RefreshCcw size={18} />
          </button>
          <button
            onClick={onClose}
            title="Close Panel"
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Conversation Area */}
      <div className="flex-grow overflow-y-auto mb-3 p-3 bg-slate-900 rounded-md scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800">
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
          <FileText size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
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
    </div>
  );
};

export default ChatPanel;
