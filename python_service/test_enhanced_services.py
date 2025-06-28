import pytest
import asyncio
import json
import os
import tempfile
from unittest.mock import Mock, patch, MagicMock
from typing import Dict, Any
import requests

from services.text_compressor import TextCompressor
from services.openrouter_service import OpenRouterService
from services.enhanced_graph_builder import EnhancedGraphBuilder
from services.pdf_processor import PDFProcessor

class TestTextCompressor:
    """Test cases for TextCompressor service"""
    
    def setup_method(self):
        self.compressor = TextCompressor()
        self.sample_text = """
        Artificial Intelligence (AI) is a branch of computer science that aims to create intelligent machines. 
        Machine Learning is a subset of AI that enables computers to learn and improve from experience without being explicitly programmed. 
        Deep Learning is a type of machine learning that uses neural networks with multiple layers to model and understand complex patterns. 
        Natural Language Processing (NLP) is a field of AI that focuses on the interaction between computers and human language. 
        Computer Vision is another important area of AI that enables machines to interpret and understand visual information from the world.
        """
    
    def test_compress_text_no_compression_needed(self):
        """Test compression when text is already short enough"""
        short_text = "This is a short text."
        result = self.compressor.compress_text(short_text, target_length=100)
        
        assert result["compressed_text"] == short_text
        assert result["compression_ratio"] == 1.0
        assert result["method"] == "none"
    
    def test_compress_text_smart_method(self):
        """Test smart compression method"""
        result = self.compressor.compress_text(self.sample_text, target_length=200, method="smart")
        
        assert len(result["compressed_text"]) <= 200
        assert result["compression_ratio"] < 1.0
        assert result["method"] == "smart"
        assert "compressed_text" in result
        assert "original_length" in result
        assert "compressed_length" in result
    
    def test_compress_text_extractive_method(self):
        """Test extractive compression method"""
        result = self.compressor.compress_text(self.sample_text, target_length=150, method="extractive")
        
        assert len(result["compressed_text"]) <= 150
        assert result["compression_ratio"] < 1.0
        assert result["method"] == "extractive"
    
    def test_compress_text_keyword_method(self):
        """Test keyword compression method"""
        result = self.compressor.compress_text(self.sample_text, target_length=100, method="keyword")
        
        assert len(result["compressed_text"]) <= 100
        assert result["compression_ratio"] < 1.0
        assert result["method"] == "keyword"
        assert "Key concepts:" in result["compressed_text"]
    
    def test_compress_text_invalid_method(self):
        """Test compression with invalid method"""
        with pytest.raises(ValueError, match="Unknown compression method"):
            self.compressor.compress_text(self.sample_text, target_length=100, method="invalid")
    
    def test_extract_keywords(self):
        """Test keyword extraction"""
        keywords = self.compressor._extract_keywords(self.sample_text)
        
        assert isinstance(keywords, list)
        assert len(keywords) > 0
        assert all(isinstance(k, str) for k in keywords)
    
    def test_extract_entities(self):
        """Test entity extraction"""
        entities = self.compressor._extract_entities(self.sample_text)
        
        assert isinstance(entities, list)
        assert len(entities) > 0
        # Should find AI-related terms
        assert any("Intelligence" in entity or "Learning" in entity for entity in entities)
    
    def test_calculate_sentence_score(self):
        """Test sentence scoring"""
        sentence = "Artificial Intelligence is a branch of computer science."
        score = self.compressor._calculate_sentence_score(sentence)
        
        assert isinstance(score, float)
        assert score > 0


