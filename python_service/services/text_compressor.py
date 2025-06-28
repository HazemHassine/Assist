import re
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords
from collections import Counter
from typing import Dict, List, Tuple
import logging

class TextCompressor:
    """
    Service for compressing text content to reduce API usage while preserving key information
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
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
    
    def compress_text(self, text: str, target_length: int = 2000, method: str = "smart") -> Dict[str, any]:
        """
        Compress text to target length using specified method
        
        Args:
            text: Original text content
            target_length: Target length in characters
            method: Compression method ("smart", "extractive", "keyword")
            
        Returns:
            Dictionary with compressed text and metadata
        """
        if len(text) <= target_length:
            return {
                "compressed_text": text,
                "original_length": len(text),
                "compressed_length": len(text),
                "compression_ratio": 1.0,
                "method": "none",
                "preserved_elements": "full_text"
            }
        
        if method == "smart":
            return self._smart_compression(text, target_length)
        elif method == "extractive":
            return self._extractive_compression(text, target_length)
        elif method == "keyword":
            return self._keyword_compression(text, target_length)
        else:
            raise ValueError(f"Unknown compression method: {method}")
    
    def _smart_compression(self, text: str, target_length: int) -> Dict[str, any]:
        """
        Smart compression that combines multiple techniques
        """
        # Step 1: Extract key sentences
        sentences = sent_tokenize(text)
        key_sentences = self._extract_key_sentences(sentences, target_length // 2)
        
        # Step 2: Extract important keywords and entities
        keywords = self._extract_keywords(text)
        entities = self._extract_entities(text)
        
        # Step 3: Combine into compressed text
        compressed_parts = []
        
        # Add key sentences
        if key_sentences:
            compressed_parts.append(" ".join(key_sentences))
        
        # Add important entities if space allows
        if entities and len(" ".join(compressed_parts)) < target_length * 0.7:
            entity_text = f"Key entities: {', '.join(entities[:10])}"
            if len(" ".join(compressed_parts) + " " + entity_text) <= target_length:
                compressed_parts.append(entity_text)
        
        # Add important keywords if space allows
        if keywords and len(" ".join(compressed_parts)) < target_length * 0.8:
            keyword_text = f"Key concepts: {', '.join(keywords[:8])}"
            if len(" ".join(compressed_parts) + " " + keyword_text) <= target_length:
                compressed_parts.append(keyword_text)
        
        compressed_text = " ".join(compressed_parts)
        
        # Ensure we don't exceed target length
        if len(compressed_text) > target_length:
            compressed_text = compressed_text[:target_length-3] + "..."
        
        return {
            "compressed_text": compressed_text,
            "original_length": len(text),
            "compressed_length": len(compressed_text),
            "compression_ratio": len(compressed_text) / len(text),
            "method": "smart",
            "preserved_elements": {
                "key_sentences": len(key_sentences),
                "entities": len(entities),
                "keywords": len(keywords)
            }
        }
    
    def _extractive_compression(self, text: str, target_length: int) -> Dict[str, any]:
        """
        Extractive compression using sentence importance scoring
        """
        sentences = sent_tokenize(text)
        
        # Score sentences based on multiple factors
        sentence_scores = []
        for sentence in sentences:
            score = self._calculate_sentence_score(sentence)
            sentence_scores.append((sentence, score))
        
        # Sort by score and select top sentences
        sentence_scores.sort(key=lambda x: x[1], reverse=True)
        
        selected_sentences = []
        current_length = 0
        
        for sentence, score in sentence_scores:
            if current_length + len(sentence) <= target_length:
                selected_sentences.append(sentence)
                current_length += len(sentence)
            else:
                break
        
        compressed_text = " ".join(selected_sentences)
        
        return {
            "compressed_text": compressed_text,
            "original_length": len(text),
            "compressed_length": len(compressed_text),
            "compression_ratio": len(compressed_text) / len(text),
            "method": "extractive",
            "preserved_elements": f"{len(selected_sentences)}_key_sentences"
        }
    
    def _keyword_compression(self, text: str, target_length: int) -> Dict[str, any]:
        """
        Keyword-based compression focusing on important terms and concepts
        """
        keywords = self._extract_keywords(text)
        entities = self._extract_entities(text)
        
        # Create keyword summary
        keyword_summary = f"Key concepts: {', '.join(keywords[:15])}"
        
        # Add important entities
        if entities:
            entity_summary = f"Important entities: {', '.join(entities[:10])}"
            compressed_text = f"{keyword_summary}. {entity_summary}"
        else:
            compressed_text = keyword_summary
        
        # Truncate if needed
        if len(compressed_text) > target_length:
            compressed_text = compressed_text[:target_length-3] + "..."
        
        return {
            "compressed_text": compressed_text,
            "original_length": len(text),
            "compressed_length": len(compressed_text),
            "compression_ratio": len(compressed_text) / len(text),
            "method": "keyword",
            "preserved_elements": f"{len(keywords)}_keywords_{len(entities)}_entities"
        }
    
    def _extract_key_sentences(self, sentences: List[str], target_length: int) -> List[str]:
        """Extract the most important sentences"""
        if not sentences:
            return []
        
        # Score sentences
        sentence_scores = []
        for sentence in sentences:
            score = self._calculate_sentence_score(sentence)
            sentence_scores.append((sentence, score))
        
        # Sort by score and select top sentences
        sentence_scores.sort(key=lambda x: x[1], reverse=True)
        
        selected_sentences = []
        current_length = 0
        
        for sentence, score in sentence_scores:
            if current_length + len(sentence) <= target_length:
                selected_sentences.append(sentence)
                current_length += len(sentence)
            else:
                break
        
        return selected_sentences
    
    def _calculate_sentence_score(self, sentence: str) -> float:
        """Calculate importance score for a sentence"""
        score = 0.0
        
        # Length factor (prefer medium-length sentences)
        length = len(sentence)
        if 20 <= length <= 100:
            score += 2.0
        elif 10 <= length <= 150:
            score += 1.0
        
        # Keyword density
        words = word_tokenize(sentence.lower())
        stop_words = set(stopwords.words('english'))
        content_words = [w for w in words if w.isalnum() and w not in stop_words]
        
        if len(words) > 0:
            keyword_density = len(content_words) / len(words)
            score += keyword_density * 3.0
        
        # Presence of numbers (often important)
        if re.search(r'\d+', sentence):
            score += 1.0
        
        # Presence of capitalized words (proper nouns)
        proper_nouns = re.findall(r'\b[A-Z][a-z]+\b', sentence)
        score += len(proper_nouns) * 0.5
        
        # Position factor (first and last sentences are often important)
        return score
    
    def _extract_keywords(self, text: str) -> List[str]:
        """Extract important keywords from text"""
        words = word_tokenize(text.lower())
        stop_words = set(stopwords.words('english'))
        
        # Filter out stopwords and short words
        content_words = [word for word in words 
                        if word.isalnum() and 
                        word not in stop_words and 
                        len(word) > 3]
        
        # Get word frequencies
        word_freq = Counter(content_words)
        
        # Return most frequent words
        return [word for word, freq in word_freq.most_common(20)]
    
    def _extract_entities(self, text: str) -> List[str]:
        """Extract named entities and important terms"""
        entities = []
        
        # Extract capitalized phrases (potential proper nouns)
        proper_nouns = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', text)
        entities.extend(proper_nouns)
        
        # Extract technical terms (words with numbers or special patterns)
        technical_terms = re.findall(r'\b[A-Za-z]+\d+|\b[A-Z]{2,}\b', text)
        entities.extend(technical_terms)
        
        # Remove duplicates and common words
        unique_entities = list(set(entities))
        common_words = {'The', 'This', 'That', 'These', 'Those', 'And', 'Or', 'But', 'For', 'With'}
        filtered_entities = [entity for entity in unique_entities 
                           if entity not in common_words and len(entity) > 2]
        
        return filtered_entities[:15]  # Return top 15 entities 