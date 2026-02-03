<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# EKA-AI Platform

An automobile intelligence platform for Go4Garage Private Limited, providing expert diagnostics and service guidance.

## Project Structure

```
eka-ai-platform/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── services/           # API and service integrations
│   ├── App.tsx             # Main application component
│   ├── index.tsx           # Application entry point
│   ├── types.ts            # TypeScript type definitions
│   └── constants.ts        # Application constants
├── server/                 # Flask backend server
│   ├── app.py              # Flask application
│   ├── requirements.txt    # Python dependencies
│   └── .env.example        # Environment variables template
├── index.html              # HTML entry point
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Node.js dependencies
```

## Run Locally

**Prerequisites:** Node.js, Python 3.x

### Frontend Only

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set the `GEMINI_API_KEY` in `.env.local` to your Gemini API key
3. Run the app:
   ```bash
   npm run dev
   ```

### Full Stack (Frontend + Backend)

1. Copy the server environment file:
   ```bash
   cp server/.env.example server/.env
   ```
2. Add your `GEMINI_API_KEY` to `server/.env`
3. Run the startup script:
   ```bash
   ./start.sh
   ```

## Build for Production

```bash
npm run build
```

The production build will be output to the `dist/` directory.

## Run Production Locally

To run the full production experience locally:

1. **Build the Frontend:**
   ```bash
   npm run build
   ```

2. **Start the Server:**
   ```bash
   python server/app.py
   ```

3. **Access:** Open http://localhost:5000