class TestOpenRouterService:
    """Test cases for OpenRouter service"""
    
    def setup_method(self):
        self.api_key = "test_api_key"
        self.service = OpenRouterService(api_key=self.api_key)
    
    def test_init_with_api_key(self):
        """Test initialization with API key"""
        service = OpenRouterService(api_key="test_key")
        assert service.api_key == "test_key"
    
    def test_init_without_api_key(self):
        """Test initialization without API key"""
        with patch.dict(os.environ, {}, clear=True):
            service = OpenRouterService()
            assert service.api_key is None
    
    @patch('services.openrouter_service.requests.post')
    def test_make_api_call_success(self, mock_post):
        """Test successful API call"""
        # Mock successful response
        mock_response = Mock()
        mock_response.json.return_value = {
            "choices": [{"message": {"content": "Test response"}}]
        }
        mock_response.raise_for_status.return_value = None
        mock_post.return_value = mock_response
        
        result = self.service._make_api_call("Test prompt")
        
        assert result == "Test response"
        mock_post.assert_called_once()
    
    @patch('services.openrouter_service.requests.post')
    def test_make_api_call_failure(self, mock_post):
        """Test API call failure"""
        mock_post.side_effect = requests.exceptions.RequestException("API Error")
        
        with pytest.raises(Exception, match="API request failed: API Error"):
            self.service._make_api_call("Test prompt")
    
    def test_create_graph_prompt(self):
        """Test graph prompt creation"""
        text = "Sample text"
        metadata = {"title": "Test Document", "author": "Test Author"}
        
        prompt = self.service._create_graph_prompt(text, metadata)
        
        assert "Sample text" in prompt
        assert "Test Document" in prompt
        assert "Test Author" in prompt
        assert "knowledge graph" in prompt.lower()
    
    def test_parse_graph_response_valid_json(self):
        """Test parsing valid JSON response"""
        response = json.dumps({
            "nodes": [
                {"id": "node1", "label": "Concept", "type": "concept", "importance": "high"}
            ],
            "edges": [
                {"source": "node1", "target": "node2", "label": "related", "weight": "medium"}
            ],
            "analysis": {"main_themes": ["AI"], "key_concepts": ["Machine Learning"]}
        })
        
        result = self.service._parse_graph_response(response, "original text", {"title": "Test"})
        
        assert "graph_data" in result
        assert "analysis" in result
        assert "metadata" in result
        assert len(result["graph_data"]["nodes"]) > 0
    
    def test_parse_graph_response_invalid_json(self):
        """Test parsing invalid JSON response"""
        response = "Invalid JSON response"
        
        result = self.service._parse_graph_response(response, "original text", {"title": "Test"})
        
        assert "graph_data" in result
        assert "fallback_used" in result["metadata"]
        assert result["metadata"]["fallback_used"] is True
    
    def test_extract_from_text_response(self):
        """Test extraction from text response"""
        response = "Entity: AI\nConcept: Machine Learning\nKeyword: Neural Networks"
        
        result = self.service._extract_from_text_response(response)
        
        assert "entities" in result
        assert "relationships" in result
        assert "keywords" in result
        assert len(result["entities"]) > 0


