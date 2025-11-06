# DocVerify Frontend

Modern React application for document verification and identity validation with AI-powered OCR.

## Features

- **Dashboard** - Overview of verification statistics and quick actions
- **ID Verification** - Multi-step ID card verification with face matching
- **Document Verification** - Upload and verify Indian ID documents (Aadhaar, PAN, etc.)
- **Real-time Processing** - Live progress updates during document processing
- **Responsive Design** - Works seamlessly on desktop and mobile devices

## Tech Stack

- **React 19.2.0** - UI framework
- **React Router 7.9.5** - Client-side routing
- **Tailwind CSS 4.1.16** - Utility-first styling
- **Lucide React 0.552.0** - Icon library
- **Axios 1.13.1** - HTTP client for API calls

## Prerequisites

- Node.js 16 or higher
- npm or yarn package manager
- Backend server running on port 8000

## Installation

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

The `.env` file should already exist with:

```env
REACT_APP_API_URL=http://localhost:8000
```

If you need to change the backend URL, edit this file.

## Running the Application

### Development Mode

Start the development server:

```bash
npm start
```

The application will open at [http://localhost:3005](http://localhost:3005)

### Production Build

Build the optimized production bundle:

```bash
npm run build
```

The build files will be in the `build/` directory.

## Project Structure

```
frontend/
├── public/               # Static files
├── src/
│   ├── components/       # Reusable components
│   │   └── Navbar.js    # Navigation bar
│   ├── pages/           # Page components
│   │   ├── Dashboard.js             # Main dashboard
│   │   ├── IDVerification.js        # ID verification flow
│   │   └── DocumentVerification.js  # Document verification
│   ├── services/        # API services
│   │   └── api.js       # Backend API client
│   ├── App.js           # Main app component
│   └── index.js         # Entry point
├── .env                 # Environment variables
├── package.json         # Dependencies
└── tailwind.config.js   # Tailwind configuration
```

## Available Pages

### Dashboard (`/`)

- View verification statistics
- Quick access to ID and document verification
- Recent activity feed
- Backend connection status

### ID Verification (`/id-verification`)

4-step process:
1. Upload ID document (Aadhaar, PAN, Driving License, etc.)
2. Automatic data extraction using Gemini AI
3. Live face verification via camera
4. Verification results

### Document Verification (`/document-verification`)

3-screen flow:
1. Upload document and select type
2. Real-time processing with progress tracking
3. View extracted data and validation results

## API Integration

The frontend connects to the backend API using these endpoints:

- `POST /api/documents/upload` - Upload document
- `POST /api/documents/process` - Process document
- `GET /api/documents/status/:jobId` - Check processing status
- `GET /api/documents/results/:documentId` - Get results
- `POST /api/face/match` - Verify face match
- `GET /api/health` - Health check

See `src/services/api.js` for full API documentation.

## Supported Document Types

- Aadhaar Card
- PAN Card
- Driving License
- Passport
- Voter ID

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API base URL | `http://localhost:8000` |

## Common Issues

### Backend Connection Error

**Problem:** "Cannot connect to the backend server"

**Solution:**
1. Ensure the backend is running: `python run_backend.py`
2. Check backend is accessible at http://localhost:8000/api/health
3. Verify `REACT_APP_API_URL` in `.env` is correct
4. Restart the frontend after changing `.env`

### CORS Errors

**Problem:** CORS policy blocking requests

**Solution:** The backend should have CORS enabled for `http://localhost:3005`. Check `backend/api/main.py` for CORS configuration.

### Module Not Found

**Problem:** "Module not found" errors

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

## Development Tips

1. **Hot Reload**: Changes to source files automatically reload the browser
2. **Console Logs**: Check browser console for API request/response logs
3. **Network Tab**: Monitor API calls in browser DevTools Network tab
4. **React DevTools**: Install React DevTools extension for component inspection

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

See main project LICENSE file.
