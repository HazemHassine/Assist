'use client';
import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Filter, Info } from 'lucide-react';
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

const GraphFullScreen = ({ onClose }) => {
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
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
    <div className="flex-1 flex flex-col min-h-0 bg-zinc-900">
      {/* Header */}
      <div className="h-14 bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-700/50 flex items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold text-zinc-100">PDF Graph - Full Screen</h1>
          
          {/* Stats */}
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-zinc-300">{stats.pdfs} PDFs</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-zinc-300">{stats.concepts} Concepts</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-zinc-300">{stats.topics} Topics</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-zinc-300">{stats.connections} Connections</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Filters */}
          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-zinc-400" />
            <div className="flex space-x-1">
              {['all', 'pdf', 'concept', 'topic', 'folder'].map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
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

          {/* Refresh Button */}
          <button 
            onClick={fetchGraphData}
            disabled={loading}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh graph"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>

          {/* Close Button */}
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded-lg transition-colors"
            title="Exit full screen"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Graph Content */}
      <div className="flex-1 flex min-h-0 bg-zinc-900">
        {/* Main Graph Area */}
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
              fullScreen={true}
            />
          )}
        </div>

        {/* Selected Node Details Panel */}
        {selectedNode && (
          <div className="w-80 bg-zinc-900/95 backdrop-blur-xl border-l border-zinc-700/50 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-zinc-700/50">
              <div className="flex items-center space-x-2">
                <Info size={16} className="text-zinc-400" />
                <span className="text-sm font-medium text-zinc-100">Node Details</span>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                ×
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4 text-sm">
                <div>
                  <span className="text-zinc-400">Name:</span>
                  <div className="text-zinc-100 mt-1 font-medium">{selectedNode.label}</div>
                </div>
                <div>
                  <span className="text-zinc-400">Type:</span>
                  <div className="text-zinc-100 mt-1 capitalize">{selectedNode.type}</div>
                </div>
                {selectedNode.metadata && (
                  <div>
                    <span className="text-zinc-400">Words:</span>
                    <div className="text-zinc-100 mt-1">{selectedNode.metadata.word_count?.toLocaleString() || 'N/A'}</div>
                  </div>
                )}
                {selectedNode.summary && (
                  <div>
                    <span className="text-zinc-400">Summary:</span>
                    <div className="text-zinc-100 mt-1 leading-relaxed">
                      {selectedNode.summary}
                    </div>
                  </div>
                )}
                {selectedNode.file_path && (
                  <div>
                    <span className="text-zinc-400">Path:</span>
                    <div className="text-zinc-100 mt-1 font-mono text-xs">
                      {selectedNode.file_path}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GraphFullScreen; 