class TestEnhancedGraphBuilder:
    """Test cases for EnhancedGraphBuilder"""
    
    def setup_method(self):
        self.builder = EnhancedGraphBuilder(use_openrouter=False, compression_target=1000)
        self.sample_text = """
        Artificial Intelligence (AI) is transforming the world. Machine Learning algorithms 
        are being used in various applications. Deep Learning models have achieved remarkable 
        results in computer vision and natural language processing. Neural networks are the 
        foundation of modern AI systems.
        """
        self.sample_metadata = {
            "title": "AI Overview",
            "author": "Test Author",
            "total_pages": 5,
            "word_count": 100
        }
    
    def test_init_without_openrouter(self):
        """Test initialization without OpenRouter"""
        builder = EnhancedGraphBuilder(use_openrouter=False)
        assert builder.use_openrouter is False
        assert builder.openrouter_service is None
    
    def test_init_with_openrouter(self):
        """Test initialization with OpenRouter"""
        with patch('services.enhanced_graph_builder.OpenRouterService'):
            builder = EnhancedGraphBuilder(use_openrouter=True)
            assert builder.use_openrouter is True
            assert builder.openrouter_service is not None
    
    def test_compress_text(self):
        """Test text compression"""
        result = self.builder._compress_text(self.sample_text)
        
        assert "compressed_text" in result
        assert "compression_ratio" in result
        assert len(result["compressed_text"]) <= self.builder.compression_target
    
    @pytest.mark.asyncio
    async def test_generate_traditional_graph(self):
        """Test traditional graph generation"""
        result = await self.builder._generate_traditional_graph(self.sample_text, self.sample_metadata)
        
        assert "entities" in result
        assert "relationships" in result
        assert "concepts" in result["entities"]
        assert "keywords" in result["entities"]
    
    def test_extract_entities_traditional(self):
        """Test traditional entity extraction"""
        entities = self.builder._extract_entities_traditional(self.sample_text)
        
        assert "concepts" in entities
        assert "keywords" in entities
        assert "numbers" in entities
        assert "dates" in entities
        assert len(entities["concepts"]) > 0
    
    def test_extract_relationships_traditional(self):
        """Test traditional relationship extraction"""
        relationships = self.builder._extract_relationships_traditional(self.sample_text)
        
        assert isinstance(relationships, list)
        assert all(isinstance(r, tuple) and len(r) == 3 for r in relationships)
    
    def test_add_document_node(self):
        """Test document node addition"""
        node_id = self.builder._add_document_node(self.sample_metadata)
        
        assert node_id in self.builder.graph.nodes()
        node_data = self.builder.graph.nodes[node_id]
        assert node_data["type"] == "document"
        assert node_data["title"] == "AI Overview"
    
    def test_add_entity_nodes(self):
        """Test entity node addition"""
        entities = {
            "concepts": ["AI", "Machine Learning"],
            "keywords": ["algorithm", "neural"],
            "numbers": ["100"],
            "dates": []
        }
        
        entity_nodes = self.builder._add_entity_nodes(entities)
        
        assert "concepts" in entity_nodes
        assert "keywords" in entity_nodes
        assert len(entity_nodes["concepts"]) == 2
        assert len(entity_nodes["keywords"]) == 2
    
    def test_analyze_graph(self):
        """Test graph analysis"""
        # Add some nodes and edges first
        self.builder._add_document_node(self.sample_metadata)
        entities = {"concepts": ["AI"], "keywords": ["algorithm"]}
        entity_nodes = self.builder._add_entity_nodes(entities)
        
        analysis = self.builder._analyze_graph()
        
        assert "total_nodes" in analysis
        assert "total_edges" in analysis
        assert "density" in analysis
        assert "node_types" in analysis
    
    def test_serialize_graph(self):
        """Test graph serialization"""
        # Add some nodes and edges first
        self.builder._add_document_node(self.sample_metadata)
        entities = {"concepts": ["AI"], "keywords": ["algorithm"]}
        self.builder._add_entity_nodes(entities)
        
        graph_data = self.builder._serialize_graph()
        
        assert "nodes" in graph_data
        assert "edges" in graph_data
        assert isinstance(graph_data["nodes"], list)
        assert isinstance(graph_data["edges"], list)
    
    @pytest.mark.asyncio
    async def test_build_graph_traditional(self):
        """Test complete graph building with traditional methods"""
        result = await self.builder.build_graph(self.sample_text, self.sample_metadata)
        
        assert "graph_data" in result
        assert "analysis" in result
        assert "compression_info" in result
        assert "ai_used" in result
        assert result["ai_used"] is False
        assert "processing_time" in result
        assert result["total_nodes"] > 0
    
    @pytest.mark.asyncio
    async def test_build_graph_with_openrouter(self):
        """Test complete graph building with OpenRouter integration"""
        # Mock OpenRouter service
        mock_openrouter = Mock()
        mock_openrouter.generate_graph_from_text.return_value = {
            "graph_data": {
                "nodes": [
                    {"id": "ai_node_1", "label": "AI", "type": "concept", "importance": "high"}
                ],
                "edges": []
            },
            "analysis": {"main_themes": ["AI"]},
            "metadata": {"total_nodes": 1, "total_edges": 0}
        }
        
        builder = EnhancedGraphBuilder(use_openrouter=True, compression_target=1000)
        builder.openrouter_service = mock_openrouter
        
        result = await builder.build_graph(self.sample_text, self.sample_metadata)
        
        assert "graph_data" in result
        assert "ai_used" in result
        assert result["ai_used"] is True
        mock_openrouter.generate_graph_from_text.assert_called_once()


class TestIntegration:
    """Integration tests for the enhanced services"""
    
    def setup_method(self):
        self.compressor = TextCompressor()
        self.builder = EnhancedGraphBuilder(use_openrouter=False, compression_target=500)
    
    def test_text_compression_integration(self):
        """Test text compression integration"""
        long_text = "This is a very long text. " * 100
        
        # Compress text
        compressed = self.compressor.compress_text(long_text, target_length=200)
        
        assert len(compressed["compressed_text"]) <= 200
        assert compressed["compression_ratio"] < 1.0
    
    @pytest.mark.asyncio
    async def test_graph_building_integration(self):
        """Test complete graph building integration"""
        text = """
        Artificial Intelligence is a field of computer science. Machine Learning is a subset of AI. 
        Deep Learning uses neural networks. Natural Language Processing helps computers understand text.
        """
        metadata = {"title": "AI Basics", "author": "Test"}
        
        result = await self.builder.build_graph(text, metadata)
        
        assert result["total_nodes"] > 0
        assert "graph_data" in result
        assert "compression_info" in result
        assert result["ai_used"] is False  # No OpenRouter in this test


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"]) 