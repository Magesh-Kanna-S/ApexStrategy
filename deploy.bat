@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

:: ════════════════════════════════════════════════════════════════════════
:: ApexStrategy Enterprise — GitHub Deploy Script
:: ════════════════════════════════════════════════════════════════════════
:: This script:
::   1. Verifies Git is installed
::   2. Cleans up sandbox-specific files that break deployment
::   3. Initializes Git (if needed) and stages all source files
::   4. Commits with a descriptive message
::   5. Asks for your GitHub repo URL and pushes
::   6. Prints next-step instructions for Vercel deployment
::
:: Usage:
::   1. Place this script in your project root (next to package.json)
::   2. Create an EMPTY GitHub repo first (no README, no .gitignore)
::   3. Double-click deploy.bat or run it from Command Prompt
:: ════════════════════════════════════════════════════════════════════════

title ApexStrategy Enterprise — GitHub Deploy

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║          ApexStrategy Enterprise — GitHub Deploy             ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.

:: ── Step 1: Check Git is installed ──
echo  [1/6] Checking Git installation...
where git >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo.
    echo  ✗ Git is not installed or not in PATH.
    echo.
    echo  Download from: https://git-scm.com/download/win
    echo  After installing, restart Command Prompt and run this script again.
    echo.
    pause
    exit /b 1
)
echo  ✓ Git found: 
for /f "delims=" %%i in ('git --version') do set GITVER=%%i
echo    !GITVER!
echo.

:: ── Step 2: Check we're in the right directory ──
echo  [2/6] Checking project directory...
if not exist "package.json" (
    echo  ✗ package.json not found. Run this script from the project root.
    pause
    exit /b 1
)
if not exist "src\app\page.tsx" (
    echo  ✗ src\app\page.tsx not found. This doesn't look like the ApexStrategy project.
    pause
    exit /b 1
)
echo  ✓ Project directory confirmed
echo.

:: ── Step 3: Clean up sandbox-specific files ──
echo  [3/6] Cleaning up sandbox-specific files...
if exist ".zscripts" rmdir /s /q ".zscripts" 2>nul
if exist "tests" rmdir /s /q "tests" 2>nul
if exist "examples" rmdir /s /q "examples" 2>nul
if exist "mini-services" rmdir /s /q "mini-services" 2>nul
if exist "skills" rmdir /s /q "skills" 2>nul
if exist "upload" rmdir /s /q "upload" 2>nul
if exist "Caddyfile" del /q "Caddyfile" 2>nul
if exist "bun.lock" del /q "bun.lock" 2>nul
if exist "worklog.md" del /q "worklog.md" 2>nul
if exist ".env" del /q ".env" 2>nul
if exist "dev.log" del /q "dev.log" 2>nul
if exist "server.log" del /q "server.log" 2>nul
if exist "db" rmdir /s /q "db" 2>nul
if exist ".claude" rmdir /s /q ".claude" 2>nul
if exist ".z-ai-config" rmdir /s /q ".z-ai-config" 2>nul
echo  ✓ Sandbox files removed
echo.

:: ── Step 4: Initialize Git and stage files ──
echo  [4/6] Initializing Git and staging files...
if not exist ".git" (
    git init
    git branch -M main
    echo  ✓ Git repository initialized
) else (
    echo  ✓ Git repository already exists
)

:: Configure user if not set
git config user.name >nul 2>nul
if %ERRORLEVEL% neq 0 (
    set /p GITNAME="   Enter your name for Git commits: "
    git config user.name "!GITNAME!"
)
git config user.email >nul 2>nul
if %ERRORLEVEL% neq 0 (
    set /p GITEMAIL="   Enter your email for Git commits: "
    git config user.email "!GITEMAIL!"
)

:: Remove any existing remote
git remote remove origin 2>nul

:: Stage all files
git add -A
echo  ✓ Files staged
echo.

:: Show what's about to be committed
echo  Files to be committed:
git status --short | findstr /R "^[ADMR]" | find /c /v "" >nul
for /f %%a in ('git status --short ^| find /c "A "') do set ADDED=%%a
for /f %%a in ('git status --short ^| find /c "M "') do set MODIFIED=%%a
for /f %%a in ('git status --short ^| find /c "D "') do set DELETED=%%a
echo    Added: !ADDED!  Modified: !MODIFIED!  Deleted: !DELETED!
echo.

