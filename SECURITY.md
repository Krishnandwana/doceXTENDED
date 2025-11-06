# Security Considerations

## ⚠️ IMPORTANT: API Key Exposure in Frontend

This application uses direct Gemini API calls from the frontend, which exposes the API key in the client-side code. **Anyone can inspect the browser and view your API key.**

### Risks

1. **API Key Theft**: Users can extract your key from browser DevTools
2. **Quota Abuse**: Stolen keys can be used to consume your API quota
3. **Cost Impact**: Unauthorized usage can result in unexpected charges
4. **Data Leakage**: API logs may contain sensitive document data

### Mitigation Steps

#### 1. Restrict API Key in Google Cloud Console

**CRITICAL**: Immediately restrict your API key to prevent abuse:

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Find your Gemini API key
3. Click "Edit"
4. Under "Application restrictions":
   - Select "HTTP referrers (websites)"
   - Add your allowed domains:
     ```
     https://docu-verify-eight.vercel.app/*
     http://localhost:3005/*
     ```
5. Under "API restrictions":
   - Select "Restrict key"
   - Choose only "Generative Language API"
6. Save changes

#### 2. Set Usage Quotas

Protect against quota abuse:

1. Go to [Quotas page](https://console.cloud.google.com/iam-admin/quotas)
2. Filter for "Generative Language API"
3. Set daily/monthly limits:
   - Requests per day: 100-500 (adjust based on expected usage)
   - Requests per minute: 10-20

#### 3. Monitor API Usage

Set up alerts for unusual activity:

1. Go to [Cloud Console Billing](https://console.cloud.google.com/billing)
2. Navigate to "Budgets & alerts"
3. Create budget alerts:
   - Daily budget: $5-10
   - Alert at 50%, 90%, 100% of budget
4. Review API usage regularly in [API Metrics](https://console.cloud.google.com/apis/dashboard)

#### 4. Environment Variable Configuration

For Vercel deployment:

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add `REACT_APP_GEMINI_API_KEY` as a **Secret**
4. This prevents the key from appearing in public logs
5. The key will still be visible in browser (unavoidable for frontend calls)

### Best Practices

#### Development
```bash
# Use .env.local for development (not committed to git)
REACT_APP_GEMINI_API_KEY=your_dev_key_here

# Never commit API keys to version control
# Add .env.local to .gitignore
```

#### Production
```bash
# Set in Vercel environment variables
REACT_APP_GEMINI_API_KEY=your_production_key_here
```

### Alternative Architecture (More Secure)

For production systems with sensitive data, consider a **backend proxy**:

```
User → Frontend → Backend API → Gemini API
                    ↑
                API key stored securely on server
```

**Benefits:**
- API key never exposed to clients
- Server-side rate limiting
- Request logging and monitoring
- Additional validation and security checks
- Can implement authentication/authorization

**To implement:**
1. Keep the backend server running
2. Update frontend to call backend API instead of Gemini directly
3. Backend proxies requests to Gemini
4. Backend handles rate limiting and authentication

### Security Checklist

- [ ] API key restricted to specific domains in Google Cloud Console
- [ ] API restrictions set to only Generative Language API
- [ ] Daily/monthly usage quotas configured
- [ ] Billing alerts set up
- [ ] Environment variables configured in Vercel
- [ ] `.env` files added to `.gitignore`
- [ ] Regular monitoring of API usage
- [ ] Considered migration to backend proxy for production

### Monitoring Commands

Check API usage:
```bash
# View recent API calls in Google Cloud Console
# Console → APIs & Services → Dashboard → Generative Language API
```

Review Vercel logs:
```bash
# Check for unusual patterns in request frequency
# Vercel Dashboard → Your Project → Logs
```

### Incident Response

If you suspect API key compromise:

1. **Immediately rotate the key:**
   - Go to Google Cloud Console
   - Create a new API key with restrictions
   - Update Vercel environment variable
   - Delete the compromised key

2. **Check usage:**
   - Review API usage metrics
   - Check for unauthorized requests
   - Review billing for unexpected charges

3. **Update application:**
   - Trigger new deployment in Vercel
   - Clear browser caches
   - Verify new key is working

4. **Report if needed:**
   - Contact Google Cloud Support for unusual billing
   - File incident report if data was compromised

## Additional Security Measures

### Input Validation

The application validates:
- File types (images and PDFs only)
- File sizes (max 10MB)
- Document types (predefined list)

### Data Handling

- Documents processed client-side only
- No server-side storage (when using frontend-only approach)
- Results not persisted
- Session data cleared on navigation

### HTTPS Only

- Always use HTTPS in production
- Vercel provides automatic HTTPS
- Never use API in unsecured HTTP context

### Browser Security

Modern browsers provide:
- Content Security Policy (CSP)
- Cross-Origin Resource Sharing (CORS)
- Same-Origin Policy

Ensure your application doesn't bypass these protections.

## Compliance Considerations

If processing sensitive documents (PII, health data, financial):

1. **Consider regulatory requirements:**
   - GDPR (Europe)
   - CCPA (California)
   - HIPAA (Healthcare)
   - PCI DSS (Payment cards)

2. **Data minimization:**
   - Only extract necessary fields
   - Don't log sensitive data
   - Clear data after processing

3. **User consent:**
   - Inform users about data processing
   - Obtain explicit consent
   - Provide privacy policy

4. **Data retention:**
   - Don't store documents unnecessarily
   - Implement data deletion policies
   - Comply with right-to-erasure requests

## Recommended: Migration to Backend Proxy

For production use with sensitive documents, we strongly recommend implementing a backend proxy:

### Benefits
- Complete API key security
- Server-side rate limiting
- Request logging
- User authentication
- Audit trails
- Compliance controls

### Implementation
See [DEPLOYMENT.md](DEPLOYMENT.md) for backend setup instructions.

---

**Remember**: Frontend API keys are **never truly secure**. For production systems handling sensitive data, always use a backend proxy.
