# Suitance

Next.js app for financial advisers that:

- authenticates users with Supabase Auth
- accepts pasted meeting notes or uploaded meeting audio
- transcribes audio with AssemblyAI
- generates FCA-style suitability reports with the Claude API
- stores reports in Supabase
- handles paid subscriptions with Stripe
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
   - `FINNHUB_API_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PRICE_ID`
   - `STRIPE_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
5. Install dependencies and start the app:

```bash
npm install
npm run dev
```

## Main routes

- `/` marketing/landing page
- `/login` adviser login
- `/signup` adviser registration
- `/pricing` subscription plan and checkout
- `/dashboard` report dashboard and generation flow

## Notes

- The Claude prompt is structured to return JSON that is validated with Zod before saving.
- Word export is generated on demand from the stored JSON report.
- Audio files are uploaded to the private Supabase Storage bucket `meeting-audio`.
