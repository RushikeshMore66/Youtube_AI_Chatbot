/** Single source of truth for credits and prices. Placeholder numbers: verify against real costs. */
export const SECONDS_PER_CREDIT = 15 * 60;
export const MAX_VIDEO_SECONDS = 180 * 60;

export const TRIAL_CREDITS = 1;
/** Trial credits only work on videos up to this length. */
export const TRIAL_MAX_SECONDS = 15 * 60;

export const PRO = { priceInr: 299, credits: 40 } as const;

export type PackId = "pack10" | "pack30";
export const TOPUP_PACKS: readonly { id: PackId; priceInr: number; credits: number }[] = [
  { id: "pack10", priceInr: 99, credits: 10 },
  { id: "pack30", priceInr: 249, credits: 30 },
];

export function getPack(id: string) {
  return TOPUP_PACKS.find((p) => p.id === id);
}

export function creditsForDuration(seconds: number): number {
  return Math.max(1, Math.ceil(seconds / SECONDS_PER_CREDIT));
}

export type Balance = { trial: number; sub: number; topup: number };

/** Mirrors the SQL spend order (trial, then subscription, then top-up). Null if the balance is too low. */
export function splitSpend(b: Balance, cost: number): Balance | null {
  if (b.trial + b.sub + b.topup < cost) return null;
  let left = cost;
  const take = (have: number) => {
    const t = Math.min(have, left);
    left -= t;
    return have - t;
  };
  return { trial: take(b.trial), sub: take(b.sub), topup: take(b.topup) };
}
