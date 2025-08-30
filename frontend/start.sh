#!/bin/bash

echo "🚀 IDEAS Frontend Setup"
echo "========================"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo ""
    echo "📝 Please create a .env file with your Supabase credentials:"
    echo "   REACT_APP_SUPABASE_URL=your_supabase_url_here"
    echo "   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here"
    echo ""
    echo "🔑 Get these from your Supabase project dashboard:"
    echo "   Settings > API > Project URL & anon/public key"
    echo ""
    exit 1
fi

echo "✅ .env file found"
echo "📦 Installing dependencies..."

# Install dependencies
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
    echo ""
    echo "🌐 Starting development server..."
    echo "   The app will open at http://localhost:3000"
    echo ""
    echo "📱 Features available:"
    echo "   - Login/Register with Supabase"
    echo "   - Browse startup ideas"
    echo "   - View detailed idea information"
    echo "   - Save/unsave ideas"
    echo "   - Search and filter functionality"
    echo ""
    echo "🔄 To update data:"
    echo "   1. Run your backend pipeline to update Supabase"
    echo "   2. Refresh the frontend - data updates automatically!"
    echo ""
    
    # Start the development server
    npm start
else
    echo "❌ Failed to install dependencies"
    exit 1
fi
