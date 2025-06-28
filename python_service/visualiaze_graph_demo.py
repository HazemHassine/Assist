import os
import asyncio
import matplotlib.pyplot as plt
import networkx as nx
from dotenv import load_dotenv
import PyPDF2
import time

from services.enhanced_graph_builder import EnhancedGraphBuilder

# Load API key from .env.example (or .env)
print("🔧 Loading environment variables...")
load_dotenv(dotenv_path=".env.example")  # Change to ".env" if you want

def extract_text_from_pdf(pdf_path):
    """Extract text content from PDF file"""
    print(f"📖 Opening PDF file: {pdf_path}")
    try:
        with open(pdf_path, 'rb') as file:
            print("✅ PDF file opened successfully")
            pdf_reader = PyPDF2.PdfReader(file)
            print(f"📄 PDF has {len(pdf_reader.pages)} pages")
            
            text = ""
            for i, page in enumerate(pdf_reader.pages):
                print(f"   📝 Extracting text from page {i+1}...")
                page_text = page.extract_text()
                text += page_text + "\n"
                print(f"   ✅ Page {i+1} extracted ({len(page_text)} characters)")
            
            final_text = text.strip()
            print(f"✅ Total extracted text: {len(final_text)} characters")
            return final_text
    except Exception as e:
        print(f"❌ Error reading PDF: {e}")
        return None

