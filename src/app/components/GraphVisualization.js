'use client';
import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const GraphVisualization = ({ data, onNodeClick, selectedNode, fullScreen = false }) => {
  const svgRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [simulation, setSimulation] = useState(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!dimensions.width || !dimensions.height || !data.nodes.length) return;

    // Clear previous graph
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current);
    const width = dimensions.width;
    const height = dimensions.height;

    // Create zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4]) // Min zoom 0.1x, max zoom 4x
      .on("zoom", (event) => {
        graphContainer.attr("transform", event.transform);
        // Update background pattern transform to stay fixed
        backgroundPattern.attr("transform", event.transform);
      });

    // Apply zoom to SVG
    svg.call(zoom);

    // Create a container group for all graph elements
    const graphContainer = svg.append("g")
      .attr("class", "graph-container");

    // Create background pattern
    const defs = svg.append("defs");
    const pattern = defs.append("pattern")
      .attr("id", "grid-pattern")
      .attr("width", 20)
      .attr("height", 20)
      .attr("patternUnits", "userSpaceOnUse");

    // Add dots to pattern
    pattern.append("circle")
      .attr("cx", 10)
      .attr("cy", 10)
      .attr("r", 1)
      .attr("fill", "#374151")
      .attr("opacity", 0.3);

    // Add background with pattern - make it much larger than viewport for infinite effect
    const backgroundPattern = svg.append("rect")
      .attr("width", Math.max(width * 3, 3000))
      .attr("height", Math.max(height * 3, 3000))
      .attr("x", -width)
      .attr("y", -height)
      .attr("fill", "url(#grid-pattern)");

    // Create color scale for different node types
    const colorScale = d3.scaleOrdinal()
      .domain(['pdf', 'concept', 'topic', 'folder'])
      .range(['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b']);

    // Create force simulation
    const newSimulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.edges).id(d => d.id).distance(80))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(25));

    setSimulation(newSimulation);

    // Create arrow marker for directed edges
    graphContainer.append("defs").selectAll("marker")
      .data(["arrow"])
      .enter().append("marker")
      .attr("id", d => d)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 12)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#6b7280");

    // Create links
    const link = graphContainer.append("g")
      .selectAll("line")
      .data(data.edges)
      .enter().append("line")
      .attr("stroke", "#6b7280")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", d => Math.sqrt(d.weight || 1) * 1.5)
      .attr("marker-end", "url(#arrow)");

    // Create drag behavior
    const drag = d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);

    // Create nodes
    const node = graphContainer.append("g")
      .selectAll("g")
      .data(data.nodes)
      .enter().append("g")
      .attr("class", "node");

    // Add circles to nodes with explicit drag behavior
    node.append("circle")
      .attr("r", d => {
        const baseSize = d.type === 'pdf' ? 12 : 8;
        return Math.max(baseSize, Math.min(20, (d.weight || 1) * 3));
      })
      .attr("fill", d => {
        if (selectedNode === d.id) return "#3b82f6";
        return colorScale(d.type);
      })
      .attr("stroke", d => selectedNode === d.id ? "#1d4ed8" : "#374151")
      .attr("stroke-width", d => selectedNode === d.id ? 3 : 1.5)
      .style("cursor", "pointer")
      .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.3))")
      .call(drag);

    // Add labels to nodes
    node.append("text")
      .text(d => {
        const label = d.label || d.id;
        return label.length > 15 ? label.substring(0, 15) + '...' : label;
      })
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .attr("font-size", "10px")
      .attr("font-weight", "500")
      .attr("fill", "#f3f4f6")
      .style("pointer-events", "none")
      .style("text-shadow", "0 1px 2px rgba(0,0,0,0.8)");

    // Add tooltips
    node.append("title")
      .text(d => {
        let tooltip = d.label || d.id;
        if (d.type === 'pdf' && d.metadata) {
          tooltip += `\nWords: ${d.metadata.word_count?.toLocaleString() || 'N/A'}`;
          tooltip += `\nPages: ${d.metadata.total_pages || 'N/A'}`;
        }
        if (d.weight) {
          tooltip += `\nWeight: ${d.weight.toFixed(2)}`;
        }
        if (d.frequency) {
          tooltip += `\nFrequency: ${d.frequency}`;
        }
        return tooltip;
      });

    // Add click handlers to the node group
    node.on("click", (event, d) => {
      onNodeClick(d.id);
    });

    // Add hover effects to the node group
    node.on("mouseover", function(event, d) {
      if (selectedNode !== d.id) {
        d3.select(this).select("circle")
          .attr("stroke", "#60a5fa")
          .attr("stroke-width", 2.5);
      }
      
      // Highlight connected links
      link.style("stroke-opacity", l => 
        l.source.id === d.id || l.target.id === d.id ? 0.8 : 0.1
      );
    })
    .on("mouseout", function(event, d) {
      if (selectedNode !== d.id) {
        d3.select(this).select("circle")
          .attr("stroke", "#374151")
          .attr("stroke-width", 1.5);
      }
      
      // Restore link opacity
      link.style("stroke-opacity", 0.4);
    });

    // Update positions on simulation tick
    newSimulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // Drag functions for nodes
    function dragstarted(event, d) {
      if (!event.active) newSimulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) newSimulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Add zoom controls at the very end to ensure they're on top
    if (fullScreen) {
      // For full screen, add controls to SVG so they stay fixed
      const zoomControls = svg.append("g")
        .attr("class", "zoom-controls")
        .attr("transform", `translate(20, 20)`)
        .style("pointer-events", "all");

      // Zoom in button
      zoomControls.append("circle")
        .attr("r", 18)
        .attr("fill", "rgba(0, 0, 0, 0.8)")
        .attr("stroke", "#6b7280")
        .attr("stroke-width", 1.5)
        .style("cursor", "pointer")
        .style("transition", "all 0.2s ease")
        .on("click", (event) => {
          console.log("Zoom in clicked!");
          event.stopPropagation();
          // Add click feedback
          d3.select(event.target)
            .attr("fill", "rgba(59, 130, 246, 0.8)")
            .attr("stroke", "#3b82f6")
            .attr("stroke-width", 2);
          
          svg.transition().duration(300).call(
            zoom.scaleBy, 1.5
          );
          
          // Reset after animation
          setTimeout(() => {
            d3.select(event.target)
              .attr("fill", "rgba(0, 0, 0, 0.8)")
              .attr("stroke", "#6b7280")
              .attr("stroke-width", 1.5);
          }, 300);
        })
        .on("mousedown", (event) => {
          console.log("Zoom in mousedown!");
          event.stopPropagation();
        })
        .on("mouseover", function(event) {
          console.log("Zoom in hover!");
          d3.select(this)
            .attr("fill", "rgba(0, 0, 0, 0.9)")
            .attr("stroke", "#9ca3af")
            .attr("stroke-width", 2);
        })
        .on("mouseout", function(event) {
          console.log("Zoom in mouseout!");
          d3.select(this)
            .attr("fill", "rgba(0, 0, 0, 0.8)")
            .attr("stroke", "#6b7280")
            .attr("stroke-width", 1.5);
        });

      zoomControls.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("fill", "#f3f4f6")
        .attr("font-size", "18px")
        .attr("font-weight", "bold")
        .style("pointer-events", "none")
        .text("+");

      // Zoom out button
      zoomControls.append("circle")
        .attr("r", 18)
        .attr("fill", "rgba(0, 0, 0, 0.8)")
        .attr("stroke", "#6b7280")
        .attr("stroke-width", 1.5)
        .style("cursor", "pointer")
        .style("transition", "all 0.2s ease")
        .attr("transform", "translate(0, 45)")
        .on("click", (event) => {
          console.log("Zoom out clicked!");
          event.stopPropagation();
          // Add click feedback
          d3.select(event.target)
            .attr("fill", "rgba(59, 130, 246, 0.8)")
            .attr("stroke", "#3b82f6")
            .attr("stroke-width", 2);
          
          svg.transition().duration(300).call(
            zoom.scaleBy, 0.75
          );
          
          // Reset after animation
          setTimeout(() => {
            d3.select(event.target)
              .attr("fill", "rgba(0, 0, 0, 0.8)")
              .attr("stroke", "#6b7280")
              .attr("stroke-width", 1.5);
          }, 300);
        })
        .on("mousedown", (event) => {
          console.log("Zoom out mousedown!");
          event.stopPropagation();
        })
        .on("mouseover", function(event) {
          console.log("Zoom out hover!");
          d3.select(this)
            .attr("fill", "rgba(0, 0, 0, 0.9)")
            .attr("stroke", "#9ca3af")
            .attr("stroke-width", 2);
        })
        .on("mouseout", function(event) {
          console.log("Zoom out mouseout!");
          d3.select(this)
            .attr("fill", "rgba(0, 0, 0, 0.8)")
            .attr("stroke", "#6b7280")
            .attr("stroke-width", 1.5);
        });

      zoomControls.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("fill", "#f3f4f6")
        .attr("font-size", "18px")
        .attr("font-weight", "bold")
        .style("pointer-events", "none")
        .attr("transform", "translate(0, 45)")
        .text("−");

      // Reset zoom button
      zoomControls.append("circle")
        .attr("r", 18)
        .attr("fill", "rgba(0, 0, 0, 0.8)")
        .attr("stroke", "#6b7280")
        .attr("stroke-width", 1.5)
        .style("cursor", "pointer")
        .style("transition", "all 0.2s ease")
        .attr("transform", "translate(0, 90)")
        .on("click", (event) => {
          console.log("Reset zoom clicked!");
          event.stopPropagation();
          // Add click feedback
          d3.select(event.target)
            .attr("fill", "rgba(59, 130, 246, 0.8)")
            .attr("stroke", "#3b82f6")
            .attr("stroke-width", 2);
          
          svg.transition().duration(300).call(
            zoom.transform, d3.zoomIdentity
          );
          
          // Reset after animation
          setTimeout(() => {
            d3.select(event.target)
              .attr("fill", "rgba(0, 0, 0, 0.8)")
              .attr("stroke", "#6b7280")
              .attr("stroke-width", 1.5);
          }, 300);
        })
        .on("mousedown", (event) => {
          console.log("Reset zoom mousedown!");
          event.stopPropagation();
        })
        .on("mouseover", function(event) {
          console.log("Reset zoom hover!");
          d3.select(this)
            .attr("fill", "rgba(0, 0, 0, 0.9)")
            .attr("stroke", "#9ca3af")
            .attr("stroke-width", 2);
        })
        .on("mouseout", function(event) {
          console.log("Reset zoom mouseout!");
          d3.select(this)
            .attr("fill", "rgba(0, 0, 0, 0.8)")
            .attr("stroke", "#6b7280")
            .attr("stroke-width", 1.5);
        });

      zoomControls.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("fill", "#f3f4f6")
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .style("pointer-events", "none")
        .attr("transform", "translate(0, 90)")
        .text("⌂");
    } else {
      // For small screen, add controls to SVG so they stay fixed to viewport
      const zoomControls = svg.append("g")
        .attr("class", "zoom-controls")
        .attr("transform", `translate(20, 20)`)
        .style("pointer-events", "all");

      // Zoom in button
      zoomControls.append("circle")
        .attr("r", 18)
        .attr("fill", "rgba(0, 0, 0, 0.8)")
        .attr("stroke", "#6b7280")
        .attr("stroke-width", 1.5)
        .style("cursor", "pointer")
        .style("transition", "all 0.2s ease")
        .on("click", (event) => {
          console.log("Zoom in clicked!");
          event.stopPropagation();
          // Add click feedback
          d3.select(event.target)
            .attr("fill", "rgba(59, 130, 246, 0.8)")
            .attr("stroke", "#3b82f6")
            .attr("stroke-width", 2);
          
          svg.transition().duration(300).call(
            zoom.scaleBy, 1.5
          );
          
          // Reset after animation
          setTimeout(() => {
            d3.select(event.target)
              .attr("fill", "rgba(0, 0, 0, 0.8)")
              .attr("stroke", "#6b7280")
              .attr("stroke-width", 1.5);
          }, 300);
        })
        .on("mousedown", (event) => {
          console.log("Zoom in mousedown!");
          event.stopPropagation();
        })
        .on("mouseover", function(event) {
          console.log("Zoom in hover!");
          d3.select(this)
            .attr("fill", "rgba(0, 0, 0, 0.9)")
            .attr("stroke", "#9ca3af")
            .attr("stroke-width", 2);
        })
        .on("mouseout", function(event) {
          console.log("Zoom in mouseout!");
          d3.select(this)
            .attr("fill", "rgba(0, 0, 0, 0.8)")
            .attr("stroke", "#6b7280")
            .attr("stroke-width", 1.5);
        });

      zoomControls.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("fill", "#f3f4f6")
        .attr("font-size", "18px")
        .attr("font-weight", "bold")
        .style("pointer-events", "none")
        .text("+");

      // Zoom out button
      zoomControls.append("circle")
        .attr("r", 18)
        .attr("fill", "rgba(0, 0, 0, 0.8)")
        .attr("stroke", "#6b7280")
        .attr("stroke-width", 1.5)
        .style("cursor", "pointer")
        .style("transition", "all 0.2s ease")
        .attr("transform", "translate(0, 45)")
        .on("click", (event) => {
          console.log("Zoom out clicked!");
          event.stopPropagation();
          // Add click feedback
          d3.select(event.target)
            .attr("fill", "rgba(59, 130, 246, 0.8)")
            .attr("stroke", "#3b82f6")
            .attr("stroke-width", 2);
          
          svg.transition().duration(300).call(
            zoom.scaleBy, 0.75
          );
          
          // Reset after animation
          setTimeout(() => {
            d3.select(event.target)
              .attr("fill", "rgba(0, 0, 0, 0.8)")
              .attr("stroke", "#6b7280")
              .attr("stroke-width", 1.5);
          }, 300);
        })
        .on("mousedown", (event) => {
          console.log("Zoom out mousedown!");
          event.stopPropagation();
        })
        .on("mouseover", function(event) {
          console.log("Zoom out hover!");
          d3.select(this)
            .attr("fill", "rgba(0, 0, 0, 0.9)")
            .attr("stroke", "#9ca3af")
            .attr("stroke-width", 2);
        })
        .on("mouseout", function(event) {
          console.log("Zoom out mouseout!");
          d3.select(this)
            .attr("fill", "rgba(0, 0, 0, 0.8)")
            .attr("stroke", "#6b7280")
            .attr("stroke-width", 1.5);
        });

      zoomControls.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("fill", "#f3f4f6")
        .attr("font-size", "18px")
        .attr("font-weight", "bold")
        .style("pointer-events", "none")
        .attr("transform", "translate(0, 45)")
        .text("−");

      // Reset zoom button
      zoomControls.append("circle")
        .attr("r", 18)
        .attr("fill", "rgba(0, 0, 0, 0.8)")
        .attr("stroke", "#6b7280")
        .attr("stroke-width", 1.5)
        .style("cursor", "pointer")
        .style("transition", "all 0.2s ease")
        .attr("transform", "translate(0, 90)")
        .on("click", (event) => {
          console.log("Reset zoom clicked!");
          event.stopPropagation();
          // Add click feedback
          d3.select(event.target)
            .attr("fill", "rgba(59, 130, 246, 0.8)")
            .attr("stroke", "#3b82f6")
            .attr("stroke-width", 2);
          
          svg.transition().duration(300).call(
            zoom.transform, d3.zoomIdentity
          );
          
          // Reset after animation
          setTimeout(() => {
            d3.select(event.target)
              .attr("fill", "rgba(0, 0, 0, 0.8)")
              .attr("stroke", "#6b7280")
              .attr("stroke-width", 1.5);
          }, 300);
        })
        .on("mousedown", (event) => {
          console.log("Reset zoom mousedown!");
          event.stopPropagation();
        })
        .on("mouseover", function(event) {
          console.log("Reset zoom hover!");
          d3.select(this)
            .attr("fill", "rgba(0, 0, 0, 0.9)")
            .attr("stroke", "#9ca3af")
            .attr("stroke-width", 2);
        })
        .on("mouseout", function(event) {
          console.log("Reset zoom mouseout!");
          d3.select(this)
            .attr("fill", "rgba(0, 0, 0, 0.8)")
            .attr("stroke", "#6b7280")
            .attr("stroke-width", 1.5);
        });

      zoomControls.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("fill", "#f3f4f6")
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .style("pointer-events", "none")
        .attr("transform", "translate(0, 90)")
        .text("⌂");
    }

    // Cleanup function
    return () => {
      if (newSimulation) {
        newSimulation.stop();
      }
    };
  }, [data, dimensions, selectedNode, onNodeClick, fullScreen]);

  // Update node colors when selection changes
  useEffect(() => {
    if (!simulation) return;

    const colorScale = d3.scaleOrdinal()
      .domain(['pdf', 'concept', 'topic', 'folder'])
      .range(['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b']);

    d3.select(svgRef.current)
      .selectAll(".node circle")
      .attr("fill", d => {
        if (selectedNode === d.id) return "#3b82f6";
        return colorScale(d.type);
      })
      .attr("stroke", d => selectedNode === d.id ? "#1d4ed8" : "#374151")
      .attr("stroke-width", d => selectedNode === d.id ? 3 : 1.5);
  }, [selectedNode, simulation]);

  if (!data.nodes.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-zinc-400 mb-2">📊</div>
          <div className="text-sm text-zinc-400">No data to visualize</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{ minHeight: '400px' }}
        className="rounded-lg"
      />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-black/60 text-white text-xs px-3 py-2 rounded opacity-90">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>PDFs</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Concepts</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span>Topics</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>Folders</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraphVisualization; 