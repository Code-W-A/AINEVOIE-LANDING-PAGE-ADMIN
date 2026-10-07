# Provider app-store button clicks

Set `PROVIDER_APP_CLICK_SECRET` on the Next.js server to enable attribution.
Generate a random secret using `openssl rand -hex 32`. Never use a
`NEXT_PUBLIC_` variable for this value. Changing the secret invalidates existing
tokens. Without it, signup and store links still work, but clicks are not saved.

Quick signup returns `appClickToken` only when configured. The token expires
24 hours after signup and is kept in the browser tab's `sessionStorage`, with
no email, phone or token in the URL. The success page sends
`POST /api/providers/quick-signup/app-click` with `{token, platform, eventId}`.
Platforms are `android` and `ios`; event IDs are UUID v4. Responses are 200
(`recorded` or `duplicate`), 400 (invalid body), 401 (invalid/expired token),
404 (deleted/missing provider), or 500 (database failure).

The Firestore transaction updates `providers/{uid}.appDownloadClicks` with
`count`, `firstClickedAt`, and `lastClickedAt` per platform, and creates
`providers/{uid}/appDownloadClickEvents/{eventId}` for deduplication. These
events contain only the platform and server timestamp. Preserve these events
when cleaning data to maintain deduplication for any still-valid tokens.

Admin/support sees both platforms in the provider detail page through the
existing admin callable serializer. These are button clicks, not confirmed
downloads or installations. Tracking only covers the quick-signup success
page and the same tab within the token lifetime. Existing accounts have no
historical data; a direct visit without a stored token is unattributed.

Validate locally with the token, click-route, client, onboarding and admin
rendering tests, TypeScript and targeted ESLint. Production acceptance requires
deploying Next.js with the secret, signing up through the live page, pressing
each button and checking that provider's admin detail. Do not deploy local
temporary Firestore rules as part of this feature. No Firebase Functions
change or deployment is required by this implementation.
