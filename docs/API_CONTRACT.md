# Backend API Contract & Specification

This document provides the definitive API contract for all endpoints exposed by the backend service. It lists paths, request parameters, response schemas, and error behaviors to allow integration without reading the backend source code.

---

## Global Headers & Error Format

### standard JSON Error Response
All errors return a standardized JSON block with `success: false` and a descriptive `message` string:
```json
{
  "success": false,
  "message": "Error details here"
}
```

### Response Status Codes
- `200 OK` / `201 Created` / `204 No Content` for successful requests.
- `400 Bad Request` for validation failures, missing parameters, or unpaid scheduling attempts.
- `401 Unauthorized` for missing, expired, or invalid access tokens or disabled profiles.
- `403 Forbidden` for role boundary violations (e.g. customer attempting to call admin route) or IDOR ownership check failures.
- `404 Not Found` for nonexistent resources.
- `429 Too Many Requests` when route-specific rate limits are exceeded.

---

## 1. Customer Authentication Endpoints

All customer authentication routes are prefixed with `/api/auth`.

### 1.1 Customer Registration
- **URL:** `POST /api/auth/register`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePassword123"
  }
  ```
- **Responses:**
  - **`201 Created`:**
    ```json
    {
      "success": true,
      "message": "Customer registered successfully"
    }
    ```
  - **`400 Bad Request`:** (Email already exists or validation fails)

---

### 1.2 Customer Email & Password Login
- **URL:** `POST /api/auth/login`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "email": "john@example.com",
    "password": "SecurePassword123"
  }
  ```
- **Responses:**
  - **`200 OK`:** (Sets HttpOnly `refreshToken` cookie)
    ```json
    {
      "success": true,
      "accessToken": "eyJhbGciOi...",
      "user": {
        "id": "60b9c...",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "CUSTOMER"
      }
    }
    ```
  - **`400 Bad Request`:** (Generic "Invalid credentials" error)
  - **`401 Unauthorized`:** (Account locked out after 5 failures)

---

### 1.3 Customer Google SSO Login
- **URL:** `POST /api/auth/google`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "idToken": "google_id_token_jwt_from_sso_button"
  }
  ```
- **Description:** Verifies Google signature, audience, and expiry on backend. Checks if account exists. If not, creates a Google-linked customer profile. If it already exists as a password-based local account, returns a `400` error to prevent insecure account linking.
- **Responses:**
  - **`200 OK`:** (Sets HttpOnly `refreshToken` cookie, returns `accessToken`)

---

### 1.4 Customer Refresh Token Rotation (RTR)
- **URL:** `POST /api/auth/refresh`
- **Headers:** 
  - `Cookie: refreshToken=eyJhbGciOi...`
  - `X-CSRF-Token: custom_header_string` (Required to mitigate cross-site request forgery)
- **Responses:**
  - **`200 OK`:** (Rotates and issues a new access token and a refreshed HttpOnly cookie)
    ```json
    {
      "success": true,
      "accessToken": "eyJhbGciOi..."
    }
    ```

---

### 1.5 Customer Logout
- **URL:** `POST /api/auth/logout`
- **Headers:**
  - `Cookie: refreshToken=eyJhbGciOi...`
  - `X-CSRF-Token: custom_header_string`
- **Responses:**
  - **`200 OK`:** Clears database session keys and cookie.

---

### 1.6 Current Profile Info (`/me`)
- **URL:** `GET /api/auth/me`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Responses:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "user": {
        "id": "60b9c...",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "CUSTOMER"
      }
    }
    ```

---

### 1.7 Forgot & Reset Password
- **URL:** `POST /api/auth/forgot-password`
- **Request Body:**
  ```json
  {
    "email": "john@example.com"
  }
  ```
- **Response `200 OK`:** (Returns a link or indicates token sent)

- **URL:** `POST /api/auth/reset-password`
- **Request Body:**
  ```json
  {
    "token": "plaintext_reset_token",
    "password": "NewSecurePassword123"
  }
  ```
- **Response `200 OK`:** Updates password and immediately revokes all active customer sessions/tokens.

---

## 2. Admin Authentication Endpoints

All admin authentication routes are prefixed with `/api/admin/auth`.

- **`POST /api/admin/auth/login`**: Accepts email/adminId + password. Returns `accessToken` (with role `'ADMIN'`) and sets HttpOnly `refreshToken` cookie.
- **`GET /api/admin/auth/me`**: Returns profile info. Requires `Authorization: Bearer <accessToken>`.
- **`POST /api/admin/auth/refresh`**: Rotates tokens. Requires `refreshToken` cookie and `X-CSRF-Token` header.
- **`POST /api/admin/auth/logout`**: Invalidates sessions.

