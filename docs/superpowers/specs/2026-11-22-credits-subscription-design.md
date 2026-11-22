# Credits + subscription pricing — design

## Intent
The free tier (3 new videos per user per day) costs real money (transcript API + LLM) and earns nothing: 1000 users x 3 videos/day is a permanent loss. Replace it with a credit system where every video costs credits by length, a one-time free trial lets people try the product, and a monthly subscription (cheapest per credit) is the obvious thing to buy. Every plan must be priced above its cost so the business is never in loss.

## Goals
- Cost to us per user is bounded: a user can never consume more than they paid for (trial is one-time and small).
- Long videos (currently rejected above 60 min) become possible, paying proportionally more credits.
- Pro subscription is the best value per credit; top-up packs exist for people who run out mid-month.
- All prices/credit rules live in one config file (`lib/pricing.ts`) so the owner can tune them without touching logic.

## Non-goals
Annual plans, coupons, refunds automation, per-feature (chat/notes) charging, team plans, credit rollover for subscription credits.

## Anti-goals
- Any path where a user gets processed output without credits being deducted.
- Double charging (retries, double clicks, webhook retries).
- Charging for a video when transcript fetch failed.

## Approaches considered
- A. Credit packs only: guaranteed margin, no recurring revenue.
- **B. Subscription with included monthly credits + top-up packs + one-time trial (chosen by owner).** Bounded cost, recurring income, long videos priced fairly.
- C. Keep unlimited Pro, drop daily free limit: simplest but heavy users on a flat plan can cost more than they pay.

## Design (approach B)

### Pricing rules (placeholder numbers — owner must verify against real Supadata + Groq costs)
- Video cost: `ceil(minutes / 15)` credits, minimum 1. Max video length 180 min (12 credits).
- Trial: 1 credit granted once at signup (owner decision); works only on a video <= 15 min = "1 short video".
- Pro: Rs 299/month, grants 40 credits each billing cycle. Reset to 40 on each successful charge (no rollover). Cancel/halt/expire zeroes subscription credits.
- Top-ups (one-time, never expire): Rs 99 = 10 credits, Rs 249 = 30 credits. Per-credit price: top-up 9.9 / 8.3, Pro 7.5 — Pro is deliberately cheapest.
- Re-opening a video the user already processed is free (existing behaviour).
- Spend order: trial/subscription credits first, then top-up credits.

### Data (new migration `0002_credits.sql`)
- `profiles`: add `sub_credits int`, `topup_credits int`, `trial_credits int` (all >= 0, check constraints). Existing users get trial 1; existing `pro` users get sub_credits 40.
- `credit_ledger(id, user_id, delta, bucket, reason, ref, created_at)` with `unique (reason, ref)` for idempotency (ref = video_id for spends, Razorpay payment/charge id for grants).
- SQL functions (security definer, service role only): `spend_credits(user, cost, video_id)` — atomic, row-locks the profile, deducts across buckets, returns false if insufficient; `grant_credits(...)` — idempotent via the ledger unique key.

### Server flow (`/api/process`)
1. Cache lookup and "already processed" check unchanged (free re-open).
2. Fetch/cache transcript (failure = no charge).
3. Compute cost from duration; reject if > 180 min; if user is trial-only and video > 15 min, return `UPGRADE_REQUIRED`.
4. `spend_credits` atomically; insufficient -> `INSUFFICIENT_CREDITS` (402) with `{needed, balance}`.
5. Insert `usage` row; if that fails, refund via a compensating ledger entry.
`FREE_DAILY_LIMIT`/`countTodayUsage` removed. `/api/chat` daily cap stays as abuse guard.

### Payments (Razorpay)
- Existing subscription flow stays. Webhook change: on `subscription.charged`/`activated` -> plan=pro and set `sub_credits = 40` (idempotent per charge/payment id); on cancel/halt/expire/complete -> plan=free and `sub_credits = 0`.
- New `POST /api/razorpay/topup` creates a Razorpay Order for a chosen pack (user id + pack in notes). Webhook handles `payment.captured`/`order.paid` for those orders and calls `grant_credits` (idempotent on payment id). Credits are only ever granted from the signature-verified webhook, never from the browser.

### UI
- Dashboard + header show credit balance; "Pro" badge kept.
- Out-of-credits state (in process form): shows cost needed vs balance with two buttons: Upgrade to Pro, Buy credits.
- Pricing page rewritten: Free trial (1 short video), Pro (Rs 299, 40 credits/mo, best value), top-up packs, and a "how credits work" line (1 credit ~ 15 min of video).

## Constraints / risks
- Long transcripts (up to 3h) may exceed the LLM context in `/api/generate` and `/api/chat`; the builder must check and add chunked (map-reduce) summarization or truncation with an explicit limit. This is required work, not optional.
- `maxDuration = 60` on process route: fine for transcript fetch; generation routes may need longer for long videos.
- Trial abuse via many accounts: mitigated by trial being short-videos-only and requiring login; no further anti-abuse in this scope.
- Rs prices/credit sizes above are placeholders, not verified margins.

## Left to the builder
Exact SQL, test approach (spend/grant concurrency and idempotency are the critical tests), component layout, copy.
