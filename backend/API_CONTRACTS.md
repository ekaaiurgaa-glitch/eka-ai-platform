# EKA-AI API Contracts

## Base URL
```
Production: https://eka-ai.go4garage.in/api
Development: http://localhost:8001/api
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

Token payload:
```json
{
  "sub": "user_uuid",
  "role": "OWNER|MANAGER|TECHNICIAN|FLEET_MANAGER|ACCOUNTANT",
  "workshop_id": "workshop_uuid",
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1234654290
}
```

---

## Health & System

### GET /health
Public endpoint for health checks.

**Response:**
```json
{
  "status": "healthy",
  "service": "eka-ai-brain",
  "version": "4.5",
  "timestamp": "2026-02-05T10:00:00Z",
  "integrations": {
    "supabase": true,
    "anthropic": true,
    "gemini": true
  }
}
```

---

## AI Intelligence

### POST /chat
Main AI intelligence endpoint.

**Rate Limit:** 15 per minute

**Request:**
```json
{
  "history": [
    {"role": "user", "parts": [{"text": "My car is making a noise"}]}
  ],
  "context": {
    "registrationNumber": "MH01AB1234",
    "brand": "Maruti",
    "model": "Swift",
    "year": "2020",
    "fuelType": "Petrol"
  },
  "status": "CREATED",
  "intelligence_mode": "FAST|THINKING",
  "operating_mode": 0
}
```

**Response:**
```json
{
  "response_content": {
    "visual_text": "<html>formatted response</html>",
    "audio_text": "Plain text for TTS"
  },
  "job_status_update": "DIAGNOSED",
  "ui_triggers": {
    "theme_color": "#f18a22",
    "show_orange_border": true
  },
  "diagnostic_data": {
    "code": "P0171",
    "severity": "MODERATE",
    "possible_causes": ["O2 Sensor", "Vacuum Leak"],
    "recommended_actions": ["Scan with OBD", "Check intake hoses"]
  },
  "estimate_data": null,
  "mg_analysis": null,
  "pdi_checklist": null
}
```

### POST /speak
Text-to-Speech endpoint.

**Rate Limit:** 20 per minute

**Request:**
```json
{
  "text": "Your vehicle diagnostic is complete."
}
```

**Response:**
```json
{
  "audio_data": "base64_encoded_audio",
  "mime_type": "audio/mp3"
}
```

---

## Job Card Management

### POST /job/transition
Transition job card state (Protected).

**Auth:** Any authenticated user

**Request:**
```json
{
  "job_id": "uuid",
  "target_state": "DIAGNOSED",
  "notes": "Customer reported brake noise"
}
```

**Response (Success):**
```json
{
  "success": true,
  "job_card_id": "uuid",
  "previous_state": "CONTEXT_VERIFIED",
  "new_state": "DIAGNOSED",
  "transitions_allowed": ["ESTIMATED"]
}
```

**Response (Invalid Transition):**
```json
{
  "error": "Invalid state transition",
  "code": "INVALID_TRANSITION",
  "current": "CREATED",
  "requested": "INVOICED",
  "allowed": ["CONTEXT_VERIFIED"]
}
```

### GET /job/transitions
Get valid transitions for a job card.

**Auth:** Any authenticated user

**Query:** `?job_id=uuid`

**Response:**
```json
{
  "job_card_id": "uuid",
  "current_state": "CREATED",
  "allowed_transitions": ["CONTEXT_VERIFIED"],
  "all_states": ["CREATED", "CONTEXT_VERIFIED", "DIAGNOSED", ...]
}
```

---

## MG Fleet Model

### POST /mg/calculate
Calculate MG billing (Protected).

**Auth:** OWNER, MANAGER, FLEET_MANAGER

**Request:**
```json
{
  "assured_km": 12000,
  "rate": 10.50,
  "actual_km": 1500,
  "months_in_cycle": 1,
  "excess_rate": 15.00
}
```

**Response:**
```json
{
  "utilization_type": "OVER_UTILIZED",
  "monthly_assured_km": 1000.0,
  "actual_km": 1500,
  "billable_km": 1500.0,
  "excess_km": 500.0,
  "base_rate_per_km": 10.5,
  "excess_rate_per_km": 15.0,
  "base_amount": 10500.0,
  "excess_amount": 7500.0,
  "final_amount": 18000.0,
  "is_audit_safe": true,
  "calculation_method": "BASE(assured) + EXCESS(over_assured)",
  "calculated_by": "user_uuid",
  "calculated_at": "2026-02-05T10:00:00Z"
}
```

### POST /mg/validate-odometer
Validate odometer readings.

**Auth:** OWNER, MANAGER, FLEET_MANAGER, TECHNICIAN

**Request:**
```json
{
  "opening_odometer": 10000,
  "closing_odometer": 11500
}
```

**Response:**
```json
{
  "valid": true,
  "opening_odometer": 10000,
  "closing_odometer": 11500,
  "actual_km": 1500,
  "message": "Valid odometer reading"
}
```

---

## Billing & GST

### POST /billing/calculate
Calculate invoice with GST (Protected).

**Auth:** OWNER, MANAGER

**Request:**
```json
{
  "items": [
    {
      "description": "Brake Pad Replacement",
      "quantity": 2,
      "unit_price": 500.00,
      "gst_rate": 28.0
    },
    {
      "description": "Labor Charges",
      "quantity": 1,
      "unit_price": 800.00,
      "gst_rate": 18.0
    }
  ],
  "workshop_state": "27",
  "customer_state": "27"
}
```

**Response:**
```json
{
  "tax_type": "CGST_SGST",
  "total_taxable_value": 1800.00,
  "total_tax_amount": 424.00,
  "grand_total": 2224.00,
  "is_interstate": false,
  "items": [
    {
      "description": "Brake Pad Replacement",
      "quantity": 2,
      "unit_price": 500.00,
      "gst_rate": 28.0,
      "taxable_value": 1000.00,
      "tax_amount": 280.00,
      "igst_amount": 0.0,
      "cgst_amount": 140.00,
      "sgst_amount": 140.00
    },
    {
      "description": "Labor Charges",
      "quantity": 1,
      "unit_price": 800.00,
      "gst_rate": 18.0,
      "taxable_value": 800.00,
      "tax_amount": 144.00,
      "igst_amount": 0.0,
      "cgst_amount": 72.00,
      "sgst_amount": 72.00
    }
  ],
  "calculated_by": "user_uuid",
  "calculated_at": "2026-02-05T10:00:00Z"
}
```

### POST /billing/validate-gstin
Validate GSTIN format.

**Auth:** Any authenticated user

**Request:**
```json
{
  "gstin": "27AABCU9603R1ZX"
}
```

**Response:**
```json
{
  "valid": true,
  "state_code": "27",
  "pan": "AABCU9603R",
  "entity_number": "1",
  "checksum": "X"
}
```

### POST /billing/tax-type
Determine tax type based on states.

**Auth:** Any authenticated user

**Request:**
```json
{
  "workshop_state": "27",
  "customer_state": "29"
}
```

**Response:**
```json
{
  "workshop_state": "27",
  "customer_state": "29",
  "tax_type": "IGST",
  "is_interstate": true
}
```

---

## Customer Approval

### POST /generate-approval-link
Generate secure approval link.

**Request:**
```json
{
  "job_card_id": "uuid",
  "customer_phone": "+919876543210"
}
```

**Response:**
```json
{
  "success": true,
  "approval_url": "https://eka-ai.go4garage.in/customer-approval?token=...",
  "token": "jwt_token",
  "expires_at": "2026-02-06T10:00:00Z"
}
```

### POST /approve-job
Customer approval action.

**Request:**
```json
{
  "token": "jwt_token",
  "action": "approve|reject|concern"
}
```

**Response:**
```json
{
  "success": true,
  "new_status": "CUSTOMER_APPROVED",
  "job_card_id": "uuid"
}
```

---

## PDI (Pre-Delivery Inspection)

### POST /upload-pdi
Upload PDI evidence.

**Rate Limit:** 30 per minute

**Content-Type:** `multipart/form-data`

**Fields:**
- `file`: Image or video (jpg, png, webp, mp4, max 5MB)
- `job_card_id`: UUID
- `checklist_item`: String identifier

**Response:**
```json
{
  "success": true,
  "file_url": "https://...",
  "filename": "uuid/checklist_item_1234567890.jpg"
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| NO_TOKEN | 401 | Missing Authorization header |
| EMPTY_TOKEN | 401 | Bearer token is empty |
| TOKEN_EXPIRED | 401 | JWT has expired |
| INVALID_TOKEN | 401 | JWT signature invalid |
| FORBIDDEN | 403 | User role not authorized |
| INVALID_INPUT | 400 | Request data invalid |
| INVALID_TRANSITION | 409 | Job card state transition not allowed |
| CALCULATION_ERROR | 500 | MG/Billing calculation failed |
| BILLING_ERROR | 500 | Invoice calculation failed |
| TRANSITION_ERROR | 500 | State transition failed |

---

## State Machine

```
CREATED → CONTEXT_VERIFIED → DIAGNOSED → ESTIMATED → CUSTOMER_APPROVAL
                                                              ↓
                                                    [CUSTOMER_APPROVED]
                                                              ↓
IN_PROGRESS ← CONCERN_RAISED ← [reject]                       ↑
   ↓                                    [approve]---------------┘
  PDI
   ↓
INVOICED
   ↓
CLOSED
```

**Terminal States:** CLOSED, CANCELLED
