import React from 'react';
import { ChevronLeft } from 'lucide-react';

const Graph = ({ collapsed }) => (
  <aside className="flex flex-col h-full bg-zinc-900/95 backdrop-blur-xl border-r border-zinc-700/50 transition-all duration-300 w-72">
    <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-700/50">
       <span className="text-sm font-semibold text-zinc-100">Graph</span>
      <button onClick={collapsed} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded-lg transition-colors">
        <ChevronLeft size={20} />
      </button>
    </div>
      <div className="p-4">
        {/* Graph content */}
      </div>
  </aside>
);

export default Graph; 