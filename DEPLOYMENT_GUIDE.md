# Free Deployment Guide for Document Verification System

This guide will help you deploy the Document Verification application for **FREE** using:
- **Frontend**: Vercel (Free Tier)
- **Backend**: Render (Free Tier)

---

## Prerequisites

1. GitHub account
2. Vercel account (sign up at https://vercel.com)
3. Render account (sign up at https://render.com)
4. Git installed on your computer

---

## Step 1: Prepare Your Repository

### 1.1 Initialize Git Repository (if not already done)

```bash
cd e:\Projects\DOCUMENT-VERIFY
git init
git add .
git commit -m "Initial commit - Document Verification System"
```

### 1.2 Create a GitHub Repository

1. Go to https://github.com/new
2. Create a new repository (e.g., `document-verification`)
3. **Don't** initialize with README (you already have files)
4. Copy the remote URL

### 1.3 Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/document-verification.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Backend to Render

### 2.1 Sign Up for Render
- Go to https://render.com
- Sign up with GitHub

### 2.2 Create New Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Select `document-verification` repository

### 2.3 Configure Service

Use these settings:

- **Name**: `document-verify-backend` (or your choice)
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: Leave empty (root)
- **Runtime**: `Python 3`
- **Build Command**: 
  ```bash
  pip install -r requirements.txt
  ```
- **Start Command**: 
  ```bash
  uvicorn backend.api.main:app --host 0.0.0.0 --port $PORT
  ```

### 2.4 Environment Variables (Optional)

- `PYTHON_VERSION`: `3.11.0`

### 2.5 Deploy

1. Click **"Create Web Service"**
2. Wait 5-10 minutes for build (downloads ML models)
3. Your backend URL will be: `https://document-verify-backend.onrender.com`

### 2.6 Test Backend

Once deployed, visit:
```
https://YOUR-BACKEND-URL.onrender.com/api/health
```

You should see:
```json
{
  "status": "healthy",
  "services": {...}
}
```

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Update Frontend API URL

Before deploying, update the API URL in your frontend:

**File**: `frontend/src/config.js`

```javascript
// Change from:
const API_BASE_URL = 'http://localhost:8000';

// To:
const API_BASE_URL = 'https://YOUR-BACKEND-URL.onrender.com';
```

**Save and commit this change:**
```bash
git add frontend/src/config.js
git commit -m "Update API URL for production"
git push origin main
```

### 3.2 Sign Up for Vercel

- Go to https://vercel.com
- Sign up with GitHub

### 3.3 Import Project

1. Click **"Add New..."** → **"Project"**
2. Import `document-verification` repository
3. Vercel will auto-detect React app

### 3.4 Configure Project

- **Framework Preset**: Create React App
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `build`

### 3.5 Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes
3. Your frontend URL: `https://document-verification-xxxx.vercel.app`

---

## Step 4: Update CORS Settings

### 4.1 Update Backend CORS

**File**: `backend/api/main.py`

Find the CORS section and update origins:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3005",
        "http://localhost:3000",
        "https://YOUR-VERCEL-URL.vercel.app",  # Add your Vercel URL
        "https://document-verification-xxxx.vercel.app"  # Your actual URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Commit and push:**
```bash
git add backend/api/main.py
git commit -m "Update CORS for production"
git push origin main
```

Render will auto-redeploy.

---

## Step 5: Test Your Deployed App

1. Visit your Vercel URL: `https://document-verification-xxxx.vercel.app`
2. Navigate to `/id-verification`
3. Upload an ID card
4. Take a selfie
5. Verify face match

---

## Important Notes

### Free Tier Limitations

**Render Free Tier**:
- ✅ 750 hours/month (enough for 24/7)
- ⚠️ Sleeps after 15 minutes of inactivity
- ⚠️ First request after sleep takes ~30-60 seconds (cold start)
- ✅ Automatic HTTPS
- ✅ 512 MB RAM

**Vercel Free Tier**:
- ✅ Unlimited deployments
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ 100 GB bandwidth/month

### Cold Start Handling

The backend sleeps after 15 minutes of inactivity. First request will be slow.

**Solution**: Add a loading message in frontend:

```javascript
// In IDVerificationWorking.js, add timeout warning:
if (!response && timeElapsed > 10000) {
  setProcessingStage('Backend waking up... (first request may take 60 seconds)');
}
```

### Model Loading

On first backend startup, it will:
1. Download EasyOCR models (~500 MB)
2. Initialize Haar Cascade models
3. This happens automatically on Render

---

## Troubleshooting

### Backend Not Responding
- Check Render logs: https://dashboard.render.com → Your Service → Logs
- Verify build completed successfully
- Check if service is sleeping (free tier)

### CORS Errors
- Verify Vercel URL is added to CORS origins
- Check both URLs (with and without trailing slash)
- Redeploy backend after CORS changes

### Build Failures on Render
- Check `requirements.txt` is present
- Verify Python version compatibility
- Review build logs for missing dependencies

### Frontend Not Connecting
- Verify `API_BASE_URL` in `frontend/src/config.js`
- Check browser console for errors
- Ensure backend is deployed and healthy

---

## Cost Optimization

### To Keep Everything Free:

1. **Don't exceed bandwidth limits**
   - Vercel: 100 GB/month
   - Render: No bandwidth limit on free tier

2. **Accept cold starts**
   - Backend sleeps after 15 min inactivity
   - First request takes 30-60 seconds

3. **Monitor usage**
   - Check Vercel dashboard
   - Check Render dashboard

---

## Upgrade Options (If Needed)

### Render Paid ($7/month):
- No sleeping
- Faster CPUs
- More RAM

### Vercel Pro ($20/month):
- More bandwidth
- Better analytics
- Priority support

---

## Alternative Free Options

### Backend Alternatives:
1. **Railway** - Free trial, then paid
2. **Fly.io** - Free tier (3 small VMs)
3. **PythonAnywhere** - Free tier (limited)
4. **Koyeb** - Free tier

### Frontend Alternatives:
1. **Netlify** - Similar to Vercel
2. **Cloudflare Pages** - Free tier
3. **GitHub Pages** - Free (static only)

---

## Security Considerations for Production

1. **Add environment variables**:
   ```bash
   # On Render, add these environment variables:
   SECRET_KEY=your-secret-key-here
   ALLOWED_HOSTS=your-vercel-url.vercel.app
   ```

2. **Rate limiting**: Consider adding rate limiting to prevent abuse

3. **File upload limits**: Already set to 10 MB in backend

4. **HTTPS**: Both platforms provide free SSL certificates

---

## Monitoring Your Deployment

### Render:
- Dashboard: https://dashboard.render.com
- View logs in real-time
- Monitor CPU/Memory usage
- Check deployment history

### Vercel:
- Dashboard: https://vercel.com/dashboard
- View deployment logs
- Monitor analytics
- Check bandwidth usage

---

## Quick Deployment Checklist

- [ ] Create GitHub repository
- [ ] Push code to GitHub
- [ ] Deploy backend to Render
- [ ] Get backend URL
- [ ] Update `frontend/src/config.js` with backend URL
- [ ] Deploy frontend to Vercel
- [ ] Update CORS in `backend/api/main.py` with Vercel URL
- [ ] Test full workflow
- [ ] Done! 🎉

---

## Support and Issues

If you encounter issues:
1. Check Render logs
2. Check Vercel deployment logs
3. Check browser console for frontend errors
4. Verify API URL configuration
5. Test backend health endpoint

---

## Next Steps

Once deployed:
1. Share your Vercel URL with users
2. Monitor usage on both platforms
3. Consider custom domain (free on both platforms)
4. Set up analytics (Vercel has built-in)

**Your deployed app will be accessible at:**
- Frontend: `https://YOUR-PROJECT.vercel.app/id-verification`
- Backend: `https://YOUR-BACKEND.onrender.com/api/health`

Enjoy your free deployed document verification system! 🚀
