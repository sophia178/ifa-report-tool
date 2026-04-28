# FCA Suitability Reports

Next.js app for financial advisers that:

- authenticates users with Supabase Auth
- accepts pasted meeting notes or uploaded meeting audio
- transcribes audio with AssemblyAI
- generates FCA-style suitability reports with the Claude API
- stores reports in Supabase
- exports each report as a Word document

## Setup

1. Copy `.env.example` to `.env.local`.
2. Create a Supabase project and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Run the SQL in `supabase/schema.sql`.
4. Add:
   - `ANTHROPIC_API_KEY`
   - `ASSEMBLYAI_API_KEY`
5. Install dependencies and start the app:

```bash
npm install
npm run dev
```

## Main routes

- `/` marketing/landing page
- `/login` adviser login
- `/signup` adviser registration
- `/dashboard` report dashboard and generation flow

## Notes

- The Claude prompt is structured to return JSON that is validated with Zod before saving.
- Word export is generated on demand from the stored JSON report.
- Audio files are uploaded to the private Supabase Storage bucket `meeting-audio`.
