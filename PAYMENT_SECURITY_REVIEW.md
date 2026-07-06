# Razorpay Payment Integration Security Review (Phase 5)

**Document Version:** 1.0  
**Date:** July 6, 2026  
**Scope:** Complete Razorpay Payment Integration (`/api/payments/*`, `/api/webhooks/razorpay`, `/api/me/payments/*`, `/api/admin/payments/*`, models, middlewares, and raw body verification)  
**Status:** Independent Security Review (No Code Modifications Performed)

---

## 1. Executive Summary

An independent, deep security review was conducted on the complete Razorpay Payment Integration implemented in Phase 5. The implementation demonstrates a robust security posture adhering to modern e-commerce and financial transaction best practices. Key architectural strengths include authoritative server-side price determination, strict customer ownership boundaries (IDOR defense), cryptographic HMAC SHA-256 verification for client-side payment verification and server-to-server webhooks, raw body buffer preservation for webhook authenticity, and replay protection.

During the review, **0 CRITICAL** and **0 HIGH** severity vulnerabilities were identified. Three **MEDIUM** severity findings were discovered relating to Time-of-Check to Time-of-Use (TOCTOU) concurrent race conditions during verification/reconciliation, unhandled webhook lifecycle events (such as `payment.failed` and `refund.processed`), and race conditions in webhook idempotency recording. Additionally, three **LOW / INFORMATIONAL** findings and defense-in-depth enhancements were documented.

---

## 2. Specific Security Verification Tests (The 7 Threat Vectors)

As requested, targeted code audits and vulnerability analyses were performed against the seven specific attack vectors:

