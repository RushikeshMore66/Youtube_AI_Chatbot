# YouTube AI-Genie

Paste a YouTube link → summary, notes, LinkedIn/blog post, and a chat with the video.
Credits: 1 credit per 15 min of video (max 3 h). Free trial: 1 credit (short video only). Pro: ₹299/month = 40 credits. Top-ups: ₹99 = 10, ₹249 = 30. All numbers live in `lib/pricing.ts`.

Stack: Next.js 15 (App Router) · TypeScript · Tailwind · Supabase (auth + Postgres + RLS) · Groq `llama-3.3-70b-versatile` · Supadata transcripts · Razorpay Subscriptions · Vercel.

## Local setup
```bash
cp .env.example .env.local   # fill in values (see below)
npm install
npm run dev
```

## Launch checklist (step 2 + 7 + 8)
1. **Supabase**: create a project → SQL editor → run `supabase/migrations/0001_init.sql`.
   - Auth → Providers: enable **Google** (Google Cloud OAuth client; redirect URI = the Supabase callback URL shown there). Email magic link is on by default.
   - Auth → URL configuration: Site URL = your domain; add `https://<domain>/auth/callback` and `http://localhost:3000/auth/callback` to Redirect URLs.
   - Copy URL, anon key, service-role key into env.
2. **Transcripts**: create a Supadata account → `TRANSCRIPT_API_KEY`.
3. **Groq**: `GROQ_API_KEY`.
4. **Razorpay (test mode first)**: create a monthly ₹299 Plan → `RAZORPAY_PLAN_ID`; copy `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`.
   Webhook: URL `https://<domain>/api/razorpay/webhook`, secret = `RAZORPAY_WEBHOOK_SECRET`, events:
   `subscription.activated`, `subscription.charged`, `subscription.cancelled`, `subscription.completed`, `subscription.halted`, and **`order.paid`** (credit top-ups).
   Apply `supabase/migrations/0002_credits.sql` after `0001_init.sql`.
5. **Vercel**: import the repo, set every variable from `.env.example` (Production + Preview), use the Pro plan once payments are live, connect your domain, set `NEXT_PUBLIC_SITE_URL`.
6. Test on a phone: sign in → process a video → spend the 1 trial credit → hit the credits wall → buy a top-up and subscribe (test card) → balance updates.

## Security notes
- `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`, `RAZORPAY_KEY_SECRET`, webhook secret are server-only (`server-only` import guard on the admin client).
- All writes to `videos`, `outputs`, `usage`, `chats` and `profiles.plan` happen server-side; RLS lets users only read their own rows.
- Credits are charged in `/api/process` via the atomic `spend_credits` SQL function and granted only by the signature-verified webhook, never from the browser.
