'use client';
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, RefreshCw, Filter, Info, Maximize2 } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import D3 to avoid SSR issues
const GraphVisualization = dynamic(() => import('./GraphVisualization'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-400"></div>
    </div>
  )
});

const Graph = ({ collapsed, onFullScreen }) => {
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGraphData();
  }, []);

  const fetchGraphData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/documents/graph');
      const data = await response.json();
      
      if (data.success) {
        setGraphData(data.graph);
        setPdfs(data.pdfs);
      } else {
        setError('Failed to fetch graph data');
      }
    } catch (error) {
      console.error('Error fetching graph data:', error);
      setError('Error loading graph data');
    } finally {
      setLoading(false);
    }
  };

  const handleCollapse = () => {
    if (typeof collapsed === 'function') {
      collapsed();
    }
  };

  const getFilteredData = () => {
    if (filterType === 'all') return graphData;
    
    const filteredNodes = graphData.nodes.filter(node => node.type === filterType);
    const filteredEdges = graphData.edges.filter(edge => {
      const sourceNode = graphData.nodes.find(n => n.id === edge.source);
      const targetNode = graphData.nodes.find(n => n.id === edge.target);
      return sourceNode?.type === filterType || targetNode?.type === filterType;
    });
    
    return { nodes: filteredNodes, edges: filteredEdges };
  };

  const getStats = () => {
    const stats = {
      pdfs: graphData.nodes.filter(n => n.type === 'pdf').length,
      concepts: graphData.nodes.filter(n => n.type === 'concept').length,
      topics: graphData.nodes.filter(n => n.type === 'topic').length,
      folders: graphData.nodes.filter(n => n.type === 'folder').length,
      connections: graphData.edges.length
    };
    return stats;
  };

  const stats = getStats();
  const filteredData = getFilteredData();

  return (
    <aside className="flex flex-col h-full bg-zinc-900/95 backdrop-blur-xl border-r border-zinc-700/50 transition-all duration-300 w-96">
      <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-700/50">
        <span className="text-sm font-semibold text-zinc-100">PDF Graph</span>
        <div className="flex items-center space-x-2">
          <button 
            onClick={fetchGraphData}
            disabled={loading}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh graph"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={handleCollapse} 
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={onFullScreen}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded-lg transition-colors"
            title="Full screen"
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {/* Stats */}
        <div className="p-4 border-b border-zinc-700/50">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <div className="text-zinc-400">PDFs</div>
              <div className="text-white font-semibold">{stats.pdfs}</div>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <div className="text-zinc-400">Connections</div>
              <div className="text-white font-semibold">{stats.connections}</div>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <div className="text-zinc-400">Concepts</div>
              <div className="text-white font-semibold">{stats.concepts}</div>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <div className="text-zinc-400">Topics</div>
              <div className="text-white font-semibold">{stats.topics}</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-zinc-700/50">
          <div className="flex items-center space-x-2 mb-3">
            <Filter size={14} className="text-zinc-400" />
            <span className="text-xs text-zinc-400">Filter by type</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {['all', 'pdf', 'concept', 'topic', 'folder'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${
                  filterType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Graph Visualization */}
        <div className="flex-1 min-h-0">
          {error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-red-400 mb-2">⚠️</div>
                <div className="text-sm text-zinc-400">{error}</div>
                <button 
                  onClick={fetchGraphData}
                  className="mt-2 text-xs text-blue-400 hover:text-blue-300"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-400 mx-auto mb-2"></div>
                <div className="text-sm text-zinc-400">Loading graph...</div>
              </div>
            </div>
          ) : filteredData.nodes.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-zinc-400 mb-2">📄</div>
                <div className="text-sm text-zinc-400">No PDFs processed yet</div>
                <div className="text-xs text-zinc-500 mt-1">Upload PDFs to see connections</div>
              </div>
            </div>
          ) : (
            <GraphVisualization
              data={filteredData}
              onNodeClick={setSelectedNode}
              selectedNode={selectedNode}
            />
          )}
        </div>

        {/* Selected Node Details */}
        {selectedNode && (
          <div className="p-4 border-t border-zinc-700/50 bg-zinc-800/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Info size={14} className="text-zinc-400" />
                <span className="text-sm font-medium text-zinc-100">Details</span>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-zinc-400 hover:text-white text-xs"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-zinc-400">Name:</span>
                <span className="text-zinc-100 ml-2">{selectedNode.label}</span>
              </div>
              <div>
                <span className="text-zinc-400">Type:</span>
                <span className="text-zinc-100 ml-2 capitalize">{selectedNode.type}</span>
              </div>
              {selectedNode.metadata && (
                <div>
                  <span className="text-zinc-400">Words:</span>
                  <span className="text-zinc-100 ml-2">{selectedNode.metadata.word_count?.toLocaleString() || 'N/A'}</span>
                </div>
              )}
              {selectedNode.summary && (
                <div>
                  <span className="text-zinc-400">Summary:</span>
                  <div className="text-zinc-100 mt-1 text-xs leading-relaxed">
                    {selectedNode.summary.length > 100 
                      ? selectedNode.summary.substring(0, 100) + '...'
                      : selectedNode.summary
                    }
                  </div>
                </div>
              )}
              {selectedNode.file_path && (
                <div>
                  <span className="text-zinc-400">Path:</span>
                  <div className="text-zinc-100 mt-1 text-xs font-mono">
                    {selectedNode.file_path}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Graph; 