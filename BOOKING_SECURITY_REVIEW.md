# Security & Correctness Review: Razorpay Payment & Calendly Booking Lifecycle

**Date:** July 2026  
**Target Architecture:** Razorpay Payment → Booking Reference → Calendly → Booking Webhook → Customer → Payment → Booking  
**Scope:** Deep security, architectural correctness, and concurrency review of the end-to-end payment and scheduling pipeline.  
**Methodology:** Static code analysis, data flow tracing, concurrency modeling, and threat modeling against realistic attack scenarios.

---

## 1. Executive Summary

An independent security and correctness review was conducted on the complete booking and scheduling lifecycle implemented across `paymentController.js`, `razorpayWebhookController.js`, `calendlyWebhookController.js`, `meBookingController.js`, `adminBookingController.js`, and their associated database models (`Booking`, `Payment`, `Service`, `ProcessedWebhookEvent`).

The implementation demonstrates **strong defense-in-depth architecture** in several critical areas:
- **CSPRNG Reference Generation:** 128-bit cryptographically secure random numbers prevent booking reference prediction and session hijacking.
- **Strict Identity Boundaries:** Customer ownership validation prevents Insecure Direct Object References (IDOR) and unauthorized payment/booking claims across all customer endpoints.
- **Cryptographic Authenticity:** Both Razorpay and Calendly webhooks enforce HMAC SHA-256 signature verification over raw request body buffers, protecting against webhook spoofing and tampering.
- **Replay & Idempotency Controls:** Calendly webhooks enforce a 300-second timestamp drift check against replay attacks and utilize atomic database insertion locks (`ProcessedWebhookEvent`) to eliminate duplicate event processing.

However, the review identified **1 High/Medium severity architectural state inconsistency** regarding email fallback logic and **1 Medium severity business logic vulnerability** regarding the lack of a terminal completion state for past meetings. 

---

## 2. Threat Model & Lifecycle Checklist Analysis

### 1. Booking without Payment
- **Status:** **PROTECTED (with Fallback Caveat)**
- **Analysis:** When an order is created via `POST /api/payments/create-order`, a `Booking` record is initialized in a `'PENDING'` state alongside a `'PENDING'` `Payment` record. The Calendly scheduling link (`unlockedCalendlyUrl`) is suppressed in `GET /api/me/bookings` until the associated payment transitions to `'SUCCESS'`. Furthermore, when a Calendly `invitee.created` webhook arrives with a tracking campaign reference, `handleCalendlyWebhook` queries `Payment.findOne({ booking: booking._id, status: 'SUCCESS' })`. If no successful payment exists, the backend immediately transitions the booking status to `'CANCELLED'` and rejects the scheduling attempt with `400 Unpaid booking attempt`.
- **Remaining Risk:** See **Finding #1** regarding state model mismatch during email fallback when tracking references are missing.

### 2. Reused Payment
- **Status:** **PROTECTED**
- **Analysis:** Payments are bound 1:1 to Bookings upon order creation (`booking: booking._id`). In `Payment.js`, both `razorpayOrderId` and `razorpayPaymentId` enforce database-level unique indexes (`unique: true`). When `verifyPayment` or `handleRazorpayWebhook` executes, atomic Mongoose updates (`findOneAndUpdate({ razorpayOrderId, status: 'PENDING' }, ...)`) transition the record. If an attacker attempts to submit a `razorpay_payment_id` previously used for another order, MongoDB throws a duplicate key error (`E11000`), preventing payment reuse across multiple bookings or accounts.

### 3. Predictable Booking References
- **Status:** **PROTECTED**
- **Analysis:** Booking references are generated using Node.js cryptographic entropy: `booking_${crypto.randomBytes(16).toString('hex')}`. This yields 128 bits (32 hexadecimal characters) of entropy ($2^{128}$ combinations). It is computationally infeasible for an attacker to enumerate, guess, or brute-force another customer's booking reference to hijack their Calendly scheduling session.

