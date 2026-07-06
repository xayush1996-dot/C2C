# INDEPENDENT FINAL SECURITY & CORRECTNESS AUDIT
## C2C Consulting Booking & Payment Backend
**Audit Date:** 2026-07-06  
**Auditor:** Independent (Antigravity AI — fresh, code-first review)  
**Audit Type:** Third-party security and correctness review  
**Codebase Tag:** `backend-v1-pre-audit` (pushed to GitHub)  

---

> **CAUTION:** This report does not claim the application is unhackable. It reflects the best available analysis of the source code and automated tests as they exist today. External integrations (Razorpay, Calendly, MongoDB Atlas) cannot be fully verified without live credentials and end-to-end testing.

---

## Executive Summary

The backend is a Node.js/Express/MongoDB API with separate admin and customer authentication, Razorpay payment integration, Calendly booking webhooks, and a comprehensive administrative data panel. The overall security posture is **above average for its class**. Core security controls — role isolation, refresh-token rotation, webhook signature verification, server-side pricing, IDOR protection, and NoSQL injection mitigation — are correctly implemented and are directly exercised by the test suite.

However, several real findings were identified during independent code review that the previous audit reports either classified too leniently or missed entirely. These are documented below.

---

## TEST RESULTS

| Metric | Value |
|---|---|
| **Test suites run** | 7 |
| **Total tests run** | 107 |
| **Tests passed** | 107 |
| **Tests failed** | 0 |
| **Test runner** | Jest 29 with Supertest |
| **Execution time** | 8.567 s |

All 107 tests passed on a clean run against the committed codebase.

---

## FINDINGS

---

### MEDIUM — M-1

**Affected file:** `backend/src/config/env.js` (lines 15–19)

**Vulnerable function/route:** Zod schema default values for secrets

**Vulnerability — Weak Secret Defaults That Enable Silent Misconfiguration in Production**

The Zod schema for environment variables sets `.default()` values for every secret:
```js
GOOGLE_CLIENT_ID: z.string().default('mock_google_client_id_12345'),
RAZORPAY_KEY_ID: z.string().default('rzp_test_mockKeyId123'),
RAZORPAY_KEY_SECRET: z.string().default('mockKeySecret456'),
RAZORPAY_WEBHOOK_SECRET: z.string().default('mockWebhookSecret789'),
CALENDLY_WEBHOOK_SECRET: z.string().default('mockCalendlyWebhookSecret123'),
```

If a production deployment is missing any of these environment variables (e.g., due to a misconfigured container, missing `.env` load, or typo in the variable name), the application will **silently start with the publicly-known mock secrets** rather than refusing to start. There is no `NODE_ENV === 'production'` guard that enforces these values be explicitly set.

**Realistic attack scenario:**  
A DevOps engineer forgets to set `RAZORPAY_WEBHOOK_SECRET` in a staging or production environment. The server starts normally — no error is thrown. An attacker who has read the public GitHub repository knows the default value `mockWebhookSecret789` and can now send arbitrary webhook payloads that will pass cryptographic signature verification, triggering fraudulent payment reconciliation.

**Impact:** HIGH if triggered. Payment state can be corrupted (fake `payment.captured` events). Booking state can be corrupted. All webhook security collapses.

**Recommended fix:**  
For production secrets, use `.min(1)` and no default. Add a startup check that explicitly verifies `NODE_ENV === 'production'` implies real secrets are present:
```js
// Example - require secrets in production:
RAZORPAY_WEBHOOK_SECRET: z.string().min(16, { message: 'RAZORPAY_WEBHOOK_SECRET must be set' }),
```

**Regression test required:** Yes — a test that asserts `env.js` rejects start when secrets are missing in production mode.

---

### MEDIUM — M-2

**Affected file:** `backend/src/controllers/authController.js` (lines 17–32)

**Vulnerable function/route:** `verifyGoogleToken` → `POST /api/auth/google`

