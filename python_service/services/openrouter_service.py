import json
import requests
import os
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
import time

class OpenRouterService:
    """
    Service for interacting with OpenRouter API for AI-powered graph generation
    """
    
    def __init__(self, api_key: Optional[str] = None, site_url: str = "http://localhost:3000", site_name: str = "Assist2"):
        self.api_key = api_key or os.getenv("OPENROUTER_API_KEY")
        self.site_url = site_url
        self.site_name = site_name
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"
        self.logger = logging.getLogger(__name__)
        
        if not self.api_key:
            self.logger.warning("OpenRouter API key not found. Set OPENROUTER_API_KEY environment variable.")
    
    def generate_graph_from_text(self, text: str, metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Generate a knowledge graph from text using OpenRouter API
        
        Args:
            text: Compressed text content
            metadata: Document metadata
            
        Returns:
            Dictionary containing graph data
        """
        if not self.api_key:
            raise ValueError("OpenRouter API key is required")
        
        try:
            # Create prompt for graph generation
            prompt = self._create_graph_prompt(text, metadata)
            
            # Make API call
            response = self._make_api_call(prompt)
            
            # Parse and structure the response
            graph_data = self._parse_graph_response(response, text, metadata)
            
            return graph_data
            
        except Exception as e:
            self.logger.error(f"Error generating graph: {str(e)}")
            raise Exception(f"Graph generation failed: {str(e)}")
    
    def generate_summary(self, text: str, max_length: int = 200) -> Dict[str, Any]:
        """
        Generate a summary of the text using OpenRouter API
        
        Args:
            text: Text to summarize
            max_length: Maximum length of summary
            
        Returns:
            Dictionary containing summary and metadata
        """
        if not self.api_key:
            raise ValueError("OpenRouter API key is required")
        
        try:
            prompt = f"""Please provide a concise summary of the following text in {max_length} characters or less:

{text}

Summary:"""
            
            response = self._make_api_call(prompt)
            
            return {
                "summary": response.strip(),
                "original_length": len(text),
                "summary_length": len(response),
                "generated_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Error generating summary: {str(e)}")
            raise Exception(f"Summary generation failed: {str(e)}")
    
    def extract_entities_and_relationships(self, text: str) -> Dict[str, Any]:
        """
        Extract entities and relationships from text using OpenRouter API
        
        Args:
            text: Text to analyze
            
        Returns:
            Dictionary containing entities and relationships
        """
        if not self.api_key:
            raise ValueError("OpenRouter API key is required")
        
        try:
            prompt = f"""Analyze the following text and extract:
1. Key entities (people, places, organizations, concepts)
2. Relationships between entities
3. Important keywords

Text: {text}

Please respond in JSON format:
{{
    "entities": [
        {{"name": "entity_name", "type": "entity_type", "importance": "high/medium/low"}}
    ],
    "relationships": [
        {{"source": "entity1", "target": "entity2", "relationship": "relationship_type"}}
    ],
    "keywords": ["keyword1", "keyword2", ...]
}}"""
            
            response = self._make_api_call(prompt)
            
            # Try to parse JSON response
            try:
                parsed_response = json.loads(response)
                return {
                    "entities": parsed_response.get("entities", []),
                    "relationships": parsed_response.get("relationships", []),
                    "keywords": parsed_response.get("keywords", []),
                    "raw_response": response
                }
            except json.JSONDecodeError:
                # Fallback: extract information from text response
                return self._extract_from_text_response(response)
                
        except Exception as e:
            self.logger.error(f"Error extracting entities: {str(e)}")
            raise Exception(f"Entity extraction failed: {str(e)}")
    
    def _create_graph_prompt(self, text: str, metadata: Dict[str, Any] = None) -> str:
        """Create a prompt for graph generation"""
        metadata_info = ""
        if metadata:
            metadata_info = f"""
Document Information:
- Title: {metadata.get('title', 'Unknown')}
- Author: {metadata.get('author', 'Unknown')}
- Pages: {metadata.get('total_pages', 'Unknown')}
- Word Count: {metadata.get('word_count', 'Unknown')}
"""
        
        prompt = f"""Create a knowledge graph from the following text. Analyze the content and identify:

1. Key entities (concepts, people, places, organizations, technical terms)
2. Relationships between entities
3. Important keywords and themes

{metadata_info}
Text Content:
{text}

Please respond with a structured JSON that includes:
{{
    "nodes": [
        {{
            "id": "unique_id",
            "label": "entity_name",
            "type": "concept|person|place|organization|keyword",
            "importance": "high|medium|low",
            "description": "brief_description"
        }}
    ],
    "edges": [
        {{
            "source": "source_node_id",
            "target": "target_node_id",
            "label": "relationship_type",
            "weight": "relationship_strength"
        }}
    ],
    "analysis": {{
        "main_themes": ["theme1", "theme2"],
        "key_concepts": ["concept1", "concept2"],
        "document_type": "academic|technical|business|other"
    }}
}}

Focus on creating meaningful connections and identifying the most important elements. Limit to 20-30 nodes and 30-50 edges for clarity."""
        
        return prompt
    
    def _make_api_call(self, prompt: str, model: str = "google/gemma-3n-e4b-it:free") -> str:
        """Make API call to OpenRouter"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": self.site_url,
            "X-Title": self.site_name,
        }
        
        data = {
            "model": model,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.3,  # Lower temperature for more consistent results
            "max_tokens": 2000
        }
        
        try:
            response = requests.post(
                url=self.base_url,
                headers=headers,
                data=json.dumps(data),
                timeout=30
            )
            
            response.raise_for_status()
            
            result = response.json()
            
            if "choices" in result and len(result["choices"]) > 0:
                return result["choices"][0]["message"]["content"]
            else:
                raise Exception("Invalid response format from OpenRouter API")
                
        except requests.exceptions.RequestException as e:
            self.logger.error(f"API request failed: {str(e)}")
            raise Exception(f"API request failed: {str(e)}")
    
    def _parse_graph_response(self, response: str, original_text: str, metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        """Parse the API response into structured graph data"""
        try:
            # Try to parse JSON response
            parsed_data = json.loads(response)
            
            # Validate and structure the data
            nodes = parsed_data.get("nodes", [])
            edges = parsed_data.get("edges", [])
            analysis = parsed_data.get("analysis", {})
            
            # Add document node if not present
            doc_node = {
                "id": "document",
                "label": metadata.get("title", "Document") if metadata else "Document",
                "type": "document",
                "importance": "high",
                "description": "Main document"
            }
            
            if not any(node.get("id") == "document" for node in nodes):
                nodes.insert(0, doc_node)
            
            # Connect document to main entities
            main_entities = [node for node in nodes if node.get("type") != "document" and node.get("importance") == "high"]
            for entity in main_entities[:5]:  # Connect to top 5 entities
                edges.append({
                    "source": "document",
                    "target": entity["id"],
                    "label": "contains",
                    "weight": "high"
                })
            
            return {
                "graph_data": {
                    "nodes": nodes,
                    "edges": edges
                },
                "analysis": analysis,
                "metadata": {
                    "generated_at": datetime.now().isoformat(),
                    "original_text_length": len(original_text),
                    "compression_ratio": len(original_text) / 2000 if len(original_text) > 2000 else 1.0,
                    "total_nodes": len(nodes),
                    "total_edges": len(edges)
                }
            }
            
        except json.JSONDecodeError:
            # Fallback: create basic graph structure from text response
            self.logger.warning("Failed to parse JSON response, creating fallback graph")
            return self._create_fallback_graph(response, original_text, metadata)
    
    def _create_fallback_graph(self, response: str, original_text: str, metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        """Create a fallback graph when JSON parsing fails"""
        # Extract entities from response text
        entities = []
        relationships = []
        
        # Simple entity extraction from response
        lines = response.split('\n')
        for line in lines:
            if ':' in line and len(line.strip()) > 5:
                parts = line.split(':')
                if len(parts) >= 2:
                    entity_name = parts[0].strip()
                    if len(entity_name) > 2 and entity_name.lower() not in ['nodes', 'edges', 'analysis']:
                        entities.append({
                            "id": f"entity_{len(entities)}",
                            "label": entity_name,
                            "type": "concept",
                            "importance": "medium",
                            "description": parts[1].strip()[:100]
                        })
        
        # Add document node
        nodes = [{
            "id": "document",
            "label": metadata.get("title", "Document") if metadata else "Document",
            "type": "document",
            "importance": "high",
            "description": "Main document"
        }] + entities[:15]  # Limit to 15 entities
        
        # Create basic edges
        edges = []
        for i, entity in enumerate(entities[:10]):
            edges.append({
                "source": "document",
                "target": entity["id"],
                "label": "contains",
                "weight": "medium"
            })
        
        return {
            "graph_data": {
                "nodes": nodes,
                "edges": edges
            },
            "analysis": {
                "main_themes": ["extracted_from_text"],
                "key_concepts": [entity["label"] for entity in entities[:5]],
                "document_type": "unknown"
            },
            "metadata": {
                "generated_at": datetime.now().isoformat(),
                "original_text_length": len(original_text),
                "fallback_used": True,
                "total_nodes": len(nodes),
                "total_edges": len(edges)
            }
        }
    
    def _extract_from_text_response(self, response: str) -> Dict[str, Any]:
        """Extract entities and relationships from text response when JSON parsing fails"""
        entities = []
        relationships = []
        keywords = []
        
        # Simple extraction from text
        lines = response.split('\n')
        for line in lines:
            line = line.strip()
            if line and len(line) > 3:
                # Look for entity patterns
                if ':' in line:
                    parts = line.split(':')
                    if len(parts) >= 2:
                        entity_name = parts[0].strip()
                        if len(entity_name) > 2:
                            entities.append({
                                "name": entity_name,
                                "type": "concept",
                                "importance": "medium"
                            })
        
        return {
            "entities": entities[:10],
            "relationships": relationships,
            "keywords": keywords,
            "raw_response": response
        } 