### 4. Wrong Customer Linkage
- **Status:** **PROTECTED**
- **Analysis:** Customer identity is strictly enforced across three boundaries:
  1. *Order Creation:* Bookings and payments are hardcoded to `req.user._id` from the authenticated JWT.
  2. *Payment Verification:* `verifyPayment` asserts `if (payment.user.toString() !== req.user._id.toString()) return next(new AppError('Forbidden', 403))`.
  3. *Calendly Webhook:* When `invitee.created` matches a `bookingReference`, the controller asserts `if (booking.user.email.toLowerCase() !== inviteeEmail.toLowerCase()) throw new AppError('Forbidden: Invitee email does not match booking customer', 403)`. An attacker who obtains a valid booking reference but enters a different email address on Calendly is blocked from confirming the booking.

### 5. Duplicate Bookings & Webhook Idempotency
- **Status:** **PROTECTED**
- **Analysis:** To prevent double-processing when Calendly retries webhooks or transmits duplicate events, `handleCalendlyWebhook` constructs a unique event identifier: `eventId = req.body.event_id || \`calendly_\${event}_\${inviteeUri}\``. It atomically inserts this ID into the `ProcessedWebhookEvent` collection before executing business logic. Duplicate requests fail with MongoDB error code `11000` and are safely acknowledged with `200 OK`. If subsequent business logic fails, the controller rolls back the lock via `ProcessedWebhookEvent.deleteOne({ eventId })`, ensuring transient failures can be retried cleanly.

### 6. Webhook Spoofing & Replay Attacks
- **Status:** **PROTECTED**
- **Analysis:** Calendly webhook authenticity is verified by parsing the `calendly-webhook-signature` header for timestamp `t` and signature `v1`. The controller calculates an HMAC SHA-256 digest over `${t}.${rawBodyString}` using `CALENDLY_WEBHOOK_SECRET`. 
  - *Spoofing Protection:* Any modification to the payload or headers without the secret key results in signature verification failure.
  - *Replay Protection:* The controller enforces `Math.abs(currentEpoch - parseInt(t, 10)) > 300`. Replayed webhook payloads older than 5 minutes are rejected before cryptographic evaluation.

### 7. Reschedule Corruption
- **Status:** **PROTECTED**
- **Analysis:** When a customer reschedules an appointment on Calendly, Calendly emits an `invitee.canceled` event for the old slot followed by an `invitee.created` event for the new slot. 
  - When `invitee.canceled` is processed, `Booking.findOne({ calendlyEventId })` locates the booking and transitions its status to `'CANCELLED'`.
  - When the subsequent `invitee.created` event arrives with the tracking reference, the controller locates the booking (even in `'CANCELLED'` state), verifies the underlying payment is still `'SUCCESS'`, and transitions the booking back to `'CONFIRMED'`, updating `calendlyEventId` and `scheduledTime` to the new slot. Even if network latency causes out-of-order delivery (where `created` arrives before `canceled`), the old cancellation event will look up by the *old* `calendlyEventId`, returning `null` and leaving the new rescheduled slot intact.

### 8. Cancellation Corruption
- **Status:** **PROTECTED**
- **Analysis:** Processing `invitee.canceled` correctly updates the `Booking` status to `'CANCELLED'`. It does not modify or corrupt the associated `Payment` record, preserving the financial transaction history while marking the time slot as vacated.

### 9. Race Conditions & Concurrency
- **Status:** **GENERALLY PROTECTED (with Low-Severity Note)**
- **Analysis:** Payment state transitions rely on atomic MongoDB `findOneAndUpdate` queries with exact pre-condition status filters (`status: 'PENDING'`). This eliminates Time-of-Check to Time-of-Use (TOCTOU) race conditions during concurrent client verifications and Razorpay webhook notifications. In the Calendly webhook handler, concurrent duplicate event processing is prevented by the atomic `ProcessedWebhookEvent` creation lock.

