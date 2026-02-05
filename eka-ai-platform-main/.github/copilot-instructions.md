# EKA-AI Platform - GitHub Copilot Instructions

## Project Overview

EKA-AI Platform is a Governed Automobile Intelligence System for Go4Garage Private Limited. It's a full-stack application consisting of:

- **Frontend**: React 19 + TypeScript + Vite + TailwindCSS
- **Backend**: Python Flask API with Supabase, JWT auth, and AI integrations (Google Gemini, Anthropic Claude)
- **Purpose**: Production-grade automobile job card management with AI-powered diagnostics, PDI pipeline, and customer approval workflow

## Repository Structure

```
/
├── src/                    # React frontend source
│   ├── components/        # React components
│   ├── pages/            # Route pages
│   ├── services/         # API services
│   ├── hooks/            # Custom React hooks
│   └── types.ts          # TypeScript type definitions
├── backend/               # Python Flask backend
│   ├── server.py         # Main Flask application
│   ├── wsgi.py           # Production WSGI entry point
│   ├── requirements.txt  # Python dependencies
│   └── database/         # Database utilities
├── .github/              # GitHub configuration
├── dist/                 # Frontend build output (gitignored)
└── node_modules/         # Node dependencies (gitignored)
```

## Development Setup

### Prerequisites
- Node.js 18+ for frontend
- Python 3.9+ for backend
- Git

### Initial Setup
1. Install frontend dependencies:
   ```bash
   npm install
   ```

2. Install backend dependencies:
   ```bash
   cd backend && pip install -r requirements.txt
   ```

3. Copy environment files:
   ```bash
   cp .env.example .env.local
   cp backend/.env.example backend/.env
   ```

4. Configure environment variables in `.env.local` and `backend/.env`

### Running the Application

**Frontend Development Server:**
```bash
npm run dev  # Starts Vite dev server on port 3000
```

**Backend Development Server:**
```bash
cd backend
# Use Flask dev mode for development:
python server.py
# OR use production mode with Gunicorn:
gunicorn --bind 0.0.0.0:8001 --workers 1 --threads 4 --timeout 60 wsgi:flask_app
```

### Build and Type Checking

**Type Check:**
```bash
npm run typecheck
```

**Build for Production:**
```bash
npm run build  # Output to dist/
```

## Coding Standards and Conventions

### Frontend (TypeScript/React)

1. **TypeScript Configuration**:
   - Strict mode is DISABLED (`strict: false` in tsconfig.json)
   - Avoid using `any` type when possible, but it's acceptable when needed
   - Use `.tsx` for React components, `.ts` for utilities

2. **React Patterns**:
   - Use functional components with hooks (React 19)
   - Use `react-router-dom` for routing
   - Component naming: PascalCase (e.g., `ChatPage.tsx`, `Sidebar.tsx`)
   - Custom hooks: prefix with `use` (e.g., `useChat.ts`)

3. **Styling**:
   - Use TailwindCSS utility classes
   - Follow the existing color scheme (neutral tones, e.g., `bg-[#fafaf9]`)
   - Use `clsx` and `tailwind-merge` for conditional classes

4. **File Organization**:
   - Components go in `src/components/`
   - Pages go in `src/pages/`
   - API services go in `src/services/`
   - Types go in `src/types.ts`
   - Use path alias `@/` for imports from `src/`

5. **Import Order**:
   - React imports first
   - Third-party libraries
   - Local components/services
   - Types last

### Backend (Python/Flask)

1. **Python Style**:
   - Follow PEP 8 conventions
   - Use descriptive variable names
   - Add docstrings to functions and classes
   - Keep functions focused and small

2. **Flask Patterns**:
   - Main app in `server.py`
   - Use blueprints for organizing routes (if needed)
   - Always use CORS properly with configured origins
   - Rate limiting is enabled via `flask-limiter`

3. **API Endpoints**:
   - All API endpoints start with `/api/`
   - Return JSON responses with proper status codes
   - Use POST for mutations, GET for queries
   - Include error handling with meaningful error messages

4. **Database (Supabase)**:
   - Use the `supabase` client initialized in `server.py`
   - Handle database errors gracefully
   - Log database operations for audit trail
   - Tables: `vehicles`, `job_cards`, `pdi_evidence`, `intelligence_logs`

5. **Security**:
   - NEVER commit `.env` files
   - Use JWT for authentication
   - Validate and sanitize all inputs
   - Use rate limiting for all endpoints
   - Never expose exact pricing (use ranges only, e.g., ₹800-1200)

