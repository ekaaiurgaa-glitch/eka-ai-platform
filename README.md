<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1aF2sK92GDy8nDzLt1A4puNAqdSkMIIPf

## Architecture

The application consists of two main components:
- **Frontend**: React + TypeScript + Vite application (port 3000)
- **Backend**: Flask API server for Gemini integration (port 5000)

## Run Locally

**Prerequisites:**  Node.js and Python 3.8+

### Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```

4. Set the `GEMINI_API_KEY` in `.env` to your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

5. Start the Flask backend:
   ```bash
   python app.py
   ```
   The backend will run on http://localhost:5000

### Frontend Setup

1. From the root directory, install dependencies:
   ```bash
   npm install
   ```

2. (Optional) Configure backend URL in `.env.local`:
   ```
   VITE_BACKEND_URL=http://localhost:5000
   ```
   If not set, defaults to `http://localhost:5000`

3. Run the frontend:
   ```bash
   npm run dev
   ```
   The app will be available at http://localhost:3000

## Security

The Gemini API key is now securely stored on the backend server and never exposed to the client. All AI operations are proxied through the Flask backend.