| # | Threat Vector / Attack Scenario | Audit Result | Technical Justification & Implementation Verification |
| :---: | :--- | :---: | :--- |
| **1** | **Can ₹10 be changed to ₹1?** *(Amount Tampering / Price Manipulation)* | **SECURE** | In [paymentController.js:L13-L65](file:///e:/c2c%20backend%20work/backend/src/controllers/paymentController.js#L13-L65) (`createOrder`), the backend accepts only `serviceId` from the client payload. Any client-submitted `amount` or `price` parameter is completely ignored. The server queries MongoDB authoritatively (`Service.findOne`), retrieves `service.price`, computes `amount = Math.round(service.price * 100)` in paise, and passes this trusted amount directly to Razorpay's order API and the MongoDB `Payment` document. During verification ([paymentController.js:L82-L148](file:///e:/c2c%20backend%20work/backend/src/controllers/paymentController.js#L82-L148)), the amount is locked on the database record and cannot be altered. |
| **2** | **Can Customer A claim Customer B's payment?** *(Payment Ownership & IDOR)* | **SECURE** | During order creation, the payment record is strictly bound to the authenticated JWT user (`user: req.user._id`). In `verifyPayment` ([paymentController.js:L104-L107](file:///e:/c2c%20backend%20work/backend/src/controllers/paymentController.js#L104-L107)), the controller asserts `payment.user.toString() === req.user._id.toString()`; if Customer A submits Customer B's order/payment IDs, the request is rejected with `403 Forbidden` and logged as a security alert. Similarly, customer lookup routes (`GET /api/me/payments/:id`) enforce strict ownership bounds ([paymentController.js:L190](file:///e:/c2c%20backend%20work/backend/src/controllers/paymentController.js#L190)). |
| **3** | **Can a Booking unlock without successful payment?** *(Booking Unlock Logic)* | **SECURE** | All bookings are initialized in `status: 'PENDING'` upon order creation ([paymentController.js:L43](file:///e:/c2c%20backend%20work/backend/src/controllers/paymentController.js#L43)). Bookings transition to `'CONFIRMED'` *only* in two secure code paths: (1) inside `verifyPayment` after cryptographic HMAC SHA-256 signature verification succeeds ([paymentController.js:L137-L140](file:///e:/c2c%20backend%20work/backend/src/controllers/paymentController.js#L137-L140)), or (2) inside `handleRazorpayWebhook` after raw body cryptographic signature verification succeeds for a `payment.captured` event ([razorpayWebhookController.js:L66-L69](file:///e:/c2c%20backend%20work/backend/src/controllers/razorpayWebhookController.js#L66-L69)). There are no user-accessible endpoints to modify booking status directly. |
| **4** | **Can a payment be reused?** *(Cryptographic Binding & Cross-Order Replay)* | **SECURE** | Razorpay's cryptographic verification algorithm computes HMAC SHA-256 over `${razorpay_order_id}|${razorpay_payment_id}` using `RAZORPAY_KEY_SECRET` ([paymentController.js:L118-L121](file:///e:/c2c%20backend%20work/backend/src/controllers/paymentController.js#L118-L121)). Because `razorpayOrderId` is globally unique per transaction ([Payment.js:L28](file:///e:/c2c%20backend%20work/backend/src/models/Payment.js#L28)), a `razorpay_payment_id` from Order A cannot be submitted against Order B—the cryptographic HMAC signature check will fail with `400 Bad Request`. |
| **5** | **Can verification be replayed?** *(Replay Attacks & Fake Success Requests)* | **SECURE** | In `verifyPayment` ([paymentController.js:L109-L115](file:///e:/c2c%20backend%20work/backend/src/controllers/paymentController.js#L109-L115)), before cryptographic computation occurs, the system checks `if (payment.status === 'SUCCESS')`. If an attacker or client replays a previously verified request, the server immediately returns an idempotent `200 OK` (`"Payment verified successfully (already processed)"`) without re-executing database updates or booking confirmations. |
| **6** | **Can a fake webhook change payment state?** *(Webhook & Raw Body Verification)* | **SECURE** | Webhooks are protected by `verifyWebhookSignature(req.rawBody, signature, env.RAZORPAY_WEBHOOK_SECRET)` ([razorpayWebhookController.js:L18-L27](file:///e:/c2c%20backend%20work/backend/src/controllers/razorpayWebhookController.js#L18-L27)). The raw, unmodified request body stream is captured by Express via `express.json({ verify: ... })` ([app.js:L31-L38](file:///e:/c2c%20backend%20work/backend/src/app.js#L31-L38)). Any webhook lacking a valid HMAC SHA-256 signature generated by Razorpay's secret key is immediately rejected with `400 Bad Request` and logged as a security alert. |
| **7** | **Can duplicate webhooks create duplicate effects?** *(Duplicate Processing & Idempotency)* | **SECURE** | Webhook idempotency is enforced via the `ProcessedWebhookEvent` Mongoose collection ([razorpayWebhookController.js:L37-L44](file:///e:/c2c%20backend%20work/backend/src/controllers/razorpayWebhookController.js#L37-L44)). Upon receiving an event, the system checks if `eventId` already exists. If found, it logs a duplicate alert and returns `200 OK` immediately without re-processing. The collection utilizes a 30-day MongoDB TTL index ([ProcessedWebhookEvent.js:L23](file:///e:/c2c%20backend%20work/backend/src/models/ProcessedWebhookEvent.js#L23)) to automatically purge historical keys while preventing replay loops. |

---

## 3. Detailed Findings & Recommendations

### CRITICAL Severity Findings
*No Critical severity vulnerabilities were identified.*

---

### HIGH Severity Findings
*No High severity vulnerabilities were identified.*

---

### MEDIUM Severity Findings

#### MEDIUM-1: Time-of-Check to Time-of-Use (TOCTOU) Race Conditions in Payment Verification and Webhook Reconciliation
* **Affected File(s):** [paymentController.js](file:///e:/c2c%20backend%20work/backend/src/controllers/paymentController.js#L109-L141) (`verifyPayment`), [razorpayWebhookController.js](file:///e:/c2c%20backend%20work/backend/src/controllers/razorpayWebhookController.js#L59-L70) (`handleRazorpayWebhook`)
* **Vulnerability:** Both client verification and webhook reconciliation check transaction status sequentially in application memory (`if (payment.status === 'SUCCESS')` or `if (payment.status === 'PENDING')`) before executing database state updates (`payment.status = 'SUCCESS'; await payment.save()`).
* **Attack Scenario / Impact:** If a user completes verification on the frontend while Razorpay's `payment.captured` webhook fires at the exact same millisecond (or if an attacker sends concurrent duplicate verification requests), both threads read `payment.status === 'PENDING'` simultaneously. Both pass cryptographic verification and both execute database updates and booking confirmations. While currently benign because setting status to `'SUCCESS'` is idempotent, if side effects are added in future phases (e.g., sending confirmation emails, triggering Calendly scheduling APIs, incrementing referral bonuses, or issuing usage tokens), a concurrent race condition will cause those side effects to trigger twice.
* **Exact Recommended Fix:** Enforce atomic database state transitions using Mongoose conditional updates (`findOneAndUpdate`), ensuring that only one thread can ever transition a payment from `PENDING` to `SUCCESS`:
  ```javascript
  // In paymentController.js (verifyPayment)
  const updatedPayment = await Payment.findOneAndUpdate(
    { razorpayOrderId: razorpay_order_id, status: 'PENDING' },
    { 
      $set: { 
        status: 'SUCCESS', 
        razorpayPaymentId: razorpay_payment_id, 
        razorpaySignature: razorpay_signature 
      } 
    },
    { new: true }
  );

  if (!updatedPayment) {
    // Payment was already verified by another thread or webhook
    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully (already processed)'
    });
  }
  ```

#### MEDIUM-2: Unhandled Webhook Events (`payment.failed`, `refund.processed`) and Orphaned `PENDING` Bookings
* **Affected File(s):** [razorpayWebhookController.js](file:///e:/c2c%20backend%20work/backend/src/controllers/razorpayWebhookController.js#L47-L75), [paymentController.js](file:///e:/c2c%20backend%20work/backend/src/controllers/paymentController.js#L123-L128)
* **Vulnerability:** The webhook controller only processes `event === 'payment.captured'`, ignoring other critical financial lifecycle events such as `payment.failed`, `order.paid`, `refund.created`, and `refund.processed`. Furthermore, when a client verification fails signature checks in `verifyPayment`, `payment.status` is set to `'FAILED'`, but the associated `Booking` is left permanently orphaned in `'PENDING'` status.
* **Attack Scenario / Impact:** If a customer's payment attempt fails on Razorpay (`payment.failed`), or if an administrator issues a refund via the Razorpay merchant dashboard (`refund.processed`), the backend database never learns of the state change. A refunded booking will remain `CONFIRMED`, potentially allowing a user to receive consulting services after receiving a full refund. Conversely, failed payment attempts leave bookings orphaned in `PENDING` indefinitely without transitioning to `CANCELLED`.
* **Exact Recommended Fix:**
  1. Expand `handleRazorpayWebhook` to process `payment.failed` and `refund.*` events:
     ```javascript
     if (event === 'payment.failed') {
       const orderId = paymentEntity?.order_id;
       await Payment.findOneAndUpdate({ razorpayOrderId: orderId }, { $set: { status: 'FAILED' } });
       const payment = await Payment.findOne({ razorpayOrderId: orderId });
       if (payment) await Booking.findByIdAndUpdate(payment.booking, { $set: { status: 'CANCELLED' } });
     } else if (event === 'refund.processed' || event === 'refund.created') {
       const paymentId = payload?.refund?.entity?.payment_id;
       const payment = await Payment.findOneAndUpdate({ razorpayPaymentId: paymentId }, { $set: { status: 'REFUNDED' } });
       if (payment) await Booking.findByIdAndUpdate(payment.booking, { $set: { status: 'CANCELLED' } });
     }
     ```
  2. In `verifyPayment`, when cryptographic signature verification fails, transition the associated booking to `CANCELLED`:
     ```javascript
     if (expectedSignature !== razorpay_signature) {
       payment.status = 'FAILED';
       await payment.save();
       await Booking.findByIdAndUpdate(payment.booking, { $set: { status: 'CANCELLED' } });
       // ...
     }
     ```

#### MEDIUM-3: Race Condition in Webhook Idempotency Recording (`ProcessedWebhookEvent`)
* **Affected File(s):** [razorpayWebhookController.js](file:///e:/c2c%20backend%20work/backend/src/controllers/razorpayWebhookController.js#L37-L79)
* **Vulnerability:** In `handleRazorpayWebhook`, the check for duplicate webhooks (`ProcessedWebhookEvent.findOne({ eventId })`) happens at the beginning of the controller (line 37), but the event ID is recorded (`ProcessedWebhookEvent.create({ eventId })`) at the very end of the handler (line 78) after business logic completes.
* **Attack Scenario / Impact:** If Razorpay sends two identical webhook payloads concurrently (e.g. network retry firing simultaneously with original delivery), both requests pass the `findOne` check because neither has inserted the record yet. Both execute the reconciliation logic concurrently. The second request eventually throws a MongoDB Duplicate Key Error (`E11000`) when calling `ProcessedWebhookEvent.create()`, resulting in a 500 Internal Server Error returned to Razorpay after business logic has already executed twice.
* **Exact Recommended Fix:** Record the idempotency key *first* using an atomic upsert or insert-if-not-exists pattern before executing business logic:
  ```javascript
  try {
    // Attempt to atomically claim the webhook event ID first
    await ProcessedWebhookEvent.create({ eventId });
  } catch (err) {
    if (err.code === 11000) {
      logger.info(`[Security Alert] Duplicate webhook event ignored. Event ID: ${eventId}`);
      return res.status(200).json({ success: true, message: 'Webhook already processed' });
    }
    throw err;
  }
  // Proceed with safe, non-duplicate reconciliation logic...
  ```

---

### LOW Severity Findings & Defense-in-Depth Enhancements

#### LOW-1: Missing Database-Level Uniqueness Constraint on `razorpayPaymentId`
* **Affected File(s):** [Payment.js](file:///e:/c2c%20backend%20work/backend/src/models/Payment.js#L31-L33)
* **Vulnerability:** While `razorpayOrderId` is defined with `unique: true, index: true`, the `razorpayPaymentId` attribute lacks a uniqueness constraint in the Mongoose schema.
* **Attack Scenario / Impact:** While cryptographic HMAC checking prevents cross-order payment reuse during verification, lacking a database-level unique index on `razorpayPaymentId` removes a layer of defense-in-depth against accidental payment ID reuse or reconciliation anomalies across records.
* **Exact Recommended Fix:** Add a sparse unique index to `razorpayPaymentId` in `Payment.js`:
  ```javascript
  razorpayPaymentId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  }
  ```

#### LOW-2: Missing Explicit Assertion of Amount and Currency in Webhook Reconciliation
* **Affected File(s):** [razorpayWebhookController.js](file:///e:/c2c%20backend%20work/backend/src/controllers/razorpayWebhookController.js#L59-L65)
* **Vulnerability:** When reconciling a missed client verification via `payment.captured` webhook, the handler sets `payment.status = 'SUCCESS'` without explicitly asserting that `payload.payment.entity.amount === payment.amount` and `payload.payment.entity.currency === payment.currency`.
* **Attack Scenario / Impact:** While Razorpay locks the order amount during creation on their servers, explicitly asserting that the captured webhook amount and currency match the expected values stored in MongoDB protects against partial capture configurations, multi-currency conversions, or webhook payload tampering.
* **Exact Recommended Fix:** In `handleRazorpayWebhook`, verify amount and currency match before confirming the payment:
  ```javascript
  const capturedAmount = paymentEntity?.amount;
  const capturedCurrency = paymentEntity?.currency;

  if (capturedAmount !== payment.amount || capturedCurrency !== payment.currency) {
    logger.error(`[Security Alert] Webhook amount/currency mismatch. Expected: ${payment.amount} ${payment.currency}, Got: ${capturedAmount} ${capturedCurrency}`);
    return next(new AppError('Webhook reconciliation failed: amount or currency mismatch', 400));
  }
  ```

#### LOW-3: Unhandled Input Validation for Non-JSON / Empty Webhook Payloads (Potential 500 TypeError)
* **Affected File(s):** [app.js](file:///e:/c2c%20backend%20work/backend/src/app.js#L31-L38), [razorpayWebhookController.js](file:///e:/c2c%20backend%20work/backend/src/controllers/razorpayWebhookController.js#L18-L22)
* **Vulnerability:** In `app.js`, `express.json()` populates `req.rawBody` only when Content-Type is `application/json`. If a request arrives at `/api/webhooks/razorpay` with a different Content-Type (e.g. `text/plain` or `application/x-www-form-urlencoded`) or an empty body, `req.rawBody` is `undefined`. Passing `undefined` to `crypto.createHmac().update(req.rawBody)` in `razorpayService.js` throws an unhandled Node.js `TypeError` (`500 Internal Server Error`).
* **Attack Scenario / Impact:** While this fails closed (rejecting the invalid webhook without altering database state), throwing an unhandled 500 `TypeError` clutters error logs and represents incomplete input validation.
* **Exact Recommended Fix:** In `handleRazorpayWebhook`, explicitly verify that `req.rawBody` exists and is a valid Buffer or String before calling `verifyWebhookSignature`:
  ```javascript
  if (!req.rawBody || (!Buffer.isBuffer(req.rawBody) && typeof req.rawBody !== 'string')) {
    return next(new AppError('Invalid or missing webhook raw body buffer', 400));
  }
  ```

---

## 4. Comprehensive Audit Checklist Summary

| Security Control / Domain | Verification Status | Notes & Implementation References |
| :--- | :---: | :--- |
| **Amount Tampering Defense** | **VERIFIED** | Authoritative server-side price lookup in paise (`Service.price * 100`). Client amounts ignored. |
| **Service Price Manipulation** | **VERIFIED** | Prices stored immutably in MongoDB `Service` collection; no client overrides permitted. |
| **Payment Ownership & IDOR** | **VERIFIED** | Bound to JWT `req.user._id` at creation; strictly asserted during verification and lookup routes. |
| **Fake Success Requests** | **VERIFIED** | Replaced entirely by cryptographic HMAC SHA-256 signature verification over Razorpay secrets. |
| **Signature Verification** | **VERIFIED** | Implemented using Node.js `crypto.createHmac('sha256', secret).update(data).digest('hex')`. |
| **Webhook Verification** | **VERIFIED** | Validated against `RAZORPAY_WEBHOOK_SECRET` using raw request body buffer. |
| **Raw Body Handling** | **VERIFIED** | Captured via Express JSON body parser `verify` hook for `/api/webhooks/*` endpoints. |
| **Replay Attacks** | **VERIFIED** | Idempotent `200 OK` return if payment status is already `'SUCCESS'`; HMAC binds order to payment ID. |
| **Duplicate Processing** | **VERIFIED** | Enforced via `ProcessedWebhookEvent` tracking collection with 30-day TTL index. |
| **Race Conditions** | **MEDIUM RISK** | TOCTOU race conditions identified in concurrent verification/webhook execution (see MEDIUM-1 & MEDIUM-3). |
| **Booking Unlock Logic** | **VERIFIED** | Bookings remain `PENDING` until cryptographic signature check succeeds; no manual unlock endpoints. |
| **Refund/Status Inconsistencies** | **MEDIUM RISK** | Unhandled `payment.failed` and `refund.processed` webhook events (see MEDIUM-2). |
| **Sensitive Logging Review** | **VERIFIED** | Zero PII, secrets, or card details logged. Only transaction IDs (`order_id`, `payment_id`) and user email logged. |
