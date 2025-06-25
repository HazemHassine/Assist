"use client";
import React from 'react';
import { ChevronLeft } from 'lucide-react';

export default function SettingsPanel({ collapsed }) {
  return (
    <aside className="flex flex-col h-full bg-zinc-900/95 backdrop-blur-xl border-r border-zinc-700/50 transition-all duration-300 w-72">
      <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-700/50">
        <span className="text-sm font-semibold text-zinc-100">Settings</span>
        <button
          onClick={collapsed}
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded-lg transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <p className="text-sm text-zinc-400">Settings UI goes here.</p>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-green-400">● Connected</span>
          <button
            className="text-sm text-red-400 hover:text-red-200 cursor-not-allowed"
            disabled
          >
            Disconnect Google Drive
          </button>
        </div>

        <button
          disabled
          className="px-3 py-2 bg-blue-600/50 text-sm text-white/70 rounded cursor-not-allowed"
        >
          Connect Google Drive
        </button>
      </div>
    </aside>
  );
}
