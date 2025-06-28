# PDF Knowledge Graph Visualizer

This tool processes PDF files and creates interactive visualizations of the knowledge graph connections extracted from the document.

## Features

- **PDF Processing**: Extracts text, metadata, and knowledge graph data from PDF files
- **Interactive Visualization**: Creates beautiful, interactive network graphs using D3.js
- **Real-time Controls**: Adjust node size, link distance, and force parameters
- **Node Information**: Click on nodes to see detailed information
- **Document Preview**: View extracted text content alongside the graph

## Prerequisites

1. **Service Running**: Make sure the document processing service is running:
   ```bash
   source venv/bin/activate
   python3 main.py
   ```

2. **Dependencies**: All required packages should be installed in the virtual environment

## Usage

### 1. Create a Test PDF (Optional)
If you don't have a PDF to test with, create one:
```bash
source venv/bin/activate
python3 create_test_pdf.py
```

### 2. Visualize a PDF
```bash
source venv/bin/activate
python3 visualize_pdf.py <path_to_pdf>
```

Example:
```bash
python3 visualize_pdf.py test_pdf.pdf
```

### 3. Interactive Features

Once the visualization opens in your browser, you can:

- **Drag nodes** to rearrange the graph layout
- **Hover over nodes** to see tooltips with basic information
- **Click on nodes** to see detailed information in the sidebar
- **Use controls** to adjust:
  - Node size
  - Link distance between nodes
  - Force strength (how much nodes repel each other)
- **View document statistics** in the header
- **Preview extracted text** in the sidebar

## How It Works

1. **PDF Processing**: The tool sends your PDF to the document processing service
2. **Graph Extraction**: The service extracts concepts and relationships from the text
3. **Visualization Generation**: Creates an interactive HTML visualization using D3.js
4. **Browser Display**: Opens the visualization in your default web browser

## Output

The visualization shows:
- **Nodes**: Represent concepts, entities, or topics from the document
- **Edges**: Show relationships between concepts
- **Colors**: Different node types are color-coded
- **Statistics**: Document metrics (word count, pages, concepts, connections)

## Troubleshooting

### Service Not Running
If you get connection errors, make sure the processing service is running:
```bash
source venv/bin/activate
python3 main.py
```

### PDF Processing Fails
- Ensure the PDF file exists and is readable
- Check that the PDF contains extractable text (not just images)
- Verify the service is healthy: `curl http://localhost:8000/health`

### Browser Doesn't Open
The visualization file is saved in a temporary directory. You can manually open it:
```bash
# Find the visualization file
find /tmp -name "pdf_viz_*" -type d
# Open the HTML file in that directory
```

## Example Output

The visualization will show:
- A beautiful network graph with interconnected nodes
- Document statistics in the header
- Interactive controls in the sidebar
- Document text preview
- Detailed node information when clicked

## Technical Details

- **Backend**: Python with FastAPI service
- **Frontend**: HTML/CSS/JavaScript with D3.js
- **Graph Layout**: Force-directed layout algorithm
- **Data Format**: JSON-based graph structure
- **Temporary Files**: Automatically cleaned up on exit

## Customization

You can modify the visualization by editing the `_generate_html()` method in `visualize_pdf.py`:
- Change colors and styling
- Add new interactive features
- Modify the graph layout algorithm
- Add additional data displays 