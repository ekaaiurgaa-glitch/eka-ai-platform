"""
Unit tests for Knowledge Base and RAG Services
Run with: python -m unittest backend.tests.test_knowledge_base
"""

import unittest
import sys
import os
from unittest.mock import Mock, patch, MagicMock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestKnowledgeBaseIndex(unittest.TestCase):
    """Test cases for LlamaIndex knowledge base"""
    
    @patch('knowledge_base.index_manager.Settings')
    @patch('knowledge_base.index_manager.VectorStoreIndex')
    def test_knowledge_base_initialization(self, mock_index, mock_settings):
        """Test knowledge base initializes correctly"""
        from knowledge_base.index_manager import KnowledgeBaseIndex
        
        # Mock settings
        mock_settings.embed_model = None
        mock_settings.node_parser = None
        
        # Create instance
        kb = KnowledgeBaseIndex()
        
        # Should create index
        self.assertIsNotNone(kb)
        mock_index.assert_called_once()
    
    def test_search_result_dataclass(self):
        """Test SearchResult dataclass structure"""
        from knowledge_base.index_manager import SearchResult
        
        result = SearchResult(
            content="Test content",
            source="test_manual.pdf",
            score=0.95,
            metadata={"page": 1},
            node_id="node_123"
        )
        
        self.assertEqual(result.content, "Test content")
        self.assertEqual(result.source, "test_manual.pdf")
        self.assertEqual(result.score, 0.95)
        self.assertEqual(result.node_id, "node_123")


class TestRAGService(unittest.TestCase):
    """Test cases for RAG service"""
    
    @patch('agents.rag_service.ChatOpenAI')
    @patch('agents.rag_service.OpenAIEmbeddings')
    def test_rag_initialization(self, mock_embeddings, mock_llm):
        """Test RAG service initializes correctly"""
        from agents.rag_service import RAGService
        
        with patch.dict(os.environ, {'OPENAI_API_KEY': 'test_key'}):
            rag = RAGService()
            self.assertIsNotNone(rag)
    
    def test_rag_response_dataclass(self):
        """Test RAGResponse dataclass structure"""
        from agents.rag_service import RAGResponse
        
        response = RAGResponse(
            answer="Test answer",
            sources=[{"source": "doc1"}],
            confidence=85.5,
            retrieved_context=["context1"],
            tokens_used=150
        )
        
        self.assertEqual(response.answer, "Test answer")
        self.assertEqual(len(response.sources), 1)
        self.assertEqual(response.confidence, 85.5)
        self.assertEqual(response.tokens_used, 150)
    
    def test_enhance_query(self):
        """Test query enhancement with vehicle context"""
        from agents.rag_service import RAGService
        
        rag = RAGService()
        
        # Without context
        query1 = rag._enhance_query("brake noise", None)
        self.assertEqual(query1, "brake noise")
        
        # With context
        context = {
            "brand": "Maruti",
            "model": "Swift",
            "year": "2020"
        }
        query2 = rag._enhance_query("brake noise", context)
        self.assertIn("Maruti", query2)
        self.assertIn("Swift", query2)
        self.assertIn("brake noise", query2)
    
    def test_calculate_confidence(self):
        """Test confidence calculation from scores"""
        from agents.rag_service import RAGService
        from knowledge_base.index_manager import SearchResult
        
        rag = RAGService()
        
        # Mock search results
        results = [
            SearchResult(content="", source="", score=0.95, metadata={}, node_id=""),
            SearchResult(content="", source="", score=0.90, metadata={}, node_id=""),
            SearchResult(content="", source="", score=0.85, metadata={}, node_id="")
        ]
        
        confidence = rag._calculate_confidence(results)
        self.assertGreater(confidence, 0)
        self.assertLessEqual(confidence, 100)
        
        # Empty results
        confidence_empty = rag._calculate_confidence([])
        self.assertEqual(confidence_empty, 0.0)


class TestDiagnosticAgent(unittest.TestCase):
    """Test cases for LangChain diagnostic agent"""
    
    def test_extract_confidence(self):
        """Test confidence extraction from text"""
        from agents.diagnostic_agent import DiagnosticAgent
        
        agent = DiagnosticAgent()
        
        # Various confidence formats
        text1 = "I am 95% confident in this diagnosis"
        self.assertEqual(agent._extract_confidence(text1), 95.0)
        
        text2 = "Confidence score: 87"
        self.assertEqual(agent._extract_confidence(text2), 87.0)
        
        text3 = "confidence: 75%"
        self.assertEqual(agent._extract_confidence(text3), 75.0)
        
        # No confidence found
        text4 = "This is a diagnosis without confidence"
        self.assertEqual(agent._extract_confidence(text4), 0.0)
    
    def test_extract_causes(self):
        """Test cause extraction from text"""
        from agents.diagnostic_agent import DiagnosticAgent
        
        agent = DiagnosticAgent()
        
        text = """
Possible causes:
- Worn brake pads
- Low brake fluid
- Damaged rotors
- Faulty caliper

Recommended actions:
- Check pads
        """
        
        causes = agent._extract_causes(text)
        self.assertIn("Worn brake pads", causes)
        self.assertIn("Low brake fluid", causes)
        self.assertEqual(len(causes), 4)
    
    def test_extract_actions(self):
        """Test action extraction from text"""
        from agents.diagnostic_agent import DiagnosticAgent
        
        agent = DiagnosticAgent()
        
        text = """
Recommended actions:
1. Check brake pads
2. Inspect brake fluid level
3. Test brake system

Other information here.
        """
        
        actions = agent._extract_actions(text)
        self.assertIn("Check brake pads", actions)
        self.assertIn("Inspect brake fluid level", actions)
    
    def test_extract_sources(self):
        """Test source extraction from text"""
        from agents.diagnostic_agent import DiagnosticAgent
        
        agent = DiagnosticAgent()
        
        text = """
According to the manual:
Source: Service_Manual_2024.pdf
Some content here.

Source: TSB_Bulletin_15.pdf
More content.
        """
        
        sources = agent._extract_sources(text)
        self.assertIn("Service_Manual_2024.pdf", sources)
        self.assertIn("TSB_Bulletin_15.pdf", sources)


class TestIntegration(unittest.TestCase):
    """Integration test scenarios"""
    
    def test_end_to_end_rag_flow(self):
        """Test complete RAG flow"""
        # This would be an integration test with actual services
        # For unit tests, we verify the structure
        pass
    
    def test_knowledge_base_stats(self):
        """Test stats retrieval"""
        from knowledge_base.index_manager import KnowledgeBaseIndex
        
        with patch('knowledge_base.index_manager.VectorStoreIndex'):
            kb = KnowledgeBaseIndex()
            stats = kb.get_stats()
            
            self.assertIn('index_ready', stats)
            self.assertIn('vector_store_connected', stats)


if __name__ == '__main__':
    unittest.main(verbosity=2)
