import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'processed_pdfs.json');
    
    if (!fs.existsSync(dataPath)) {
      return new Response(JSON.stringify({ 
        success: true, 
        pdfs: [], 
        graph: { nodes: [], edges: [] } 
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const pdfs = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // Generate graph data from PDFs
    const graphData = generateGraphData(pdfs);

    return new Response(JSON.stringify({ 
      success: true, 
      pdfs: pdfs,
      graph: graphData
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching PDF graph data:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function generateGraphData(pdfs) {
  const nodes = [];
  const edges = [];
  const nodeMap = new Map();

  // Add PDF nodes
  pdfs.forEach((pdf) => {
    const nodeId = `pdf_${pdf.file_id}`;
    nodeMap.set(nodeId, {
      id: nodeId,
      label: pdf.filename,
      type: 'pdf',
      weight: pdf.metadata?.word_count || 1,
      metadata: pdf.metadata,
      summary: pdf.summary,
      file_path: pdf.file_path,
      processed_at: pdf.processed_at
    });
    nodes.push(nodeMap.get(nodeId));
  });

  // Generate connections based on content similarity
  for (let i = 0; i < pdfs.length; i++) {
    for (let j = i + 1; j < pdfs.length; j++) {
      const similarity = calculateSimilarity(pdfs[i], pdfs[j]);
      
      if (similarity > 0.1) { // Threshold for connection
        const edge = {
          source: `pdf_${pdfs[i].file_id}`,
          target: `pdf_${pdfs[j].file_id}`,
          weight: similarity,
          type: 'similarity'
        };
        edges.push(edge);
      }
    }
  }

  // Add concept nodes from extracted entities
  const conceptMap = new Map();
  
  pdfs.forEach(pdf => {
    if (pdf.graph && pdf.graph.nodes) {
      pdf.graph.nodes.forEach(node => {
        if (node.type === 'concept' || node.type === 'entity') {
          const conceptId = `concept_${node.id}`;
          
          if (!conceptMap.has(conceptId)) {
            conceptMap.set(conceptId, {
              id: conceptId,
              label: node.label || node.id,
              type: 'concept',
              weight: 1,
              frequency: 1
            });
            nodes.push(conceptMap.get(conceptId));
          } else {
            conceptMap.get(conceptId).frequency += 1;
            conceptMap.get(conceptId).weight += 1;
          }

          // Connect concept to PDF
          edges.push({
            source: `pdf_${pdf.file_id}`,
            target: conceptId,
            weight: 1,
            type: 'contains'
          });
        }
      });
    }
  });

  // Add topic nodes from summaries
  const topicMap = new Map();
  
  pdfs.forEach(pdf => {
    if (pdf.summary) {
      const topics = extractTopics(pdf.summary);
      topics.forEach(topic => {
        const topicId = `topic_${topic.toLowerCase().replace(/\s+/g, '_')}`;
        
        if (!topicMap.has(topicId)) {
          topicMap.set(topicId, {
            id: topicId,
            label: topic,
            type: 'topic',
            weight: 1,
            frequency: 1
          });
          nodes.push(topicMap.get(topicId));
        } else {
          topicMap.get(topicId).frequency += 1;
          topicMap.get(topicId).weight += 1;
        }

        // Connect topic to PDF
        edges.push({
          source: `pdf_${pdf.file_id}`,
          target: topicId,
          weight: 0.5,
          type: 'discusses'
        });
      });
    }
  });

  // Add folder structure nodes based on file paths
  const folderMap = new Map();
  
  pdfs.forEach(pdf => {
    if (pdf.file_path) {
      const folders = extractFolderStructure(pdf.file_path);
      folders.forEach(folder => {
        const folderId = `folder_${folder.toLowerCase().replace(/\s+/g, '_')}`;
        
        if (!folderMap.has(folderId)) {
          folderMap.set(folderId, {
            id: folderId,
            label: folder,
            type: 'folder',
            weight: 1,
            frequency: 1
          });
          nodes.push(folderMap.get(folderId));
        } else {
          folderMap.get(folderId).frequency += 1;
          folderMap.get(folderId).weight += 1;
        }

        // Connect folder to PDF
        edges.push({
          source: `pdf_${pdf.file_id}`,
          target: folderId,
          weight: 0.3,
          type: 'located_in'
        });
      });
    }
  });

  return { nodes, edges };
}

function calculateSimilarity(pdf1, pdf2) {
  let similarity = 0;
  
  // Compare summaries
  if (pdf1.summary && pdf2.summary) {
    const words1 = new Set(pdf1.summary.toLowerCase().split(/\s+/));
    const words2 = new Set(pdf2.summary.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    similarity += intersection.size / union.size * 0.4;
  }

  // Compare concepts
  if (pdf1.graph && pdf2.graph) {
    const concepts1 = new Set(pdf1.graph.nodes?.filter(n => n.type === 'concept').map(n => n.label) || []);
    const concepts2 = new Set(pdf2.graph.nodes?.filter(n => n.type === 'concept').map(n => n.label) || []);
    const intersection = new Set([...concepts1].filter(x => concepts2.has(x)));
    const union = new Set([...concepts1, ...concepts2]);
    if (union.size > 0) {
      similarity += intersection.size / union.size * 0.4;
    }
  }

  // Compare file paths (same folder structure)
  if (pdf1.file_path && pdf2.file_path) {
    const path1 = path.dirname(pdf1.file_path);
    const path2 = path.dirname(pdf2.file_path);
    if (path1 === path2) {
      similarity += 0.2; // Bonus for same folder
    } else if (path1.includes(path2) || path2.includes(path1)) {
      similarity += 0.1; // Bonus for nested folders
    }
  }

  return similarity;
}

function extractTopics(summary) {
  // Simple topic extraction based on common keywords
  const commonTopics = [
    'machine learning', 'artificial intelligence', 'data science', 'programming',
    'software development', 'web development', 'database', 'cloud computing',
    'cybersecurity', 'blockchain', 'mobile development', 'devops',
    'research', 'analysis', 'statistics', 'mathematics', 'physics',
    'chemistry', 'biology', 'medicine', 'engineering', 'business',
    'finance', 'economics', 'marketing', 'management', 'education',
    'design', 'architecture', 'testing', 'deployment', 'monitoring',
    'documentation', 'tutorial', 'guide', 'manual', 'specification'
  ];

  const topics = [];
  const lowerSummary = summary.toLowerCase();
  
  commonTopics.forEach(topic => {
    if (lowerSummary.includes(topic)) {
      topics.push(topic);
    }
  });

  // Extract potential topics from capitalized words
  const words = summary.split(/\s+/);
  const capitalizedWords = words.filter(word => 
    word.length > 3 && 
    word[0] === word[0].toUpperCase() && 
    !word.includes('.') &&
    !commonTopics.some(topic => topic.includes(word.toLowerCase()))
  );

  topics.push(...capitalizedWords.slice(0, 3)); // Limit to 3 additional topics

  return topics;
}

function extractFolderStructure(filePath) {
  const pathParts = filePath.split('/').filter(part => part.trim() !== '');
  return pathParts.slice(0, -1); // Exclude the filename, keep only folders
} 