async def main():
    start_time = time.time()
    print("🚀 Starting PDF to Knowledge Graph visualization...")
    print("=" * 60)
    
    # Extract text from the existing test PDF
    pdf_path = "test_pdf.pdf"
    print(f"\n📄 Step 1: Reading PDF file: {pdf_path}")
    
    text_content = extract_text_from_pdf(pdf_path)
    if not text_content:
        print("❌ Failed to extract text from PDF")
        return
    
    print(f"📝 Text preview (first 200 chars): {text_content[:200]}...")
    
    # Create metadata for the PDF
    print(f"\n📋 Step 2: Creating document metadata...")
    word_count = len(text_content.split())
    pdf_metadata = {
        "title": "Test PDF Document",
        "author": "PDF Author",
        "total_pages": 1,
        "word_count": word_count,
        "source": "test_pdf.pdf"
    }
    print(f"   • Title: {pdf_metadata['title']}")
    print(f"   • Author: {pdf_metadata['author']}")
    print(f"   • Word count: {word_count}")
    print(f"   • Source: {pdf_metadata['source']}")
    
    print(f"\n🔍 Step 3: Initializing graph builder...")
    
    # Use OpenRouter if API key is present
    api_key = os.getenv("OPENROUTER_API_KEY")
    use_openrouter = bool(api_key)
    print(f"   • API key found: {'Yes' if api_key else 'No'}")
    print(f"   • Using AI-powered graph building: {use_openrouter}")
    if api_key:
        print(f"   • API key preview: {api_key[:10]}...")
    
    print(f"   • Compression target: 1000 characters")
    builder = EnhancedGraphBuilder(use_openrouter=use_openrouter, compression_target=1000)
    print("✅ Graph builder initialized")
    
    print(f"\n🏗️  Step 4: Building knowledge graph...")
    graph_start_time = time.time()
    result = await builder.build_graph(text_content, pdf_metadata)
    graph_time = time.time() - graph_start_time
    print(f"✅ Graph building completed in {graph_time:.2f}s")
    
    # Print analysis results
    print(f"\n📊 Step 5: Analyzing graph results...")
    print(f"   • Total nodes: {result['total_nodes']}")
    print(f"   • Total edges: {result['total_edges']}")
    print(f"   • Processing time: {result['processing_time']:.2f}s")
    print(f"   • AI used: {result['ai_used']}")
    
    if 'compression_info' in result:
        compression = result['compression_info']
        print(f"   • Text compression:")
        print(f"     - Original length: {compression.get('original_length', 'N/A')}")
        print(f"     - Compressed length: {compression.get('compressed_length', 'N/A')}")
        print(f"     - Compression ratio: {compression.get('compression_ratio', 'N/A'):.3f}")
        print(f"     - Method used: {compression.get('method', 'N/A')}")
    
    if 'analysis' in result and 'error' not in result['analysis']:
        analysis = result['analysis']
        print(f"   • Graph metrics:")
        print(f"     - Density: {analysis.get('density', 'N/A'):.3f}")
        print(f"     - Average degree: {analysis.get('average_degree', 'N/A'):.2f}")
        
        if 'node_types' in analysis:
            print(f"   • Node type distribution:")
            for node_type, count in analysis['node_types'].items():
                print(f"     - {node_type}: {count}")
        
        if 'sources' in analysis:
            print(f"   • Source distribution:")
            for source, count in analysis['sources'].items():
                print(f"     - {source}: {count}")
    else:
        print(f"   ⚠️  Graph analysis error: {result['analysis'].get('error', 'Unknown error')}")
    
    print(f"\n🎯 Step 6: Preparing graph data for visualization...")
    graph_data = result["graph_data"]
    print(f"   • Nodes in graph data: {len(graph_data['nodes'])}")
    print(f"   • Edges in graph data: {len(graph_data['edges'])}")
    
    # Build a NetworkX graph from the serialized data
    print(f"   • Creating NetworkX graph...")
    G = nx.Graph()
    
    # Add nodes with their properties
    print(f"   • Adding nodes to NetworkX graph...")
    for i, node in enumerate(graph_data["nodes"]):
        node_id = node["id"]
        node_label = node.get("label", node_id)
        node_type = node.get("type", "unknown")
        G.add_node(node_id, label=node_label, type=node_type)
        print(f"     - Node {i+1}: {node_label} (type: {node_type})")
    
    # Add edges with their properties
    print(f"   • Adding edges to NetworkX graph...")
    for i, edge in enumerate(graph_data["edges"]):
        source = edge["source"]
        target = edge["target"]
        edge_label = edge.get("label", "")
        G.add_edge(source, target, label=edge_label)
        print(f"     - Edge {i+1}: {source} -> {target} (label: {edge_label})")
    
    print(f"✅ NetworkX graph created with {G.number_of_nodes()} nodes and {G.number_of_edges()} edges")
    
    # Create visualization with different colors for different node types
    print(f"\n🎨 Step 7: Creating visualization...")
    print(f"   • Setting up matplotlib figure...")
    plt.figure(figsize=(12, 8))
    
    print(f"   • Calculating node positions...")
    pos = nx.spring_layout(G, seed=42, k=1, iterations=50)
    
    # Color nodes by type
    print(f"   • Assigning colors to nodes by type...")
    node_colors = []
    node_labels = {}
    type_counts = {'document': 0, 'concept': 0, 'keyword': 0, 'entity': 0, 'unknown': 0}
    
    for node in G.nodes():
        node_type = G.nodes[node].get('type', 'unknown')
        node_labels[node] = G.nodes[node].get('label', node)
        type_counts[node_type] = type_counts.get(node_type, 0) + 1
        
        if node_type == 'document':
            node_colors.append('red')
        elif node_type == 'concept':
            node_colors.append('lightblue')
        elif node_type == 'keyword':
            node_colors.append('lightgreen')
        elif node_type == 'entity':
            node_colors.append('orange')
        else:
            node_colors.append('gray')
    
    print(f"   • Node type counts: {type_counts}")
    
    # Draw the graph
    print(f"   • Drawing graph nodes and edges...")
    nx.draw(G, pos, 
            with_labels=True, 
            labels=node_labels,
            node_color=node_colors,
            node_size=2000, 
            font_size=9, 
            font_weight='bold',
            edge_color='gray',
            width=2)
    
    # Draw edge labels
    print(f"   • Adding edge labels...")
    edge_labels = nx.get_edge_attributes(G, 'label')
    nx.draw_networkx_edge_labels(G, pos, edge_labels=edge_labels, font_color='red', font_size=8)
    
    # Add legend
    print(f"   • Adding legend...")
    legend_elements = [
        plt.Line2D([0], [0], marker='o', color='w', markerfacecolor='red', markersize=10, label='Document'),
        plt.Line2D([0], [0], marker='o', color='w', markerfacecolor='lightblue', markersize=10, label='Concept'),
        plt.Line2D([0], [0], marker='o', color='w', markerfacecolor='lightgreen', markersize=10, label='Keyword'),
        plt.Line2D([0], [0], marker='o', color='w', markerfacecolor='orange', markersize=10, label='Entity')
    ]
    plt.legend(handles=legend_elements, loc='upper left', bbox_to_anchor=(1, 1))
    
    plt.title("Knowledge Graph from PDF\n(Red=Document, Blue=Concepts, Green=Keywords, Orange=Entities)", 
              fontsize=14, fontweight='bold')
    plt.tight_layout()
    
    total_time = time.time() - start_time
    print(f"\n🎉 Step 8: Complete! Total processing time: {total_time:.2f}s")
    print(f"🖼️  Opening graph visualization...")
    print(f"   • Red nodes: Document")
    print(f"   • Blue nodes: Concepts")
    print(f"   • Green nodes: Keywords") 
    print(f"   • Orange nodes: Entities")
    print(f"   • Red text on edges: Relationship types")
    print("=" * 60)
    
    plt.show()

if __name__ == "__main__":
    asyncio.run(main())
