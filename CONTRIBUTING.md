# Contributing to EKA-AI Platform

Thank you for your interest in contributing to EKA-AI Platform!

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Install dependencies:
   ```bash
   npm install
   cd backend && pip install -r requirements.txt
   ```
4. Copy environment files:
   ```bash
   cp .env.example .env.local
   cp backend/.env.example backend/.env
   ```
5. Configure your API keys in the `.env` files

## Development Workflow

1. Create a feature branch from `main`
2. Make your changes
3. Run type checking: `npm run typecheck`
4. Build the frontend: `npm run build`
5. Test your changes locally
6. Submit a pull request

## Code Style

- Frontend: TypeScript with React
- Backend: Python with Flask
- Follow existing code patterns and conventions

## Pull Request Guidelines

- Keep PRs focused and small
- Write descriptive commit messages
- Update documentation if needed
- Ensure all CI checks pass

## Reporting Issues

When reporting issues, please include:
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, Python version)
