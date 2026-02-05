<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# EKA-AI Platform (Production v4.5)

Governed Automobile Intelligence System for Go4Garage Private Limited.

Features: Triple-Model Router, Rate Limiting, JWT Auth, Supabase Integration, PDI Pipeline.

View your app in AI Studio: https://ai.studio/apps/drive/1aF2sK92GDy8nDzLt1A4puNAqdSkMIIPf

## Frontend (Run Locally)

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local` and set your `GEMINI_API_KEY`
3. Run the app:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```

## Backend Deployment

**Prerequisites:** Python 3.9+

1. Navigate to backend folder and install dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. Create `backend/.env` file with your configuration:
   ```bash
   cp backend/.env.example backend/.env
   ```

3. Edit `backend/.env` and configure the required values:

   **Required Configuration:**
   - `GEMINI_API_KEY`: Get from [Google AI Studio](https://aistudio.google.com/app/apikey)
   - `SUPABASE_URL`: Your Supabase project URL (e.g., `https://yourproject.supabase.co`)
   - `SUPABASE_SERVICE_KEY`: From Supabase Dashboard > Settings > API > service_role key

   **Generate JWT_SECRET:**
   ```bash
   openssl rand -base64 32
   ```

   **Example Configuration:**
   ```env
   # AI Services
   GEMINI_API_KEY=your_gemini_api_key_here
   ANTHROPIC_API_KEY=your_claude_key_optional

   # Database
   SUPABASE_URL=https://yourproject.supabase.co
   SUPABASE_SERVICE_KEY=your_service_role_key_here

   # Security
   JWT_SECRET=your_generated_secret_here

   # CORS (no spaces after commas)
   CORS_ORIGINS=http://localhost:3000,http://localhost:5173,https://yourdomain.com

   # App Config
   FRONTEND_URL=http://localhost:5173
   PORT=8001
   ```

   > ⚠️ **CRITICAL:** Never commit `.env` files to version control!

4. Start the production server:
   ```bash
   gunicorn --bind 0.0.0.0:8001 --workers 1 --threads 4 --timeout 60 wsgi:flask_app
   ```

## Database Schema (Supabase)

Run the following SQL in the Supabase SQL Editor to create the required tables:

```sql
-- Vehicles Registry
CREATE TABLE IF NOT EXISTS vehicles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    registration_number TEXT UNIQUE NOT NULL,
    brand TEXT,
    model TEXT,
    year TEXT,
    fuel_type TEXT,
    vin TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job Cards
CREATE TABLE IF NOT EXISTS job_cards (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT,
    status TEXT DEFAULT 'CREATED',
    customer_phone TEXT,
    approval_token TEXT,
    approval_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    customer_approved_at TIMESTAMP WITH TIME ZONE
);

-- PDI Evidence Storage
CREATE TABLE IF NOT EXISTS pdi_evidence (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    job_card_id TEXT REFERENCES job_cards(id) ON DELETE CASCADE,
    checklist_item TEXT,
    file_url TEXT NOT NULL,
    file_type TEXT CHECK (file_type IN ('image', 'video')),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by TEXT
);

-- Audit Trail
CREATE TABLE IF NOT EXISTS intelligence_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    mode INTEGER,
    status TEXT,
    user_query TEXT,
    ai_response TEXT,
    confidence_score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_vehicles_reg ON vehicles(registration_number);
CREATE INDEX idx_jobcards_status ON job_cards(status);
CREATE INDEX idx_pdi_jobcard ON pdi_evidence(job_card_id);
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | System health check |
| `/api/chat` | POST | Main intelligence endpoint |
| `/api/speak` | POST | Text-to-Speech using Gemini |
| `/api/upload-pdi` | POST | PDI evidence upload |
| `/api/approve-job` | POST | Customer approval gate |
| `/api/generate-approval-link` | POST | Generate secure approval link |

## Environment Variables

See `.env.example` for the complete list of required configuration variables.
