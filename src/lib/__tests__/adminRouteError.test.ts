import { describe, expect, it } from "vitest";
import { formatAdminRouteErrorMessage, serializeRouteError } from "@/lib/adminRouteError";

describe("adminRouteError", () => {
  it("serializes route errors with step and firestore code", () => {
    const error = Object.assign(new Error("The query requires an index."), {
      code: 9,
      details: "https://console.firebase.google.com/...",
    });

    expect(serializeRouteError(error, "providerPayoutRequests.orderBy")).toEqual({
      step: "providerPayoutRequests.orderBy",
      message: "The query requires an index.",
      code: 9,
      details: "https://console.firebase.google.com/...",
      name: "Error",
    });
  });

  it("formats admin route error messages for UI display", () => {
    expect(formatAdminRouteErrorMessage("Nu am putut încărca cererile de payout.", {
      step: "providerPayoutRequests.orderBy",
      message: "The query requires an index.",
      code: 9,
      details: null,
      name: "Error",
    })).toBe(
      "Nu am putut încărca cererile de payout. [providerPayoutRequests.orderBy] The query requires an index. (code: 9)"
    );
  });
});
