# EKA-AI Platform Integration Assessment

## 🎯 Executive Summary

**Status:** Service classes fully implemented but NOT integrated into server.py

**Action Required:** Wire up 30+ API endpoints to expose the implemented services

---

## ✅ What's Already Implemented (Service Layer)

### 1. JobCardManager (858 lines)
- Full 9-state FSM with VALID_TRANSITIONS
- State validation logic
- Workshop isolation
- Audit trail logging
- Job card CRUD operations

### 2. PDIManager (882 lines)
- 16-item standardized checklist
- Evidence upload management
- Completion validation
- Critical safety gates
- Technician declaration

### 3. InvoiceManager (828 lines)
- Invoice generation with unique numbering
- GST-compliant structure
- PDF generation capability
- Invoice sequencing
- Line item management

### 4. AIGovernance (721 lines)
- 4-layer validation system:
  - Domain Gate (automobile queries only)
  - Confidence Gate (≥0.90 threshold)
  - Context Gate (vehicle details required)
  - Permission Gate (role-based access)

### 5. Supporting Services
- MGEngine (fleet billing calculations)
- Billing service (GST calculations)
- Auth middleware (JWT + RBAC)

---

## ❌ What's Missing (API Integration Layer)

### Current Endpoints in server.py (21 total)
```
✅ /api/health
✅ /api/chat
✅ /api/speak
✅ /api/upload-pdi
✅ /api/approve-job
✅ /api/generate-approval-link
✅ /api/mg/calculate
✅ /api/mg/validate-odometer
✅ /api/job/transition (basic, needs JobCardManager)
✅ /api/job/transitions (basic, needs JobCardManager)
✅ /api/billing/calculate
✅ /api/billing/validate-gstin
✅ /api/billing/tax-type
✅ /api/kb/* (knowledge base - 4 endpoints)
✅ /api/agent/* (diagnostic agent - 2 endpoints)
```

### Missing Critical Endpoints (Need to Add)

#### Job Card Management (Using JobCardManager)
```
❌ POST   /api/job-cards          - Create job card
❌ GET    /api/job-cards/:id      - Get job card details
❌ GET    /api/job-cards          - List job cards (with filters)
❌ PUT    /api/job-cards/:id      - Update job card
❌ DELETE /api/job-cards/:id      - Cancel job card
❌ GET    /api/job-cards/:id/history - Get state history
❌ POST   /api/job-cards/:id/generate-approval-link - Generate customer link
```

#### PDI Management (Using PDIManager)
```
❌ GET    /api/job-cards/:id/pdi/checklist    - Get PDI checklist
❌ PUT    /api/pdi/checklist/:id              - Update checklist item
❌ POST   /api/job-cards/:id/pdi/complete     - Complete PDI with declaration
❌ POST   /api/job-cards/:id/pdi/evidence     - Upload evidence (needs refactor)
❌ GET    /api/job-cards/:id/pdi/evidence     - List evidence files
```

#### Invoice Management (Using InvoiceManager)
```
❌ POST   /api/job-cards/:id/invoice          - Create invoice (PDI check!)
❌ GET    /api/invoices/:id                   - Get invoice details
❌ GET    /api/invoices                       - List invoices
❌ POST   /api/invoices/:id/pdf               - Generate PDF
❌ PUT    /api/invoices/:id/finalize          - Finalize invoice
❌ POST   /api/invoices/:id/send              - Send to customer
```

#### Public Customer View
```
❌ GET    /api/public/job-cards/:id?token=<jwt>  - Read-only job card view
❌ POST   /api/approve-job                        - Customer approval (exists but needs update)
```

#### AI Governance (Using AIGovernance)
```
❌ POST   /api/ai/governance-check            - Run 4-layer validation
❌ POST   /api/ai/validate-query              - Domain validation only
❌ GET    /api/ai/governance/logs             - Get governance audit logs
```

#### Pricing & Catalog
```
❌ POST   /api/pricing/guidance               - Get pricing ranges (not exact prices)
❌ GET    /api/parts-catalog                  - List parts with price ranges
❌ GET    /api/labor-catalog                  - List services with rate ranges
❌ POST   /api/pricing/log-access             - Log pricing access for audit
```

#### MG Fleet Extensions
```
❌ GET    /api/mg/contracts                   - List MG contracts
❌ POST   /api/mg/contracts                   - Create MG contract
❌ POST   /api/mg/report                      - Generate fleet report
❌ POST   /api/mg/vehicle-logs                - Create vehicle log
❌ GET    /api/mg/vehicle-logs                - List vehicle logs
```

---

## 🔧 Integration Work Required

