# Quick Start Guide

Get your IDEAS frontend running in 5 minutes!

## 🚀 Immediate Setup

1. **Create Environment File**:
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

2. **Run the Startup Script**:
   ```bash
   ./start.sh
   ```

## 🔑 Get Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and sign in
2. Open your project dashboard
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `REACT_APP_SUPABASE_URL`
   - **anon public** key → `REACT_APP_SUPABASE_ANON_KEY`

## 📱 Test the App

1. **Open** http://localhost:3000
2. **Register** a new account
3. **Browse** startup ideas
4. **Click** on any idea to see details
5. **Save** ideas you like
6. **Search** for specific topics

## 🎯 What You'll See

- **Login/Register**: Clean toggle interface
- **Home Page**: Idea cards with ratings and save buttons
- **Idea Details**: Full analysis with evaluation scores table
- **Save Function**: Bookmark ideas for later
- **Search**: Find ideas by title or content

## 🔄 Update Data

1. **Run your backend pipeline**:
   ```bash
   cd ../data/outputs
   python3 supabase_pipeline.py
   ```

2. **Refresh the frontend** - new data appears automatically!

## 🚀 Deploy

```bash
npm run build
# Upload build/ folder to your hosting service
```

## ❓ Need Help?

- Check browser console for errors
- Verify Supabase connection
- Ensure environment variables are set
- Check the full README.md for detailed instructions