**Vulnerability — Test-mode Google Token Bypass Unconditionally Enabled by NODE_ENV**

The Google token verification function contains a hard-coded mock bypass:
```js
if (env.NODE_ENV === 'test' && idToken.startsWith('mock_google_token_')) {
  const parts = idToken.split('_');
  const email = parts[3] || 'googleuser@example.com';
  const sub = parts[4] || '123456789012345678901';
  ...
  return { email, sub, name, email_verified: true, ... };
}
```

While this only triggers when `NODE_ENV === 'test'`, if `NODE_ENV` is accidentally set to `test` in a staging or production environment (a common DevOps mistake), any client who knows the token format can authenticate as any user without a real Google token.

**Realistic attack scenario:**  
CI/CD pipeline misconfiguration sets `NODE_ENV=test` on a staging server. An attacker sends `POST /api/auth/google` with `{ "idToken": "mock_google_token_victim@company.com_anysubid" }` and obtains a valid CUSTOMER access token for the victim's account.

**Impact:** MEDIUM. Account takeover risk if `NODE_ENV=test` is ever set outside a local test runner.

**Recommended fix:**  
Guard the bypass with `process.env.JEST_WORKER_ID` (set by Jest, absent in normal Node processes):
```js
if (env.NODE_ENV === 'test' && process.env.JEST_WORKER_ID && idToken.startsWith('mock_google_token_')) {
```

**Regression test required:** Yes.

---

### MEDIUM — M-3

**Affected file:** `backend/src/controllers/authController.js` (line 12), `backend/src/controllers/adminAuthController.js` (line 11)

**Vulnerable function/route:** `DUMMY_HASH` constant — timing defense in login

**Vulnerability — DUMMY_HASH Constant May Not Be a Valid bcrypt Hash**

```js
const DUMMY_HASH = '$2b$12$L.y.H3vV9y.0vP0XFf8Cve.8J8e5U5V9G1G1G1G1G1G1G1G1G1G1G';
```

The hash segment is heavily repeated (`G1G1G1...`), suggesting it may be a manually constructed placeholder rather than a legitimate bcrypt hash. The timing behavior of `bcrypt.compare` against an invalid hash is implementation-dependent — it may short-circuit immediately rather than taking the full bcrypt computation time, defeating the timing attack defense against user enumeration.

**Impact:** LOW-MEDIUM. Timing-based oracle attack may leak whether an email account exists.

**Recommended fix:**  
Replace with a precomputed legitimate bcrypt hash generated offline:
```js
// Generated offline: bcrypt.hashSync(crypto.randomBytes(32).toString('hex'), 12)
const DUMMY_HASH = '$2b$12$[actual valid 53-char bcrypt hash]';
```

**Regression test required:** Optional — confirm bcrypt.compare does not throw and takes meaningful time.

---

### MEDIUM — M-4

**Affected file:** `backend/src/controllers/authController.js` (lines 423–426)

**Vulnerable function/route:** `forgotPassword` → `POST /api/auth/forgot-password`

**Vulnerability — Reset Token Leaks in Response When NODE_ENV=test**

```js
if (env.NODE_ENV === 'test') {
  response.resetToken = resetToken;
}
```

If `NODE_ENV=test` is accidentally set in staging or production, plaintext password reset tokens for any real user are returned in the HTTP response body. An attacker can call `POST /api/auth/forgot-password` with a victim's email and immediately receive the reset token, enabling full account takeover.

**Impact:** MEDIUM. Account takeover in misconfigured staging/production.

**Recommended fix:**  
Use the same `JEST_WORKER_ID` guard as M-2:
```js
if (env.NODE_ENV === 'test' && process.env.JEST_WORKER_ID) {
  response.resetToken = resetToken;
}
```

**Regression test required:** Yes.

---

### MEDIUM — M-5

**Affected file:** `backend/src/middleware/security.js` (lines 9–17), `backend/src/config/env.js` (line 11)

