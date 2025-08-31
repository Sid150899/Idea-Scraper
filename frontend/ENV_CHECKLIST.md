# Environment Variables Checklist

## ✅ Pre-Deployment Checklist

Before deploying to Vercel, ensure you have these environment variables configured:

### Required Variables

- [ ] `REACT_APP_SUPABASE_URL` - Your Supabase project URL
- [ ] `REACT_APP_SUPABASE_ANON_KEY` - Your Supabase anonymous/public key

### Optional Variables

- [ ] `REACT_APP_ENV` - Set to "production" for production builds

## 🔍 How to Check

### 1. Local Development
Create a `.env.local` file in your frontend directory:
```bash
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
REACT_APP_ENV=development
```

### 2. Vercel Dashboard
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable with the exact names above

### 3. Verify Configuration
Check your browser console for these messages:
```
Supabase environment variables check:
REACT_APP_SUPABASE_URL: SET
REACT_APP_SUPABASE_ANON_KEY: SET
```

## 🚨 Common Issues

- **Variable names must start with `REACT_APP_`**
- **No spaces around the `=` sign**
- **Values should not be quoted**
- **Redeploy after adding new variables**

## 🔧 Testing Locally

1. Create `.env.local` file
2. Restart your development server
3. Check browser console for confirmation
4. Test authentication flow

## 📱 Production Deployment

1. Set variables in Vercel dashboard
2. Deploy your application
3. Verify variables are loaded in production
4. Test all functionality

---

**Note**: Environment variables are only loaded at build time for Create React App. Changes require a new deployment.
