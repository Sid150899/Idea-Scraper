# Deployment Guide

This guide covers deploying the IDEAS frontend to various hosting platforms.

## Prerequisites

1. **Environment Variables**: Ensure you have a `.env` file with your Supabase credentials
2. **Build the App**: Run `npm run build` to create the production build
3. **Database Setup**: Ensure your Supabase database is properly configured

## Deployment Options

### 1. Vercel (Recommended - Free & Easy)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel --prod
   ```

3. **Follow the prompts**:
   - Link to existing project or create new
   - Set environment variables in Vercel dashboard
   - Deploy!

### 2. Netlify (Free & Easy)

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Deploy**:
   ```bash
   netlify deploy --prod --dir=build
   ```

3. **Set environment variables** in Netlify dashboard

### 3. GitHub Pages

1. **Add homepage** to package.json (already done)
2. **Install gh-pages**:
   ```bash
   npm install --save-dev gh-pages
   ```

3. **Add scripts** to package.json:
   ```json
   "predeploy": "npm run build",
   "deploy": "gh-pages -d build"
   ```

4. **Deploy**:
   ```bash
   npm run deploy
   ```

### 4. AWS S3 + CloudFront

1. **Create S3 bucket** with public read access
2. **Upload build folder** to S3
3. **Configure CloudFront** for CDN and HTTPS
4. **Set environment variables** in Lambda@Edge if needed

### 5. Firebase Hosting

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Initialize Firebase**:
   ```bash
   firebase init hosting
   ```

3. **Build and deploy**:
   ```bash
   npm run build
   firebase deploy
   ```

## Environment Variables

Set these in your hosting platform's dashboard:

```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Post-Deployment

1. **Test the app** thoroughly
2. **Check authentication** flows
3. **Verify database connections**
4. **Test save functionality**
5. **Monitor for errors**

## Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**:
   - Ensure they're set in your hosting platform
   - Restart the deployment

2. **CORS Issues**:
   - Check Supabase RLS policies
   - Verify domain is allowed in Supabase

3. **Build Failures**:
   - Check for TypeScript errors
   - Ensure all dependencies are installed

### Support

- Check the browser console for errors
- Verify Supabase connection in Network tab
- Test with a simple idea to isolate issues
