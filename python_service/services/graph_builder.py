import networkx as nx
import re
from typing import Dict, Any, List, Tuple
from collections import Counter
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize, sent_tokenize

class GraphBuilder:
    def __init__(self):
        self.graph = nx.Graph()
        self.node_id_counter = 0
        # Download required NLTK data
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
        Build a knowledge graph from text content and metadata
        
        Args:
            text: The text content to analyze
            metadata: Document metadata
            
        Returns:
            Dictionary containing graph data and analysis
        """
        try:
            print(f"\n🔍 DEBUG: Starting graph building process")
            print(f"📄 Text length: {len(text)} characters")
            print(f"📄 Text preview: {text[:200]}...")
            
            # Reset graph for new document
            self.graph = nx.Graph()
            self.node_id_counter = 0
            
            # Add document node
            doc_node_id = self._add_document_node(metadata)
            print(f"📄 Added document node: {doc_node_id}")
            
            # Extract entities and relationships
            print(f"\n🔍 DEBUG: Extracting entities...")
            entities = self._extract_entities(text)
            print(f"📊 Extracted entities: {entities}")
            
            print(f"\n🔍 DEBUG: Extracting relationships...")
            relationships = self._extract_relationships(text)
            print(f"🔗 Extracted relationships: {relationships}")
            
            # Add entity nodes
            print(f"\n🔍 DEBUG: Adding entity nodes...")
            entity_nodes = self._add_entity_nodes(entities)
            print(f"📊 Entity nodes created: {entity_nodes}")
            
            # Add relationship edges
            print(f"\n🔍 DEBUG: Adding relationship edges...")
            self._add_relationship_edges(relationships, entity_nodes)
            
            # Connect entities to document
            print(f"\n🔍 DEBUG: Connecting entities to document...")
            self._connect_entities_to_document(entity_nodes, doc_node_id)
            
            # Analyze graph structure
            graph_analysis = self._analyze_graph()
            print(f"\n📊 Graph analysis: {graph_analysis}")
            
            # Convert to serializable format
            graph_data = self._serialize_graph()
            print(f"\n📊 Final graph data - Nodes: {len(graph_data['nodes'])}, Edges: {len(graph_data['edges'])}")
            
            return {
                'graph_data': graph_data,
                'analysis': graph_analysis,
                'entities': entities,
                'relationships': relationships,
                'total_nodes': self.graph.number_of_nodes(),
                'total_edges': self.graph.number_of_edges()
            }
            
        except Exception as e:
            print(f"❌ ERROR in build_graph: {str(e)}")
            raise Exception(f"Graph building failed: {str(e)}")
    
    def _add_document_node(self, metadata: Dict[str, Any]) -> str:
        """Add document as a central node"""
        node_id = f"doc_{self.node_id_counter}"
        self.node_id_counter += 1
        
        self.graph.add_node(node_id, 
                           type='document',
                           title=metadata.get('title', 'Unknown'),
                           author=metadata.get('author', 'Unknown'),
                           pages=metadata.get('total_pages', 0),
                           word_count=metadata.get('word_count', 0))
        
        return node_id
    
    def _extract_entities(self, text: str) -> Dict[str, List[str]]:
        """Extract entities from text using improved and loosened heuristics"""
        print(f"🔍 DEBUG: _extract_entities called with text length: {len(text)}")
        
        entities = {
            'concepts': [],
            'keywords': [],
            'numbers': [],
            'dates': []
        }
        
        # Loosened concept patterns: match any phrases, not just capitalized
        concept_patterns = [
            r'\b[A-Za-z][a-z]+(?:\s+[A-Za-z][a-z]+)*\b',  # Any phrases
            r'\b[A-Za-z]{2,}\b',  # Any words with 2+ letters
            r'\b[A-Za-z][a-z]+(?:\s+[A-Za-z][a-z]+){1,3}\b'  # Multi-word concepts
        ]
        
        print(f"🔍 DEBUG: Using concept patterns: {concept_patterns}")
        
        all_concepts = []
        for i, pattern in enumerate(concept_patterns):
            matches = re.findall(pattern, text)
            print(f"🔍 DEBUG: Pattern {i+1} found {len(matches)} matches: {matches[:10]}...")
            all_concepts.extend(matches)
        
        print(f"🔍 DEBUG: Total concept matches before filtering: {len(all_concepts)}")
        
        # Filter and clean concepts
        filtered_concepts = []
        for concept in all_concepts:
            # Remove common words and short concepts
            if len(concept) > 3 and concept.lower() not in ['the', 'and', 'or', 'but', 'for', 'with', 'this', 'that']:
                filtered_concepts.append(concept)
        
        print(f"🔍 DEBUG: Filtered concepts: {len(filtered_concepts)}")
        print(f"🔍 DEBUG: Sample filtered concepts: {filtered_concepts[:10]}")
        
        # Get unique concepts and limit to top ones
        unique_concepts = list(set(filtered_concepts))
        entities['concepts'] = unique_concepts[:15]  # Top 15 concepts
        print(f"🔍 DEBUG: Final concepts: {entities['concepts']}")
        
        # Extract keywords using NLTK
        try:
            print(f"🔍 DEBUG: Extracting keywords with NLTK...")
            # Tokenize and get word frequencies
            tokens = word_tokenize(text.lower())
            stop_words = set(stopwords.words('english'))
            
            # Filter out stopwords, punctuation, and short words
            filtered_tokens = [word for word in tokens 
                             if word.isalnum() and 
                             word not in stop_words and 
                             len(word) > 3]
            
            print(f"🔍 DEBUG: Filtered tokens count: {len(filtered_tokens)}")
            
            # Get most frequent words
            word_freq = Counter(filtered_tokens)
            keywords = [word for word, freq in word_freq.most_common(20)]
            entities['keywords'] = keywords[:10]  # Top 10 keywords
            print(f"🔍 DEBUG: NLTK keywords: {entities['keywords']}")
            
        except Exception as e:
            print(f"🔍 DEBUG: NLTK failed, using fallback: {e}")
            # Fallback to simple regex if NLTK fails
            words = re.findall(r'\b[a-zA-Z]+\b', text.lower())
            common_words = {'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'a', 'an'}
            word_freq = Counter(words)
            keywords = [word for word, freq in word_freq.most_common(20) 
                       if word not in common_words and len(word) > 3]
            entities['keywords'] = keywords[:10]
            print(f"🔍 DEBUG: Fallback keywords: {entities['keywords']}")
        
        # Extract numbers
        numbers = re.findall(r'\b\d+(?:\.\d+)?\b', text)
        entities['numbers'] = numbers[:10]  # First 10 numbers
        print(f"🔍 DEBUG: Numbers found: {entities['numbers']}")
        
        # Extract dates (improved pattern)
        date_patterns = [
            r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b',  # MM/DD/YYYY
            r'\b\d{4}[/-]\d{1,2}[/-]\d{1,2}\b',    # YYYY/MM/DD
            r'\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b'  # Month DD, YYYY
        ]
        
        all_dates = []
        for pattern in date_patterns:
            matches = re.findall(pattern, text)
            all_dates.extend(matches)
        entities['dates'] = all_dates[:5]  # First 5 dates
        print(f"🔍 DEBUG: Dates found: {entities['dates']}")
        
        print(f"🔍 DEBUG: Final entities summary:")
        for entity_type, entity_list in entities.items():
            print(f"  {entity_type}: {len(entity_list)} items - {entity_list}")
        
        return entities
    
    def _extract_relationships(self, text: str) -> List[Tuple[str, str, str]]:
        """Extract relationships between entities using improved patterns"""
        print(f"🔍 DEBUG: _extract_relationships called with text length: {len(text)}")
        
        relationships = []
        
        # Split into sentences
        sentences = sent_tokenize(text) if len(text) > 100 else text.split('. ')
        print(f"🔍 DEBUG: Split into {len(sentences)} sentences")
        print(f"🔍 DEBUG: Sample sentences: {sentences[:3]}")
        
        for sentence_idx, sentence in enumerate(sentences):
            print(f"🔍 DEBUG: Processing sentence {sentence_idx + 1}: {sentence[:100]}...")
            
            # Improved relationship patterns
            patterns = [
                # "A is B" patterns
                r'(\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b)\s+(is|are|has|have|contains|includes|involves|requires)\s+(\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b)',
                # "A of B" patterns
                r'(\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b)\s+(of|in|with|from|to|for)\s+(\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b)',
                # "A and B" patterns (co-occurrence)
                r'(\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b)\s+and\s+(\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b)',
                # "A, B, and C" patterns
                r'(\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b),\s+(\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b)',
            ]
            
            for pattern_idx, pattern in enumerate(patterns):
                matches = re.findall(pattern, sentence)
                if matches:
                    print(f"🔍 DEBUG: Pattern {pattern_idx + 1} found {len(matches)} matches in sentence {sentence_idx + 1}: {matches}")
                
                for match in matches:
                    if len(match) == 3:
                        relationships.append((match[0], match[1], match[2]))
                        print(f"🔍 DEBUG: Added 3-part relationship: {match[0]} -> {match[1]} -> {match[2]}")
                    elif len(match) == 2:
                        # For "A and B" patterns, create a relationship
                        relationships.append((match[0], 'related_to', match[1]))
                        print(f"🔍 DEBUG: Added 2-part relationship: {match[0]} -> related_to -> {match[1]}")
        
        # Also create relationships based on proximity in the same sentence
        print(f"🔍 DEBUG: Creating co-occurrence relationships...")
        for sentence_idx, sentence in enumerate(sentences):
            concepts = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', sentence)
            if len(concepts) >= 2:
                print(f"🔍 DEBUG: Sentence {sentence_idx + 1} has {len(concepts)} concepts: {concepts}")
                for i in range(len(concepts) - 1):
                    for j in range(i + 1, len(concepts)):
                        if concepts[i] != concepts[j]:
                            relationships.append((concepts[i], 'co_occurs_with', concepts[j]))
                            print(f"🔍 DEBUG: Added co-occurrence: {concepts[i]} -> co_occurs_with -> {concepts[j]}")
        
        print(f"🔍 DEBUG: Total relationships found: {len(relationships)}")
        print(f"🔍 DEBUG: Sample relationships: {relationships[:10]}")
        
        return relationships[:30]  # Limit to first 30 relationships
    
    def _normalize_name(self, name: str) -> str:
        """Normalize entity names for matching (lowercase, strip, collapse spaces)"""
        return re.sub(r'\s+', ' ', name.strip().lower())

    def _add_entity_nodes(self, entities: Dict[str, List[str]]) -> Dict[str, List[str]]:
        """Add entity nodes to the graph and build a lookup for normalized names"""
        print(f"🔍 DEBUG: _add_entity_nodes called with entities: {entities}")
        
        entity_nodes = {}
        self.entity_name_to_node_id = {}  # NEW: normalized name -> node_id
        
        for entity_type, entity_list in entities.items():
            entity_nodes[entity_type] = []
            print(f"🔍 DEBUG: Processing entity type: {entity_type} with {len(entity_list)} items")
            
            for entity in entity_list:
                node_id = f"{entity_type}_{self.node_id_counter}"
                self.node_id_counter += 1
                
                self.graph.add_node(node_id,
                                   type=entity_type,
                                   name=entity,
                                   value=entity)
                
                entity_nodes[entity_type].append(node_id)
                # Add to lookup table
                norm = self._normalize_name(entity)
                self.entity_name_to_node_id[norm] = node_id
                print(f"🔍 DEBUG: Added node {node_id} for entity '{entity}' of type '{entity_type}' (normalized: '{norm}')")
        
        print(f"🔍 DEBUG: Final entity_nodes: {entity_nodes}")
        print(f"🔍 DEBUG: entity_name_to_node_id: {self.entity_name_to_node_id}")
        return entity_nodes
    
    def _add_relationship_edges(self, relationships: List[Tuple[str, str, str]], entity_nodes: Dict[str, List[str]]):
        """Add relationship edges to the graph using normalized name lookup, creating nodes if needed"""
        print(f"🔍 DEBUG: _add_relationship_edges called with {len(relationships)} relationships")
        print(f"🔍 DEBUG: Available entity_nodes: {entity_nodes}")
        
        edges_added = 0
        for rel_idx, rel in enumerate(relationships):
            entity1, relation, entity2 = rel
            print(f"🔍 DEBUG: Processing relationship {rel_idx + 1}: {entity1} -> {relation} -> {entity2}")
            
            # Use normalized name lookup
            norm1 = self._normalize_name(entity1)
            norm2 = self._normalize_name(entity2)
            node1 = self.entity_name_to_node_id.get(norm1)
            node2 = self.entity_name_to_node_id.get(norm2)
            
            # If node1 does not exist, create it as a concept
            if not node1:
                node1 = f"concepts_{self.node_id_counter}"
                self.node_id_counter += 1
                self.graph.add_node(node1, type='concepts', name=entity1, value=entity1)
                self.entity_name_to_node_id[norm1] = node1
                print(f"🔍 DEBUG: Created missing node1: {node1} for entity1: {entity1} (normalized: {norm1})")
            # If node2 does not exist, create it as a concept
            if not node2:
                node2 = f"concepts_{self.node_id_counter}"
                self.node_id_counter += 1
                self.graph.add_node(node2, type='concepts', name=entity2, value=entity2)
                self.entity_name_to_node_id[norm2] = node2
                print(f"🔍 DEBUG: Created missing node2: {node2} for entity2: {entity2} (normalized: {norm2})")
            
            if node1 and node2:
                self.graph.add_edge(node1, node2, 
                                   relation=relation,
                                   weight=1.0)
                edges_added += 1
                print(f"🔍 DEBUG: Added edge: {node1} -> {node2} with relation '{relation}'")
            else:
                print(f"🔍 DEBUG: Could not find or create nodes for relationship: {entity1} -> {relation} -> {entity2}")
                print(f"🔍 DEBUG: node1: {node1}, node2: {node2}")
        
        print(f"🔍 DEBUG: Total edges added: {edges_added}")
    
    def _connect_entities_to_document(self, entity_nodes: Dict[str, List[str]], doc_node_id: str):
        """Connect all entities to the document node"""
        print(f"🔍 DEBUG: _connect_entities_to_document called with doc_node_id: {doc_node_id}")
        print(f"🔍 DEBUG: entity_nodes: {entity_nodes}")
        
        connections_added = 0
        for entity_type, nodes in entity_nodes.items():
            for node_id in nodes:
                self.graph.add_edge(doc_node_id, node_id,
                                   relation=f'contains_{entity_type}',
                                   weight=0.5)
                connections_added += 1
                print(f"🔍 DEBUG: Connected document to {node_id} with relation 'contains_{entity_type}'")
        
        print(f"🔍 DEBUG: Total document connections added: {connections_added}")
    
    def _analyze_graph(self) -> Dict[str, Any]:
        """Analyze the graph structure"""
        analysis = {
            'num_nodes': self.graph.number_of_nodes(),
            'num_edges': self.graph.number_of_edges(),
            'density': nx.density(self.graph),
            'connected_components': nx.number_connected_components(self.graph),
            'node_types': {},
            'centrality': {}
        }
        
        # Count node types
        for node in self.graph.nodes():
            node_type = self.graph.nodes[node]['type']
            analysis['node_types'][node_type] = analysis['node_types'].get(node_type, 0) + 1
        
        # Calculate centrality for important nodes
        if self.graph.number_of_nodes() > 1:
            centrality = nx.degree_centrality(self.graph)
            analysis['centrality'] = {node: centrality[node] for node in centrality}
        
        return analysis
    
    def _serialize_graph(self) -> Dict[str, Any]:
        """Convert graph to serializable format"""
        nodes = []
        edges = []
        
        print(f"🔍 DEBUG: _serialize_graph - Graph has {self.graph.number_of_nodes()} nodes and {self.graph.number_of_edges()} edges")
        
        for node in self.graph.nodes():
            node_data = self.graph.nodes[node].copy()
            node_data['id'] = node
            
            # Ensure we have the required fields for visualization
            if 'name' not in node_data:
                node_data['name'] = node_data.get('value', node_data.get('title', node))
            if 'label' not in node_data:
                node_data['label'] = node_data['name']
            if 'type' not in node_data:
                node_data['type'] = 'concept'
            if 'weight' not in node_data:
                node_data['weight'] = 1
            if 'description' not in node_data:
                node_data['description'] = f"{node_data['type']}: {node_data['name']}"
            
            nodes.append(node_data)
            print(f"🔍 DEBUG: Serialized node {node}: {node_data}")
        
        for edge in self.graph.edges(data=True):
            edge_data = {
                'source': edge[0],
                'target': edge[1],
                'relation': edge[2].get('relation', 'related'),
                'weight': edge[2].get('weight', 1.0)
            }
            edges.append(edge_data)
            print(f"🔍 DEBUG: Serialized edge: {edge_data}")
        
        result = {
            'nodes': nodes,
            'edges': edges
        }
        
        print(f"🔍 DEBUG: _serialize_graph result - {len(nodes)} nodes, {len(edges)} edges")
        return result
    
    def get_graph_info(self) -> Dict[str, Any]:
        """Get information about the graph builder"""
        return {
            'name': 'NetworkX Graph Builder',
            'description': 'Builds knowledge graphs from text content',
            'features': ['Entity extraction', 'Relationship detection', 'Graph analysis']
        } 