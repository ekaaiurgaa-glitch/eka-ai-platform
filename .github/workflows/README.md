# GitHub Actions Workflows

This directory contains all GitHub Actions workflows for the EKA-AI Platform.

## Workflows Overview

### 1. CI - Build & Test (`ci.yml`)
**Triggers:** Push to main/develop, Pull Requests

**Jobs:**
- **build-and-test**: Installs dependencies, runs type checking, tests, and builds the application
- **gemini-code-review**: Uses Google's Gemini CLI to review pull requests and post comments

### 2. Deploy to Production (`deploy.yml`)
**Triggers:** Push to main, Manual dispatch

**Features:**
- Builds the application with environment variables
- Deploys to GitHub Pages (enabled by default)
- Optional: Deploy to AWS S3 or EC2 (configure secrets to enable)

### 3. Gemini AI Assistant (`gemini-ai.yml`)
**Triggers:** Issues, PR comments, Pull requests, Manual dispatch

**Jobs:**
- **respond-to-issues**: Automatically responds to new issues with AI-generated answers
- **code-suggestions**: Generates code improvement suggestions on PRs
- **custom-prompt**: Execute custom prompts via workflow dispatch

### 4. Dependency Update & Security (`dependency-update.yml`)
**Triggers:** Weekly (Sundays), Manual dispatch

**Jobs:**
- **security-audit**: Runs npm audit and Gemini security analysis
- **outdated-check**: Checks for outdated dependencies and creates update recommendations

## Required Secrets

Configure these in your GitHub repository settings:

| Secret | Description | Required For |
|--------|-------------|--------------|
| `GEMINI_API_KEY` | Google Gemini API key | Gemini workflows |
| `GITHUB_TOKEN` | Auto-generated | All workflows |
| `VITE_API_URL` | Backend API URL | Deploy |
| `VITE_SUPABASE_URL` | Supabase URL | Deploy |
| `VITE_SUPABASE_ANON_KEY` | Supabase Anon Key | Deploy |
| `AWS_ACCESS_KEY_ID` | AWS Access Key | S3 Deploy |
| `AWS_SECRET_ACCESS_KEY` | AWS Secret Key | S3 Deploy |
| `EC2_HOST` | EC2 instance IP | EC2 Deploy |
| `EC2_SSH_KEY` | SSH private key | EC2 Deploy |

## Manual Workflow Execution

You can trigger workflows manually from the GitHub UI:

1. Go to **Actions** tab
2. Select the workflow
3. Click **Run workflow**
4. Fill in any required inputs
5. Click **Run workflow**

## Troubleshooting

### Gemini CLI Not Working
- Verify `GEMINI_API_KEY` is set in repository secrets
- Check that the API key has not expired
- Ensure the workflow has `permissions: contents: read`

### Build Failures
- Check that `package-lock.json` is committed
- Verify Node.js version compatibility
- Check for TypeScript errors locally with `npm run typecheck`

### Deployment Failures
- Verify all required secrets are set
- Check that the target (S3 bucket/EC2 instance) is accessible
- Review deployment logs in GitHub Actions
