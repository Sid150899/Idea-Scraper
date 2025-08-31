#!/bin/bash

# Vercel Deployment Script
# This script automates the deployment process to Vercel

echo "🚀 Starting Vercel Deployment..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel..."
    vercel login
fi

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

echo "✅ Build successful!"

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "🎉 Deployment complete!"
echo "📱 Your app should be live at the URL provided above."
echo "🔧 Don't forget to set environment variables in your Vercel dashboard:"
echo "   - REACT_APP_SUPABASE_URL"
echo "   - REACT_APP_SUPABASE_ANON_KEY"
