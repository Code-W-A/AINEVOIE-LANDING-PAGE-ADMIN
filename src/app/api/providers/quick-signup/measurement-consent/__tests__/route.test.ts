import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ update: vi.fn(), verify: vi.fn(), doc: vi.fn() }));
vi.mock("@/lib/providerMetaConsentToken", () => ({ verifyProviderMetaConsentToken: mocks.verify }));
vi.mock("@/lib/firebaseAdmin", () => ({ getAdminDb: () => ({ collection: () => ({ doc: mocks.doc }) }) }));
vi.mock("firebase-admin/firestore", () => ({ FieldValue: { delete: () => "delete", serverTimestamp: () => "timestamp" } }));
import { POST } from "../route";
const request = () => new Request("http://localhost/api/providers/quick-signup/measurement-consent", { method: "POST", body: JSON.stringify({ token: "signed" }) });
describe("provider measurement revocation", () => {
  beforeEach(() => { vi.resetAllMocks(); mocks.doc.mockReturnValue({ update: mocks.update }); });
  it("cannot update a provider without a valid revocation token", async () => {
    mocks.verify.mockReturnValue(null);
    expect((await POST(request())).status).toBe(401);
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("revokes consent and deletes matching data without modifying the profile", async () => {
    mocks.verify.mockReturnValue("provider-1");
    expect((await POST(request())).status).toBe(200);
    expect(mocks.doc).toHaveBeenCalledWith("provider-1");
    expect(mocks.update).toHaveBeenCalledWith({ "metaAcquisition.measurementConsent": false, "metaAcquisition.userData": "delete", "metaAcquisition.revokedAt": "timestamp" });
  });
  it("reports failed revocation so the browser can retain the token for retry", async () => {
    mocks.verify.mockReturnValue("provider-1"); mocks.update.mockRejectedValue(new Error("offline"));
    expect((await POST(request())).status).toBe(503);
  });
});
