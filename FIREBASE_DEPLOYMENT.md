# 🔥 Firebase Deployment Guide - EKA-AI Platform
## Go4Garage Private Limited

---

## 📋 Prerequisites

1. **Firebase CLI** installed globally
```bash
npm install -g firebase-tools
```

2. **Firebase Project** created at https://console.firebase.google.com
   - Project Name: `eka-ai-platform`
   - Enable Hosting

3. **Build completed**
```bash
npm run build
```

---

## 🚀 Deployment Steps

### Step 1: Login to Firebase
```bash
firebase login
```

### Step 2: Initialize Project (First Time Only)
```bash
firebase init hosting
```

**Configuration:**
- Select: Use existing project
- Choose: `eka-ai-platform`
- Public directory: `dist`
- Single-page app: `Yes`
- GitHub deploys: `No` (optional)

### Step 3: Deploy
```bash
firebase deploy --only hosting
```

---

## 📁 Repository Structure for Firebase

```
eka-ai-platform/
├── dist/                    # Build output (deployed to Firebase)
│   ├── index.html
│   ├── assets/
│   └── ...
├── firebase.json            # Firebase configuration
├── .firebaserc             # Project aliases
├── .firebaseignore         # Files to ignore
└── ...
```

---

## ⚙️ Firebase Configuration Files

### firebase.json
```json
{
  "hosting": {
    "public": "dist",
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### .firebaserc
```json
{
  "projects": {
    "default": "eka-ai-platform"
  }
}
```

---

## 🔄 Continuous Deployment

### Option 1: Manual Deploy
```bash
npm run build && firebase deploy --only hosting
```

### Option 2: GitHub Actions (Automated)
Create `.github/workflows/firebase-deploy.yml`:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: eka-ai-platform
```

---

## 🌐 Custom Domain Setup

### Step 1: Add Domain in Firebase Console
1. Go to Hosting → Add custom domain
2. Enter: `eka-ai.go4garage.com`
3. Follow DNS verification steps

### Step 2: Update DNS Records
Add these records to your DNS provider:

```
Type: A
Name: @
Value: [Firebase IP from console]

Type: A
Name: www
Value: [Firebase IP from console]
```

---

## 🔒 Environment Variables

Firebase Hosting doesn't support server-side env vars. Use build-time variables:

### .env.production
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=https://api.go4garage.com
```

Build with production env:
```bash
npm run build
```

---

## 📊 Post-Deployment Verification

### Check Deployment Status
```bash
firebase hosting:channel:list
```

### View Live Site
```bash
firebase open hosting:site
```

### Check Logs
```bash
firebase hosting:channel:deploy preview --expires 7d
```

---

## 🐛 Troubleshooting

### Issue: "dist folder not found"
**Solution:**
```bash
npm run build
ls -la dist/  # Verify build output
firebase deploy --only hosting
```

### Issue: "404 on refresh"
**Solution:** Ensure `firebase.json` has rewrite rule:
```json
"rewrites": [
  {
    "source": "**",
    "destination": "/index.html"
  }
]
```

### Issue: "Old version still showing"
**Solution:** Clear cache:
```bash
firebase hosting:channel:delete preview
firebase deploy --only hosting
```

---

## 📈 Performance Optimization

### Enable Compression
Firebase automatically compresses files. Verify in `firebase.json`:
```json
{
  "hosting": {
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

### CDN Caching
Firebase Hosting uses Google's CDN automatically. No additional config needed.

---

## 🔐 Security Headers

Add security headers in `firebase.json`:
```json
{
  "hosting": {
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          },
          {
            "key": "X-Frame-Options",
            "value": "DENY"
          },
          {
            "key": "X-XSS-Protection",
            "value": "1; mode=block"
          }
        ]
      }
    ]
  }
}
```

---

## 📞 Support

**Firebase Issues:**
- Console: https://console.firebase.google.com
- Docs: https://firebase.google.com/docs/hosting

**EKA-AI Platform:**
- Technical: tech@go4garage.com
- Documentation: See repository root

---

**Go4Garage Private Limited**  
**EKA-AI Platform - Firebase Deployment**
