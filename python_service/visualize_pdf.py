#!/usr/bin/env python3
"""
PDF Knowledge Graph Visualizer
Processes a PDF file and creates an interactive visualization of connections
"""

import requests
import base64
import json
import time
import os
import sys
from pathlib import Path
import webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler
import threading
import tempfile

class PDFVisualizer:
    def __init__(self, service_url="http://localhost:8000"):
        self.service_url = service_url
        self.temp_dir = None
        
    def process_pdf(self, pdf_path: str) -> dict:
        """
        Process a PDF file using the document processing service
        
        Args:
            pdf_path: Path to the PDF file
            
        Returns:
            Processing results including text, embeddings, and graph data
        """
        print(f"📄 Processing PDF: {pdf_path}")
        
        # Read and encode the PDF file
        with open(pdf_path, 'rb') as f:
            pdf_content = f.read()
        
        pdf_base64 = base64.b64encode(pdf_content).decode()
        
        # Prepare request data
        request_data = {
            "file_id": Path(pdf_path).stem,
            "content": pdf_base64,
            "mime_type": "application/pdf",
            "filename": Path(pdf_path).name
        }
        
        # Send request to processing service
        try:
            print("🔄 Sending to processing service...")
            response = requests.post(f"{self.service_url}/process-pdf", json=request_data)
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Processing completed in {result.get('processing_time', 0):.2f}s")
                print(f"📊 Extracted {result.get('metadata', {}).get('word_count', 0)} words")
                print(f"🕸️  Generated {result.get('graph_data', {}).get('total_nodes', 0)} graph nodes")
                return result
            else:
                print(f"❌ Processing failed: {response.status_code}")
                print(response.text)
                return None
                
        except Exception as e:
            print(f"❌ Error processing PDF: {e}")
            return None
    
    def create_visualization(self, processing_result: dict) -> str:
        """
        Create an interactive HTML visualization of the knowledge graph
        
        Args:
            processing_result: Results from PDF processing
            
        Returns:
            Path to the generated HTML file
        """
        print("🎨 Creating visualization...")
        
        # Debug the processing result structure
        print(f"🔍 DEBUG: Processing result keys: {list(processing_result.keys())}")
        print(f"🔍 DEBUG: graph_data key exists: {'graph_data' in processing_result}")
        
        # Extract graph data
        graph_data = processing_result.get('graph_data', {})
        text_content = processing_result.get('text_content', '')
        metadata = processing_result.get('metadata', {})
        
        print(f"🔍 DEBUG: graph_data type: {type(graph_data)}")
        print(f"🔍 DEBUG: graph_data keys: {list(graph_data.keys()) if isinstance(graph_data, dict) else 'Not a dict'}")
        print(f"🔍 DEBUG: Full graph_data: {graph_data}")
        
        # Create temporary directory for visualization files
        self.temp_dir = tempfile.mkdtemp(prefix="pdf_viz_")
        
        # Generate HTML visualization
        html_content = self._generate_html(graph_data, text_content, metadata)
        
        # Save HTML file
        html_path = os.path.join(self.temp_dir, "visualization.html")
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        print(f"📁 Visualization saved to: {html_path}")
        return html_path
    
    def _generate_html(self, graph_data: dict, text_content: str, metadata: dict) -> str:
        """Generate the HTML content for the visualization"""
        
        # Handle nested graph_data structure
        if 'graph_data' in graph_data:
            # The actual graph data is nested inside graph_data
            actual_graph_data = graph_data.get('graph_data', {})
            nodes = actual_graph_data.get('nodes', [])
            edges = actual_graph_data.get('edges', [])
        else:
            # Direct structure
            nodes = graph_data.get('nodes', [])
            edges = graph_data.get('edges', [])
        
        print(f"🔍 DEBUG: Visualization - Raw nodes: {len(nodes)}")
        print(f"🔍 DEBUG: Visualization - Raw edges: {len(edges)}")
        
        # Create node data for visualization with better formatting
        node_data = []
        for node in nodes:
            # Extract the actual entity name from the node data
            node_name = node.get('name', node.get('value', node.get('id', '')))
            node_type = node.get('type', 'concept')
            
            # Create a more readable label
            if node_type == 'document':
                label = f"📄 {node.get('title', 'Document')}"
            elif node_type == 'concepts':
                label = node_name
            elif node_type == 'keywords':
                label = f"🔑 {node_name}"
            elif node_type == 'numbers':
                label = f"🔢 {node_name}"
            else:
                label = node_name
            
            node_data.append({
                'id': node.get('id', ''),
                'label': label,
                'type': node_type,
                'weight': node.get('weight', 1),
                'description': node.get('description', f'{node_type}: {node_name}'),
                'original_name': node_name
            })
        
        # Create edge data for visualization
        edge_data = []
        for edge in edges:
            edge_data.append({
                'source': edge.get('source', ''),
                'target': edge.get('target', ''),
                'relationship': edge.get('relation', 'related'),
                'weight': edge.get('weight', 1)
            })
        
        print(f"🔍 DEBUG: Visualization - Processed nodes: {len(node_data)}")
        print(f"🔍 DEBUG: Visualization - Processed edges: {len(edge_data)}")
        print(f"🔍 DEBUG: Sample nodes: {node_data[:5]}")
        print(f"🔍 DEBUG: Sample edges: {edge_data[:5]}")
        
        html_template = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PDF Knowledge Graph Visualization</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }}
        
        .container {{
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }}
        
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }}
        
        .header h1 {{
            margin: 0;
            font-size: 2.5em;
            font-weight: 300;
        }}
        
        .stats {{
            display: flex;
            justify-content: space-around;
            margin-top: 20px;
            flex-wrap: wrap;
        }}
        
        .stat {{
            text-align: center;
            padding: 10px;
        }}
        
        .stat-value {{
            font-size: 2em;
            font-weight: bold;
        }}
        
        .stat-label {{
            font-size: 0.9em;
            opacity: 0.8;
        }}
        
        .content {{
            display: flex;
            height: 600px;
        }}
        
        .graph-container {{
            flex: 2;
            position: relative;
            background: #f8f9fa;
        }}
        
        .sidebar {{
            flex: 1;
            padding: 20px;
            background: white;
            border-left: 1px solid #e9ecef;
            overflow-y: auto;
        }}
        
        .controls {{
            margin-bottom: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
        }}
        
        .controls h3 {{
            margin-top: 0;
            color: #495057;
        }}
        
        .control-group {{
            margin-bottom: 15px;
        }}
        
        .control-group label {{
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
            color: #495057;
        }}
        
        .control-group input, .control-group select {{
            width: 100%;
            padding: 8px;
            border: 1px solid #ced4da;
            border-radius: 4px;
            font-size: 14px;
        }}
        
        .node-info {{
            background: #e3f2fd;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 15px;
        }}
        
        .node-info h4 {{
            margin-top: 0;
            color: #1976d2;
        }}
        
        .text-preview {{
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            max-height: 200px;
            overflow-y: auto;
            font-size: 14px;
            line-height: 1.5;
        }}
        
        .text-preview h4 {{
            margin-top: 0;
            color: #495057;
        }}
        
        .node {{
            cursor: pointer;
            transition: all 0.3s ease;
        }}
        
        .node:hover {{
            stroke-width: 3px;
        }}
        
        .link {{
            stroke: #999;
            stroke-opacity: 0.6;
            transition: all 0.3s ease;
        }}
        
        .link:hover {{
            stroke-opacity: 1;
            stroke-width: 2px;
        }}
        
        .tooltip {{
            position: absolute;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            pointer-events: none;
            z-index: 1000;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 PDF Knowledge Graph</h1>
            <div class="stats">
                <div class="stat">
                    <div class="stat-value">{len(nodes)}</div>
                    <div class="stat-label">Concepts</div>
                </div>
                <div class="stat">
                    <div class="stat-value">{len(edges)}</div>
                    <div class="stat-label">Connections</div>
                </div>
                <div class="stat">
                    <div class="stat-value">{metadata.get('word_count', 0)}</div>
                    <div class="stat-label">Words</div>
                </div>
                <div class="stat">
                    <div class="stat-value">{metadata.get('total_pages', 0)}</div>
                    <div class="stat-label">Pages</div>
                </div>
            </div>
        </div>
        
        <div class="content">
            <div class="graph-container" id="graph">
                <!-- D3.js visualization will be rendered here -->
            </div>
            
            <div class="sidebar">
                <div class="controls">
                    <h3>🎛️ Controls</h3>
                    <div class="control-group">
                        <label for="nodeSize">Node Size:</label>
                        <input type="range" id="nodeSize" min="3" max="15" value="8">
                    </div>
                    <div class="control-group">
                        <label for="linkDistance">Link Distance:</label>
                        <input type="range" id="linkDistance" min="30" max="200" value="80">
                    </div>
                    <div class="control-group">
                        <label for="charge">Node Charge:</label>
                        <input type="range" id="charge" min="-200" max="-10" value="-80">
                    </div>
                </div>
                
                <div class="node-info" id="nodeInfo" style="display: none;">
                    <h4>📋 Node Information</h4>
                    <div id="nodeDetails"></div>
                </div>
                
                <div class="text-preview">
                    <h4>📄 Document Preview</h4>
                    <div id="textPreview">{text_content[:500]}{'...' if len(text_content) > 500 else ''}</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Graph data
        const nodes = {json.dumps(node_data)};
        const links = {json.dumps(edge_data)};
        
        console.log('Graph data loaded:', {{ nodes: nodes.length, links: links.length }});
        console.log('Sample nodes:', nodes.slice(0, 3));
        console.log('Sample links:', links.slice(0, 3));
        
        // Setup
        const width = document.getElementById('graph').clientWidth;
        const height = document.getElementById('graph').clientHeight;
        
        // Color scale for node types
        const color = d3.scaleOrdinal()
            .domain(['document', 'concepts', 'keywords', 'numbers'])
            .range(['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4']);
        
        // Create SVG
        const svg = d3.select("#graph")
            .append("svg")
            .attr("width", width)
            .attr("height", height);
        
        // Create tooltip
        const tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);
        
        // Create force simulation
        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id).distance(80))
            .force("charge", d3.forceManyBody().strength(-80))
            .force("center", d3.forceCenter(width / 2, height / 2).strength(0.1))
            .force("collision", d3.forceCollide().radius(35));
        
        // Create links
        const link = svg.append("g")
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("class", "link")
            .attr("stroke-width", 1);
        
        // Create nodes
        const node = svg.append("g")
            .selectAll("circle")
            .data(nodes)
            .join("circle")
            .attr("class", "node")
            .attr("r", d => d.type === 'document' ? 12 : 8)
            .attr("fill", d => color(d.type))
            .call(drag(simulation))
            .on("mouseover", showTooltip)
            .on("mouseout", hideTooltip)
            .on("click", showNodeInfo);
        
        // Add labels
        const label = svg.append("g")
            .selectAll("text")
            .data(nodes)
            .join("text")
            .text(d => d.label.length > 20 ? d.label.substring(0, 20) + '...' : d.label)
            .attr("x", 12)
            .attr("dy", ".35em")
            .style("font-size", "10px")
            .style("pointer-events", "none")
            .style("fill", "#333");
        
        // Update positions on simulation tick with padding
        const padding = 50; // Keep nodes away from edges
        simulation.on("tick", () => {{
            link
                .attr("x1", d => clamp(d.source.x, padding, width - padding))
                .attr("y1", d => clamp(d.source.y, padding, height - padding))
                .attr("x2", d => clamp(d.target.x, padding, width - padding))
                .attr("y2", d => clamp(d.target.y, padding, height - padding));
            
            node
                .attr("cx", d => clamp(d.x, padding, width - padding))
                .attr("cy", d => clamp(d.y, padding, height - padding));
            
            label
                .attr("x", d => clamp(d.x + 12, padding, width - padding))
                .attr("y", d => clamp(d.y, padding, height - padding));
        }});
        
        // Drag functions
        function drag(simulation) {{
            function dragstarted(event) {{
                if (!event.active) simulation.alphaTarget(0.3).restart();
                event.subject.fx = event.subject.x;
                event.subject.fy = event.subject.y;
            }}
            
            function dragged(event) {{
                event.subject.fx = event.x;
                event.subject.fy = event.y;
            }}
            
            function dragended(event) {{
                if (!event.active) simulation.alphaTarget(0);
                event.subject.fx = null;
                event.subject.fy = null;
            }}
            
            return d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended);
        }}
        
        // Tooltip functions
        function showTooltip(event, d) {{
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`<strong>${{d.label}}</strong><br/>Type: ${{d.type}}<br/>Weight: ${{d.weight}}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        }}
        
        function hideTooltip() {{
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        }}
        
        // Node info functions
        function showNodeInfo(event, d) {{
            const nodeInfo = document.getElementById('nodeInfo');
            const nodeDetails = document.getElementById('nodeDetails');
            
            nodeDetails.innerHTML = `
                <p><strong>Label:</strong> ${{d.label}}</p>
                <p><strong>Type:</strong> ${{d.type}}</p>
                <p><strong>Weight:</strong> ${{d.weight}}</p>
                <p><strong>Description:</strong> ${{d.description}}</p>
                <p><strong>Original Name:</strong> ${{d.original_name}}</p>
            `;
            
            nodeInfo.style.display = 'block';
        }}
        
        // Control functions with better defaults
        document.getElementById('nodeSize').addEventListener('input', function(e) {{
            const size = parseInt(e.target.value);
            node.attr("r", d => d.type === 'document' ? size + 4 : size);
        }});
        
        document.getElementById('linkDistance').addEventListener('input', function(e) {{
            simulation.force("link").distance(parseInt(e.target.value));
            simulation.alpha(1).restart();
        }});
        
        document.getElementById('charge').addEventListener('input', function(e) {{
            simulation.force("charge").strength(parseInt(e.target.value));
            simulation.alpha(1).restart();
        }});
        
        // Handle window resize
        window.addEventListener('resize', function() {{
            const newWidth = document.getElementById('graph').clientWidth;
            const newHeight = document.getElementById('graph').clientHeight;
            
            svg.attr("width", newWidth).attr("height", newHeight);
            simulation.force("center", d3.forceCenter(newWidth / 2, newHeight / 2));
            simulation.alpha(1).restart();
        }});
        
        // Helper function to clamp values
        function clamp(val, min, max) {{
            return Math.max(min, Math.min(max, val));
        }}
    </script>
</body>
</html>
        """
        
        return html_template
    
    def open_visualization(self, html_path: str):
        """Open the visualization in the default web browser"""
        print("🌐 Opening visualization in browser...")
        webbrowser.open(f"file://{html_path}")
    
    def cleanup(self):
        """Clean up temporary files"""
        if self.temp_dir and os.path.exists(self.temp_dir):
            import shutil
            shutil.rmtree(self.temp_dir)
            print(f"🧹 Cleaned up temporary files: {self.temp_dir}")

def main():
    """Main function to run the PDF visualizer"""
    if len(sys.argv) != 2:
        print("Usage: python visualize_pdf.py <path_to_pdf>")
        print("Example: python visualize_pdf.py test_pdf.pdf")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    if not os.path.exists(pdf_path):
        print(f"❌ Error: PDF file '{pdf_path}' not found")
        sys.exit(1)
    
    # Create visualizer
    visualizer = PDFVisualizer()
    
    try:
        # Process the PDF
        result = visualizer.process_pdf(pdf_path)
        
        if result is None:
            print("❌ Failed to process PDF")
            sys.exit(1)
        
        # Create visualization
        html_path = visualizer.create_visualization(result)
        
        # Open in browser
        visualizer.open_visualization(html_path)
        
        print("\n🎉 Visualization complete!")
        print("💡 Tips:")
        print("   - Drag nodes to rearrange the graph")
        print("   - Hover over nodes to see tooltips")
        print("   - Click nodes to see detailed information")
        print("   - Use the controls to adjust the visualization")
        print("\nPress Ctrl+C to exit and clean up...")
        
        # Keep the script running to maintain the visualization
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n👋 Goodbye!")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
    finally:
        visualizer.cleanup()

if __name__ == "__main__":
    main() 