### Step 1: Import Manager Classes into server.py
```python
from services.job_card_manager import JobCardManager, JobStatus, VALID_TRANSITIONS
from services.pdi_manager import PDIManager, STANDARD_PDI_ITEMS
from services.invoice_manager import InvoiceManager
from services.ai_governance import AIGovernance
```

### Step 2: Initialize Managers
```python
# After supabase initialization
job_card_manager = JobCardManager(supabase) if supabase else None
pdi_manager = PDIManager(supabase) if supabase else None
invoice_manager = InvoiceManager(supabase) if supabase else None
ai_governance = AIGovernance()
```

### Step 3: Replace Existing Basic Endpoints
- `/api/job/transition` → Use JobCardManager.transition_state()
- `/api/upload-pdi` → Use PDIManager.upload_evidence()

### Step 4: Add Missing Endpoints
Create ~30 new endpoint handlers that call the manager methods

### Step 5: Update FSM Enforcement
Replace the basic VALID_TRANSITIONS dict in server.py with JobCardManager's FSM

---

## 🎯 Implementation Priority

### Phase 1: Critical Path (1-2 hours)
1. ✅ Import all 4 managers into server.py
2. ✅ Add job card CRUD endpoints
3. ✅ Add PDI checklist endpoints
4. ✅ Add invoice generation endpoint
5. ✅ Update existing transition endpoint to use JobCardManager
6. ✅ Test: Create job → Transition to PDI → Complete PDI → Generate invoice

### Phase 2: AI Governance (30 min)
1. ✅ Add /api/ai/governance-check endpoint
2. ✅ Integrate with existing /api/chat endpoint
3. ✅ Add domain/confidence/context validation

### Phase 3: Public Customer View (30 min)
1. ✅ Add /api/public/job-cards/:id endpoint
2. ✅ JWT token validation with expiry
3. ✅ Read-only response format

### Phase 4: Complete MG & Pricing (1 hour)
1. ✅ Add MG contracts and reporting endpoints
2. ✅ Add pricing guidance endpoints
3. ✅ Add pricing access logging

---

## 🚨 Critical Issues to Fix

### Issue 1: FSM Enforcement
**Current:** server.py has basic VALID_TRANSITIONS dict  
**Problem:** Doesn't use JobCardManager's validation logic  
**Fix:** Replace with JobCardManager.transition_state() calls

### Issue 2: PDI Blocking
**Current:** No check before invoicing  
**Problem:** Can invoice without completing PDI  
**Fix:** InvoiceManager.create_invoice() already has this check, just need to wire it up

### Issue 3: AI Governance Not Applied
**Current:** /api/chat doesn't validate queries  
**Problem:** Can ask non-automobile questions  
**Fix:** Add AIGovernance.full_check() before calling AI

### Issue 4: Public Job Card View Missing
**Current:** No read-only customer view  
**Problem:** Customer can't see job status  
**Fix:** Add /api/public/job-cards/:id endpoint with JWT validation

---

## 📊 Estimated Work

| Task | Endpoints | Time | Priority |
|------|-----------|------|----------|
| Job Card CRUD | 7 | 1h | HIGH |
| PDI Operations | 5 | 45m | HIGH |
| Invoice System | 6 | 1h | HIGH |
| AI Governance | 3 | 30m | HIGH |
| Public View | 2 | 30m | MEDIUM |
| MG Extensions | 5 | 45m | MEDIUM |
| Pricing/Catalog | 4 | 30m | LOW |
| **TOTAL** | **32** | **~5-6 hours** | |

---

## ✅ Recommended Action Plan

### Option A: Full Integration (Recommended)
- Implement ALL 32 missing endpoints
- Complete production-ready system
- Time: 5-6 hours
- Result: 100% API coverage as per contracts

### Option B: MVP Critical Path
- Focus on job card → PDI → invoice flow
- 15 core endpoints only
- Time: 2-3 hours
- Result: Core workflows functional

### Option C: Incremental (What I'll do)
- Phase 1: Job Card + PDI + Invoice (2 hours)
- Test critical flow
- Phase 2: AI Governance (30 min)
- Phase 3: Everything else (2 hours)
- Time: 4-5 hours total
- Result: Validated working system at each phase

---

## 🎬 Next Steps

1. **Get Confirmation:** Which option do you prefer?
2. **Start Integration:** Import managers into server.py
3. **Add Endpoints:** Create missing API handlers
4. **Test Each Phase:** Validate as we go
5. **Deploy:** Update environment and test production

**Ready to start?** I recommend Option C (Incremental) so you can test each phase as it's completed.
