"""
cognitive/vector_engine.py
Implements Semantic Caching using Redis and Google Gemini Embeddings.
This module provides "short-term memory" for the AI, reducing latency and costs.
"""
import os
import json
import logging
import hashlib
from typing import Optional, List, Dict, Tuple
from datetime import datetime, timedelta

# Configure Logging
logger = logging.getLogger(__name__)

# Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
EMBEDDING_MODEL = "models/embedding-001"
SIMILARITY_THRESHOLD = 0.90  # Cosine similarity threshold (0-1)
CACHE_TTL = 86400  # 24 hours in seconds
MAX_CACHE_SIZE = 10000  # Maximum number of cached entries

# Lazy imports to handle missing dependencies gracefully
try:
    import redis
    from redis.commands.search.field import VectorField, TextField
    from redis.commands.search.index_definition import IndexDefinition, IndexType
    REDIS_AVAILABLE = True
except ImportError as e:
    REDIS_AVAILABLE = False
    logger.warning(f"Redis modules not available: {e}. Semantic caching disabled.")

try:
    import google.generativeai as genai
    import numpy as np
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    logger.warning("Google Generative AI not available. Embeddings disabled.")


class VectorEngine:
    """
    Semantic caching engine using Redis and Gemini embeddings.
    Reduces AI inference costs by caching similar queries.
    """
    
    def __init__(self):
        """Initialize the Vector Engine with Redis connection and Gemini API."""
        self.redis = None
        self.index_name = "semantic_cache_idx"
        self.doc_prefix = "cache:"
        
        # Initialize Redis connection
        if REDIS_AVAILABLE:
            try:
                self.redis = redis.from_url(REDIS_URL, decode_responses=True)
                self.redis.ping()
                logger.info("✅ Vector Engine connected to Redis.")
                self._ensure_index()
            except Exception as e:
                logger.error(f"❌ Failed to connect to Redis: {e}")
                self.redis = None
        
        # Initialize Gemini
        if GENAI_AVAILABLE:
            try:
                api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
                if api_key:
                    genai.configure(api_key=api_key)
                    logger.info("✅ Gemini API configured.")
                else:
                    logger.warning("⚠️ No Gemini API key found.")
                    self.genai = None
            except Exception as e:
                logger.error(f"❌ Failed to configure Gemini: {e}")
                self.genai = None
    
    def _ensure_index(self):
        """Create RediSearch index if it doesn't exist."""
        if not self.redis:
            return
        
        try:
            # Check if index exists
            try:
                self.redis.ft(self.index_name).info()
                logger.debug(f"Index {self.index_name} already exists.")
                return
            except:
                pass
            
            # Create index
            schema = (
                TextField("$.query", no_stem=True, as_name="query"),
                TextField("$.response", no_stem=True, as_name="response"),
                VectorField(
                    "$.vector",
                    "FLAT",
                    {
                        "TYPE": "FLOAT32",
                        "DIM": 768,
                        "DISTANCE_METRIC": "COSINE"
                    },
                    as_name="vector"
                )
            )
            
            definition = IndexDefinition(
                prefix=[self.doc_prefix],
                index_type=IndexType.JSON
            )
            
            self.redis.ft(self.index_name).create_index(
                fields=schema,
                definition=definition
            )
            logger.info(f"✅ Created RediSearch index: {self.index_name}")
            
        except Exception as e:
            logger.error(f"❌ Failed to create index: {e}")
    
    def get_embedding(self, text: str) -> Optional[List[float]]:
        """
        Generate embedding vector for the given text using Gemini.
        
        Args:
            text: Input text to embed
            
        Returns:
            768-dimensional embedding vector or None if failed
        """
        if not GENAI_AVAILABLE:
            return None
        
        try:
            result = genai.embed_content(
                model=EMBEDDING_MODEL,
                content=text,
                task_type="retrieval_query"
            )
            return result['embedding']
        except Exception as e:
            logger.error(f"❌ Embedding generation failed: {e}")
            return None
    
    def cosine_similarity(self, v1: List[float], v2: List[float]) -> float:
        """
        Calculate cosine similarity between two vectors.
        
        Args:
            v1: First vector
            v2: Second vector
            
        Returns:
            Similarity score between 0 and 1
        """
        try:
            dot_product = sum(a * b for a, b in zip(v1, v2))
            norm_v1 = sum(a * a for a in v1) ** 0.5
            norm_v2 = sum(b * b for b in v2) ** 0.5
            
            if norm_v1 == 0 or norm_v2 == 0:
                return 0.0
            
            return dot_product / (norm_v1 * norm_v2)
        except Exception as e:
            logger.error(f"❌ Similarity calculation failed: {e}")
            return 0.0
    
    def search_cache(self, query_text: str) -> Optional[Dict]:
        """
        Semantic search against the Redis cache.
        
        Args:
            query_text: User query to search for
            
        Returns:
            Cached response dict with 'text', 'similarity', 'timestamp' or None
        """
        if not self.redis:
            logger.debug("Redis not available, skipping cache search.")
            return None
        
        try:
            # Generate embedding for query
            query_vector = self.get_embedding(query_text)
            if not query_vector:
                return None
            
            # Search using RediSearch
            # Convert vector to bytes for RediSearch
            query_vector_bytes = np.array(query_vector, dtype=np.float32).tobytes()
            
            # Perform KNN search
            results = self.redis.ft(self.index_name).search(
                f"*=>[KNN 5 @vector $vec]",
                query_params={"vec": query_vector_bytes}
            )
            
            if not results or not results.docs:
                logger.debug("No cache hits found.")
                return None
            
            # Check similarity for top result
            top_doc = results.docs[0]
            doc_data = json.loads(top_doc.json)
            
            cached_vector = doc_data.get('vector', [])
            similarity = self.cosine_similarity(query_vector, cached_vector)
            
            if similarity >= SIMILARITY_THRESHOLD:
                logger.info(f"✅ Cache HIT (similarity: {similarity:.3f})")
                return {
                    'text': doc_data.get('response'),
                    'similarity': similarity,
                    'query': doc_data.get('query'),
                    'timestamp': doc_data.get('timestamp')
                }
            else:
                logger.debug(f"Cache MISS (similarity too low: {similarity:.3f})")
                return None
                
        except Exception as e:
            logger.error(f"❌ Cache search failed: {e}")
            return None
    
    def cache_response(self, query_text: str, response_text: str, metadata: Dict = None):
        """
        Store the query vector and response in Redis.
        
        Args:
            query_text: Original query
            response_text: AI response to cache
            metadata: Optional metadata dict
        """
        if not self.redis:
            logger.debug("Redis not available, skipping cache write.")
            return
        
        try:
            # Generate embedding
            query_vector = self.get_embedding(query_text)
            if not query_vector:
                return
            
            # Create unique key
            key_hash = hashlib.md5(query_text.encode()).hexdigest()[:12]
            key = f"{self.doc_prefix}{key_hash}"
            
            # Prepare document
            doc = {
                'query': query_text,
                'response': response_text,
                'vector': query_vector,
                'timestamp': datetime.utcnow().isoformat(),
                'metadata': metadata or {}
            }
            
            # Store in Redis with TTL
            self.redis.json().set(key, '$', doc)
            self.redis.expire(key, CACHE_TTL)
            
            logger.info(f"✅ Cached response for query (key: {key})")
            
        except Exception as e:
            logger.error(f"❌ Failed to cache response: {e}")
    
    def get_cache_stats(self) -> Dict:
        """Get cache statistics."""
        if not self.redis:
            return {'status': 'disabled'}
        
        try:
            # Count keys with prefix
            keys = self.redis.keys(f"{self.doc_prefix}*")
            return {
                'status': 'active',
                'entries': len(keys),
                'ttl_hours': CACHE_TTL / 3600,
                'threshold': SIMILARITY_THRESHOLD
            }
        except Exception as e:
            logger.error(f"❌ Failed to get stats: {e}")
            return {'status': 'error', 'error': str(e)}


# Singleton instance for application use
vector_engine = VectorEngine()


def get_cached_response(query: str) -> Optional[str]:
    """
    Convenience function to check cache for a query.
    
    Args:
        query: User query string
        
    Returns:
        Cached response text or None
    """
    result = vector_engine.search_cache(query)
    return result['text'] if result else None


def cache_response(query: str, response: str, metadata: Dict = None):
    """
    Convenience function to cache a response.
    
    Args:
        query: Original query
        response: AI response
        metadata: Optional metadata
    """
    vector_engine.cache_response(query, response, metadata)
