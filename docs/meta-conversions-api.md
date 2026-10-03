# Meta Lead measurement for provider quick signup

## Scope and failure isolation

Only the updated quick-signup form opts in with `metaTrackingVersion: quick-signup-v1`.
The API schedules a server `Lead` after all existing successful signup operations.
It returns `metaLeadEventId` for the browser Pixel's `eventID`. Both use the same
pixel, event name and identifier. Older clients and the other onboarding flows
continue without server Leads. Opening or refreshing `/success` sends no Lead.
The identifier is derived from the created provider UID, with SHA-256; no raw UID
is sent in the event. A Lead means a pre-registered provider, not an activated one.

The network call uses Next.js `after()` so Meta latency does not delay signup.
There are at most two attempts, each with a 2.5-second timeout. Retries keep the
same event ID and occurrence time. Configuration/scheduling/Meta errors do not
change the successful signup response. The browser helper also contains Pixel
exceptions so a broken analytics script cannot block the success redirect.

## Activation

Disabled by default. Configure secrets in server environment settings, never in
client code, `NEXT_PUBLIC_*` variables (except the existing Pixel ID), or Git:

- `NEXT_PUBLIC_META_PIXEL_ID`: the same Pixel selected in the Leads ad set.
- `META_CONVERSIONS_API_ACCESS_TOKEN`: token authorized for that Pixel/dataset.
- `META_GRAPH_API_VERSION`: supported Graph API version, verified when enabling.
- `META_CAPI_ENABLED=true`: explicit activation switch.
- `META_CAPI_TEST_EVENT_CODE`: Events Manager test code for controlled testing.

Preview/local environments require a test code and cannot emit unmarked live
events. Unmarked live events require `VERCEL_ENV=production` (set by Vercel).
Remove the test code when moving to live production measurement. Never give
previews the production token automatically. Redeploy after changing settings.
Rollback: set `META_CAPI_ENABLED=false` and redeploy; browser tracking continues.

Before live activation, connect/verify the site's advertising consent policy.
The existing signup terms checkbox is NOT advertising consent, and the code
does not reinterpret it as such. No consent-management mechanism was found in
the inspected analytics components; this implementation does not add a consent
banner. Server delivery respects `Sec-GPC: 1` and `DNT: 1`; absence of these
headers is not evidence of consent. If affirmative consent is required by the
site's policy, add the corresponding per-request gate before enabling CAPI.

Server events contain normalized SHA-256 email/phone and hashed external ID,
user agent, and valid existing `_fbp`/`_fbc` cookies. Hashing is pseudonymization,
not anonymization. Passwords, names, other cookies and form contents are excluded.
Source URL is the fixed localized quick-signup URL without query parameters.
Logs contain only fixed messages, HTTP status and event ID, never tokens,
Meta response bodies or raw contact details.

## Verification before live use

1. Run unit tests, typecheck and build. Unit tests mock all Meta/Firebase calls.
2. Use an approved controlled signup with a test code and inspect Meta Test Events.
3. Confirm Browser + Server `Lead` share the same ID and are deduplicated; verify
   one provider record was created. Ensure invalid/duplicate submissions send none.
4. Repeat with the browser Pixel blocked: the server event should still arrive,
   subject to advertising consent. Test a Meta failure: signup must still succeed.
5. Remove the test code for live measurement, then reconcile real signups with
   Events Manager reception and separately with Ads Manager attribution.

Delivery is best effort, not a durable queue: extended Meta downtime or termination
of the background task can lose events. A received event does not guarantee ad
attribution. UTMs are not persisted by this change. No 100% measurement guarantee.

References:

- https://nextjs.org/docs/app/api-reference/functions/after
- https://experienceleague.adobe.com/en/docs/experience-platform/tags/extensions/server/meta/overview