### 10. Ambiguous Email Fallback
- **Status:** **ARCHITECTURALLY SOUND (with Finding #1 Caveat)**
- **Analysis:** If browser privacy extensions or redirects strip the UTM campaign parameter (`bookingReference`), `handleCalendlyWebhook` falls back to querying bookings by the invitee's email address. To prevent incorrect linkage when a customer owns multiple pending calls:
  - If exactly one paid pending booking exists (`pendingBookings.length === 1`), it is safely linked.
  - If multiple paid pending bookings exist (`pendingBookings.length > 1`), the system refuses to guess. It transitions all matching bookings to `'NEEDS_REVIEW'` and throws a `400` error, alerting administrators to manually reconcile the scheduling.

### 11. Insecure Direct Object References (IDOR)
- **Status:** **PROTECTED**
- **Analysis:** All customer-facing endpoints (`GET /api/me/bookings`, `GET /api/me/bookings/:id`, `GET /api/me/payments`, `GET /api/me/payments/:id`) strictly scope database queries to `req.user._id` or explicitly assert `if (doc.user.toString() !== req.user._id.toString()) return next(new AppError('Forbidden', 403))`. An authenticated customer cannot enumerate or read booking or payment details belonging to any other user.

---

## 3. Categorized Vulnerability Findings

### FINDING 1: State Model Inconsistency in Calendly Webhook Email Fallback
- **Severity:** **HIGH / MEDIUM**
- **Affected File:** `backend/src/controllers/calendlyWebhookController.js` (lines 126-135) & `backend/src/controllers/paymentController.js` (line 167).
- **Vulnerability:** Inconsistency between payment verification state transitions and Calendly webhook fallback query filtering.
- **Attack / Failure Scenario:**
  1. A customer purchases a consulting package. Upon successful payment verification (via `POST /api/payments/verify` or Razorpay `payment.captured` webhook), the backend executes `Booking.findByIdAndUpdate(..., { $set: { status: 'CONFIRMED' } })`.
  2. The customer is redirected to Calendly to select a time slot. However, due to browser privacy blockers, cross-domain redirects, or direct link sharing, the UTM campaign tracking parameter (`bookingReference`) is stripped from the URL.
  3. Calendly transmits an `invitee.created` webhook without `tracking.utm_campaign`.
  4. `handleCalendlyWebhook` initiates email fallback logic, querying `Booking.find({ user: user._id })` and filtering for records where `b.status === 'PENDING'` and payment is `'SUCCESS'`.
  5. **Failure:** Because step 1 already transitioned the booking status from `'PENDING'` to `'CONFIRMED'`, `b.status === 'PENDING'` evaluates to `false`. The fallback array `pendingBookings` is empty (`length === 0`). The controller throws `400 Unpaid booking attempt (no paid pending bookings found for email)`, failing to link the appointment and leaving the customer's paid booking unscheduled.
- **Exact Recommended Fix:**
  Update the status filter condition in `calendlyWebhookController.js` during email fallback to check for paid bookings awaiting slot scheduling (i.e., bookings where `status` is `'PENDING'` OR where `status` is `'CONFIRMED'` but `calendlyEventId` has not yet been assigned):
  ```javascript
  // IN: backend/src/controllers/calendlyWebhookController.js (lines 128-135)
  const pendingBookings = [];
  for (const b of userBookings) {
    // Check if booking is awaiting slot assignment
    const isAwaitingSchedule = b.status === 'PENDING' || (b.status === 'CONFIRMED' && !b.calendlyEventId);
    if (isAwaitingSchedule) {
      const hasPaid = await Payment.findOne({ booking: b._id, status: 'SUCCESS' });
      if (hasPaid) {
        pendingBookings.push(b);
      }
    }
  }
  ```

---

### FINDING 2: Absence of Booking Completion State (Unlimited Rescheduling & Slot Re-use)
- **Severity:** **MEDIUM**
- **Affected File:** `backend/src/models/Booking.js` & `backend/src/controllers/meBookingController.js` (lines 19-22).
- **Vulnerability:** Lack of a terminal `'COMPLETED'` or `'EXPIRED'` lifecycle state for rendered services.
- **Attack / Failure Scenario:**
  1. A customer pays for a 1-Hour Consulting Call, schedules it via Calendly, and attends the meeting.
  2. Months after the meeting has concluded, the booking record in MongoDB remains in `status: 'CONFIRMED'` with an associated `Payment` in `status: 'SUCCESS'`.
  3. When the customer accesses `GET /api/me/bookings`, `meBookingController.js` checks `if (isPaid && booking.service && booking.service.calendlyUrl)`. Because `isPaid` is still true, the API continues returning the active `unlockedCalendlyUrl` containing the historical `bookingReference`.
  4. **Exploitation:** The customer clicks the unlocked Calendly link and schedules another 1-Hour Consulting Call. When the Calendly webhook arrives, `handleCalendlyWebhook` finds the booking by `bookingReference`, confirms `Payment.status === 'SUCCESS'`, and updates `scheduledTime` to the new date—allowing the customer to book unlimited free consulting calls indefinitely using a single historical payment.
- **Exact Recommended Fix:**
  1. Add a `'COMPLETED'` status to the enum in `Booking.js`:
     ```javascript
     enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'NEEDS_REVIEW', 'COMPLETED']
     ```
  2. In `meBookingController.js`, suppress `unlockedCalendlyUrl` if the booking is completed or if the scheduled time has passed:
     ```javascript
     // IN: meBookingController.js (lines 19-23 & 58-62)
     const isExpiredOrCompleted = booking.status === 'COMPLETED' || (booking.scheduledTime && new Date(booking.scheduledTime) < new Date());
     if (isPaid && !isExpiredOrCompleted && booking.service && booking.service.calendlyUrl) {
       bookingObj.unlockedCalendlyUrl = `${booking.service.calendlyUrl}?utm_campaign=${booking.bookingReference}`;
     } else {
       bookingObj.unlockedCalendlyUrl = null;
     }
     ```
  3. In `calendlyWebhookController.js`, reject scheduling attempts for completed bookings:
     ```javascript
     if (booking.status === 'COMPLETED') {
       throw new AppError('Booking has already been completed and cannot be rescheduled', 400);
     }
     ```

---

### FINDING 3: In-Memory `save()` vs. Atomic Document Updates in Webhook Handler
- **Severity:** **LOW**
- **Affected File:** `backend/src/controllers/calendlyWebhookController.js` (lines 157-162 & lines 170-171).
- **Vulnerability:** Using Mongoose document fetching and in-memory `.save()` instead of atomic MongoDB update operations during webhook state transitions.
- **Attack / Failure Scenario:**
  While duplicate webhooks with identical `event_id` values are cleanly intercepted by `ProcessedWebhookEvent`, if an administrator manually modifies a booking record (e.g., updating administrative notes or status in an admin panel) at the exact millisecond a Calendly reschedule webhook arrives, fetching the document into memory via `findOne()`, modifying properties in JavaScript, and executing `await booking.save()` can result in a Time-of-Check to Time-of-Use (TOCTOU) race condition that overwrites concurrent administrative modifications without optimistic concurrency control or version checking.
- **Exact Recommended Fix:**
  Replace in-memory document mutations and `.save()` calls with atomic Mongoose `findOneAndUpdate` operations:
  ```javascript
  // IN: backend/src/controllers/calendlyWebhookController.js (lines 157-162)
  await Booking.findByIdAndUpdate(
    booking._id,
    {
      $set: {
        status: 'CONFIRMED',
        calendlyEventId: calendlyEventId,
        ...(startTime && { scheduledTime: new Date(startTime) })
      }
    },
    { new: true }
  );
  ```

---

## 4. Conclusion & Verification Summary

The Razorpay and Calendly integration demonstrates rigorous adherence to secure software engineering principles, incorporating raw-body HMAC verification, CSPRNG reference generation, strict ownership boundaries, and database-level idempotency locks. 

Remediating **Finding #1 (Email Fallback State Filter)** and **Finding #2 (Terminal Booking Completion State)** will close the remaining architectural gaps, ensuring complete lifecycle robustness and preventing service reuse across the platform.