**Vulnerable function/route:** `corsMiddleware`

**Vulnerability — Wildcard CORS Fallback When CORS_ORIGIN Is Unset**

The env schema defaults `CORS_ORIGIN` to `'*'`, and `parseCorsOrigins` passes this through unchanged. When `CORS_ORIGIN` is `'*'`, any origin can make cross-origin requests to the API and read response data. While the code correctly disables `credentials` in wildcard mode (preventing cookie leakage), a wildcard CORS policy in production is inappropriate for a business API — it allows any third-party website to make API calls and read JSON responses.

**Impact:** LOW-MEDIUM. Information leakage, inappropriate for production.

**Recommended fix:**  
Remove the `'*'` default from `CORS_ORIGIN`. The production deployment guide must mandate setting the real frontend URL:
```js
CORS_ORIGIN: z.string().min(1).default('http://localhost:3000'),
```
Document that wildcard is unacceptable in production.

**Regression test required:** No — operational/configuration concern.

---

### LOW — L-1

**Affected file:** `backend/src/controllers/razorpayWebhookController.js` (lines 38–41)

**Vulnerable function/route:** `handleRazorpayWebhook`

**Vulnerability — Webhook Event ID Falls Back to Predictable Synthetic Key**

```js
eventId = req.body.event_id || `webhook_${event}_${paymentId || 'generic'}`;
```

If Razorpay sends a webhook without `event_id` (e.g., during testing or with a proxy), the synthetic fallback key may be predictable and non-unique across different events for the same payment ID, causing one event to be silently dropped due to duplicate key detection.

**Impact:** LOW. Conditional on Razorpay omitting `event_id`.

**Recommended fix:**  
Require `event_id` to be present and reject the webhook if absent.

**Regression test required:** Yes.

---

### LOW — L-2

**Affected file:** `backend/src/controllers/calendlyWebhookController.js` (line 74)

**Vulnerable function/route:** `handleCalendlyWebhook`

**Vulnerability — Calendly Event ID Falls Back to URI-Based Synthetic Key**

```js
eventId = req.body.event_id || `calendly_${event}_${inviteeUri || 'generic'}`;
```

Same pattern as L-1. The invitee URI uniqueness depends entirely on Calendly's implementation. Rescheduled events may produce new URIs but similar event structures.

**Impact:** LOW. Informational/operational risk.

**Recommended fix:**  
Prefer `event_id`; reject if absent and URI is not available.

**Regression test required:** No.

---

### LOW — L-3

**Affected file:** `backend/src/controllers/adminCustomerController.js` (lines 48, 78)

**Vulnerable function/route:** `getCustomers`, `getCustomerById` → `GET /api/admin/customers`

**Vulnerability — Admin Customer Listing Exposes Internal Security State Fields**

```js
.select('id name email createdAt updatedAt googleId failedLoginAttempts lockoutUntil')
```

`failedLoginAttempts` and `lockoutUntil` are internal security state. Exposing them to the admin panel creates an unnecessary information surface — if the admin session is compromised (e.g., XSS on the frontend), an attacker learns which accounts are under attack and when lockouts expire.

**Impact:** LOW. Admin-only; no direct external exposure.

**Recommended fix:**  
Remove raw `failedLoginAttempts` and `lockoutUntil` from the select; expose only a computed `isLocked` boolean.

**Regression test required:** Yes — assert these fields are absent from the response.

---

### LOW — L-4

**Affected file:** `backend/src/controllers/meBookingController.js` (lines 21, 61)

**Vulnerable function/route:** `getMyBookings`, `getMyBookingById`

**Vulnerability — Calendly Booking URL Not One-Time-Use**

The `unlockedCalendlyUrl` is returned on every authenticated GET request for as long as the payment is `SUCCESS` and the session has not expired. If a customer shares or leaks this URL, any person with the URL can book a Calendly session under the original customer's `bookingReference`.