:: ── Step 5: Commit ──
echo  [5/6] Creating commit...
git commit -m "ApexStrategy Enterprise v1.0 — Multi-department corporate business simulation

- 6 integrated MBA departments: Strategy, R&D, Marketing, Operations, HR, Finance
- Multi-currency support (INR default + USD/EUR/GBP/JPY/AED/SGD with live rates)
- Client-side auth (sign up / sign in / sign out)
- AI competitors with difficulty levels
- Live proforma calculator on every input
- Indian company names (Bharat Apex Industries + 3 AI rivals)
- Chart tooltips with high-contrast dark theme
- Creator: Magesh Kanna S" 2>nul

if %ERRORLEVEL% neq 0 (
    echo  ℹ Nothing new to commit, or commit failed. Continuing...
) else (
    echo  ✓ Commit created
)
echo.

:: ── Step 6: Push to GitHub ──
echo  [6/6] Push to GitHub
echo.
echo  ┌──────────────────────────────────────────────────────────────┐
echo  │  BEFORE CONTINUING:                                          │
echo  │                                                              │
echo  │  1. Go to https://github.com/new                             │
echo  │  2. Create a NEW EMPTY repository                            │
echo  │     - DO NOT check "Add a README"                            │
echo  │     - DO NOT check "Add .gitignore"                          │
echo  │     - DO NOT check "Choose a license"                        │
echo  │  3. Copy the repo URL (looks like):                          │
echo  │     https://github.com/yourname/apex-strategy.git            │
echo  └──────────────────────────────────────────────────────────────┘
echo.
set /p REPO_URL="  Paste your GitHub repo URL here: "

if "!REPO_URL!"=="" (
    echo  ✗ No URL provided. You can push manually later:
    echo    git remote add origin YOUR_URL
    echo    git push -u origin main
    pause
    exit /b 1
)

echo.
echo  Adding remote...
git remote add origin "!REPO_URL!"
if %ERRORLEVEL% neq 0 (
    echo  ℹ Remote already exists, updating...
    git remote set-url origin "!REPO_URL!"
)
echo  ✓ Remote added
echo.

echo  Pushing to GitHub...
echo  (If prompted, enter your GitHub username and Personal Access Token)
echo.
git push -u origin main
if %ERRORLEVEL% neq 0 (
    echo.
    echo  ✗ Push failed. Common fixes:
    echo.
    echo  1. If you get "Authentication failed":
    echo     - Use a Personal Access Token as password (not your GitHub password)
    echo     - Create one at: GitHub → Settings → Developer settings → Tokens → Generate new token
    echo     - Check the "repo" scope
    echo.
    echo  2. If you get "non-fast-forward":
    echo     - Your GitHub repo has commits not in your local repo
    echo     - Delete the GitHub repo and create an EMPTY one
    echo.
    echo  3. If you get "Repository not found":
    echo     - Check the URL spelling
    echo     - Make sure the repo is public or you have access
    echo.
    pause
    exit /b 1
)

echo.
echo  ✓ Push successful!
echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║                     NEXT STEPS                              ║
echo  ╠══════════════════════════════════════════════════════════════╣
echo  ║                                                              ║
echo  ║  Your code is now on GitHub. To deploy the live app:        ║
echo  ║                                                              ║
echo  ║  1. Go to https://vercel.com/new                            ║
echo  ║  2. Sign in with GitHub                                      ║
echo  ║  3. Click "Import" on your apex-strategy repo                ║
echo  ║  4. Vercel auto-detects Next.js — just click "Deploy"       ║
echo  ║  5. Wait ~2 minutes for the build to complete               ║
echo  ║  6. Your app is live at https://apex-strategy.vercel.app    ║
echo  ║                                                              ║
echo  ║  No environment variables needed — the app is 100%          ║
echo  ║  client-side.                                                ║
echo  ║                                                              ║
echo  ║  Why Vercel? GitHub Pages does NOT support Next.js          ║
echo  ║  App Router (which this app uses). Vercel is free and       ║
echo  ║  built by the Next.js team.                                 ║
echo  ║                                                              ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.
echo  Your repo: !REPO_URL!
echo.
pause
