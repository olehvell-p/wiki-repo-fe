# Vercel Deployment Guide

## Environment Variables Setup

Before deploying to Vercel, you need to configure the following environment variables in your Vercel project settings:

### Required Environment Variables

| Variable | Description | Example Values |
|----------|-------------|----------------|
| `NEXT_PUBLIC_BACKEND_URL` | Backend API URL (without trailing slash) | `https://your-backend-api.com` |

### Setting Environment Variables in Vercel

1. Go to your project dashboard on [Vercel](https://vercel.com)
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

#### Production Environment
- **Name:** `NEXT_PUBLIC_BACKEND_URL`
- **Value:** `https://your-backend-domain.com` (replace with your actual backend URL)
- **Environment:** Production

#### Preview Environment (Optional)
- **Name:** `NEXT_PUBLIC_BACKEND_URL`
- **Value:** `https://staging-backend-domain.com` (replace with your staging backend URL)
- **Environment:** Preview

#### Development Environment (Optional)
- **Name:** `NEXT_PUBLIC_BACKEND_URL`
- **Value:** `http://localhost:8000`
- **Environment:** Development

## Deployment Steps

### 1. Automatic Deployment (Recommended)

1. Connect your GitHub repository to Vercel
2. Set up the environment variables as described above
3. Push your code to the main branch
4. Vercel will automatically deploy your application

### 2. Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

## Local Development

To run the application locally:

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your local backend URL
# NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# Start development server
npm run dev
```

## Build Verification

Before deploying, verify that your build works correctly:

```bash
# Build the application
npm run build

# Start production server locally
npm start
```

## Backend Integration

Make sure your backend API:

1. **Supports CORS** for your frontend domain
2. **Has proper SSL/HTTPS** for production
3. **Returns appropriate headers** for SSE (Server-Sent Events)
4. **Handles environment-specific URLs** correctly

### Example Backend CORS Configuration (FastAPI)

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-domain.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Troubleshooting

### Common Issues

1. **Environment variables not loading:**
   - Ensure variables start with `NEXT_PUBLIC_` for client-side access
   - Redeploy after changing environment variables

2. **CORS errors:**
   - Configure your backend to allow requests from your Vercel domain
   - Check that your backend URL is correct (https, not http)

3. **SSE connection issues:**
   - Verify your backend supports SSE properly
   - Check that the backend URL is accessible from Vercel's servers

4. **Build failures:**
   - Run `npm run build` locally to check for TypeScript errors
   - Ensure all dependencies are properly listed in package.json

### Support

If you encounter issues, check:
- Vercel deployment logs
- Browser developer console
- Backend API logs
- Network tab in browser dev tools 