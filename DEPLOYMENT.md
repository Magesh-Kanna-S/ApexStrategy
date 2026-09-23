# Deployment Guide

This guide explains how to deploy ApexStrategy Enterprise to the web.

## Why Vercel (not GitHub Pages)?

This app uses **Next.js App Router** with client-side features that require a server runtime. GitHub Pages only serves static files and **cannot** run Next.js App Router apps. If you enable GitHub Pages, you'll only see the README — the app won't work.

**Vercel** is the recommended platform because:
- It's built by the Next.js team (zero config)
- Free for personal projects
- Automatic builds on every `git push`
- Custom HTTPS URLs

---

## Step-by-Step Deployment

### 1. Create a GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `apex-strategy-enterprise`
3. **IMPORTANT**: Do NOT check any of these:
   - ❌ "Add a README file"
   - ❌ "Add .gitignore"
   - ❌ "Choose a license"
4. Click **Create repository**
5. Copy the repo URL (looks like `https://github.com/yourname/apex-strategy-enterprise.git`)

### 2. Push Your Code

Run the `deploy.bat` script in this folder:

```
deploy.bat
```

Or manually:

```bash
git init
git branch -M main
git add .
git commit -m "ApexStrategy Enterprise v1.0"
git remote add origin https://github.com/YOURNAME/apex-strategy-enterprise.git
git push -u origin main
```

### 3. Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Sign in with GitHub
3. Click **Import** on your `apex-strategy-enterprise` repo
4. Vercel auto-detects Next.js — just click **Deploy**
5. Wait ~2 minutes
6. Your app is live at `https://apex-strategy-enterprise.vercel.app`

### 4. Custom Domain (Optional)

In Vercel dashboard → Settings → Domains → add your custom domain.

---

## Common Issues

### "Only README shows on GitHub Pages"
GitHub Pages doesn't support Next.js App Router. Use Vercel instead (free).

### "Build failed on Vercel: Cannot find module 'z-ai-web-dev-sdk'"
This sandbox dependency was removed from `package.json`. Make sure you're using the latest `package.json` from this repo. If you have an old version, re-download or remove that dependency manually.

### "Authentication failed when pushing to GitHub"
GitHub no longer accepts passwords. Use a **Personal Access Token**:
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Generate new token
2. Check the `repo` scope
3. Use the token as your password when `git push` asks

### "Port 3000 already in use" (local dev)
```bash
npx kill-port 3000
npm run dev
```

---

## Local Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Open http://localhost:3000
```

## Build for Production (local test)

```bash
npm run build
npm run start
```

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Charts**: Recharts
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **State**: React Context + localStorage

## Creator

**Magesh Kanna S**
- [LinkedIn](https://www.linkedin.com/in/magesh-kanna-s/)
- [Portfolio](https://magesh-kanna-s.github.io/portfolio/)

Concept, system architecture & interface design of ApexStrategy Enterprise.
