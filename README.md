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

The application can be deployed to any static hosting service:
- Vercel
- Netlify
- GitHub Pages
- Supabase Hosting

Ensure your Supabase edge functions are deployed before deploying the frontend.

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues or questions, please open an issue on GitHub.

## 🙏 Acknowledgments

Built to protect and empower Ugandan migrant workers with technology and information.