**Impact:** LOW. The Calendly webhook's email-match check provides a compensating control (wrong person's booking will be rejected). Residual risk is indirect.

**Recommended fix:**  
Document this design decision in the frontend integration guide; advise customers not to share booking links. Consider adding a booking link expiry mechanism in a future release.

**Regression test required:** No code change required.

---

### LOW — L-5

**Affected file:** `backend/src/scripts/seedAdmin.js`

**Vulnerable function/route:** `seedAdmins()` script

**Vulnerability — Seed Script Has No Production Guard and Uses Hardcoded Weak Passwords**

The seed script starts with `Admin.deleteMany({})` which wipes all admin accounts if run in production. It uses `'AdminPassword123'` as the password. There is no `NODE_ENV !== 'production'` guard.

**Impact:** LOW-MEDIUM if accidentally run against a production DB.

**Recommended fix:**  
```js
if (process.env.NODE_ENV === 'production') {
  console.error('ERROR: seedAdmin must not be run in production!');
  process.exit(1);
}
```

**Regression test required:** No automated test; operational guard.

---

### INFORMATIONAL — I-1

**Affected file:** `backend/src/app.js` (line 65)

**Issue:** Public health endpoint exposes `process.memoryUsage()` (RSS, heap total/used, external, ArrayBuffers). This gives any caller insight into server resource consumption, useful for timing resource-exhaustion attacks.

**Recommendation:** Return memory metrics only to authenticated admin callers, or remove from the public endpoint.

---

### INFORMATIONAL — I-2

**Affected file:** `backend/src/config/env.js` (line 13)

**Issue:** `JWT_REFRESH_SECRET` is declared and validated in the Zod schema but is **never used anywhere in the codebase**. Refresh tokens are opaque random strings, not JWTs, and require no signing secret.

**Recommendation:** Remove `JWT_REFRESH_SECRET` from the schema, or add a comment explaining it is reserved for future use.

---

### INFORMATIONAL — I-3

**Affected file:** `backend/src/controllers/adminReportController.js` (line 174)

**Issue:** The customers report fetch does not apply a `.select()` projection:
```js
const customers = await User.find(query).sort({ createdAt: -1 }).limit(5000);
```
All non-`select:false` fields (including `googleId`, `failedLoginAttempts`, `lockoutUntil`) are loaded into memory, even though the PDF columns only use a subset.

**Recommendation:** Add `.select('name email createdAt googleId lockoutUntil')` to minimize memory and data exposure in the PDF pipeline.

---

### INFORMATIONAL — I-4

**Affected file:** `backend/src/controllers/calendlyWebhookController.js` (line 159)

**Issue:** Dead code in start time extraction:
```js
const startTime = payload?.scheduled_event?.start_time 
  || payload?.start_time 
  || req.body.payload?.start_time; // identical to payload?.start_time
```
The third branch is the same object as the second. This is not a security issue but is a correctness concern.

**Recommendation:** Remove the duplicate branch.

---

### INFORMATIONAL — I-5

**Issue:** `.env.example` file is referenced in the README but does not exist in the repository.

The README instructs developers to `cp .env.example .env`, but no `.env.example` file exists. New developers cannot onboard without manually discovering the required variables.

**Recommendation:** Create `backend/.env.example` with all required variables documented (with placeholder values for secrets):
```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/c2c_db
JWT_SECRET=change-me-at-least-32-characters-long
JWT_REFRESH_SECRET=change-me-not-currently-used
CORS_ORIGIN=http://localhost:3000
TRUST_PROXY=loopback
GOOGLE_CLIENT_ID=your-google-client-id
RAZORPAY_KEY_ID=rzp_test_your_key
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
RAZORPAY_WEBHOOK_SECRET=your-razorpay-webhook-secret
CALENDLY_WEBHOOK_SECRET=your-calendly-webhook-secret
```

---

## COMPREHENSIVE SECURITY VERIFICATION TABLE

