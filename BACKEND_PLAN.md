# Backend Implementation Plan: C2C Booking & Payment API

## 1. Architecture Summary
- **Language/Framework**: Node.js with Express and TypeScript. (Chosen for its robust ecosystem and excellent support for RESTful APIs and webhooks).
- **Database**: PostgreSQL (managed via Prisma ORM for type safety and easy migrations).
- **Architecture**: Layered architecture (Controllers, Services, Models, Routes) for clean separation of concerns.
- **Authentication**: JWT (JSON Web Tokens) with distinct roles for Admin and Customer.
- **External Integrations**:
  - **Razorpay**: For processing and verifying payments in India.
  - **Calendly**: For booking and scheduling calls (via Calendly API and Webhooks).

## 2. Proposed Database Models
- **User**
  - `id` (UUID), `email` (String, Unique), `password_hash` (String), `role` (Enum: ADMIN | CUSTOMER), `created_at` (DateTime), `updated_at` (DateTime)
- **Service / Package**
  - `id` (UUID), `title` (String), `description` (Text), `price` (Decimal), `calendly_event_type_url` (String), `is_active` (Boolean), `created_at` (DateTime), `updated_at` (DateTime)
- **Booking**
  - `id` (UUID), `user_id` (FK to User), `service_id` (FK to Service), `calendly_event_id` (String, nullable), `status` (Enum: PENDING, CONFIRMED, CANCELLED), `scheduled_time` (DateTime, nullable), `created_at` (DateTime), `updated_at` (DateTime)
- **Payment**
  - `id` (UUID), `booking_id` (FK to Booking), `user_id` (FK to User), `amount` (Decimal), `currency` (String), `razorpay_order_id` (String), `razorpay_payment_id` (String, nullable), `razorpay_signature` (String, nullable), `status` (Enum: PENDING, SUCCESS, FAILED), `created_at` (DateTime), `updated_at` (DateTime)

## 3. Authentication Design
- **Customer Auth**: Customers register/login using their email and password. A stateless JWT is returned containing `{ userId, role: 'CUSTOMER' }`.
- **Admin Auth**: Admins log in using an Admin-specific portal/endpoint. The JWT returned contains `{ userId, role: 'ADMIN' }`.
- **Middleware**: A robust authentication and authorization middleware will verify the JWT structure, expiration, and signature, and enforce Role-Based Access Control (RBAC) on protected routes.

## 4. External Integrations Flow
### Razorpay Payment Flow
1. **Create Order**: Client calls `POST /api/payments/create-order` with a Service ID. Backend calculates the price, calls Razorpay Server API to create an order, and returns the `order_id` to the frontend.
2. **Process Payment**: Frontend uses the `order_id` to render the Razorpay checkout overlay.
3. **Verify Payment**: Frontend calls `POST /api/payments/verify` with the `payment_id`, `order_id`, and `signature`. Backend verifies the signature cryptographically to prevent spoofing and marks the payment as SUCCESS.
4. **Webhooks (Fallback)**: Backend listens to Razorpay Webhooks (`payment.captured`, `payment.failed`) to ensure the system is updated even if the user drops off before verification.

### Calendly Booking Integration
1. **Schedule**: After payment is completed, the frontend routes the user to the Calendly scheduling link (passing tracking metadata like `email` and `booking_id`).
2. **Webhooks**: Calendly sends a webhook payload to `POST /api/webhooks/calendly` when an event is successfully scheduled (`invitee.created`) or canceled (`invitee.canceled`).
3. **Backend Processing**: The backend extracts the metadata, finds the corresponding `Booking` in the database, and updates its status to `CONFIRMED` along with the scheduled time.

## 5. API Structure & Expected Frontend Contract

### Auth Endpoints
- `POST /api/auth/register` (Customer)
- `POST /api/auth/login` (Admin/Customer)
- `GET /api/auth/me` (Protected - Get current user profile)

### Service Endpoints
- `GET /api/services` (Public - List active services)
- `GET /api/services/:id` (Public)
- `POST /api/services` (Admin only - Create new service)
- `PUT /api/services/:id` (Admin only - Update service)

### Booking Endpoints
- `POST /api/bookings` (Protected Customer - Initialize booking intent)
- `GET /api/bookings/my-bookings` (Protected Customer)
- `GET /api/bookings` (Protected Admin - View all bookings)

### Payment Endpoints
- `POST /api/payments/create-order` (Protected Customer)
- `POST /api/payments/verify` (Protected Customer)

### Webhook Endpoints
- `POST /api/webhooks/razorpay` (Public, expects Razorpay headers for signature verification)
- `POST /api/webhooks/calendly` (Public, expects Calendly signature headers)

## 6. Implementation Phases
- **Phase 1: Project & Database Initialization**
  - Setup Node.js, Express, TypeScript.
  - Setup Prisma schema and local PostgreSQL database.
- **Phase 2: Authentication & Core Models**
  - Build Auth APIs (Register, Login, Middleware).
  - Build Service Management APIs for Admin and Customers.
- **Phase 3: Payments Integration**
  - Integrate Razorpay SDK.
  - Build Order creation and Verification APIs.
- **Phase 4: Bookings & Scheduling Integrations**
  - Build Booking initialization APIs.
  - Implement Calendly Webhook receiver for booking confirmation.
- **Phase 5: Automated Testing & API Documentation**
  - Write Unit/Integration tests with Jest and Supertest.
  - Export a complete Postman Collection defining the contract for the frontend team.
