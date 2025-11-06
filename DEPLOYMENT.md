# Deployment Guide

This guide covers deploying the DocVerify application to production.

## Production URLs

- **Frontend (Vercel)**: https://docu-verify-eight.vercel.app
- **Backend (Render)**: https://docu-verify.onrender.com

## Backend Deployment (Render)

### Prerequisites
- Render account
- GitHub repository connected to Render

### Steps

1. **Create New Web Service on Render**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Build Settings**
   ```
   Name: docu-verify
   Environment: Python 3
   Build Command: pip install -r requirements.txt
   Start Command: python run_backend.py
   ```

3. **Set Environment Variables**

   Go to Environment tab and add:
   ```
   GEMINI_API_KEY=AIzaSyD8iCMG7GWBi9sqOnMZlfQIG9SeK7Kqy1Q
   API_HOST=0.0.0.0
   API_PORT=8000
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Backend will be available at: https://docu-verify.onrender.com

### Health Check

Verify backend is running:
```bash
curl https://docu-verify.onrender.com/health
```

Expected response:
```json
{"status": "healthy"}
```

## Frontend Deployment (Vercel)

### Prerequisites
- Vercel account
- GitHub repository connected to Vercel

### Steps

1. **Create New Project on Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New..." → "Project"
   - Import your GitHub repository

2. **Configure Project Settings**
   ```
   Framework Preset: Create React App
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: build
   Install Command: npm install
   ```

3. **Set Environment Variables**

   Go to Settings → Environment Variables and add:
   ```
   REACT_APP_API_URL=https://docu-verify.onrender.com
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Frontend will be available at: https://docu-verify-eight.vercel.app

### Redeploy After Changes

Vercel automatically redeploys when you push to your main branch. To manually redeploy:
1. Go to Deployments tab
2. Click "..." on latest deployment
3. Click "Redeploy"

## CORS Configuration

The backend is configured to allow all origins in development. For production, it's already set to `allow_origins=["*"]` in [backend/api/main.py](backend/api/main.py:29).

**Current CORS settings (backend/api/main.py):**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins including Vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

This configuration already works for your Vercel deployment. If you want to restrict it to specific domains for security:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://docu-verify-eight.vercel.app",
        "http://localhost:3005",  # For local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Testing the Production Deployment

### 1. Test Backend
```bash
# Health check
curl https://docu-verify.onrender.com/health

# API docs
open https://docu-verify.onrender.com/docs
```

### 2. Test Frontend
- Open https://docu-verify-eight.vercel.app
- Navigate to Document Verification page
- Upload a test document (Aadhaar, PAN, etc.)
- Verify it processes correctly and shows results

### 3. Test Integration
- Ensure frontend can communicate with backend
- Check browser console for CORS errors
- Verify API calls in Network tab

## Environment Variables Summary

### Backend (Render)
```
GEMINI_API_KEY=AIzaSyD8iCMG7GWBi9sqOnMZlfQIG9SeK7Kqy1Q
API_HOST=0.0.0.0
API_PORT=8000
```

### Frontend (Vercel)
```
REACT_APP_API_URL=https://docu-verify.onrender.com
```

## Troubleshooting

### Backend Issues

**Problem:** Backend not starting on Render

**Solutions:**
1. Check build logs in Render dashboard
2. Verify all dependencies in requirements.txt are compatible
3. Check if GEMINI_API_KEY is set in environment variables
4. Ensure `run_backend.py` exists and is executable

**Problem:** 500 errors on API calls

**Solutions:**
1. Check Render logs for errors
2. Verify environment variables are set correctly
3. Test API endpoints using /docs interface

### Frontend Issues

**Problem:** "Cannot connect to backend" error

**Solutions:**
1. Verify REACT_APP_API_URL is set in Vercel environment variables
2. Check backend is running: https://docu-verify.onrender.com/health
3. Redeploy frontend after changing environment variables
4. Check browser console for CORS errors

**Problem:** Build fails on Vercel

**Solutions:**
1. Check Vercel build logs
2. Verify all dependencies are in package.json
3. Ensure Root Directory is set to "frontend"
4. Try clearing Vercel build cache and redeploying

### CORS Errors

**Problem:** CORS policy blocking requests

**Solutions:**
1. Verify backend CORS is set to allow Vercel domain
2. Check browser console for specific CORS error message
3. Test backend endpoint directly with curl to verify it's accessible
4. Ensure frontend is using https:// not http:// for API URL

## Monitoring

### Render Monitoring
- Dashboard shows CPU, Memory, and Network usage
- View logs in real-time from Render dashboard
- Set up email alerts for downtime

### Vercel Monitoring
- Analytics available in Vercel dashboard
- View deployment logs for each build
- Monitor Core Web Vitals

## Updating the Application

### Backend Updates
1. Push changes to GitHub
2. Render automatically rebuilds and deploys
3. Monitor deployment in Render dashboard

### Frontend Updates
1. Push changes to GitHub
2. Vercel automatically rebuilds and deploys
3. Monitor deployment in Vercel dashboard

### Manual Deployment
If automatic deployment is disabled:
- **Render**: Click "Manual Deploy" → "Deploy latest commit"
- **Vercel**: Go to Deployments → Click "..." → "Redeploy"

## Local Development with Production Backend

If you want to test locally against the production backend:

```bash
cd frontend

# Create .env.local
echo "REACT_APP_API_URL=https://docu-verify.onrender.com" > .env.local

# Start frontend
npm start
```

Frontend will run at http://localhost:3005 and connect to production backend.

## Security Considerations

1. **API Keys**: Never commit API keys to GitHub. Use environment variables only.
2. **CORS**: Consider restricting CORS to specific domains in production
3. **HTTPS**: Both services use HTTPS automatically (Render and Vercel)
4. **Rate Limiting**: Consider adding rate limiting to backend API
5. **File Upload Limits**: Backend has file size limits configured

## Cost Optimization

### Render
- Free tier available with limitations
- Spins down after 15 minutes of inactivity (first request will be slow)
- Upgrade to paid plan for always-on service

### Vercel
- Free tier includes 100GB bandwidth
- Unlimited deployments
- Upgrade for more bandwidth and team features

## Support

For deployment issues:
- **Render**: https://render.com/docs
- **Vercel**: https://vercel.com/docs
- **GitHub Issues**: Report bugs in your repository
