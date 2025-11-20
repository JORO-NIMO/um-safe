# UM-SAFE Deployment Guide

## ✅ Architecture Overview

1. **Free AI Backend**: Using Groq API with Llama 3.1 70B model (no API key needed for basic tier)
2. **Free Translation**: MyMemory Translation API provides 1000 free requests/day per IP
3. **Zero Cost Setup**: No paid services or API keys required to run the full application
4. **Supabase Backend**: PostgreSQL database, authentication, and edge functions on free tier

## 🚀 Deployment Steps

### 1. Deploy Database Migrations

Go to your Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql

Run these migrations in order:

#### Migration 1: Knowledge Base Schema
```sql
-- Copy and paste content from: supabase/migrations/20251119140000_knowledge_base.sql
```

#### Migration 2: Verified Recruiters Data
```sql
-- Copy and paste content from: supabase/migrations/20251120000000_verified_recruiters_data.sql
```

### 2. Deploy Edge Function

Go to Edge Functions: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/functions

1. Click **"Deploy new function"**
2. Name it: `chat`
3. Copy the entire content from `supabase/functions/chat/index.ts`
4. Click **Deploy**

**Note**: No environment variables needed! The free APIs don't require keys.

### 3. Test the Application

1. Restart your dev server if running:
   ```powershell
   npm run dev
   ```

2. Open http://localhost:8080/

3. Sign up and test the chat with questions like:
   - "Tell me about safe migration to the Middle East"
   - "How can I verify a recruiter?"
   - "What are my rights as a worker?"

## 🔧 Free APIs Used

### Groq AI (Llama 3.1 70B)
- **Speed**: Very fast responses
- **Limit**: Generous free tier
- **Model**: llama-3.1-70b-versatile
- **No signup needed for basic usage**

### MyMemory Translation
- **Languages**: Supports 50+ languages including Ugandan languages
- **Limit**: 1000 requests/day per IP (free)
- **No API key required**
- **Quality**: Good for general translation

## 📝 Notes

- If you hit rate limits on MyMemory, you can switch to LibreTranslate (self-hosted, unlimited)
- Groq has generous free limits but you can get an API key at https://console.groq.com for higher limits
- All data is stored in your Supabase database for learning and improvement

## 🆘 Troubleshooting

**Chat not working?**
1. Check edge function is deployed
2. Check database migrations ran successfully
3. Check browser console for errors

**Translation not working?**
- MyMemory has daily limits per IP
- Fallback: App will use English if translation fails

**Need higher limits?**
- Get free Groq API key at: https://console.groq.com
- Update the Bearer token in chat/index.ts line 341

## 🌐 Production Deployment

### Deploy Frontend

**Option 1: Vercel (Recommended)**
```bash
npm install -g vercel
vercel
```

**Option 2: Netlify**
```bash
npm run build
# Upload dist/ folder to Netlify
```

**Option 3: GitHub Pages**
```bash
npm run build
# Deploy dist/ folder to gh-pages branch
```

### Environment Variables

Set these in your hosting platform:
```env
VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_URL=https://your-project.supabase.co
```

### Post-Deployment Checklist

- ✅ Database migrations completed
- ✅ Edge function deployed and working
- ✅ Test chat functionality
- ✅ Test recruiter verification
- ✅ Test emergency detection
- ✅ Test multilingual support
- ✅ Verify knowledge base data loaded
