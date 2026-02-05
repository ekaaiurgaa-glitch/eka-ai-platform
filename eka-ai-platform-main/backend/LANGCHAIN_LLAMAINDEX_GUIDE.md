# LangChain & LlamaIndex Integration Guide

## Overview

EKA-AI now includes advanced AI capabilities powered by:
- **LangChain**: For intelligent agent orchestration and tool calling
- **LlamaIndex**: For document indexing, vector search, and RAG (Retrieval-Augmented Generation)

This integration makes EKA-AI "smarter" by:
1. **Knowledge Retrieval**: Search service manuals, bulletins, and repair guides
2. **RAG**: Generate answers grounded in retrieved documents
3. **Diagnostic Agents**: Multi-step reasoning with tool access
4. **Context Augmentation**: Enhance AI responses with relevant knowledge

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     EKA-AI Backend                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   LlamaIndex │  │  LangChain   │  │    Flask     │      │
│  │  Knowledge   │  │    Agents    │  │    API       │      │
│  │    Base      │  │              │  │              │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │              │
│         └─────────────────┼─────────────────┘              │
│                           │                                │
│              ┌────────────┴────────────┐                  │
│              │    RAG Service          │                  │
│              │  (Retrieval + Generation)│                  │
│              └────────────┬────────────┘                  │
└───────────────────────────┼─────────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │Supabase  │ │  OpenAI  │ │  Gemini  │
        │Vector DB │ │   API    │ │   API    │
        └──────────┘ └──────────┘ └──────────┘
```

## Features

### 1. Knowledge Base Search (`/api/kb/search`)
Semantic search over indexed documents using vector embeddings.

**Use Cases:**
- Find relevant service procedures
- Locate technical specifications
- Search repair guides

**Example:**
```bash
curl -X POST https://eka-ai.go4garage.in/api/kb/search \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "brake pad replacement swift 2020",
    "top_k": 5
  }'
```

### 2. RAG Query (`/api/kb/query`)
Retrieval-Augmented Generation for intelligent Q&A.

**Process:**
1. User asks question
2. System retrieves relevant documents
3. LLM generates answer using retrieved context
4. Sources are cited for verification

**Example:**
```bash
curl -X POST https://eka-ai.go4garage.in/api/kb/query \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the torque specification for brake caliper bolts?",
    "vehicle_context": {
      "brand": "Maruti",
      "model": "Swift",
      "year": "2020"
    }
  }'
```

**Response:**
```json
{
  "answer": "According to the service manual, brake caliper bolts should be torqued to 35 Nm (25.8 lb-ft). Always use a calibrated torque wrench and tighten in a star pattern.",
  "sources": [
    {
      "source": "Maruti_Swift_Service_Manual.pdf",
      "score": 0.96,
      "excerpt": "Brake caliper bolt torque: 35 Nm..."
    }
  ],
  "confidence": 94.5
}
```

### 3. Diagnostic Agent (`/api/agent/diagnose`)
LangChain-powered diagnostic agent with tool calling.

**Capabilities:**
- Search knowledge base for similar issues
- Calculate MG billing
- Validate GSTIN
- Provide structured diagnosis with confidence scores

**Tools Available:**
- `search_knowledge_base`: Query repair manuals
- `calculate_mg_billing`: Fleet billing calculations
- `calculate_invoice`: Invoice with GST
- `validate_gstin`: GSTIN validation
- `get_pricing_guidance`: Pricing information

**Example:**
```bash
curl -X POST https://eka-ai.go4garage.in/api/agent/diagnose \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "symptoms": "Engine overheating, coolant leaking from bottom",
    "vehicle_context": {
      "brand": "Maruti",
      "model": "Swift",
      "year": "2019"
    }
  }'
```

**Response:**
```json
{
  "diagnosis": {
    "root_cause_analysis": "Based on knowledge base search...",
    "confidence_score": 87.5,
    "possible_causes": [
      "Failed water pump seal (70%)",
      "Damaged radiator hose (20%)",
      "Cracked radiator (10%)"
    ],
    "recommended_actions": [
      "Pressure test cooling system",
      "Inspect water pump weep hole",
      "Check radiator for cracks"
    ]
  },
  "tokens_used": 1250,
  "cost": 0.018
}
```

### 4. Enhanced Chat (`/api/agent/enhanced-chat`)
Regular chat augmented with RAG context.

**Benefits:**
- More accurate responses
- Grounded in workshop manuals
- Source citations

## Configuration

### Environment Variables

```bash
# Required for OpenAI (recommended)
OPENAI_API_KEY=sk-...

