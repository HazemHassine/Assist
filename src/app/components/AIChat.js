import React, { useState } from 'react';
import { X, Send } from 'lucide-react';

const AIChat = ({ isOpen, onClose, currentContent }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content:
        "Hello! I'm your AI writing assistant. I can help you with:\n\n• Improving your markdown content\n• Suggesting better structure\n• Grammar and style corrections\n• Content ideas and expansion\n\nWhat would you like to work on?"
    }
  ]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: input
    };

    setMessages((prev) => [...prev, userMessage]);

    setTimeout(() => {
      const aiResponses = [
        'I can help you improve that section. Consider adding more specific examples and breaking it into smaller paragraphs for better readability.',
        'Your markdown structure looks good! I notice you could enhance it with better headings and more descriptive content.',
        "That's an interesting topic. Would you like me to suggest some additional points to expand on this section?",
        'I see some opportunities to improve the flow. Consider reorganizing these points in order of importance.',
        'Great content! You might want to add some code examples or bullet points to make it more engaging.',
        'This section could benefit from a brief introduction paragraph. Would you like me to suggest one?'
      ];

      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiResponses[Math.floor(Math.random() * aiResponses.length)]
      };

      setMessages((prev) => [...prev, aiMessage]);
    }, 1000);

    setInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-96 h-full bg-zinc-900/98 backdrop-blur-xl border-l border-zinc-700/50 flex flex-col shadow-2xl">
      <div className="p-5 border-b border-zinc-700/50 flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
          AI
        </div>
        <span className="font-semibold text-white">AI Assistant</span>
        <button
          onClick={onClose}
          className="ml-auto p-2 hover:bg-zinc-700/50 rounded-lg transition-colors text-zinc-400 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 p-5 overflow-y-auto space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
              message.type === 'user'
                ? 'bg-blue-500/20 text-zinc-100 ml-auto rounded-br-sm'
                : 'bg-zinc-700/50 text-zinc-200 mr-auto rounded-bl-sm'
            }`}
          >
            {message.content.split('\n').map((line, index) => (
              <div key={index}>{line}</div>
            ))}
          </div>
        ))}
      </div>

      <div className="p-5 border-t border-zinc-700/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your document..."
            className="flex-1 bg-zinc-700/50 border border-zinc-600/50 rounded-lg px-4 py-3 text-sm text-zinc-100 placeholder-zinc-400 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;