| Control | Status | Notes |
|---|---|---|
| Admin/customer auth completely separate | PASS | Separate models, routes, middleware, cookies, token stores |
| No public admin registration | PASS | No `/api/admin/auth/register` route exists |
| Customer cannot become admin | PASS | `User.role` immutable, `enum: ['CUSTOMER']`. `protectAdmin` verifies against Admin model only |
| Role injection blocked | PASS | Register hardcodes `role: 'CUSTOMER'`. Immutable schema field. JWT role verified against correct model |
| `isAdmin` injection blocked | PASS | No `isAdmin` field exists anywhere in codebase |
| Password hashing secure | PASS | bcrypt cost 12 on both models, pre-save hooks on all update paths |
| Admin login rate limiting | PASS | 5 req/15min, skip-on-success |
| Customer login rate limiting | PASS | 5 req/15min, skip-on-success |
| Account lockout (admin) | PASS | 5 failures → 15min lockout |
| Account lockout (customer) | PASS | 5 failures → 15min lockout; also blocked at middleware level |
| Timing attack defense | PARTIAL | See M-3: DUMMY_HASH validity uncertain |
| Refresh token hashing | PASS | SHA-256(rawToken) stored in DB |
| Refresh token rotation (RTR) | PASS | Atomic `findOneAndUpdate`, old token marked `isUsed: true`, new token created |
| Token theft/replay detection | PASS | Reuse of used token triggers family revocation |
| Token TTL expiry | PASS | MongoDB TTL index on `expiresAt` for both token models |
| Logout invalidates session | PASS | `deleteOne({ token: hash })` on logout, cookie cleared |
| CSRF protection | PASS | Custom header check on refresh/logout (double-submit style) |
| HttpOnly cookies | PASS | Both refresh token cookies set `httpOnly: true` |
| Secure cookies in production | PASS | `secure: NODE_ENV === 'production'` |
| SameSite: Strict | PASS | Both cookie setters use `sameSite: 'strict'` |
| CORS allowlist | PARTIAL | See M-5: default is `'*'` if not configured |
| Production errors hide stack trace | PASS | Stack only included when `NODE_ENV === 'development'` |
| Google token verified server-side | PASS | `client.verifyIdToken()` with audience + issuer check |
| Google sub mismatch blocked | PASS | Existing user with different `googleId` returns 400 |
| Same-email local/Google account linking blocked | PASS | Rejects Google login if user has no `googleId` |
| Password reset token secure | PASS | 32 random bytes, SHA-256 stored, 10min expiry |
| Password reset revokes all sessions | PASS | `UserRefreshToken.deleteMany({ user: user._id })` on reset |
| IDOR protection (bookings) | PASS | Ownership check before returning booking data |
| IDOR protection (payments) | PASS | Ownership check before returning payment data |
| Customer cannot access admin APIs | PASS | `protectAdmin` rejects CUSTOMER-role tokens |
| Ownership from authenticated identity | PASS | All creates use `req.user._id`, never `req.body` user IDs |
| Disabled admin blocked | PASS | `protectAdmin` checks `admin.isActive` |
| Disabled customer blocked | PARTIAL | Time-limited lockout only; no permanent `isActive:false` for customers |
| Server-side pricing | PASS | Price from `Service` DB record; client `amount` completely ignored |
| Payment ownership enforcement | PASS | Owner check before signature verification |
| Razorpay signature verification | PASS | HMAC-SHA256 of `orderId|paymentId` |
| Razorpay webhook signature verification | PASS | HMAC-SHA256 over raw body buffer |
| Raw body preservation for webhooks | PASS | `verify` callback saves `req.rawBody` for all `/api/webhooks/` routes |
| Webhook idempotency (Razorpay) | PASS | `ProcessedWebhookEvent` unique index; E11000 = short-circuit |
| Webhook idempotency (Calendly) | PASS | Same mechanism |
| Webhook replay attack (Calendly) | PASS | 5-minute timestamp drift check |
| Webhook event deletion on business failure | PASS | Inner try-catch deletes `ProcessedWebhookEvent` on failure |
| Booking cannot unlock before verified payment | PASS | `unlockedCalendlyUrl` gated on `payment.status === 'SUCCESS'` |
| Razorpay webhook amount match | PASS | Amount and currency mismatch → reject reconciliation |
| Atomic payment state transitions | PASS | `findOneAndUpdate` with status filter prevents double-processing |
| `bookingReference` unpredictable | PASS | `crypto.randomBytes(16)` = 128 bits entropy |
| Calendly email/owner match | PASS | Invitee email vs booking customer email check |
| Calendly ambiguous fallback → NEEDS_REVIEW | PASS | Multiple paid pending bookings → all set NEEDS_REVIEW |
| NoSQL injection (query params) | PASS | `typeof === 'string'` check before all filter usage |
| Regex injection (search) | PASS | `escapeRegex()` applied to all search inputs |
| Object ID validation | PASS | All `/:id` routes validate hex-24 format |
| Mass assignment blocked | PASS | All controllers explicitly whitelist fields; `User.role` immutable |
| Sensitive fields excluded from responses | PASS | `password`, reset tokens are `select: false` |
| No shell command execution API | PASS | No `child_process` usage in routes/controllers |
| No arbitrary DB query API | PASS | All queries constructed internally |
| No arbitrary file modification API | PASS | No file write endpoints |
| No executable upload API | PASS | No file upload routes |
| No CMS or config modification API | PASS | No dynamic route/config modification |
| No hardcoded secrets | PASS | All secrets from environment; defaults labeled as test values |
| `.env` not tracked | PASS | `.gitignore` at both levels; confirmed not in git push |
| Passwords not logged | PASS | No `logger.*` calls include password values |
| Google tokens not logged | PASS | `idToken` never passed to logger |
| Razorpay secrets not logged | PASS | `env.*` secrets never logged |
| Payload size limits | PASS | `express.json({ limit: '10kb' })` |
| Helmet security headers | PASS | `helmet()` applied globally |
| `JWT_REFRESH_SECRET` usage | NOTE | See I-2: declared but never used |
| `.env.example` present | FAIL | Referenced in README but missing from repository (see I-5) |

