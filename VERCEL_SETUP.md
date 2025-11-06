# Vercel Deployment Setup

## Quick Setup Guide

### 1. Environment Variables

**CRITICAL**: You must set the Gemini API key in Vercel environment variables.

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (docu-verify-eight)
3. Navigate to **Settings** → **Environment Variables**
4. Add the following variable:

```
Variable Name: REACT_APP_GEMINI_API_KEY
Value: AIzaSyD8iCMG7GWBi9sqOnMZlfQIG9SeK7Kqy1Q
Environment: Production, Preview, Development (check all)
```

5. Click "Save"

### 2. Redeploy Application

After adding environment variables:

1. Go to **Deployments** tab
2. Click "..." on the latest deployment
3. Click "Redeploy"
4. Wait for deployment to complete

### 3. Restrict API Key (IMPORTANT)

⚠️ **Security Warning**: The API key will be visible in browser code.

To prevent abuse, restrict the key in Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Find your Gemini API key
3. Click "Edit"
4. Set **Application restrictions**:
   - Choose "HTTP referrers (websites)"
   - Add allowed referrers:
     ```
     https://docu-verify-eight.vercel.app/*
     https://*.vercel.app/*  (for preview deployments)
     http://localhost:3005/*  (for local development)
     ```
5. Set **API restrictions**:
   - Choose "Restrict key"
   - Select only "Generative Language API"
6. Click "Save"

### 4. Set Usage Quotas

Protect your API quota:

1. Go to [Quotas page](https://console.cloud.google.com/iam-admin/quotas)
2. Filter for "Generative Language API"
3. Set limits:
   - **Requests per day**: 500 (adjust based on expected traffic)
   - **Requests per minute**: 20

### 5. Set Up Billing Alerts

Prevent unexpected charges:

1. Go to [Cloud Console Billing](https://console.cloud.google.com/billing)
2. Navigate to "Budgets & alerts"
3. Create a new budget:
   - **Budget amount**: $10/month (adjust as needed)
   - **Alert thresholds**: 50%, 90%, 100%
   - **Email notifications**: Your email

## Configuration Files

### vercel.json

The project root contains `vercel.json` with build configuration:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "devCommand": "npm start",
  "installCommand": "npm install",
  "framework": null
}
```

### Root Directory

Vercel should be configured to use `frontend` as the root directory:

1. Go to **Settings** → **General**
2. Set **Root Directory**: `frontend`
3. Click "Save"

## Testing Deployment

### 1. Check Build Logs

After deployment:
1. Go to **Deployments** tab
2. Click on the latest deployment
3. Review build logs for errors
4. Look for "Build Completed" message

### 2. Test Functionality

Visit your deployment URL and test:

1. **Homepage loads**: https://docu-verify-eight.vercel.app
2. **Navigation works**: Try all menu items
3. **Document upload**: Try uploading a test document
4. **Gemini API**: Verify OCR extraction works
5. **Browser console**: Check for errors (F12 → Console)

### 3. Verify API Key

Check browser Network tab:
1. Open DevTools (F12)
2. Go to Network tab
3. Upload a document
4. Look for requests to `generativelanguage.googleapis.com`
5. Verify requests succeed (200 status code)

## Troubleshooting

### Build Fails

**Error**: "REACT_APP_GEMINI_API_KEY is not defined"

**Solution**: Add environment variable in Vercel settings and redeploy

### API Calls Fail

**Error**: "API key not valid" or 403 errors

**Solution**:
1. Check API key is correct in Vercel environment variables
2. Verify API key restrictions in Google Cloud Console
3. Ensure referrer matches your Vercel domain

### Blank Page After Deploy

**Solution**:
1. Check browser console for errors
2. Verify build output directory is correct (should be `build`)
3. Check that homepage field in package.json is set correctly

## Environment Variable Best Practices

### Development
```bash
# frontend/.env.local (not committed to git)
REACT_APP_GEMINI_API_KEY=your_dev_key_here
PORT=3005
```

### Production
Set in Vercel dashboard only (never commit to git)

### .gitignore

Ensure these files are ignored:
```
# Environment variables
.env
.env.local
.env.production
.env.development

# Vercel
.vercel
```

## Monitoring

### Check API Usage

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/dashboard)
2. Select "Generative Language API"
3. View metrics:
   - Requests per day
   - Error rates
   - Latency

### Vercel Analytics

Enable Vercel Analytics for visitor insights:
1. Go to **Analytics** tab in Vercel
2. Click "Enable Analytics"
3. View page views, performance metrics

## Custom Domain (Optional)

To use a custom domain:

1. Go to **Settings** → **Domains**
2. Click "Add"
3. Enter your domain (e.g., `docverify.com`)
4. Follow DNS configuration instructions
5. Update API key restrictions to include new domain

## Security Checklist

Before going live:

- [ ] API key restricted to your Vercel domain in Google Cloud Console
- [ ] Usage quotas set in Google Cloud Console
- [ ] Billing alerts configured
- [ ] Environment variables set in Vercel (not in code)
- [ ] `.env` files added to `.gitignore`
- [ ] API key marked as "Secret" in Vercel
- [ ] Tested API calls work in production
- [ ] Reviewed [SECURITY.md](SECURITY.md) for best practices

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Environment Variables in Vercel](https://vercel.com/docs/concepts/projects/environment-variables)
- [Google Cloud Console](https://console.cloud.google.com)
- [Gemini API Documentation](https://ai.google.dev/docs)

---

⚠️ **Important**: Read [SECURITY.md](SECURITY.md) for complete security guidelines.
