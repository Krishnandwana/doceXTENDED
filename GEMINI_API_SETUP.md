# Gemini API Setup Guide

## Issue: Models Not Found (404 Error)

If you're seeing errors like:
```
models/gemini-pro is not found for API version v1beta
```

This means your API key doesn't have access to Gemini models. Follow these steps to fix it:

## Step 1: Get a New API Key

### Option A: Google AI Studio (Recommended - Free)

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click **"Get API Key"**
3. Choose **"Create API key in new project"** or select an existing project
4. Copy the generated API key

### Option B: Google Cloud Console (For Production)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **"Generative Language API"**:
   - Go to APIs & Services → Library
   - Search for "Generative Language API"
   - Click "Enable"
4. Create credentials:
   - Go to APIs & Services → Credentials
   - Click "Create Credentials" → "API Key"
   - Copy the generated key

## Step 2: Verify API Access

Test your API key works:

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Try the **Text prompt** with your API key
3. If it works there, it should work in the app

## Step 3: Update Environment Variables

### Local Development

Update `frontend/.env`:
```env
REACT_APP_GEMINI_API_KEY=your_new_api_key_here
PORT=3005
REACT_APP_API_URL=http://localhost:8000
```

### Vercel Production

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Update `REACT_APP_GEMINI_API_KEY` with new value
5. Redeploy

## Step 4: Restart Application

```bash
# Stop the current server (Ctrl+C)
# Then restart
cd frontend
npm start
```

## Step 5: Test

1. Open http://localhost:3005
2. Go to **Document Verification**
3. Upload a test document
4. Check browser console (F12) for logs
5. Should see "Success with model: ..." message

## Troubleshooting

### Error: "API key not valid"

**Solution:**
- Make sure you copied the entire API key
- No extra spaces or quotes
- Key should start with "AIza..."

### Error: "API not enabled"

**Solution:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to APIs & Services → Library
3. Search for "Generative Language API"
4. Click "Enable"

### Error: "Quota exceeded"

**Solution:**
- Free tier has limits (60 requests/minute, 1500/day)
- Wait or upgrade to paid plan
- Check [quotas page](https://console.cloud.google.com/iam-admin/quotas)

### Still Getting 404 Errors

**Possible causes:**
1. **Wrong API type**: Make sure you're using Generative Language API key, not other Google APIs
2. **Old API key**: Try creating a fresh API key
3. **Project not configured**: Ensure Generative Language API is enabled in your project

**To verify:**
```bash
# Test the API key with curl
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

If this returns data, your API key works. If not, create a new one.

## Current Workaround

The app is currently using **mock data** to demonstrate functionality while you set up the API key properly.

You'll see a warning: "⚠️ This is mock data - Please configure Gemini API key properly"

Once you have a working API key:
1. Update `.env` with new key
2. Restart the app
3. The app will automatically use real Gemini AI

## API Key Security

Once you have a working key:

1. **Restrict it** in Google Cloud Console:
   - Application restrictions: HTTP referrers
   - Add: `https://docu-verify-eight.vercel.app/*`
   - Add: `http://localhost:3005/*`

2. **Set quotas**:
   - Limit requests per day: 500
   - Limit requests per minute: 20

3. **Monitor usage**:
   - Check [Google Cloud Console](https://console.cloud.google.com/apis/dashboard)
   - Set up billing alerts

## Need Help?

1. **Google AI Studio**: [https://aistudio.google.com/](https://aistudio.google.com/)
2. **API Documentation**: [https://ai.google.dev/docs](https://ai.google.dev/docs)
3. **Support**: [https://developers.googleblog.com/](https://developers.googleblog.com/)

## Summary Checklist

- [ ] Created new API key from Google AI Studio
- [ ] Verified API works in Google AI Studio
- [ ] Updated `frontend/.env` with new key
- [ ] Restarted the frontend application
- [ ] Tested document upload - should work without errors
- [ ] Restricted API key in Google Cloud Console
- [ ] Set usage quotas
- [ ] Configured Vercel environment variable (for production)

---

**After completing these steps**, the document verification should work with real Gemini AI instead of mock data.