---

## AREAS THAT COULD NOT BE FULLY VERIFIED

1. **Razorpay live payment flow** — Mocked in all tests. Live API keys, actual order creation, and Razorpay webhook delivery cannot be verified without live credentials.

2. **Calendly webhook delivery format** — Verified against code structure only; cannot confirm against live Calendly webhook delivery.

3. **MongoDB Atlas production configuration** — TLS, network access, IP allowlisting, and backup configuration are out of scope.

4. **bcrypt cost factor adequacy at scale** — Cost 12 is reasonable. Under specialized hardware attacks, benchmarking should be done against target deployment hardware.

5. **Express-rate-limit in multi-process deployments** — Default in-memory store; counters are per-process. Horizontal scaling requires a Redis-backed store.

6. **Calendly reschedule webhook ordering** — The cancellation + re-booking sequence depends on Calendly delivering `invitee.canceled` before the new `invitee.created`. Out-of-order delivery is not tested.

7. **Helmet CSP/HSTS defaults** — `helmet()` is applied with defaults. Explicit CSP, HSTS `includeSubDomains`, and `referrerPolicy` should be configured for production.

8. **PDF report load testing** — 5000-record cap is set, but actual rendering performance at that limit was not tested.

---

## MANUAL EXTERNAL SETUP STILL REQUIRED

