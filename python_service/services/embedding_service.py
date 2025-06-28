from sentence_transformers import SentenceTransformer
import numpy as np
from typing import Dict, Any, List
import asyncio

class EmbeddingService: 
    def __init__(self):
        # Initialize the sentence transformer model
        # Using a lightweight model for faster processing
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.model_name = 'all-MiniLM-L6-v2'
        self.embedding_dimension = 384  # Dimension for this model
    
    async def generate_embeddings(self, text: str) -> Dict[str, Any]:
        """
        Generate embeddings for the given text
        
        Args:
            text: The text content to embed
            
        Returns:
            Dictionary containing embeddings and metadata
        """
        try:
            # Split text into chunks for better embedding
            chunks = self._split_text_into_chunks(text)
            
            # Generate embeddings for each chunk
            embeddings = []
            for chunk in chunks:
                embedding = self.model.encode(chunk, convert_to_tensor=False)
                embeddings.append(embedding.tolist())
            
            # Generate overall document embedding
            full_text_embedding = self.model.encode(text, convert_to_tensor=False)
            
            return {
                'model_name': self.model_name,
                'embedding_dimension': self.embedding_dimension,
                'chunk_embeddings': embeddings,
                'document_embedding': full_text_embedding.tolist(),
                'num_chunks': len(chunks),
                'chunk_texts': chunks,
                'embedding_type': 'sentence_transformers'
            }
            
        except Exception as e:
            raise Exception(f"Embedding generation failed: {str(e)}")
    
    def _split_text_into_chunks(self, text: str, max_chunk_size: int = 512) -> List[str]:
        """
        Split text into smaller chunks for better embedding
        
        Args:
            text: Text to split
            max_chunk_size: Maximum number of characters per chunk
            
        Returns:
            List of text chunks
        """
        if not text:
            return []
        
        # Simple splitting by sentences and size
        sentences = text.split('. ')
        chunks = []
        current_chunk = ""
        
        for sentence in sentences:
            if len(current_chunk) + len(sentence) < max_chunk_size:
                current_chunk += sentence + ". "
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = sentence + ". "
        
        # Add the last chunk if it exists
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        # If no chunks were created, create a single chunk
        if not chunks:
            chunks = [text[:max_chunk_size]]
        
        return chunks
    
    async def calculate_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """
        Calculate cosine similarity between two embeddings
        
        Args:
            embedding1: First embedding vector
            embedding2: Second embedding vector
            
        Returns:
            Similarity score between 0 and 1
        """
        try:
            vec1 = np.array(embedding1)
            vec2 = np.array(embedding2)
            
            # Calculate cosine similarity
            similarity = np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))
            return float(similarity)
            
        except Exception as e:
            raise Exception(f"Similarity calculation failed: {str(e)}")
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the embedding model"""
        return {
            'model_name': self.model_name,
            'embedding_dimension': self.embedding_dimension,
            'model_type': 'sentence_transformers',
            'description': 'Lightweight sentence transformer for fast embedding generation'
        } 