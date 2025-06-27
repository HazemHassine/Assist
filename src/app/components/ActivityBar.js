import React from 'react';
import { FileText, Zap, Cloud, Settings, Network } from 'lucide-react';

const ActivityBar = ({ collapsed, activeTab, onTabSelect }) => {
    const tabs = [
        { id: 'sync', icon: Cloud, label: 'Drive Sync' },
        { id: 'quick', icon: Zap, label: 'Quick Actions' },
        { id: 'graph', icon: Network, label: 'Graph' },
    ];

    return (
        <aside className="flex flex-col items-center h-full bg-zinc-900/95 border-r border-zinc-700/50 transition-all duration-300 w-16">
            {/* App Logo at top */}
            <div className="mt-4 mb-6 flex items-center justify-center">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    A
                </div>
            </div>
            {/* Tab icons */}
            <nav className="mt-4 flex flex-col items-center space-y-4 flex-1">
                {tabs.map(({ id, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => { onTabSelect(id); collapsed(id); }}
                        className={`p-2 rounded-lg transition-colors ${activeTab === id
                            ? 'text-blue-400 bg-zinc-700/50'
                            : 'text-zinc-400 hover:bg-zinc-700/50 hover:text-white'
                            }`}
                        title={id}
                    >
                        <Icon size={20} />
                    </button>
                ))}
            </nav>

            {/* Settings at bottom */}
            <button
                onClick={() => { onTabSelect('settings'); collapsed("settings"); }}
                className={`mb-4 p-2 rounded-lg transition-colors ${activeTab === 'settings'
                    ? 'text-blue-400 bg-zinc-700/50'
                    : 'text-zinc-400 hover:bg-zinc-700/50 hover:text-white'
                    }`}
                title="Settings"
            >
                <Settings size={20} />
            </button>
        </aside>
    );
};
export default ActivityBar;