import networkx as nx
import re
from typing import Dict, Any, List, Tuple, Optional
from collections import Counter
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize, sent_tokenize
import logging
import time

from .text_compressor import TextCompressor
from .openrouter_service import OpenRouterService

class EnhancedGraphBuilder:
    """
    Enhanced graph builder that uses text compression and OpenRouter API for AI-powered graph generation
    """
    
    def __init__(self, use_openrouter: bool = True, compression_target: int = 2000):
        self.graph = nx.Graph()
        self.node_id_counter = 0
        self.use_openrouter = use_openrouter
        self.compression_target = compression_target
        self.logger = logging.getLogger(__name__)
        
        # Initialize services
        self.text_compressor = TextCompressor()
        self.openrouter_service = OpenRouterService() if use_openrouter else None
        
        # Download required NLTK data
        self._ensure_nltk_data()
    
    def _ensure_nltk_data(self):
        """Ensure required NLTK data is downloaded"""
        try:
            nltk.data.find('tokenizers/punkt')
        except LookupError:
            nltk.download('punkt')
        try:
            nltk.data.find('corpora/stopwords')
        except LookupError:
            nltk.download('stopwords')
    
    async def build_graph(self, text: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Build a knowledge graph from text content using enhanced methods
        
        Args:
            text: The text content to analyze
            metadata: Document metadata
            
        Returns:
            Dictionary containing graph data and analysis
        """
        try:
            start_time = time.time()
            self.logger.info(f"Starting enhanced graph building process")
            self.logger.info(f"Text length: {len(text)} characters")
            
            # Reset graph for new document
            self.graph = nx.Graph()
            self.node_id_counter = 0
            
            # Step 1: Compress text to reduce API usage
            compression_result = self._compress_text(text)
            compressed_text = compression_result["compressed_text"]
            
            self.logger.info(f"Text compressed from {len(text)} to {len(compressed_text)} characters "
                           f"(ratio: {compression_result['compression_ratio']:.2f})")
            
            # Step 2: Generate graph using AI or fallback to traditional methods
            if self.use_openrouter and self.openrouter_service:
                try:
                    graph_result = await self._generate_ai_graph(compressed_text, metadata)
                    self.logger.info("AI-powered graph generation successful")
                except Exception as e:
                    self.logger.warning(f"AI graph generation failed: {str(e)}, falling back to traditional methods")
                    graph_result = await self._generate_traditional_graph(compressed_text, metadata)
            else:
                graph_result = await self._generate_traditional_graph(compressed_text, metadata)
            
            # Step 3: Add document node and connect to main entities
            doc_node_id = self._add_document_node(metadata)
            self._connect_document_to_entities(doc_node_id, graph_result.get("entities", []))
            
            # Step 4: Analyze graph structure
            graph_analysis = self._analyze_graph()
            
            # Step 5: Convert to serializable format
            graph_data = self._serialize_graph()
            
            processing_time = time.time() - start_time
            
            self.logger.info(f"Graph building completed in {processing_time:.2f}s")
            self.logger.info(f"Final graph - Nodes: {len(graph_data['nodes'])}, Edges: {len(graph_data['edges'])}")
            
            return {
                'graph_data': graph_data,
                'analysis': graph_analysis,
                'compression_info': compression_result,
                'ai_used': self.use_openrouter and self.openrouter_service is not None,
                'processing_time': processing_time,
                'total_nodes': self.graph.number_of_nodes(),
                'total_edges': self.graph.number_of_edges()
            }
            
        except Exception as e:
            self.logger.error(f"Error in build_graph: {str(e)}")
            raise Exception(f"Enhanced graph building failed: {str(e)}")
    
    def _compress_text(self, text: str) -> Dict[str, Any]:
        """Compress text to reduce API usage"""
        return self.text_compressor.compress_text(
            text, 
            target_length=self.compression_target,
            method="smart"
        )
    
    async def _generate_ai_graph(self, compressed_text: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Generate graph using OpenRouter API"""
        try:
            # Generate graph using AI
            ai_result = self.openrouter_service.generate_graph_from_text(compressed_text, metadata)
            
            # Extract entities and relationships from AI response
            entities = []
            relationships = []
            
            # Process AI-generated nodes
            ai_nodes = ai_result.get("graph_data", {}).get("nodes", [])
            for node in ai_nodes:
                if node.get("type") != "document":
                    entities.append({
                        "name": node.get("label", ""),
                        "type": node.get("type", "concept"),
                        "importance": node.get("importance", "medium"),
                        "description": node.get("description", "")
                    })
            
            # Process AI-generated edges
            ai_edges = ai_result.get("graph_data", {}).get("edges", [])
            for edge in ai_edges:
                if edge.get("source") != "document" and edge.get("target") != "document":
                    relationships.append({
                        "source": edge.get("source", ""),
                        "target": edge.get("target", ""),
                        "relationship": edge.get("label", ""),
                        "weight": edge.get("weight", "medium")
                    })
            
            # Add AI-generated nodes to graph
            entity_nodes = self._add_ai_entity_nodes(ai_nodes)
            
            # Add AI-generated edges to graph
            self._add_ai_relationship_edges(ai_edges, entity_nodes)
            
            return {
                "entities": entities,
                "relationships": relationships,
                "ai_analysis": ai_result.get("analysis", {}),
                "ai_metadata": ai_result.get("metadata", {})
            }
            
        except Exception as e:
            self.logger.error(f"AI graph generation failed: {str(e)}")
            raise e
    
    async def _generate_traditional_graph(self, compressed_text: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Generate graph using traditional NLP methods"""
        # Extract entities using traditional methods
        entities = self._extract_entities_traditional(compressed_text)
        
        # Extract relationships using traditional methods
        relationships = self._extract_relationships_traditional(compressed_text)
        
        # Add entity nodes
        entity_nodes = self._add_entity_nodes(entities)
        
        # Add relationship edges
        self._add_relationship_edges(relationships, entity_nodes)
        
        return {
            "entities": entities,
            "relationships": relationships
        }
    
    def _add_ai_entity_nodes(self, ai_nodes: List[Dict[str, Any]]) -> Dict[str, List[str]]:
        """Add AI-generated entity nodes to the graph"""
        entity_nodes = {"concepts": [], "keywords": [], "entities": []}
        
        for node in ai_nodes:
            if node.get("type") == "document":
                continue
                
            node_id = node.get("id", f"ai_node_{self.node_id_counter}")
            self.node_id_counter += 1
            
            # Add node to graph
            self.graph.add_node(node_id,
                               type=node.get("type", "concept"),
                               label=node.get("label", ""),
                               importance=node.get("importance", "medium"),
                               description=node.get("description", ""),
                               source="ai")
            
            # Categorize node
            node_type = node.get("type", "concept")
            if node_type in ["concept", "keyword"]:
                entity_nodes["concepts"].append(node_id)
            elif node_type in ["person", "place", "organization"]:
                entity_nodes["entities"].append(node_id)
            else:
                entity_nodes["keywords"].append(node_id)
        
        return entity_nodes
    
    def _add_ai_relationship_edges(self, ai_edges: List[Dict[str, Any]], entity_nodes: Dict[str, List[str]]):
        """Add AI-generated relationship edges to the graph"""
        for edge in ai_edges:
            source = edge.get("source")
            target = edge.get("target")
            
            if source and target and source != "document" and target != "document":
                # Check if both nodes exist in our graph
                if self.graph.has_node(source) and self.graph.has_node(target):
                    self.graph.add_edge(source, target,
                                      label=edge.get("label", ""),
                                      weight=edge.get("weight", "medium"),
                                      source="ai")
    
    def _extract_entities_traditional(self, text: str) -> Dict[str, List[str]]:
        """Extract entities using traditional NLP methods"""
        entities = {
            'concepts': [],
            'keywords': [],
            'numbers': [],
            'dates': []
        }
        
        # Extract concepts (capitalized phrases)
        concept_patterns = [
            r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b',
            r'\b[A-Za-z]{2,}\b',
            r'\b[A-Za-z][a-z]+(?:\s+[A-Za-z][a-z]+){1,3}\b'
        ]
        
        all_concepts = []
        for pattern in concept_patterns:
            matches = re.findall(pattern, text)
            all_concepts.extend(matches)
        
        # Filter and clean concepts
        filtered_concepts = []
        for concept in all_concepts:
            if len(concept) > 3 and concept.lower() not in ['the', 'and', 'or', 'but', 'for', 'with', 'this', 'that']:
                filtered_concepts.append(concept)
        
        unique_concepts = list(set(filtered_concepts))
        entities['concepts'] = unique_concepts[:15]
        
        # Extract keywords using NLTK
        try:
            tokens = word_tokenize(text.lower())
            stop_words = set(stopwords.words('english'))
            
            filtered_tokens = [word for word in tokens 
                             if word.isalnum() and 
                             word not in stop_words and 
                             len(word) > 3]
            
            word_freq = Counter(filtered_tokens)
            keywords = [word for word, freq in word_freq.most_common(20)]
            entities['keywords'] = keywords[:10]
            
        except Exception as e:
            self.logger.warning(f"NLTK keyword extraction failed: {e}")
            # Fallback to simple regex
            words = re.findall(r'\b[a-zA-Z]+\b', text.lower())
            common_words = {'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
            word_freq = Counter(words)
            keywords = [word for word, freq in word_freq.most_common(20) 
                       if word not in common_words and len(word) > 3]
            entities['keywords'] = keywords[:10]
        
        # Extract numbers and dates
        numbers = re.findall(r'\b\d+(?:\.\d+)?\b', text)
        entities['numbers'] = numbers[:10]
        
        date_patterns = [
            r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b',
            r'\b\d{4}[/-]\d{1,2}[/-]\d{1,2}\b',
            r'\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b'
        ]
        
        all_dates = []
        for pattern in date_patterns:
            matches = re.findall(pattern, text)
            all_dates.extend(matches)
        entities['dates'] = all_dates[:5]
        
        return entities
    
    def _extract_relationships_traditional(self, text: str) -> List[Tuple[str, str, str]]:
        """Extract relationships using traditional NLP methods"""
        relationships = []
        
        # Simple relationship extraction based on proximity
        sentences = sent_tokenize(text)
        
        for sentence in sentences:
            # Extract entities in the sentence
            entities = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', sentence)
            
            # Create relationships between entities in the same sentence
            for i in range(len(entities)):
                for j in range(i + 1, len(entities)):
                    if entities[i] != entities[j]:
                        relationships.append((entities[i], entities[j], "related"))
        
        return relationships[:50]  # Limit relationships
    
    def _add_document_node(self, metadata: Dict[str, Any]) -> str:
        """Add document as a central node"""
        node_id = f"doc_{self.node_id_counter}"
        self.node_id_counter += 1
        
        self.graph.add_node(node_id, 
                           type='document',
                           title=metadata.get('title', 'Unknown'),
                           author=metadata.get('author', 'Unknown'),
                           pages=metadata.get('total_pages', 0),
                           word_count=metadata.get('word_count', 0),
                           source="document")
        
        return node_id
    
    def _add_entity_nodes(self, entities: Dict[str, List[str]]) -> Dict[str, List[str]]:
        """Add entity nodes to the graph"""
        entity_nodes = {"concepts": [], "keywords": [], "entities": []}
        
        # Add concept nodes
        for concept in entities.get('concepts', []):
            node_id = f"concept_{self.node_id_counter}"
            self.node_id_counter += 1
            self.graph.add_node(node_id, type='concept', label=concept, source="traditional")
            entity_nodes["concepts"].append(node_id)
        
        # Add keyword nodes
        for keyword in entities.get('keywords', []):
            node_id = f"keyword_{self.node_id_counter}"
            self.node_id_counter += 1
            self.graph.add_node(node_id, type='keyword', label=keyword, source="traditional")
            entity_nodes["keywords"].append(node_id)
        
        return entity_nodes
    
    def _add_relationship_edges(self, relationships: List[Tuple[str, str, str]], entity_nodes: Dict[str, List[str]]):
        """Add relationship edges to the graph"""
        # Create mapping from entity names to node IDs
        name_to_id = {}
        for node_id in self.graph.nodes():
            if self.graph.nodes[node_id].get('label'):
                name_to_id[self.graph.nodes[node_id]['label']] = node_id
        
        # Add edges based on relationships
        for source_name, target_name, relationship in relationships:
            source_id = name_to_id.get(source_name)
            target_id = name_to_id.get(target_name)
            
            if source_id and target_id and source_id != target_id:
                self.graph.add_edge(source_id, target_id, 
                                  label=relationship, 
                                  weight="medium",
                                  source="traditional")
    
    def _connect_document_to_entities(self, doc_node_id: str, entities):
        """Connect document node to main entities"""
        # Handle both AI format (list of dicts) and traditional format (dict of lists)
        if isinstance(entities, dict):
            # Traditional format - convert to list of dicts
            entity_list = []
            for entity_type, entity_names in entities.items():
                for name in entity_names[:3]:  # Take top 3 from each type
                    entity_list.append({
                        "name": name,
                        "type": entity_type,
                        "importance": "high" if entity_type == "concepts" else "medium"
                    })
            entities = entity_list
        
        # Now entities should be a list of dictionaries
        if not isinstance(entities, list):
            return
            
        # Connect to high-importance entities first
        high_importance = [e for e in entities if e.get("importance") == "high"]
        medium_importance = [e for e in entities if e.get("importance") == "medium"]
        
        # Connect to high importance entities
        for entity in high_importance[:5]:
            entity_name = entity.get("name", "")
            # Find corresponding node
            for node_id in self.graph.nodes():
                if (self.graph.nodes[node_id].get('label') == entity_name and 
                    self.graph.nodes[node_id].get('type') != 'document'):
                    self.graph.add_edge(doc_node_id, node_id, 
                                      label="contains", 
                                      weight="high",
                                      source="document_connection")
                    break
        
        # Connect to medium importance entities if space allows
        for entity in medium_importance[:3]:
            entity_name = entity.get("name", "")
            for node_id in self.graph.nodes():
                if (self.graph.nodes[node_id].get('label') == entity_name and 
                    self.graph.nodes[node_id].get('type') != 'document'):
                    self.graph.add_edge(doc_node_id, node_id, 
                                      label="contains", 
                                      weight="medium",
                                      source="document_connection")
                    break
    
    def _analyze_graph(self) -> Dict[str, Any]:
        """Analyze the graph structure"""
        if self.graph.number_of_nodes() == 0:
            return {"error": "Empty graph"}
        
        try:
            # Basic metrics
            analysis = {
                "total_nodes": self.graph.number_of_nodes(),
                "total_edges": self.graph.number_of_edges(),
                "density": nx.density(self.graph),
                "average_degree": sum(dict(self.graph.degree()).values()) / self.graph.number_of_nodes() if self.graph.number_of_nodes() > 0 else 0
            }
            
            # Node type distribution
            node_types = {}
            for node in self.graph.nodes():
                node_type = self.graph.nodes[node].get('type', 'unknown')
                node_types[node_type] = node_types.get(node_type, 0) + 1
            analysis["node_types"] = node_types
            
            # Source distribution
            sources = {}
            for node in self.graph.nodes():
                source = self.graph.nodes[node].get('source', 'unknown')
                sources[source] = sources.get(source, 0) + 1
            analysis["sources"] = sources
            
            # Centrality measures
            if self.graph.number_of_nodes() > 1:
                try:
                    analysis["centrality"] = {
                        "degree": dict(nx.degree_centrality(self.graph)),
                        "betweenness": dict(nx.betweenness_centrality(self.graph)),
                        "closeness": dict(nx.closeness_centrality(self.graph))
                    }
                except Exception as e:
                    self.logger.warning(f"Centrality calculation failed: {e}")
            
            return analysis
            
        except Exception as e:
            self.logger.error(f"Graph analysis failed: {e}")
            return {"error": f"Analysis failed: {str(e)}"}
    
    def _serialize_graph(self) -> Dict[str, Any]:
        """Convert graph to serializable format"""
        nodes = []
        edges = []
        
        # Serialize nodes
        for node_id in self.graph.nodes():
            node_data = self.graph.nodes[node_id].copy()
            node_data['id'] = node_id
            nodes.append(node_data)
        
        # Serialize edges
        for source, target in self.graph.edges():
            edge_data = self.graph.edges[source, target].copy()
            edge_data['source'] = source
            edge_data['target'] = target
            edges.append(edge_data)
        
        return {
            "nodes": nodes,
            "edges": edges
        } 