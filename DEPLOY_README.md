# 🚀 Quick Deploy - Free Hosting

Deploy your Document Verification app **100% free** in 15 minutes!

## ⚡ Quick Start

### 1. Push to GitHub (2 min)
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/document-verification.git
git push -u origin main
```

### 2. Deploy Backend on Render (5 min)
1. Go to [render.com](https://render.com) → Sign up with GitHub
2. **New** → **Web Service** → Connect your repo
3. Settings:
   - **Build**: `pip install -r requirements.txt`
   - **Start**: `uvicorn backend.api.main:app --host 0.0.0.0 --port $PORT`
4. **Create** → Wait 10 min → Copy your URL

### 3. Deploy Frontend on Vercel (5 min)
1. Go to [vercel.com](https://vercel.com) → Sign up with GitHub
2. **Import** → Select your repo
3. Settings:
   - **Root Directory**: `frontend`
   - **Environment Variable**: 
     - Name: `REACT_APP_API_URL`
     - Value: `https://YOUR-BACKEND.onrender.com` (from step 2)
4. **Deploy** → Wait 3 min → Done!

### 4. Update CORS (2 min)
Update `backend/api/main.py`:
```python
allow_origins=[
    "http://localhost:3005",
    "https://YOUR-VERCEL-URL.vercel.app",  # Add this line
],
```
Commit and push → Render will auto-redeploy.

## ✅ Done!

Your app is live at: `https://YOUR-PROJECT.vercel.app/id-verification`

---

## 📝 Full Guide

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed instructions, troubleshooting, and alternatives.

## 💰 Cost

**$0/month** for:
- ✅ Unlimited frontend deployments
- ✅ 750 hours/month backend (24/7)
- ✅ HTTPS & Custom domains
- ⚠️ Backend sleeps after 15 min (cold start ~30s)

## 🛠️ Alternative Free Platforms

**Backend**: Render, Fly.io, Railway, Koyeb
**Frontend**: Vercel, Netlify, Cloudflare Pages

---

Need help? Check [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
