# Vercel Deployment Guide

## 🚀 Frontend-Only Deployment to Vercel

This guide will help you deploy your React frontend to Vercel while keeping your Python backend agents local.

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code should be in a GitHub repo
3. **Supabase Project**: Set up your Supabase project for authentication

## 🔧 Environment Variables Setup

### 1. Create Environment Variables in Vercel

In your Vercel dashboard, go to your project settings and add these environment variables:

```bash
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_ENV=production
```

### 2. Get Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the Project URL and anon/public key

## 🚀 Deployment Steps

### Option 1: Vercel CLI (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from frontend directory**:
   ```bash
   cd frontend
   vercel --prod
   ```

### Option 2: GitHub Integration

1. **Connect GitHub Repository**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Select the `frontend` folder as the root directory

2. **Configure Build Settings**:
   - Framework Preset: `Create React App`
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`

3. **Set Environment Variables** (as shown above)

4. **Deploy**: Click "Deploy"

## 🔍 Post-Deployment Verification

1. **Check Authentication Flow**:
   - Visit your deployed URL
   - Test login/register functionality
   - Verify Supabase connection

2. **Test Routing**:
   - Navigate between pages
   - Check that protected routes work
   - Verify redirects function properly

## 📁 Project Structure for Vercel

```
frontend/
├── src/                    # React source code
├── public/                 # Static assets
├── package.json           # Dependencies
├── vercel.json            # Vercel configuration
├── tsconfig.json          # TypeScript config
└── README.md              # Project documentation
```

## 🔧 Configuration Files

### vercel.json
- Handles SPA routing
- Configures build settings
- Sets environment variables

### package.json
- Defines build scripts
- Lists dependencies
- Specifies Node.js version

## 🚨 Common Issues & Solutions

### 1. Environment Variables Not Loading
- Ensure variables are set in Vercel dashboard
- Check that variable names start with `REACT_APP_`
- Redeploy after adding variables

### 2. Routing Issues
- Verify `vercel.json` has proper rewrites
- Check that all routes redirect to `index.html`

### 3. Build Failures
- Ensure Node.js version compatibility
- Check for missing dependencies
- Verify TypeScript compilation

## 🔄 Continuous Deployment

Once connected to GitHub:
- Every push to `main` branch triggers automatic deployment
- Preview deployments are created for pull requests
- Easy rollback to previous versions

## 📊 Monitoring & Analytics

Vercel provides:
- Performance metrics
- Error tracking
- Analytics integration
- Real-time logs

## 🎯 Next Steps

After successful deployment:
1. **Test all functionality** thoroughly
2. **Set up custom domain** if needed
3. **Configure monitoring** and alerts
4. **Set up staging environment** for testing

## 📞 Support

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)
- **Project Issues**: Check your GitHub repository

---

**Note**: This deployment only includes the frontend. Your Python agents and data processing pipeline will continue to run locally or on your preferred backend infrastructure.