6. **AI Integration**:
   - Primary AI: Google Gemini
   - Optional: Anthropic Claude
   - Follow the EKA_CONSTITUTION in `server.py` for AI behavior
   - All AI responses must be valid JSON
   - Confidence gating: < 90% confidence = ask clarifying questions

7. **Error Handling**:
   - Use try-except blocks for external API calls
   - Graceful degradation if optional services (e.g., Anthropic) are unavailable
   - Log errors for debugging but don't expose internal details to clients

## Core Business Logic

### Job Card Lifecycle (9 States)
The system follows a strict state machine:
1. `CREATED` - Initial intake
2. `CONTEXT_VERIFIED` - Vehicle info validated
3. `DIAGNOSED` - Fault identification
4. `ESTIMATED` - Price range estimation
5. `CUSTOMER_APPROVAL` - Awaiting customer authorization
6. `IN_PROGRESS` - Work being performed
7. `PDI` - Pre-delivery inspection
8. `INVOICED` - Final billing
9. `CLOSED` - Archived

**Key Rules:**
- Never skip states in the pipeline
- Customer approval is mandatory before work begins
- PDI checklist must be completed with photo/video evidence
- All state transitions must be logged

### AI Response Format
- Always return valid JSON
- Include confidence scores
- Never hallucinate data (if confidence < 90%, ask for clarification)
- Price estimates: ranges only, never exact amounts

## Environment Variables

### Frontend (.env.local)
```
GEMINI_API_KEY=your_key_here
BACKEND_URL=http://127.0.0.1:8001  # For development proxy
```

### Backend (backend/.env)
```
GEMINI_API_KEY=required
ANTHROPIC_API_KEY=optional
SUPABASE_URL=required
SUPABASE_SERVICE_KEY=required
JWT_SECRET=required (generate with openssl rand -base64 32)
CORS_ORIGINS=comma-separated list (no spaces)
FRONTEND_URL=http://localhost:3000
PORT=8001
```

## Testing

Currently, there are no automated tests in the repository. When adding tests:
- Frontend: Consider Jest + React Testing Library
- Backend: Consider pytest + Flask testing utilities
- Follow existing patterns if tests are added in the future

## Git and Pull Request Guidelines

1. **Branch Naming**:
   - Feature: `feature/description`
   - Bug fix: `fix/description`
   - Use Copilot branch format: `copilot/description`

2. **Commit Messages**:
   - Use clear, descriptive messages
   - Start with a verb (Add, Fix, Update, Remove)
   - Keep first line under 72 characters

3. **Pull Requests**:
   - Keep PRs focused and small
   - Run `npm run typecheck` before submitting
   - Run `npm run build` to ensure no build errors
   - Update documentation if needed
   - Test changes locally before submitting

## DO's and DON'Ts

### DO:
- ✅ Use existing patterns and conventions
- ✅ Handle errors gracefully
- ✅ Add proper TypeScript types
- ✅ Use TailwindCSS for styling
- ✅ Follow the job card lifecycle strictly
- ✅ Validate inputs and sanitize outputs
- ✅ Use environment variables for configuration
- ✅ Log important operations for audit trail

### DON'T:
- ❌ Don't commit `.env` or `.env.local` files
- ❌ Don't use `any` type excessively in TypeScript
- ❌ Don't skip type checking before committing
- ❌ Don't expose exact pricing in AI responses
- ❌ Don't allow job card state skipping
- ❌ Don't expose sensitive data in error messages
- ❌ Don't add new dependencies without necessity
- ❌ Don't modify the core EKA_CONSTITUTION without review

## AI Agent Considerations

When working with this codebase:
1. **Understand the domain**: This is an automobile service management system with strict business rules
2. **Respect the constitution**: The EKA_CONSTITUTION in `server.py` defines core AI behavior - don't modify without explicit approval
3. **State machine integrity**: Job card states are critical - never implement shortcuts
4. **Security first**: This handles customer data and financial information
5. **Audit requirements**: All significant operations must be logged
6. **Production system**: Changes should be conservative and well-tested

## Additional Resources

- Main documentation: `README.md`
- Contributing guidelines: `CONTRIBUTING.md`
- Security policy: `SECURITY.md`
- Database schema: See `README.md` Database Schema section

## Questions or Clarifications

If you need clarification on:
- Business logic: Refer to `backend/server.py` EKA_CONSTITUTION
- Frontend structure: Check `src/App.tsx` for routing and layout
- Backend API: Review `backend/server.py` endpoint definitions
- Database: See `README.md` for schema and table definitions
