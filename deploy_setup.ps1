# Quick Deployment Setup Script

Write-Host "=== Document Verification Deployment Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if Git is initialized
if (!(Test-Path ".git")) {
    Write-Host "Initializing Git repository..." -ForegroundColor Yellow
    git init
    Write-Host "✓ Git initialized" -ForegroundColor Green
} else {
    Write-Host "✓ Git already initialized" -ForegroundColor Green
}

# Check for .gitignore
if (!(Test-Path ".gitignore")) {
    Write-Host "Creating .gitignore..." -ForegroundColor Yellow
    @"
venv/
venv1/
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
*.so
*.dylib
data/uploads/
data/processed/
*.log
.env
.env.local
.env.production
.vscode/
node_modules/
frontend/node_modules/
frontend/build/
.DS_Store
"@ | Out-File -FilePath ".gitignore" -Encoding UTF8
    Write-Host "✓ .gitignore created" -ForegroundColor Green
} else {
    Write-Host "✓ .gitignore exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Create GitHub repository:" -ForegroundColor Yellow
Write-Host "   - Go to https://github.com/new"
Write-Host "   - Create new repository (e.g., 'document-verification')"
Write-Host ""
Write-Host "2. Add remote and push:" -ForegroundColor Yellow
Write-Host "   git remote add origin https://github.com/YOUR_USERNAME/document-verification.git"
Write-Host "   git add ."
Write-Host "   git commit -m 'Initial commit'"
Write-Host "   git branch -M main"
Write-Host "   git push -u origin main"
Write-Host ""
Write-Host "3. Deploy Backend to Render:" -ForegroundColor Yellow
Write-Host "   - Go to https://render.com"
Write-Host "   - New > Web Service"
Write-Host "   - Connect your GitHub repo"
Write-Host "   - Build: pip install -r requirements.txt"
Write-Host "   - Start: uvicorn backend.api.main:app --host 0.0.0.0 --port `$PORT"
Write-Host ""
Write-Host "4. Deploy Frontend to Vercel:" -ForegroundColor Yellow
Write-Host "   - Go to https://vercel.com"
Write-Host "   - Import GitHub repo"
Write-Host "   - Root Directory: frontend"
Write-Host "   - Add Environment Variable:"
Write-Host "     REACT_APP_API_URL = https://YOUR-BACKEND.onrender.com"
Write-Host ""
Write-Host "5. Update CORS in backend/api/main.py with your Vercel URL"
Write-Host ""
Write-Host "See DEPLOYMENT_GUIDE.md for detailed instructions!" -ForegroundColor Green
Write-Host ""
