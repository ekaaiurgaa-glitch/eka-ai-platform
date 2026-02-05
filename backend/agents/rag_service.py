"""
RAG (Retrieval-Augmented Generation) Service for EKA-AI
Combines LlamaIndex retrieval with LangChain generation
"""

import os
import logging
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI

from llama_index.core import VectorStoreIndex, Document
from llama_index.core.retrievers import VectorIndexRetriever

logger = logging.getLogger(__name__)


@dataclass
class RAGResponse:
    """Structured RAG response"""
    answer: str
    sources: List[Dict[str, Any]]
    confidence: float
    retrieved_context: List[str]
    tokens_used: int


class RAGService:
    """
    RAG service that retrieves relevant documents and generates answers
    """
    
    # RAG Prompt Template
    RAG_PROMPT = """You are EKA-AI, an expert automotive diagnostic assistant.

Use the following retrieved context to answer the user's question.
If the context doesn't contain the answer, say "I don't have enough information to answer that."
Always cite your sources.

Retrieved Context:
{context}

User Question: {question}

Instructions:
1. Answer based ONLY on the provided context
2. Cite specific sources from the context
3. If multiple possible causes exist, list them with probabilities
4. Provide confidence score (0-100%)
5. Suggest next diagnostic steps

Response:"""
    
    def __init__(self):
        self.llm = None
        self.embeddings = None
        self.prompt = PromptTemplate(
            template=self.RAG_PROMPT,
            input_variables=["context", "question"]
        )
        self._initialize_llm()
    
    def _initialize_llm(self):
        """Initialize LLM and embeddings"""
        try:
            if os.getenv("OPENAI_API_KEY"):
                self.llm = ChatOpenAI(
                    model="gpt-4o-mini",
                    temperature=0.1,
                    api_key=os.getenv("OPENAI_API_KEY")
                )
                self.embeddings = OpenAIEmbeddings(
                    model="text-embedding-3-small",
                    api_key=os.getenv("OPENAI_API_KEY")
                )
                logger.info("✅ RAG service using OpenAI")
            
            elif os.getenv("GEMINI_API_KEY"):
                self.llm = ChatGoogleGenerativeAI(
                    model="gemini-2.0-flash",
                    temperature=0.1,
                    api_key=os.getenv("GEMINI_API_KEY")
                )
                logger.info("✅ RAG service using Gemini (embeddings limited)")
                
        except Exception as e:
            logger.error(f"❌ RAG initialization failed: {e}")
    
    def query(
        self,
        question: str,
        vehicle_context: Optional[Dict] = None,
        top_k: int = 5
    ) -> RAGResponse:
        """
        Execute RAG query
        
        Args:
            question: User question
            vehicle_context: Optional vehicle details for context
            top_k: Number of documents to retrieve
        
        Returns:
            RAGResponse with answer and sources
        """
        try:
            # Get knowledge base
            from knowledge_base.index_manager import get_knowledge_base
            kb = get_knowledge_base()
            
            # Enhance query with vehicle context
            enhanced_query = self._enhance_query(question, vehicle_context)
            
            # Retrieve relevant documents
            search_results = kb.search(enhanced_query, top_k=top_k)
            
            if not search_results:
                return RAGResponse(
                    answer="I don't have sufficient information in my knowledge base to answer this question.",
                    sources=[],
                    confidence=0.0,
                    retrieved_context=[],
                    tokens_used=0
                )
            
            # Format context
            context = self._format_context(search_results)
            retrieved_context = [r.content for r in search_results]
            
            # Generate answer
            if self.llm:
                prompt_input = self.prompt.format(
                    context=context,
                    question=question
                )
                
                response = self.llm.invoke(prompt_input)
                answer = response.content if hasattr(response, 'content') else str(response)
                
                # Estimate tokens (rough approximation)
                tokens_used = len(prompt_input.split()) + len(answer.split())
            else:
                # Fallback without LLM - return raw context
                answer = self._format_fallback_answer(search_results)
                tokens_used = 0
            
            # Calculate confidence based on retrieval scores
            confidence = self._calculate_confidence(search_results)
            
            # Format sources
            sources = [
                {
                    "source": r.source,
                    "score": r.score,
                    "excerpt": r.content[:200] + "..."
                }
                for r in search_results
            ]
            
            return RAGResponse(
                answer=answer,
                sources=sources,
                confidence=confidence,
                retrieved_context=retrieved_context,
                tokens_used=tokens_used
            )
            
        except Exception as e:
            logger.error(f"❌ RAG query failed: {e}")
            return RAGResponse(
                answer=f"Error processing query: {str(e)}",
                sources=[],
                confidence=0.0,
                retrieved_context=[],
                tokens_used=0
            )
    
    def _enhance_query(
        self,
        question: str,
        vehicle_context: Optional[Dict]
    ) -> str:
        """Enhance query with vehicle context"""
        if not vehicle_context:
            return question
        
        vehicle_info = " ".join([
            vehicle_context.get("brand", ""),
            vehicle_context.get("model", ""),
            vehicle_context.get("year", ""),
            vehicle_context.get("fuel_type", "")
        ]).strip()
        
        if vehicle_info:
            return f"{question} (Vehicle: {vehicle_info})"
        return question
    
    def _format_context(self, results: List) -> str:
        """Format search results into context string"""
        context_parts = []
        for i, result in enumerate(results, 1):
            context_parts.append(
                f"[Source {i}: {result.source}]\n{result.content}\n"
            )
        return "\n---\n".join(context_parts)
    
    def _format_fallback_answer(self, results: List) -> str:
        """Format answer when LLM is not available"""
        answer_parts = ["Based on relevant documents:\n"]
        for i, result in enumerate(results[:3], 1):
            answer_parts.append(f"\n{i}. From {result.source}:")
            answer_parts.append(result.content[:300] + "...")
        return "\n".join(answer_parts)
    
    def _calculate_confidence(self, results: List) -> float:
        """Calculate overall confidence from retrieval scores"""
        if not results:
            return 0.0
        
        # Average of top 3 scores, scaled to 0-100
        top_scores = [r.score for r in results[:3]]
        avg_score = sum(top_scores) / len(top_scores)
        
        # Scale and cap
        confidence = min(100, max(0, avg_score * 100))
        return round(confidence, 1)
    
    def add_to_context(
        self,
        documents: List[Dict[str, str]],
        source_type: str = "user_upload"
    ) -> bool:
        """
        Add documents to RAG context
        
        Args:
            documents: List of {"content": "...", "metadata": {...}}
            source_type: Type of source
        
        Returns:
            Success status
        """
        try:
            from knowledge_base.index_manager import get_knowledge_base, Document
            
            kb = get_knowledge_base()
            
            # Convert to LlamaIndex documents
            idx_documents = []
            for doc in documents:
                idx_doc = Document(
                    text=doc["content"],
                    metadata={
                        **doc.get("metadata", {}),
                        "source_type": source_type,
                        "added_via": "rag_service"
                    }
                )
                idx_documents.append(idx_doc)
            
            # Add to knowledge base
            success = kb.add_documents(idx_documents, source_type)
            
            if success:
                logger.info(f"✅ Added {len(documents)} documents to RAG context")
            
            return success
            
        except Exception as e:
            logger.error(f"❌ Failed to add documents: {e}")
            return False


# Singleton
_rag_instance = None

def get_rag_service() -> RAGService:
    """Get RAG service singleton"""
    global _rag_instance
    if _rag_instance is None:
        _rag_instance = RAGService()
    return _rag_instance
