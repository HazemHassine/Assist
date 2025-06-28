"""
Configuration settings for the enhanced Python service
"""

import os
from typing import Optional

class Config:
    """Configuration class for the enhanced document processing service"""
    
    # OpenRouter API Configuration
    OPENROUTER_API_KEY: Optional[str] = os.getenv("OPENROUTER_API_KEY")
    USE_OPENROUTER: bool = os.getenv("USE_OPENROUTER", "true").lower() == "true"
    OPENROUTER_SITE_URL: str = os.getenv("OPENROUTER_SITE_URL", "http://localhost:3000")
    OPENROUTER_SITE_NAME: str = os.getenv("OPENROUTER_SITE_NAME", "Assist2")
    
    # Text Compression Configuration
    COMPRESSION_TARGET: int = int(os.getenv("COMPRESSION_TARGET", "2000"))
    COMPRESSION_METHOD: str = os.getenv("COMPRESSION_METHOD", "smart")
    
    # Graph Building Configuration
    MAX_GRAPH_NODES: int = int(os.getenv("MAX_GRAPH_NODES", "50"))
    MAX_GRAPH_EDGES: int = int(os.getenv("MAX_GRAPH_EDGES", "100"))
    
    # API Configuration
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))
    API_WORKERS: int = int(os.getenv("API_WORKERS", "1"))
    
    # CORS Configuration
    CORS_ORIGINS: list = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
    
    # Logging Configuration
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FORMAT: str = os.getenv("LOG_FORMAT", "%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    
    # Performance Configuration
    MAX_TEXT_LENGTH: int = int(os.getenv("MAX_TEXT_LENGTH", "100000"))
    REQUEST_TIMEOUT: int = int(os.getenv("REQUEST_TIMEOUT", "30"))
    
    # Testing Configuration
    TEST_MODE: bool = os.getenv("TEST_MODE", "false").lower() == "true"
    MOCK_OPENROUTER: bool = os.getenv("MOCK_OPENROUTER", "false").lower() == "true"
    
    @classmethod
    def validate(cls) -> bool:
        """Validate configuration settings"""
        errors = []
        
        if cls.USE_OPENROUTER and not cls.OPENROUTER_API_KEY:
            errors.append("OpenRouter API key is required when USE_OPENROUTER is enabled")
        
        if cls.COMPRESSION_TARGET <= 0:
            errors.append("COMPRESSION_TARGET must be positive")
        
        if cls.MAX_GRAPH_NODES <= 0:
            errors.append("MAX_GRAPH_NODES must be positive")
        
        if cls.MAX_GRAPH_EDGES <= 0:
            errors.append("MAX_GRAPH_EDGES must be positive")
        
        if errors:
            print("Configuration validation errors:")
            for error in errors:
                print(f"  - {error}")
            return False
        
        return True
    
    @classmethod
    def print_config(cls):
        """Print current configuration"""
        print("Enhanced Document Processing Service Configuration:")
        print("=" * 50)
        print(f"OpenRouter API Key: {'Set' if cls.OPENROUTER_API_KEY else 'Not set'}")
        print(f"Use OpenRouter: {cls.USE_OPENROUTER}")
        print(f"Compression Target: {cls.COMPRESSION_TARGET} characters")
        print(f"Compression Method: {cls.COMPRESSION_METHOD}")
        print(f"Max Graph Nodes: {cls.MAX_GRAPH_NODES}")
        print(f"Max Graph Edges: {cls.MAX_GRAPH_EDGES}")
        print(f"API Host: {cls.API_HOST}")
        print(f"API Port: {cls.API_PORT}")
        print(f"Log Level: {cls.LOG_LEVEL}")
        print(f"Test Mode: {cls.TEST_MODE}")
        print("=" * 50)
    
    @classmethod
    def get_openrouter_config(cls) -> dict:
        """Get OpenRouter configuration"""
        return {
            "api_key": cls.OPENROUTER_API_KEY,
            "site_url": cls.OPENROUTER_SITE_URL,
            "site_name": cls.OPENROUTER_SITE_NAME
        }
    
    @classmethod
    def get_compression_config(cls) -> dict:
        """Get compression configuration"""
        return {
            "target_length": cls.COMPRESSION_TARGET,
            "method": cls.COMPRESSION_METHOD
        }
    
    @classmethod
    def get_graph_config(cls) -> dict:
        """Get graph building configuration"""
        return {
            "max_nodes": cls.MAX_GRAPH_NODES,
            "max_edges": cls.MAX_GRAPH_EDGES,
            "use_openrouter": cls.USE_OPENROUTER
        } 