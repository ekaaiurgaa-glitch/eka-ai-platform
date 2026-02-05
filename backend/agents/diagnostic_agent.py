"""
LangChain Diagnostic Agent for EKA-AI
Provides intelligent diagnostic reasoning with tool calling
"""

import os
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from decimal import Decimal

# LangChain imports
from langchain.agents import AgentExecutor
from langchain.agents.tool_calling_agent.base import create_tool_calling_agent
from langchain.tools import Tool, StructuredTool
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.callbacks import get_openai_callback

# Import EKA-AI services
from services.mg_service import MGEngine
from services.billing import calculate_invoice_totals, validate_gstin
from knowledge_base.index_manager import get_knowledge_base

logger = logging.getLogger(__name__)


# Tool definitions for the agent
TOOLS_DESCRIPTION = """
You are EKA-AI Diagnostic Agent - an expert automotive diagnostic system.
You have access to specialized tools for retrieving information and performing calculations.

Available Tools:
1. search_knowledge_base - Search vehicle manuals, service bulletins, and repair guides
2. calculate_mg_billing - Calculate Minimum Guarantee fleet billing
3. calculate_invoice - Calculate invoice totals with GST
4. validate_vehicle_data - Validate VIN, registration numbers
5. get_pricing_range - Get part and labor pricing ranges

Rules:
- ALWAYS use tools for factual information (don't hallucinate)
- If confidence is low, ask clarifying questions
- Never output exact final prices - only ranges
- Always cite sources from knowledge base searches
"""


