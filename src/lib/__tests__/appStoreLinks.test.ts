import { APP_STORE_LINKS } from "@/constants/appStoreLinks";
import { describe, expect, it } from "vitest";

describe("APP_STORE_LINKS", () => {
  it("keeps the public Ainevoie store destinations centralized", () => {
    expect(APP_STORE_LINKS).toEqual({
      android: "https://play.google.com/store/apps/details?id=com.ainevoie.nrb",
      ios: "https://apps.apple.com/ro/app/ainevoie/id6777059131",
    });
  });
});
