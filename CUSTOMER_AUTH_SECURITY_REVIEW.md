# Customer Authentication Security Review (Phase 3)

**Document Version:** 1.0  
**Date:** July 6, 2026  
**Scope:** Complete Customer Authentication System (`/api/auth/*` endpoints, models, middlewares, and security controls)  
**Status:** Independent Security Review (No Code Modifications Performed)

---

## 1. Executive Summary

An independent security review was conducted on the Customer Authentication System implemented in Phase 3. The architecture demonstrates adherence to modern web security best practices, featuring strong separation of privilege between customer and administrator entities, cryptographically secure Refresh Token Rotation (RTR) with automatic family revocation upon theft detection, server-side Google ID token validation, and defense-in-depth against CSRF and brute-force attacks.

During the review, **0 CRITICAL** and **0 HIGH** severity vulnerabilities were identified. Two **MEDIUM** severity findings related to missing password minimum length enforcement and missing verification of the OIDC `email_verified` claim were noted, alongside several **LOW / INFORMATIONAL** findings and accepted architectural trade-offs.

---

## 2. Specific Security Verification Tests

As requested, targeted verifications and code audits were performed against eight critical threat vectors:

| Threat Vector / Scenario | Audit Result | Technical Justification & Implementation Verification |
| :--- | :--- | :--- |
| **Can a customer become an admin?** | **SECURE** | In [User.js](file:///e:/c2c%20backend%20work/backend/src/models/User.js#L22-L28), the `role` attribute is restricted by `enum: ['CUSTOMER']`, defaults to `'CUSTOMER'`, and is marked `immutable: true`. During registration and Google login in [authController.js](file:///e:/c2c%20backend%20work/backend/src/controllers/authController.js#L98), `role: 'CUSTOMER'` is explicitly passed to `User.create()`. Access token generation hardcodes `role: 'CUSTOMER'` into the JWT payload. |
| **Can a customer submit `isAdmin=true`?** | **SECURE** | The `User` Mongoose schema does not define an `isAdmin` property. By default, Mongoose operates in strict mode (`strict: true`), silently stripping any undefined fields injected into `req.body` during document creation or updates. Furthermore, no middleware or authorization check in the codebase inspects an `isAdmin` flag on customer records. |
| **Can a customer submit `role=ADMIN`?** | **SECURE** | Attempted role injection via `req.body` during `POST /api/auth/register` is explicitly overridden by `role: 'CUSTOMER'` in the controller ([authController.js:L98](file:///e:/c2c%20backend%20work/backend/src/controllers/authController.js#L98)). Even if attempted during a database update, Mongoose rejects changes to immutable properties (`immutable: true`). |
| **Can a customer access admin routes?** | **SECURE** | Admin routes are protected by `protectAdmin` ([auth.js:L7-L47](file:///e:/c2c%20backend%20work/backend/src/middleware/auth.js#L7-L47)), which validates that `decoded.role === 'ADMIN'` (rejecting customer JWTs with `403 Forbidden`). Additionally, it queries the `Admin` MongoDB collection via `Admin.findById(decoded.id)`. Since customers reside entirely in the `User` collection, cross-model lookup fails with `401 Unauthorized`. |
| **Can a customer use fake Google identity data?** | **SECURE** | In [authController.js:L17-L52](file:///e:/c2c%20backend%20work/backend/src/controllers/authController.js#L17-L52), Google ID tokens are cryptographically verified server-side using Google's official `google-auth-library` (`client.verifyIdToken`), validating the RSA signature against Google's public certificates, audience (`aud`) against `env.GOOGLE_CLIENT_ID`, expiration (`exp`), and issuer (`iss`). User attributes (`email`, `sub`, `name`) are extracted strictly from the validated token payload; any identity fields sent separately in `req.body` are ignored. |
| **Can a customer take over an existing account?** | **SECURE** | **No Silent Linking Policy:** In [authController.js:L231-L234](file:///e:/c2c%20backend%20work/backend/src/controllers/authController.js#L231-L234), if a customer attempts Google login with an email already registered via local password login (`!user.googleId`), authentication is rejected with a `400 Bad Request`. Conversely, if a Google account exists, attempting password registration returns `'Email already registered'`. **IDOR:** All protected endpoints (`/me`, `/logout`, `/refresh`) operate strictly on the authenticated user ID extracted from server-validated JWTs or HttpOnly cookies; no user IDs are accepted as request parameters. |
| **Can a customer replay a refresh token?** | **SECURE** | Refresh Token Rotation (RTR) is enforced in [authController.js:L293-L313](file:///e:/c2c%20backend%20work/backend/src/controllers/authController.js#L293-L313). Tokens are atomically consumed via `findOneAndUpdate({ token, isUsed: false }, { $set: { isUsed: true } })`, preventing TOCTOU race conditions. If an already-used token is presented, the system detects theft/replay and immediately revokes the entire token family (`UserRefreshToken.deleteMany({ familyId })`) and clears the cookie. |
| **Can a customer reset another account's password?** | **SECURE** | Password reset tokens are 256-bit cryptographically random hex strings (`crypto.randomBytes(32)`), stored exclusively as SHA-256 hashes in MongoDB with a strict 10-minute expiration ([authController.js:L410-L416](file:///e:/c2c%20backend%20work/backend/src/controllers/authController.js#L410-L416)). Guessing a valid token within 10 minutes is computationally infeasible ($2^{256}$ entropy). Upon successful reset, the token is invalidated and all active sessions (`UserRefreshToken.deleteMany({ user: user._id })`) are revoked immediately. |

---

## 3. Detailed Findings & Recommendations

### CRITICAL Severity Findings
*No Critical severity vulnerabilities were identified.*

---

### HIGH Severity Findings
*No High severity vulnerabilities were identified.*

---

### MEDIUM Severity Findings

#### 1. Missing Password Complexity and Minimum Length Enforcement
* **Affected File(s):** [User.js](file:///e:/c2c%20backend%20work/backend/src/models/User.js#L13-L16), [authController.js](file:///e:/c2c%20backend%20work/backend/src/controllers/authController.js#L77-L132) (`register` and `resetPassword` controllers)
* **Vulnerability:** Neither the Mongoose `User` schema nor the authentication controller enforces minimum length or complexity rules on customer passwords.
* **Attack Scenario:** A customer registers or resets their password using a trivial 1-character string (e.g., `"1"` or `"a"`). An attacker targeting customer accounts could execute credential stuffing or offline dictionary attacks (in the event of a database hash disclosure) and trivially crack weak passwords.
* **Exact Recommended Fix:** Add a minimum length validator to the `password` field definition in `User.js` and enforce validation prior to user creation or password updates:
  ```javascript
  // In src/models/User.js
  password: {
    type: String,
    select: false,
    minlength: [8, 'Password must be at least 8 characters long']
  }
  ```
  Alternatively, explicitly validate password length in `authController.js` during `/register` and `/reset-password`:
  ```javascript
  if (password.length < 8) {
    return next(new AppError('Password must be at least 8 characters long', 400));
  }
  ```

#### 2. Missing Verification of `email_verified` Claim in Google OAuth Token Payload
* **Affected File(s):** [authController.js](file:///e:/c2c%20backend%20work/backend/src/controllers/authController.js#L47-L52) (`verifyGoogleToken` and `google` controller)
* **Vulnerability:** When verifying a Google ID token via `client.verifyIdToken()`, the server extracts `email`, `sub`, and `name` without explicitly asserting that the OIDC claim `email_verified` is `true`.
* **Attack Scenario:** While standard consumer Gmail accounts are verified by default, certain federated identity setups or custom domain integrations in Google Cloud Identity / Workspace may issue ID tokens where `email_verified` is `false` or unverified. An attacker utilizing an unverified email address from a custom identity provider could potentially register or authenticate under an email address they do not legitimately own or control.
* **Exact Recommended Fix:** In `verifyGoogleToken` ([authController.js:L47](file:///e:/c2c%20backend%20work/backend/src/controllers/authController.js#L47)), explicitly check the verification status before returning the payload:
  ```javascript
  const payload = ticket.getPayload();
  
  if (payload.email_verified !== true) {
    throw new AppError('Google account email address is not verified', 400);
  }
  ```

---

### LOW Severity Findings & Accepted Risks

#### 1. Account Enumeration via Timing Attack on Forgot Password Endpoint (LOW)
* **Affected File(s):** [authController.js](file:///e:/c2c%20backend%20work/backend/src/controllers/authController.js#L388-L432) (`forgotPassword` controller)
* **Vulnerability:** When a request is submitted to `POST /api/auth/forgot-password`, if the candidate email exists in the database, the server generates random bytes, computes a SHA-256 hash, and executes an asynchronous database write (`await user.save()`), taking approximately 20–50ms. If the email does not exist, the server returns immediately without performing cryptographic hashing or database writes (~1–2ms).
* **Attack Scenario:** An attacker sending high-precision timed requests to `/api/auth/forgot-password` can observe response latency differences to enumerate valid customer email addresses registered on the platform.
* **Exact Recommended Fix:** When `!user` evaluates to true, execute a dummy SHA-256 hash calculation and a simulated delay (or dummy database read) to equalize response latency across existent and non-existent accounts:
  ```javascript
  if (!user) {
    // Perform dummy hashing to equalize CPU timing
    crypto.createHash('sha256').update('dummy_token_string_for_timing_defense').digest('hex');
    return res.status(200).json({
      success: true,
      message: genericSuccessMessage
    });
  }
  ```

#### 2. Missing Dedicated Rate Limiter on Reset Password Endpoint (LOW)
* **Affected File(s):** [authRoutes.js](file:///e:/c2c%20backend%20work/backend/src/routes/authRoutes.js#L28)
* **Vulnerability:** While `/forgot-password` is protected by `forgotPasswordRateLimiter` (max 3 requests per 15 minutes), the token submission route `/reset-password` only applies `csrfProtect` without an IP-based rate limiting middleware.
* **Attack Scenario:** Although guessing a 256-bit random hex token within a 10-minute window is mathematically infeasible ($2^{256}$ entropy), lacking rate limits on authentication-sensitive endpoints allows automated flooding or high-frequency submission attempts.
* **Exact Recommended Fix:** Apply a dedicated rate limiter (e.g., max 10 requests per 15 minutes per IP) to the reset password route in `authRoutes.js`:
  ```javascript
  router.post('/reset-password', customerLoginRateLimiter, csrfProtect, resetPassword);
  ```

#### 3. Stateless Access Token Validity Post-Logout or Post-Password Reset (Accepted Risk / Informational)
* **Affected File(s):** [authController.js](file:///e:/c2c%20backend%20work/backend/src/controllers/authController.js#L352-L374) (`logout` and `resetPassword` controllers)
* **Vulnerability:** When a customer logs out or resets their password, all active refresh tokens in MongoDB are immediately deleted/revoked. However, any previously issued JWT access token remains valid until its natural expiration because JWTs are stateless and verified via signature alone without a database blacklist lookup.
* **Attack Scenario:** If an attacker intercepts an active access token and the legitimate user discovers the compromise and logs out or resets their password, the attacker can continue utilizing the stolen access token for the remainder of its lifespan (up to 15 minutes).
* **Architectural Justification:** This is an **Accepted Risk** in stateless JWT architectures designed to prevent the database/Redis memory overhead of querying a token blacklist on every protected API request. The short 15-minute access token lifespan significantly restricts the window of vulnerability while maintaining high API throughput and stateless scalability.

#### 4. Account Enumeration via Registration Endpoint (Informational / UX Trade-off)
* **Affected File(s):** [authController.js](file:///e:/c2c%20backend%20work/backend/src/controllers/authController.js#L88-L91) (`register` controller)
* **Vulnerability:** Attempting to register with an email address already present in the database returns a `400 Bad Request` with the message `'Email already registered'`.
* **Attack Scenario:** An attacker can query `/api/auth/register` with candidate email addresses to enumerate registered users on the platform.
* **Architectural Justification:** In B2C web applications, returning "Email already registered" is standard user experience (UX) so legitimate users know to navigate to the login screen rather than attempting registration repeatedly. If strict privacy against enumeration is required in future phases, registration could be refactored to return a generic message and send an activation/login link via email.

---

## 4. Review of General Security Controls

* **CORS Policy ([security.js:L21-L27](file:///e:/c2c%20backend%20work/backend/src/middleware/security.js#L21-L27)):** Strictly configured from `env.CORS_ORIGIN`, supporting credentials only when the origin is not a wildcard (`*`).
* **CSRF Defense-in-Depth ([security.js:L30-L37](file:///e:/c2c%20backend%20work/backend/src/middleware/security.js#L30-L37)):** All state-changing routes relying on cookies (`/refresh`, `/logout`, `/reset-password`) enforce the `csrfProtect` middleware, requiring custom headers (`X-Admin-Client` or `X-Requested-With`). Since standard browsers prevent cross-origin requests from attaching custom headers without explicit CORS preflight authorization, this provides robust protection complementing `SameSite: Strict` cookies.
* **Sensitive Logging ([authController.js](file:///e:/c2c%20backend%20work/backend/src/controllers/authController.js), [errorHandler.js](file:///e:/c2c%20backend%20work/backend/src/middleware/errorHandler.js)):** All authentication events (registration, login successes/failures, lockouts, Google OAuth checks, token reuse alerts, and password resets) log relevant security identifiers (email, IP address, user ID) without ever logging plaintext passwords, JWTs, refresh token strings, or password reset tokens.
* **Token Storage Security ([User.js](file:///e:/c2c%20backend%20work/backend/src/models/User.js), [UserRefreshToken.js](file:///e:/c2c%20backend%20work/backend/src/models/UserRefreshToken.js)):** Passwords are hashed using `bcryptjs` with salt rounds set to 12. Refresh tokens and password reset tokens are stored exclusively as SHA-256 cryptographic digests.

---

## 5. Conclusion

The Customer Authentication System implemented in Phase 3 is robust and well-secured against common web application attacks (OWASP Top 10). The privilege separation between Customer and Admin domains is strictly enforced both at the database schema layer and within server-side JWT verification middlewares. Addressing the two **MEDIUM** findings (password length validation and OIDC `email_verified` assertion) will further harden the authentication suite before production deployment.