class DiagnosticAgent:
    """
    LangChain-powered diagnostic agent with tool calling
    """
    
    def __init__(self):
        self.llm = None
        self.agent = None
        self.agent_executor = None
        self.tools = []
        
        self._initialize_llm()
        self._setup_tools()
        self._create_agent()
    
    def _initialize_llm(self):
        """Initialize the language model"""
        try:
            # Try OpenAI first
            if os.getenv("OPENAI_API_KEY"):
                self.llm = ChatOpenAI(
                    model="gpt-4o-mini",
                    temperature=0.1,
                    api_key=os.getenv("OPENAI_API_KEY")
                )
                logger.info("✅ OpenAI LLM initialized for agent")
            
            # Fallback to Gemini
            elif os.getenv("GEMINI_API_KEY"):
                self.llm = ChatGoogleGenerativeAI(
                    model="gemini-2.0-flash",
                    temperature=0.1,
                    api_key=os.getenv("GEMINI_API_KEY")
                )
                logger.info("✅ Gemini LLM initialized for agent")
            
            else:
                logger.warning("⚠️ No LLM API key available for agent")
                
        except Exception as e:
            logger.error(f"❌ Failed to initialize LLM: {e}")
    
    def _setup_tools(self):
        """Define tools available to the agent"""
        
        def search_knowledge_base(query: str, top_k: int = 5) -> str:
            """Search vehicle manuals, service bulletins, and repair guides"""
            try:
                kb = get_knowledge_base()
                results = kb.search(query, top_k=top_k)
                
                if not results:
                    return "No relevant information found in knowledge base."
                
                formatted = []
                for i, r in enumerate(results, 1):
                    formatted.append(f"[{i}] Source: {r.source} (Score: {r.score:.3f})\n{r.content[:500]}...")
                
                return "\n\n".join(formatted)
            except Exception as e:
                return f"Search error: {str(e)}"
        
        def calculate_mg_billing(
            assured_km_annual: int,
            rate_per_km: float,
            actual_km: int,
            months: int = 1,
            excess_rate: float = None
        ) -> str:
            """Calculate Minimum Guarantee fleet billing"""
            try:
                from decimal import Decimal
                
                if excess_rate:
                    result = MGEngine.calculate_excess_bill(
                        assured_km_annual=assured_km_annual,
                        rate_per_km=Decimal(str(rate_per_km)),
                        excess_rate_per_km=Decimal(str(excess_rate)),
                        actual_km_run=actual_km,
                        months_in_cycle=months
                    )
                else:
                    result = MGEngine.calculate_monthly_bill(
                        assured_km_annual=assured_km_annual,
                        rate_per_km=Decimal(str(rate_per_km)),
                        actual_km_run=actual_km,
                        months_in_cycle=months
                    )
                
                return json.dumps(result, indent=2)
            except Exception as e:
                return f"Calculation error: {str(e)}"
        
        def calculate_invoice_with_gst(
            items_json: str,
            workshop_state: str,
            customer_state: str
        ) -> str:
            """Calculate invoice totals with GST. Items should be JSON array."""
            try:
                items = json.loads(items_json)
                result = calculate_invoice_totals(items, workshop_state, customer_state)
                return json.dumps(result, indent=2, default=str)
            except Exception as e:
                return f"Invoice calculation error: {str(e)}"
        
        def validate_gstin_number(gstin: str) -> str:
            """Validate GSTIN format"""
            result = validate_gstin(gstin)
            return json.dumps(result, indent=2)
        
        def get_pricing_guidance(part_code: str = None, service_code: str = None) -> str:
            """Get pricing range guidance for parts or services"""
            # This would query the database in production
            # For now, return generic guidance
            return """
Pricing Guidance:
- Parts pricing is governed by catalog with min/max ranges
- Labor rates are based on standard hours and skill level
- AI can only provide ranges, not exact amounts
- Final pricing is determined by backend services
            """.strip()
        
        # Create LangChain tools
        self.tools = [
            Tool(
                name="search_knowledge_base",
                func=search_knowledge_base,
                description="Search vehicle manuals, service bulletins, and repair guides. Input: search query string."
            ),
            StructuredTool.from_function(
                name="calculate_mg_billing",
                func=calculate_mg_billing,
                description="Calculate Minimum Guarantee fleet billing. Inputs: assured_km_annual (int), rate_per_km (float), actual_km (int), months (int, default 1), excess_rate (float, optional)"
            ),
            StructuredTool.from_function(
                name="calculate_invoice",
                func=calculate_invoice_with_gst,
                description="Calculate invoice with GST. Inputs: items_json (JSON array string), workshop_state (2-digit code), customer_state (2-digit code)"
            ),
            Tool(
                name="validate_gstin",
                func=validate_gstin_number,
                description="Validate GSTIN format. Input: GSTIN string."
            ),
            Tool(
                name="get_pricing_guidance",
                func=get_pricing_guidance,
                description="Get pricing range guidance. Optional inputs: part_code or service_code."
            )
        ]
        
        logger.info(f"✅ {len(self.tools)} tools initialized")
    
    def _create_agent(self):
        """Create the LangChain agent with tools"""
        if not self.llm:
            logger.warning("⚠️ Cannot create agent without LLM")
            return
        
        try:
            # Create prompt
            prompt = ChatPromptTemplate.from_messages([
                SystemMessage(content=TOOLS_DESCRIPTION),
                MessagesPlaceholder(variable_name="chat_history"),
                HumanMessage(content="{input}"),
                MessagesPlaceholder(variable_name="agent_scratchpad")
            ])
            
            # Create agent
            self.agent = create_tool_calling_agent(self.llm, self.tools, prompt)
            
            # Create executor
            self.agent_executor = AgentExecutor(
                agent=self.agent,
                tools=self.tools,
                verbose=True,
                max_iterations=10,
                handle_parsing_errors=True
            )
            
            logger.info("✅ LangChain agent initialized")
            
        except Exception as e:
            logger.error(f"❌ Failed to create agent: {e}")
    
    def diagnose(
        self,
        symptoms: str,
        vehicle_context: Dict[str, Any],
        chat_history: List[Dict] = None
    ) -> Dict[str, Any]:
        """
        Perform intelligent diagnosis with tool assistance
        
        Args:
            symptoms: User-reported symptoms
            vehicle_context: Vehicle details (brand, model, year, etc.)
            chat_history: Previous conversation messages
        
        Returns:
            Diagnostic result with root cause, confidence, and recommendations
        """
        if not self.agent_executor:
            return {
                "success": False,
                "error": "Agent not initialized",
                "diagnosis": None
            }
        
        try:
            # Build input
            vehicle_info = f"{vehicle_context.get('brand', 'Unknown')} {vehicle_context.get('model', '')} {vehicle_context.get('year', '')}"
            
            input_text = f"""
Vehicle: {vehicle_info}
Symptoms: {symptoms}

Analyze these symptoms and:
1. Search knowledge base for similar issues
2. Identify root cause (not just symptoms)
3. Provide confidence score (0-100%)
4. List possible causes with probabilities
5. Recommend diagnostic actions

Return structured response with clear reasoning.
            """.strip()
            
            # Format chat history
            formatted_history = []
            if chat_history:
                for msg in chat_history[-5:]:  # Last 5 messages
                    if msg.get("role") == "user":
                        formatted_history.append(HumanMessage(content=msg.get("content", "")))
                    else:
                        formatted_history.append(AIMessage(content=msg.get("content", "")))
            
            # Execute with callback for token tracking
            with get_openai_callback() as cb:
                result = self.agent_executor.invoke({
                    "input": input_text,
                    "chat_history": formatted_history
                })
                
                logger.info(f"Agent tokens used: {cb.total_tokens}, Cost: ${cb.total_cost:.4f}")
            
            # Parse and structure response
            output = result.get("output", "")
            
            # Try to extract structured data from output
            parsed = self._parse_diagnostic_output(output)
            
            return {
                "success": True,
                "diagnosis": parsed,
                "raw_output": output,
                "tokens_used": cb.total_tokens,
                "cost": cb.total_cost
            }
            
        except Exception as e:
            logger.error(f"❌ Diagnosis failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "diagnosis": None
            }
    
    def _parse_diagnostic_output(self, output: str) -> Dict[str, Any]:
        """Parse agent output into structured diagnostic data"""
        # This is a simplified parser - in production, use structured output
        return {
            "root_cause_analysis": output,
            "confidence_score": self._extract_confidence(output),
            "possible_causes": self._extract_causes(output),
            "recommended_actions": self._extract_actions(output),
            "knowledge_sources": self._extract_sources(output)
        }
    
    def _extract_confidence(self, text: str) -> float:
        """Extract confidence score from text"""
        import re
        patterns = [
            r'confidence[\s:]+(\d+)%',
            r'(\d+)%\s+confident',
            r'confidence score[\s:]+(\d+)'
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return float(match.group(1))
        return 0.0
    
    def _extract_causes(self, text: str) -> List[str]:
        """Extract possible causes from text"""
        causes = []
        lines = text.split('\n')
        in_causes_section = False
        
        for line in lines:
            if 'possible cause' in line.lower() or 'likely cause' in line.lower():
                in_causes_section = True
                continue
            if in_causes_section and line.strip().startswith(('-', '*', '1.', '2.', '3.')):
                causes.append(line.strip('- *1234567890. '))
            elif in_causes_section and line.strip() == '':
                break
        
        return causes[:5]  # Top 5 causes
    
    def _extract_actions(self, text: str) -> List[str]:
        """Extract recommended actions from text"""
        actions = []
        lines = text.split('\n')
        in_actions_section = False
        
        for line in lines:
            if 'recommend' in line.lower() or 'action' in line.lower():
                in_actions_section = True
                continue
            if in_actions_section and line.strip().startswith(('-', '*', '1.', '2.', '3.')):
                actions.append(line.strip('- *1234567890. '))
            elif in_actions_section and line.strip() == '':
                break
        
        return actions[:5]
    
    def _extract_sources(self, text: str) -> List[str]:
        """Extract knowledge base sources from text"""
        import re
        sources = []
        pattern = r'Source:\s*([^\n]+)'
        matches = re.findall(pattern, text)
        for match in matches:
            sources.append(match.strip())
        return list(set(sources))  # Deduplicate


# Singleton instance
_agent_instance = None

def get_diagnostic_agent() -> DiagnosticAgent:
    """Get or create singleton diagnostic agent"""
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = DiagnosticAgent()
    return _agent_instance
