// Read-only by default. Review the proposed catalog before applying it to a named project.
import { readFileSync } from "node:fs";
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.argv.find((arg) => arg.startsWith("--project="))?.slice(10);
if (!projectId) throw new Error("Specify --project=<Firebase project ID>. Default mode only previews changes.");
const launch = JSON.parse(readFileSync(new URL("../src/lib/launchServiceCatalog.json", import.meta.url), "utf8"));
const app = initializeApp({ credential: applicationDefault(), projectId });
const db = getFirestore(app);
const ref = db.collection("admin_settings").doc("provider_service_types");
const merge = (raw) => {
  const existing = Array.isArray(raw?.items) ? raw.items : [];
  const seen = new Set(existing.map((item) => String(item.value || "").trim().toLowerCase()));
  return [...existing, ...launch.filter((item) => !seen.has(item.value.toLowerCase())).map(({ value, labels, enabled, sortOrder }) => ({ value, labels, enabled, sortOrder }))];
};
const snapshot = await ref.get();
const items = merge(snapshot.data());
console.log(JSON.stringify({ projectId, apply: process.argv.includes("--apply"), items }, null, 2));
if (process.argv.includes("--apply")) {
  await db.runTransaction(async (transaction) => {
    const current = await transaction.get(ref);
    transaction.set(ref, { items: merge(current.data()) }, { merge: true });
  });
  console.log("Launch categories added; existing values and disabled items preserved.");
}
