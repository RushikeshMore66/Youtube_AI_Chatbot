import { describe, expect, it } from "vitest";
import { creditsForDuration, TOPUP_PACKS, PRO, MAX_VIDEO_SECONDS } from "@/lib/pricing";

describe("creditsForDuration", () => {
  it("charges at least 1 credit", () => expect(creditsForDuration(0)).toBe(1));
  it("15 minutes is 1 credit", () => expect(creditsForDuration(900)).toBe(1));
  it("16 minutes is 2 credits", () => expect(creditsForDuration(960)).toBe(2));
  it("180 minutes is 12 credits", () => expect(creditsForDuration(MAX_VIDEO_SECONDS)).toBe(12));
});

describe("pricing config", () => {
  it("makes Pro the cheapest per credit", () => {
    const pro = PRO.priceInr / PRO.credits;
    for (const p of TOPUP_PACKS) expect(p.priceInr / p.credits).toBeGreaterThan(pro);
  });
});