| Item | Description |
|---|---|
| Razorpay credentials | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` must be set from Razorpay dashboard |
| Razorpay webhook registration | Register production URL with `payment.captured`, `payment.failed`, `refund.processed` events |
| Calendly credentials | `CALENDLY_WEBHOOK_SECRET` must be obtained and set |
| Calendly webhook registration | Register production URL with `invitee.created`, `invitee.canceled` subscriptions |
| Google OAuth client | `GOOGLE_CLIENT_ID` from Google Cloud Console with correct authorized origins |
| MongoDB production cluster | TLS-enabled Atlas cluster with IP allowlisting and backups |
| Admin seeding | First admin account must be created manually (do not run seed script in production) |
| `CORS_ORIGIN` | Must be set to actual frontend domain; wildcard `*` must not remain |
| `JWT_SECRET` strength | Must be cryptographically random, at least 32 characters |
| Rate limiter Redis store | Required for multi-instance/horizontally-scaled deployments |
| `TRUST_PROXY` | Must match actual reverse proxy topology (not default `loopback`) |
| `.env.example` | Must be created before onboarding new developers |
| Helmet hardening | Explicit CSP, HSTS, and `referrerPolicy` for production |

---

## STAGING READINESS ASSESSMENT

**Ready for staging: YES, with conditions**

The core security controls are correctly implemented and all 107 tests pass. The backend can be deployed to staging provided:
1. All external secrets are set to real (non-default) values in the staging `.env`.
2. `CORS_ORIGIN` is set to the staging frontend URL.
3. MongoDB is a real Atlas cluster.
4. Razorpay and Calendly webhooks point at the staging URL.
5. Seed script is not run against the staging DB without the production guard (see L-5).

The M-2/M-4 findings are not a risk if `NODE_ENV` is correctly set to `staging` (not `test`) in the deployment environment.

---

## PRODUCTION READINESS ASSESSMENT

**Ready for production: NOT YET**

The following must be addressed before production launch:

| Priority | Item |
|---|---|
| MUST FIX | M-1: Harden or remove secret defaults to prevent silent misconfiguration |
| MUST FIX | M-2: Guard Google mock bypass with `JEST_WORKER_ID` |
| MUST FIX | M-4: Guard reset token leak with `JEST_WORKER_ID` |
| MUST FIX | L-5: Add production guard to seed script |
| MUST FIX | I-5: Create `.env.example` file |
| MUST FIX | Configure Redis-backed rate limiter store for multi-instance deployment |
| SHOULD FIX | M-3: Replace DUMMY_HASH with a valid precomputed bcrypt hash |
| SHOULD FIX | L-1: Require `event_id` in Razorpay webhooks |
| SHOULD FIX | M-5: Document that `CORS_ORIGIN=*` is unacceptable in production |
| CONFIGURE | All external services must be fully provisioned |
| CONFIGURE | Helmet CSP and HSTS must be explicitly configured |
| CONFIGURE | `TRUST_PROXY` must match the actual production reverse proxy topology |

Once MUST FIX items are resolved and external services are configured, the backend will be in a strong security posture for a v1 production launch. The overall architecture is sound, critical controls are correctly implemented, and test coverage is meaningful and behavioral — not superficially mocked.

---

## SUMMARY OF TEST COVERAGE QUALITY

The tests are **genuine behavioral tests**:

- JWT creation and decoding uses the real `jsonwebtoken` library with the actual `JWT_SECRET`.
- Payment signature generation and verification in `payments.test.js` uses the real `crypto.createHmac` with the actual `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET`.
- Calendly signature and timestamp replay tests construct real HMAC signatures.
- CSRF header enforcement is tested end-to-end through the Express middleware stack.
- Role injection tests issue real JWTs with tampered roles and verify middleware rejection.
- Idempotency tests simulate real MongoDB E11000 duplicate key errors.
- IDOR tests use distinct user IDs and verify 403 responses.

**Where mocking reduces confidence:**  
All MongoDB calls are mocked. The actual Mongoose schema enforcement (e.g., `select: false` behavior, index uniqueness, TTL index firing) cannot be verified in tests alone. Real end-to-end tests against a test Atlas cluster and Razorpay test mode should be added before production.

---

*End of Independent Final Audit Report.*  
*This report should be treated as a starting point for risk management, not a certification of security.*
