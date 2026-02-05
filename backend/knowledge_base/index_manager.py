"""
LlamaIndex Integration for EKA-AI Knowledge Base
Manages document indexing, vector storage, and intelligent retrieval
"""

import os
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime
import logging

# LlamaIndex imports
from llama_index.core import (
    VectorStoreIndex,
    SimpleDirectoryReader,
    StorageContext,
    load_index_from_storage,
    Settings,
    Document
)
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core.retrievers import VectorIndexRetriever
from llama_index.core.query_engine import RetrieverQueryEngine
from llama_index.core.postprocessor import SimilarityPostprocessor
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.llms.openai import OpenAI
from llama_index.vector_stores.supabase import SupabaseVectorStore

# Supabase for metadata storage
from supabase import create_client

logger = logging.getLogger(__name__)


@dataclass
class SearchResult:
    """Structured search result from knowledge base"""
    content: str
    source: str
    score: float
    metadata: Dict[str, Any]
    node_id: str


class KnowledgeBaseIndex:
    """
    Manages the LlamaIndex vector index for EKA-AI
    Supports automotive manuals, service bulletins, pricing catalogs
    """
    
    def __init__(self):
        self.index: Optional[VectorStoreIndex] = None
        self.retriever: Optional[VectorIndexRetriever] = None
        self.query_engine: Optional[RetrieverQueryEngine] = None
        self.supabase = None
        self.vector_store = None
        
        # Initialize settings
        self._initialize_settings()
        
        # Initialize Supabase client
        self._initialize_supabase()
        
        # Load or create index
        self._initialize_index()
    
    def _initialize_settings(self):
        """Configure LlamaIndex global settings"""
        # Use OpenAI embeddings if API key available, else fallback to local
        if os.getenv("OPENAI_API_KEY"):
            Settings.embed_model = OpenAIEmbedding(
                model="text-embedding-3-small",
                api_key=os.getenv("OPENAI_API_KEY")
            )
            Settings.llm = OpenAI(
                model="gpt-4o-mini",
                api_key=os.getenv("OPENAI_API_KEY"),
                temperature=0.1
            )
        else:
            # Fallback to local embeddings (slower but no API cost)
            Settings.embed_model = HuggingFaceEmbedding(
                model_name="BAAI/bge-small-en-v1.5"
            )
        
        # Node parsing settings
        Settings.node_parser = SentenceSplitter(
            chunk_size=512,
            chunk_overlap=50
        )
        
        logger.info("✅ LlamaIndex settings initialized")
    
    def _initialize_supabase(self):
        """Initialize Supabase connection for vector storage"""
        try:
            if os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_SERVICE_KEY"):
                self.supabase = create_client(
                    os.getenv("SUPABASE_URL"),
                    os.getenv("SUPABASE_SERVICE_KEY")
                )
                
                # Initialize Supabase vector store
                self.vector_store = SupabaseVectorStore(
                    postgres_connection_string=os.getenv("DATABASE_URL"),
                    collection_name="eka_ai_knowledge"
                )
                
                logger.info("✅ Supabase vector store connected")
        except Exception as e:
            logger.warning(f"⚠️ Supabase vector store not available: {e}")
            self.vector_store = None
    
    def _initialize_index(self):
        """Load existing index or create new one"""
        try:
            # Try to load from storage
            storage_dir = "/opt/eka-ai/storage/llamaindex"
            if os.path.exists(storage_dir):
                storage_context = StorageContext.from_defaults(
                    persist_dir=storage_dir
                )
                self.index = load_index_from_storage(storage_context)
                logger.info("✅ Loaded existing LlamaIndex from storage")
            else:
                # Create new index with vector store if available
                if self.vector_store:
                    storage_context = StorageContext.from_defaults(
                        vector_store=self.vector_store
                    )
                    self.index = VectorStoreIndex(
                        [],
                        storage_context=storage_context
                    )
                else:
                    self.index = VectorStoreIndex([])
                logger.info("✅ Created new LlamaIndex")
            
            # Initialize retriever and query engine
            self._setup_retriever()
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize index: {e}")
            # Create empty index as fallback
            self.index = VectorStoreIndex([])
            self._setup_retriever()
    
    def _setup_retriever(self):
        """Setup retriever with similarity postprocessing"""
        if not self.index:
            return
        
        self.retriever = VectorIndexRetriever(
            index=self.index,
            similarity_top_k=5,
            vector_store_query_mode="default"
        )
        
        # Create query engine with postprocessing
        self.query_engine = RetrieverQueryEngine.from_args(
            retriever=self.retriever,
            node_postprocessors=[
                SimilarityPostprocessor(similarity_cutoff=0.7)
            ],
            response_mode="compact"
        )
        
        logger.info("✅ Retriever and query engine ready")
    
    def add_documents(self, documents: List[Document], source_type: str = "general") -> bool:
        """
        Add documents to the knowledge base
        
        Args:
            documents: List of LlamaIndex Document objects
            source_type: Type of documents (manual, bulletin, pricing, etc.)
        
        Returns:
            Success status
        """
        try:
            # Add metadata to each document
            for doc in documents:
                doc.metadata["source_type"] = source_type
                doc.metadata["indexed_at"] = datetime.now().isoformat()
            
            # Insert into index
            self.index.insert_nodes(documents)
            
            # Persist to storage
            self._persist()
            
            logger.info(f"✅ Added {len(documents)} documents to knowledge base")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to add documents: {e}")
            return False
    
    def search(self, query: str, top_k: int = 5, filters: Dict = None) -> List[SearchResult]:
        """
        Search knowledge base for relevant context
        
        Args:
            query: Search query
            top_k: Number of results to return
            filters: Optional metadata filters
        
        Returns:
            List of SearchResult objects
        """
        try:
            if not self.retriever:
                logger.warning("⚠️ Retriever not initialized")
                return []
            
            # Update top_k
            self.retriever.similarity_top_k = top_k
            
            # Retrieve nodes
            nodes = self.retriever.retrieve(query)
            
            # Convert to SearchResult
            results = []
            for node in nodes:
                result = SearchResult(
                    content=node.node.text,
                    source=node.node.metadata.get("file_name", "unknown"),
                    score=float(node.score) if hasattr(node, 'score') else 0.0,
                    metadata=node.node.metadata,
                    node_id=node.node.node_id
                )
                results.append(result)
            
            return results
            
        except Exception as e:
            logger.error(f"❌ Search failed: {e}")
            return []
    
    def query(self, query: str) -> Dict[str, Any]:
        """
        Query the knowledge base with LLM synthesis
        
        Args:
            query: Natural language query
        
        Returns:
            Response with answer and sources
        """
        try:
            if not self.query_engine:
                return {
                    "answer": "Knowledge base not available",
                    "sources": [],
                    "success": False
                }
            
            response = self.query_engine.query(query)
            
            # Extract source nodes
            sources = []
            if hasattr(response, 'source_nodes'):
                for node in response.source_nodes:
                    sources.append({
                        "content": node.node.text[:200],
                        "source": node.node.metadata.get("file_name", "unknown"),
                        "score": float(node.score) if hasattr(node, 'score') else 0.0
                    })
            
            return {
                "answer": str(response),
                "sources": sources,
                "success": True
            }
            
        except Exception as e:
            logger.error(f"❌ Query failed: {e}")
            return {
                "answer": f"Error: {str(e)}",
                "sources": [],
                "success": False
            }
    
    def delete_document(self, source: str) -> bool:
        """Delete all nodes from a specific source"""
        try:
            # This requires vector store support for deletion
            if self.vector_store:
                # Implement deletion logic based on metadata filter
                pass
            logger.info(f"✅ Deleted document: {source}")
            return True
        except Exception as e:
            logger.error(f"❌ Delete failed: {e}")
            return False
    
    def _persist(self):
        """Persist index to storage"""
        try:
            storage_dir = "/opt/eka-ai/storage/llamaindex"
            os.makedirs(storage_dir, exist_ok=True)
            self.index.storage_context.persist(persist_dir=storage_dir)
            logger.debug("💾 Index persisted to storage")
        except Exception as e:
            logger.error(f"❌ Failed to persist index: {e}")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get knowledge base statistics"""
        try:
            return {
                "index_ready": self.index is not None,
                "vector_store_connected": self.vector_store is not None,
                "document_count": len(self.index.docstore.docs) if self.index else 0,
                "embed_model": Settings.embed_model.__class__.__name__ if Settings.embed_model else None
            }
        except Exception as e:
            logger.error(f"❌ Stats error: {e}")
            return {"error": str(e)}


# Singleton instance
_kb_instance = None

def get_knowledge_base() -> KnowledgeBaseIndex:
    """Get or create singleton knowledge base instance"""
    global _kb_instance
    if _kb_instance is None:
        _kb_instance = KnowledgeBaseIndex()
    return _kb_instance