# Or use Gemini
GEMINI_API_KEY=...

# Supabase Vector Store
SUPABASE_URL=https://...supabase.co
SUPABASE_SERVICE_KEY=eyJ...
DATABASE_URL=postgresql://...

# Local Embeddings (fallback)
# No additional config needed - uses HuggingFace locally
```

### Document Indexing

#### Upload Service Manual

```python
import requests

documents = [
    {
        "content": "Brake Pad Replacement Procedure:\n1. Remove wheel\n2. Remove caliper bolts...",
        "metadata": {
            "title": "Brake Service Manual",
            "category": "brakes",
            "vehicle_model": "Swift"
        }
    }
]

response = requests.post(
    "https://eka-ai.go4garage.in/api/kb/documents",
    headers={"Authorization": "Bearer <token>"},
    json={
        "documents": documents,
        "source_type": "manual"
    }
)
```

#### Supported Document Types

| Source Type | Description | Examples |
|-------------|-------------|----------|
| `manual` | Service manuals | OEM workshop manuals |
| `bulletin` | Technical bulletins | TSBs, recalls |
| `guide` | Repair guides | Step-by-step procedures |
| `pricing` | Pricing catalogs | Parts, labor rates |
| `diagnostic` | Diagnostic procedures | Troubleshooting guides |

## Performance Considerations

### Embedding Models

| Model | Speed | Quality | Cost |
|-------|-------|---------|------|
| `text-embedding-3-small` (OpenAI) | Fast | Good | $0.02/1M tokens |
| `text-embedding-3-large` (OpenAI) | Medium | Excellent | $0.13/1M tokens |
| `BAAI/bge-small-en` (Local) | Slow | Good | Free |

### Query Performance

| Endpoint | Avg Latency | Rate Limit |
|----------|-------------|------------|
| `/kb/search` | 200-500ms | 60/min |
| `/kb/query` | 1-3s | 30/min |
| `/agent/diagnose` | 2-5s | 10/min |

### Optimization Tips

1. **Chunk Size**: Documents are split into 512-token chunks
2. **Overlap**: 50-token overlap between chunks for continuity
3. **Top-K**: Default retrieves 5 most relevant chunks
4. **Caching**: Consider caching frequent queries

## Cost Management

### Token Usage Tracking

All RAG and Agent endpoints return token usage:

```json
{
  "tokens_used": 1250,
  "cost": 0.018
}
```

### Cost Estimates

| Operation | Input Tokens | Output Tokens | Cost (GPT-4-mini) |
|-----------|--------------|---------------|-------------------|
| KB Search | N/A | N/A | $0 (embeddings only) |
| RAG Query | 2,000 | 500 | $0.00375 |
| Agent Diagnosis | 3,000 | 800 | $0.0057 |

### Budget Controls

Set monthly limits via environment:

```python
# In your application
MAX_MONTHLY_COST = float(os.getenv('MAX_AI_COST', 100))  # $100 default
```

## Security

### Data Privacy

- Documents are stored in YOUR Supabase instance
- Embeddings are not shared with third parties
- LLM calls use API keys you control

### Access Control

| Endpoint | Required Role |
|----------|---------------|
| `/kb/search` | Any authenticated |
| `/kb/query` | Any authenticated |
| `/kb/documents` | OWNER, MANAGER |
| `/agent/diagnose` | Any authenticated |
| `/kb/status` | Any authenticated |

## Troubleshooting

### Knowledge Base Not Available

**Symptoms:** 503 error on KB endpoints

**Solutions:**
1. Check environment variables
2. Verify Supabase connection
3. Check logs: `docker logs eka-ai-backend`

### Slow Queries

**Symptoms:** >5s response times

**Solutions:**
1. Add indexes to Supabase vector store
2. Reduce `top_k` parameter
3. Use local embeddings instead of API

### High Token Usage

**Symptoms:** Excessive costs

**Solutions:**
1. Implement query caching
2. Reduce chunk size
3. Use Gemini instead of OpenAI

## Testing

Run knowledge base tests:

```bash
cd backend
python -m unittest tests.test_knowledge_base -v
```

## Future Enhancements

- [ ] Multi-modal support (images in manuals)
- [ ] Real-time document sync
- [ ] Advanced filtering (by model year, engine type)
- [ ] Collaborative annotations
- [ ] Automatic document ingestion from PDFs