---

## 3. Public Enquiry Endpoint

- **URL:** `POST /api/enquiries`
- **Headers:** `Content-Type: application/json` (Optional `Authorization: Bearer <token>` to associate query to user account)
- **Request Body:**
  ```json
  {
    "name": "Jane Smith",
    "email": "jane@example.com",
    "subject": "Inquiry about consulting",
    "message": "Hello, I would like to book a code review.",
    "phone": "" // Honeypot spam-trap field (must leave empty)
  }
  ```
- **Responses:**
  - **`201 Created`:**
    ```json
    {
      "success": true,
      "message": "Enquiry submitted successfully"
    }
    ```

---

## 4. Razorpay Payments Endpoints

All payment routes are prefixed with `/api/payments`.

### 4.1 Create Payment Order
- **URL:** `POST /api/payments/create-order`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Request Body:**
  ```json
  {
    "serviceId": "consulting-1h" // OR Mongoose ObjectId
  }
  ```
- **Responses:**
  - **`201 Created`:**
    ```json
    {
      "success": true,
      "orderId": "order_Hj23fKs9as",
      "amount": 500000, // price in paise (authoritative server-side pricing)
      "currency": "INR",
      "bookingReference": "booking_a2f8b9d0...",
      "keyId": "rzp_test_mockKeyId123"
    }
    ```

---

### 4.2 Verify Client Payment
- **URL:** `POST /api/payments/verify`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Request Body:**
  ```json
  {
    "razorpay_order_id": "order_Hj23fKs9as",
    "razorpay_payment_id": "pay_Hj28fjSKw1",
    "razorpay_signature": "cryptographic_signature_from_frontend"
  }
  ```
- **Responses:**
  - **`200 OK`:** Payment verified, booking transitioned to `'CONFIRMED'`.
  - **`403 Forbidden`:** Attempting to verify a payment belonging to another customer ID.

---

## 5. Booking Endpoints

### 5.1 Customer: Get Bookings List
- **URL:** `GET /api/me/bookings`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Responses:**
  - **`200 OK`:**
    ```json
    {
      "success": true,
      "bookings": [
        {
          "_id": "60b9c123...",
          "service": {
            "name": "1-Hour Consulting Call",
            "price": 5000
          },
          "status": "CONFIRMED",
          "bookingReference": "booking_a2f8...",
          "paymentStatus": "SUCCESS",
          "unlockedCalendlyUrl": "https://calendly.com/consultant/1h?utm_campaign=booking_a2f8..."
        }
      ]
    }
    ```
    *Note: `unlockedCalendlyUrl` is `null` if the payment is unpaid or pending.*

---

## 6. Admin Operational & Report Endpoints

All admin endpoints require `Authorization: Bearer <adminAccessToken>`.

### 6.1 Dashboard Summary Stats
- **URL:** `GET /api/admin/dashboard/summary`
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "enquiries": { "total": 5, "pending": 2, "inProgress": 2, "resolved": 1 },
      "bookings": { "total": 10, "pending": 1, "confirmed": 6, "cancelled": 2, "needsReview": 1 },
      "payments": { "total": 8, "successful": 5, "pending": 1, "failed": 1, "refunded": 1, "totalRevenue": 25000 },
      "customers": { "total": 12 }
    }
  }
  ```

---

### 6.2 List Customers
- **URL:** `GET /api/admin/customers?page=1&limit=10&search=Jane`
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "pagination": { "page": 1, "limit": 10, "totalPages": 2, "totalResults": 12 },
    "customers": [
      {
        "id": "60c2d...",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "createdAt": "2026-07-01T12:00:00Z"
      }
    ]
  }
  ```

---

### 6.3 PDF Document Report Downloads
All endpoints return an `application/pdf` binary stream.
- **Enquiries PDF Report:** `GET /api/admin/reports/enquiries?startDate=ISO_DATE&endDate=ISO_DATE&status=PENDING`
- **Payments PDF Report:** `GET /api/admin/reports/payments?startDate=ISO_DATE&endDate=ISO_DATE&status=SUCCESS`
- **Bookings PDF Report:** `GET /api/admin/reports/bookings?startDate=ISO_DATE&endDate=ISO_DATE&status=CONFIRMED`
- **Customers PDF Report:** `GET /api/admin/reports/customers?startDate=ISO_DATE&endDate=ISO_DATE`
