# UM-SAFE - Uganda Migrant Safety Assistant

## 🌍 About

UM-SAFE is an AI-powered multilingual assistant dedicated to protecting Ugandan migrant workers traveling to the Middle East. The platform provides:

- **Real-time AI Chatbot** with emergency detection
- **Multilingual Support** - English + 5 Ugandan languages (Luganda, Acholi, Ateso, Lugbara, Runyankole)
- **Recruiter Verification** - Check against 95+ government-verified agencies
- **Embassy Contacts** - Direct access to Uganda embassies in UAE, Saudi Arabia, Qatar, Kuwait, Jordan
- **Rights Education** - Know your rights as a migrant worker
- **Emergency Response** - Automatic incident detection and reporting

## 🚀 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **AI Model**: Groq API with Llama 3.1 70B (Free unlimited tier)
- **Translation**: MyMemory Translation API (1000 free requests/day, no key needed)
- **Authentication**: Supabase Auth with email/password

## 📋 Prerequisites

- Node.js 18+ & npm
- Supabase account

## 🛠️ Installation

```sh
# Clone the repository
git clone https://github.com/JORO-NIMO/um-safe.git

# Navigate to project directory
cd um-safe

# Install dependencies
npm install

# Start development server
npm run dev
```

## ⚙️ Configuration

1. **Update Environment Variables**
   
   Edit `.env` file with your Supabase credentials:
   ```env
   VITE_SUPABASE_PROJECT_ID="your-project-id"
   VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
   VITE_SUPABASE_URL="https://your-project.supabase.co"
   ```

2. **Run Database Migrations**
   
   Go to your Supabase SQL Editor and run:
   - `supabase/migrations/20251119140000_knowledge_base.sql`
   - `supabase/migrations/20251120000000_verified_recruiters_data.sql`

3. **Deploy Edge Function**
   
   Deploy the chat function from `supabase/functions/chat/index.ts` to your Supabase project.

## 💡 Free & Open Source

UM-SAFE uses completely free APIs with no API keys required:
- **Groq AI**: Free tier with generous limits for Llama 3.1 70B model
- **MyMemory Translation**: 1000 free translations per day per IP
- **Supabase**: Free tier includes 500MB database, 2GB file storage, 50,000 monthly active users

No credit card or paid subscriptions needed to run the application!

## 📚 Features

### 🤖 AI Assistant
- Context-aware responses using knowledge base
- Emergency keyword detection in 6 languages
- Automatic incident logging and severity assessment
- Real-time streaming responses

### ✅ Recruiter Verification
- Database of 95+ verified recruitment agencies
- License number validation
- Complaint tracking
- Expiry date monitoring

### 🏢 Embassy Directory
- Direct phone numbers and emergency hotlines
- Working hours and addresses
- Email contacts for all Uganda embassies

### 📖 Rights Education
- Your basic rights as a migrant worker
- Warning signs of trafficking
- Emergency procedures
- Contract rights and violations
- Healthcare access information

### 🚨 Emergency Detection
- Multi-language keyword detection
- Automatic priority response
- Incident report creation
- Embassy contact provision

## 🗂️ Project Structure

```
um-safe/
├── src/
│   ├── components/          # React components
│   │   ├── LandingPage.tsx
│   │   ├── AuthPage.tsx
│   │   ├── SignUpPage.tsx
│   │   ├── ChatInterface.tsx
│   │   └── KnowledgeBasePanel.tsx
│   ├── integrations/        # Supabase client
│   └── pages/               # Route pages
├── supabase/
│   ├── functions/
│   │   └── chat/            # AI chat edge function
│   └── migrations/          # Database schema
└── public/                  # Static assets
```

## 🌐 Deployment

UM-SAFE consists of a static frontend plus Supabase database + edge functions.

### 1. Supabase Setup
Run migrations (in order) via Supabase SQL Editor:
```
supabase/migrations/20251119140000_knowledge_base.sql
supabase/migrations/20251120000000_verified_recruiters_data.sql
```
Deploy edge functions:
- `chat` (AI conversation)
- `fetch_incidents` (optional news ingestion trigger)

Dashboard path: Edge Functions → New Function → Name matches folder → paste `index.ts` → Deploy. Add secrets for `fetch_incidents`:
```
SUPABASE_URL=https://<your-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```
Never expose service role key in frontend.

### 2. Environment Variables (Frontend Hosting)
Set in hosting provider (Vercel / Netlify):
```
VITE_SUPABASE_URL=https://<your-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-public-key>
VITE_SUPABASE_PROJECT_ID=<project-ref>
```

### 3. Build Frontend
```
npm install
npm run build
```
`dist/` is the deployable artifact.

### 4. Hosting Options
- **Vercel (Recommended)**: `vercel --prod` (auto-detects Vite)
- **Netlify**: Deploy `dist/` with build command `npm run build`
- **GitHub Pages**: Push `dist/` to `gh-pages` branch (e.g. `npx gh-pages -d dist`)
- **Static S3 + CloudFront**: Upload `dist/` contents and set proper caching headers

### 5. Automated Function Deployment (CI)
GitHub Actions workflow added: `.github/workflows/deploy_supabase_functions.yml`
Add repository secrets:
```
SUPABASE_ACCESS_TOKEN=<personal-access-token>
SUPABASE_PROJECT_REF=<project-ref>
```
Trigger manually from Actions tab to deploy functions without local CLI.

### 6. Daily Incident Ingestion
Workflow: `.github/workflows/fetch_incidents.yml` runs daily (cron) and appends new rows to `incident_reports_transformed.csv` using free GDELT API.

### 7. Post-Deployment Checklist
```
✅ Migrations applied
✅ Edge functions deployed (chat, fetch_incidents if needed)
✅ Frontend reachable
✅ Auth sign-up / login works
✅ Chat responses stream
✅ Incident ingestion cron running (see Actions)
✅ No service role key in client bundle
```

### 8. Optional Hardening
- Enable JWT verification on `fetch_incidents` by setting `verify_jwt = true` in its `config.toml`.
- Add rate limiting table (track IP / user_id + timestamp).
- Add Sentry or similar for frontend error monitoring.
- Add RLS policies for any new tables created.

### 9. Manual Invocation Examples
Fetch incidents (no insert):
```
GET https://<project-ref>.functions.supabase.co/fetch_incidents?max=5
```
Insert (requires service role secret configured in function environment):
```
GET https://<project-ref>.functions.supabase.co/fetch_incidents?insert=true&max=5
```

### 10. Local Supabase CLI (Optional)
If you prefer CLI locally and install methods fail, download binary from releases:
```
https://github.com/supabase/cli/releases
```
Place `supabase.exe` in a folder on `PATH` and use:
```
supabase login
supabase link --project-ref <project-ref>
supabase functions deploy chat
```

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues or questions, please open an issue on GitHub.

## 🙏 Acknowledgments

Built to protect and empower Ugandan migrant workers with technology and information.
