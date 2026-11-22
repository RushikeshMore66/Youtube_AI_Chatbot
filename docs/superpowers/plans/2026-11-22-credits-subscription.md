# Credits + Subscription Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 3-free-videos-per-day limit with length-based credits, a 1-credit trial, a Pro subscription with 40 monthly credits, and one-time top-up packs.

**Architecture:** All pricing lives in `lib/pricing.ts` (pure, unit-tested). Balances live on `profiles` with an idempotent `credit_ledger`; atomic Postgres functions do spend/grant. `/api/process` charges after transcript fetch; the Razorpay webhook (signature-verified) is the only place credits are granted.

**Tech Stack:** Next.js 15 App Router, Supabase (Postgres + service role), Razorpay (subscriptions + orders), Groq, vitest (added for pure-logic tests).

**Spec:** docs/superpowers/specs/2026-11-22-credits-subscription-design.md

## Global Constraints
- Video cost: `ceil(minutes/15)`, min 1; max video 180 min (12 credits).
- Trial: 1 credit once at signup, only for videos <= 15 min.
- Pro: Rs 299/month, 40 credits per charge, reset (not added), zeroed on cancel/halt/expire/complete.
- Top-ups: Rs 99 = 10 credits, Rs 249 = 30 credits, never expire. Spend order: trial, sub, then top-up.
- Re-opening an already-processed video is free. No charge if transcript fetch fails. Credits granted only from the signature-verified webhook.

## Review Focus
- Two concurrent `/api/process` calls for the same video charge once (ledger unique key).
- Webhook retry of the same payment/charge id grants once.
- Balance can never go negative (DB check constraints + atomic function).
- Usage insert failure after charge refunds the credits.
- Duration exactly 15 / 16 / 180 / 181 minutes and 0-second videos price correctly.

---

### Task 1: Pricing config (pure logic)
**Files:** Create `lib/pricing.ts`, `lib/pricing.test.ts`; modify `package.json` (add vitest devDependency, `"test": "vitest run"`); delete `lib/limits.ts` usages later (Task 3).
**Interfaces:** Produces `creditsForDuration(seconds: number): number`; `TRIAL_CREDITS=1`, `TRIAL_MAX_SECONDS=900`, `MAX_VIDEO_SECONDS=10800`, `PRO={priceInr:299,credits:40}`, `TOPUP_PACKS: {id:'pack10'|'pack30',priceInr:number,credits:number}[]`; `splitSpend(b:{trial,sub,topup},cost): {trial,sub,topup}|null`.
- [ ] Failing tests: `creditsForDuration(0)=1`, `(900)=1`, `(901)=2`, `(10800)=12`; `splitSpend({trial:1,sub:2,topup:5},4)` -> `{trial:1,sub:2,topup:1}`; returns null when total < cost.
- [ ] Run `npx vitest run` -> FAIL; implement; run -> PASS.
- [ ] Commit.

### Task 2: Database migration
**Files:** Create `supabase/migrations/0002_credits.sql`.
**Interfaces:** Produces `profiles.trial_credits/sub_credits/topup_credits` (int, default 0, check >= 0; trial default 1 for new users via updated `handle_new_user`), table `credit_ledger(id,user_id,delta,bucket,reason,ref,created_at, unique(reason,ref))`, functions (service role only): `spend_credits(p_user uuid,p_cost int,p_ref text) returns boolean`, `grant_credits(p_user uuid,p_bucket text,p_amount int,p_reason text,p_ref text) returns boolean` (false if already applied), `set_sub_credits(p_user uuid,p_amount int,p_ref text) returns boolean`.
- [ ] Write migration: backfill existing users trial 1 (pro users sub 40); `spend_credits` locks the profile row (`for update`), spends trial -> sub -> topup, inserts ledger rows, returns false if insufficient or ref already spent; `grant_credits`/`set_sub_credits` idempotent via ledger unique key. Enable RLS on `credit_ledger` with read-own policy; revoke function execute from anon/authenticated.
- [ ] Verify SQL parses (`psql --set ON_ERROR_STOP` if available, else careful review). Commit.

### Task 3: Charging in `/api/process`
**Files:** Create `lib/credits.ts`; modify `app/api/process/route.ts`, `lib/plan.ts`, `lib/api.ts` (error codes `INSUFFICIENT_CREDITS` 402, `UPGRADE_REQUIRED` 402); delete `lib/limits.ts`.
**Interfaces:** Consumes Task 1/2. Produces `getBalance(userId): Promise<{trial,sub,topup,total}>`, `spendForVideo(userId, videoId, cost): Promise<boolean>`, `refundVideo(userId, videoId, cost)`.
- [ ] Rewrite flow per spec: cached/already-processed returns free; fetch transcript; reject > 180 min `TOO_LONG`; trial-only user (no sub/topup balance) and video > 900s -> `UPGRADE_REQUIRED`; `spendForVideo` false -> `INSUFFICIENT_CREDITS` with `{needed, balance}` in the error body; then insert `usage`; on failure refund.
- [ ] `npx tsc --noEmit` and `npm run lint` pass. Commit.

### Task 4: Payments — webhook and top-up
**Files:** Create `app/api/razorpay/topup/route.ts`; modify `app/api/razorpay/webhook/route.ts`, `.env.example`, `README.md`.
- [ ] Webhook: `subscription.activated/charged` -> plan=pro + `set_sub_credits(user,40,<payment or subscription id + charge>)`; cancel/halt/expire/complete -> plan=free + `set_sub_credits(user,0,...)`; `payment.captured`/`order.paid` with `notes.pack` and `notes.user_id` -> `grant_credits(user,'topup',pack.credits,'topup',paymentId)`. Unknown packs/plans ignored. Signature check unchanged.
- [ ] `POST /api/razorpay/topup {packId}` (auth required, zod-validated) creates a Razorpay order for the pack price in paise with notes `{user_id, pack}`; returns `{orderId, keyId, amount}`.
- [ ] README: add webhook events and checkout steps. `tsc` + lint. Commit.

### Task 5: Long-transcript handling
**Files:** Modify `lib/llm.ts`, `app/api/generate/route.ts`, `app/api/chat/route.ts`.
- [ ] Add `fitTranscript(transcript: string, maxChars: number)`; for generate, if transcript exceeds the limit, summarize in chunks then combine (map-reduce); for chat, use the head+tail truncation with a note to the model. Test `fitTranscript` with a vitest case (short input unchanged; long input <= maxChars). Commit.

### Task 6: UI
**Files:** Modify `app/dashboard/page.tsx`, `components/app-header.tsx`, `components/process-form.tsx`, `components/pricing-cards.tsx`, `app/pricing/page.tsx`, `lib/site.ts`; create `components/topup-buttons.tsx`.
- [ ] Dashboard + header show total credits; process-form handles `INSUFFICIENT_CREDITS`/`UPGRADE_REQUIRED` with needed vs balance and Upgrade / Buy buttons; pricing page shows Free trial (1 short video), Pro (best value), top-up packs, "1 credit ~ 15 min of video".
- [ ] `npm run build` passes. Commit and push.
