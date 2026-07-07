import { describe, expect, it } from "vitest";
import {
  formatPayoutRequestLinkLabel,
  formatPayoutRequestMoney,
  formatPayoutRequestShortId,
} from "../adminPaymentLabels";

describe("adminPaymentLabels", () => {
  it("shortens long payout request ids", () => {
    expect(formatPayoutRequestShortId("payout_provider_1710000000000")).toBe("…000000");
    expect(formatPayoutRequestShortId("abc")).toBe("abc");
  });

  it("builds payout request list labels from amount and date", () => {
    expect(formatPayoutRequestLinkLabel({
      providerNetAmount: 1234.5,
      currency: "RON",
      requestedAtLabel: "7 iul. 2026, 14:32",
    })).toContain("1.234,50");
    expect(formatPayoutRequestLinkLabel({
      providerNetAmount: 1234.5,
      currency: "RON",
      requestedAtLabel: "7 iul. 2026, 14:32",
    })).toContain("7 iul. 2026, 14:32");
  });

  it("formats payout money values", () => {
    expect(formatPayoutRequestMoney(0)).toBe("-");
    expect(formatPayoutRequestMoney(100, "RON")).toContain("100");
  });
});
