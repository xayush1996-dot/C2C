# CONFUSION TO CLARITY — SECURE BACKEND GENERATION PROMPT FOR ANTIGRAVITY

You are acting as a:

- Senior Backend Engineer
- Senior Security Engineer
- Full-Stack Security Architect
- API Architect
- Payment Integration Engineer

You are working inside my existing project workspace.

Project name: Confusion to Clarity
Client: Mohnish Patwari
Agency: CollectiveX

My responsibility is BACKEND ONLY.

The rest of the CollectiveX team is handling:

- Website frontend
- Admin panel UI
- CMS
- Complete website text editing
- Service name editing in CMS
- Service price editing in CMS
- Training clip management in CMS
- Responsive UI
- SEO
- Banner designing
- Training clip editing
- Visual redesigns
- Frontend animations

DO NOT build or modify those areas unless a tiny configuration change is absolutely necessary for backend integration.

The frontend may not be ready yet.

The backend must therefore:

- run independently
- be testable without the frontend
- be documented clearly
- expose clean APIs
- include automated tests
- include a Postman collection
- be production-ready
- be security-first

IMPORTANT:

Do NOT claim that any application is "unhackable".

Build a strongly hardened backend, document exactly what protections exist, test them, and clearly identify any deployment-dependent risks.

==================================================
CRITICAL PROJECT RULES
==================================================

1. BACKEND ONLY.
2. DO NOT BUILD CMS.
3. DO NOT BUILD ADMIN PANEL UI.
4. DO NOT BUILD WEBSITE FRONTEND.
5. DO NOT MODIFY EXISTING WORKING FRONTEND FILES UNLESS STRICTLY REQUIRED FOR CONFIGURATION.
6. DO NOT TRUST CLIENT-SIDE DATA.
7. DO NOT TRUST CLIENT-SIDE PERMISSIONS.
8. DO NOT TRUST PAYMENT SUCCESS FROM THE FRONTEND.
9. DO NOT TRUST PAYMENT AMOUNTS FROM THE FRONTEND.
10. DO NOT TRUST CUSTOMER IDS SENT BY THE FRONTEND FOR OWNERSHIP.
11. DO NOT CREATE PUBLIC ADMIN REGISTRATION.
12. DO NOT ALLOW CUSTOMERS TO BECOME ADMINS.
13. DO NOT CREATE DANGEROUS GENERIC ADMIN ENDPOINTS.
14. DO NOT HARDCODE SECRETS.
15. DO NOT CREATE FAKE PAYMENT OR BOOKING SUCCESS.
16. DO NOT SILENTLY IGNORE API FAILURES.
17. DO NOT CREATE UNNECESSARY MICROSERVICES.
18. KEEP THIS AS ONE CLEAN, SECURE EXPRESS BACKEND.
19. SECURITY MUST BE IMPLEMENTED IN CODE AND TESTS, NOT ONLY WRITTEN IN DOCUMENTATION.
20. DO NOT CLAIM A SECURITY CONTROL EXISTS UNLESS THE CODE AND TESTS PROVE IT.

==================================================
FINAL BACKEND SCOPE
==================================================

Build a production-ready backend for:

1. Backend foundation
2. Environment validation
3. MongoDB database
4. Admin authentication
5. Customer registration and login
6. Google login for customers
7. Secure session management
8. Password reset flow
9. Enquiry management
10. Customer account data
11. Razorpay payment integration
12. Payment verification
13. Razorpay webhook reconciliation
14. Payment-to-booking access flow
15. Calendly booking synchronization
16. Google Calendar / Google Meet flow through Calendly
17. Admin data APIs
18. Customer self-service APIs
19. Basic PDF reports
20. Security logging and selected audit events
21. Automated testing
22. Postman collection
23. API documentation
24. Deployment readiness
25. Final security review

DO NOT IMPLEMENT CMS FUNCTIONALITY.

==================================================
TECH STACK
==================================================

Use:

- Node.js
- Express.js
- JavaScript with ES Modules
- MongoDB
- Mongoose

Use stable, production-ready packages.

Preferred supporting packages where appropriate:

- bcrypt or argon2 for password hashing
- jsonwebtoken if JWTs are used
- official Google authentication library
- official Razorpay Node SDK
- zod for request validation
- helmet
- cors
- express-rate-limit
- dotenv
- cookie-parser if needed
- PDFKit or another suitable PDF library
- a proper logging library
- a test framework suitable for the existing project
- supertest for API tests where appropriate

Use the existing package manager already used by the project.

If the existing frontend is in the workspace, create the backend in:

/backend

Do not mix backend source files into frontend source folders.

==================================================
BEFORE WRITING CODE
==================================================

FIRST:

1. Inspect the complete existing project structure.
2. Identify the frontend framework.
3. Identify the package manager.
4. Check whether any backend code already exists.
5. Check whether any auth, Razorpay, Calendly, database or environment setup already exists.
6. Do not overwrite working code.
7. Identify all trust boundaries.
8. Identify all public, customer, admin and webhook routes.
9. Create a complete architecture plan.
10. Create a complete security review.

Create these files BEFORE main implementation:

- BACKEND_PLAN.md
- SECURITY_REVIEW.md
- docs/API_CONTRACT.md
- docs/FRONTEND_INTEGRATION.md

BACKEND_PLAN.md must describe:

- architecture
- folder structure
- database models
- API groups
- authentication design
- session design
- payment flow
- booking flow
- environment variables
- testing approach
- deployment assumptions

SECURITY_REVIEW.md must document:

- authentication threats
- authorization threats
- IDOR risks
- privilege escalation risks
- payment fraud risks
- webhook spoofing risks
- brute-force risks
- credential stuffing risks
- session theft risks
- refresh-token replay risks
- CSRF risks
- CORS risks
- NoSQL injection risks
- Google login risks
- account takeover risks
- password reset abuse risks
- account enumeration risks
- secret exposure risks
- sensitive data leakage risks
- denial-of-service and abuse risks
- logging risks
- deployment risks

Then proceed with implementation automatically.

Do not wait for confirmation unless a genuine blocker makes implementation impossible.

==================================================
RECOMMENDED BACKEND STRUCTURE
==================================================

Use a clean architecture similar to:

backend/
  src/
    config/
    controllers/
    middleware/
    models/
    routes/
    services/
    validators/
    utils/
    security/
    app.js
    server.js

  scripts/
  tests/
  docs/
  postman/
  .env.example
  .gitignore
  package.json
  README.md

Keep:

- routes thin
- controllers focused
- business logic in services
- validation reusable
- authorization explicit
- database access organized
- errors centralized
- security logic reusable

==================================================
AUTHENTICATION ARCHITECTURE
==================================================

There must be TWO COMPLETELY SEPARATE authentication systems:

1. ADMIN AUTHENTICATION
2. CUSTOMER AUTHENTICATION

Use "Customer" or "User" for website users.

Do not call normal users "Client" in the code because the business client is Mohnish Patwari / Confusion to Clarity.

Admin and Customer authentication must remain separate.

Rules:

- No public admin registration.
- A Customer can NEVER become an Admin through public APIs.
- Never accept role, permissions, isAdmin or adminAccess from customer requests.
- No shared login endpoint between admins and customers.
- Never trust hidden frontend buttons as security.
- Every protected request must verify identity server-side.
- Every protected request must verify authorization server-side.
- Every customer resource request must enforce ownership server-side.

Roles:

- ADMIN
- CUSTOMER

Do not add unnecessary roles unless the real project later requires them.

==================================================
SESSION AND TOKEN SECURITY
==================================================

Prefer secure browser authentication using HttpOnly cookies.

Recommended architecture:

- short-lived access session/token
- longer-lived refresh session/token
- refresh token rotation
- server-side revocation support
- hashed refresh token storage where persistence is required

Never store long-lived authentication tokens in:

- localStorage
- sessionStorage

Cookies in production must use appropriate:

- HttpOnly
- Secure
- SameSite

The exact SameSite setting must match the real frontend/backend deployment architecture.

If frontend and backend are cross-site and credentialed cookies are required:

- use exact CORS allowlists
- enable credentials only for approved origins
- implement explicit CSRF protections for state-changing requests where required
- validate Origin/Referer where appropriate

Do not use:

Access-Control-Allow-Origin: *

for authenticated APIs.

On these events, revoke relevant sessions:

- logout
- password change
- password reset
- account disable
- suspicious refresh replay

Do not store plain refresh tokens in the database.

Store hashes where server-side token persistence is required.

Implement refresh token rotation and replay detection where practical.

==================================================
ADMIN MODEL
==================================================

Create an Admin model.

Fields:

- adminId
- email
- passwordHash
- role
- status
- lastLoginAt
- passwordChangedAt
- createdAt
- updatedAt

Possible status:

- active
- disabled

Rules:

- no public registration
- password must be strongly hashed
- plain password must never be stored
- password must never be logged
- duplicate admin creation must be prevented

Create initial admins using one secure method:

- one-time seed script
or
- secure environment-based bootstrap

Preferred:

A one-time seed script that:

- reads credentials from environment variables
- hashes the password
- never prints the password
- does not create duplicate admins

==================================================
ADMIN AUTHENTICATION API
==================================================

Create:

POST /api/admin/auth/login
GET /api/admin/auth/me
POST /api/admin/auth/refresh
POST /api/admin/auth/logout

Admin login input:

{
  "identifier": "admin ID or email",
  "password": "..."
}

Requirements:

- strict route-specific rate limiting
- generic invalid credential errors
- password hashing verification
- safe session issuance
- refresh rotation
- session revocation
- disabled account protection
- brute-force protection
- credential stuffing resistance
- safe successful login logging
- safe failed login logging

Never reveal whether a specific admin ID or email exists.

==================================================
CUSTOMER MODEL
==================================================

Create a Customer model.

Recommended fields:

- fullName
- email
- phone
- passwordHash
- googleSubject
- authProviders
- emailVerified
- status
- lastLoginAt
- passwordChangedAt
- createdAt
- updatedAt

authProviders may include:

- local
- google

Possible status:

- active
- disabled

Never return:

- passwordHash
- refresh token hashes
- internal security fields
- provider tokens
- internal audit fields

==================================================
CUSTOMER REGISTRATION AND LOGIN
==================================================

Create:

POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET /api/auth/me

Registration input:

{
  "fullName": "...",
  "email": "...",
  "phone": "...",
  "password": "..."
}

Requirements:

- validate all fields
- normalize email
- validate phone format
- strong password policy
- securely hash password
- prevent duplicate accounts
- never log passwords
- never store plain passwords
- never accept role
- always create local users as CUSTOMER
- prevent mass assignment
- whitelist accepted fields

Do not store:

- plain password
- confirmPassword

Use generic authentication errors where appropriate.

Prevent account enumeration.

==================================================
PASSWORD RESET
==================================================

Create:

POST /api/auth/forgot-password
POST /api/auth/reset-password

Requirements:

- cryptographically random reset token
- store only a secure hash of the reset token
- short expiration
- one-time use
- invalidate token after successful reset
- revoke active sessions after successful reset
- never reveal whether a specific email exists
- rate limit reset requests
- prevent reset endpoint abuse

If email sending requires credentials that are unavailable:

- implement a clean email service abstraction
- document required environment variables
- do not fake successful delivery
- do not claim emails were sent if they were not
- keep development testing safe

==================================================
GOOGLE LOGIN FOR CUSTOMERS
==================================================

Create:

POST /api/auth/google

The frontend sends a Google credential / ID token.

The backend must:

1. Receive the Google ID token over HTTPS.
2. Verify it using the official supported Google server-side library.
3. Verify:
   - signature
   - issuer
   - audience
   - expiry
4. Ensure audience matches this application's Google Client ID.
5. Use the verified Google subject identifier as the Google identity.
6. Never trust raw email, name or Google user ID sent separately by the frontend.
7. Create or find the correct CUSTOMER account.
8. Issue this application's own secure session only after successful verification.

Use:

GOOGLE_CLIENT_ID=

Do not put server secrets in frontend code.

Do not silently merge conflicting accounts.

If an existing local account has the same email:

- use a secure account-linking policy
- avoid account takeover
- document the chosen behavior

Public Google login must NEVER authenticate an Admin account.

Admin auth and Customer auth must remain separate.

==================================================
AUTHORIZATION MIDDLEWARE
==================================================

Create reusable middleware such as:

- requireAuthenticatedCustomer
- requireAdmin
- requireOwnership
- requireActiveAccount

Never trust:

req.body.role
req.body.isAdmin
req.body.permissions
req.body.adminAccess

Reject or ignore sensitive fields on public routes.

Enforce all permissions server-side.

==================================================
IDOR PROTECTION
==================================================

Prevent Insecure Direct Object References.

Customers must only access their own resources.

Prefer:

GET /api/me/profile
GET /api/me/payments
GET /api/me/bookings

Do not use insecure customer APIs such as:

GET /api/users/:userId/payments

where changing userId could expose another user.

For resource-specific endpoints:

- derive customer identity from authenticated session
- verify ownership in the database
- never trust frontend ownership claims

Customer routes must never accept customerId for access decisions.

Admin routes may access broader business records only after verified ADMIN authorization.

==================================================
ENQUIRY SYSTEM
==================================================

Public endpoint:

POST /api/enquiries

Expected input:

- name
- email
- phone
- serviceId if available
- serviceName if needed
- message

Requirements:

- validation
- allowed-field whitelist
- sanitization where appropriate
- body size limits
- rate limiting
- spam resistance
- save to MongoDB
- safe response
- no raw database errors

Enquiry model fields:

- name
- email
- phone
- customerId if authenticated
- serviceId if available
- serviceName if available
- message
- status
- source
- createdAt
- updatedAt

Statuses:

- new
- contacted
- converted
- closed

Admin endpoints:

GET /api/admin/enquiries
GET /api/admin/enquiries/:id
PATCH /api/admin/enquiries/:id/status

Support:

- pagination
- date filtering
- status filtering
- search where reasonable

Do not allow arbitrary updates.

Only allow safe whitelisted status changes.

==================================================
SERVICE PAYMENT CATALOG
==================================================

IMPORTANT:

CMS is handled separately by my team.

However, payment amounts must NEVER come from the browser.

Create a minimal SERVER-SIDE authoritative payment catalog.

This is NOT a CMS.

It must contain:

- serviceId
- serviceName
- amountInPaise
- active
- Calendly event URL if different services use different booking links

There must be no public endpoint that allows changing prices.

Implement one clean option:

- database seed file + seed script
or
- secure server-side configuration

Choose the option that best fits the project.

Create placeholder services if final values are not yet available.

Document exactly where service names, prices and Calendly links must later be updated.

==================================================
PAYMENT MODEL
==================================================

Store:

- customerId
- serviceId
- serviceNameSnapshot
- amount
- currency
- Razorpay order ID
- Razorpay payment ID
- payment status
- verification status
- paidAt
- bookingReference
- createdAt
- updatedAt

Possible payment statuses:

- created
- authorized
- paid
- failed
- refunded

Rules:

- payment belongs to authenticated customer
- amount comes from server-side catalog
- customer ID comes from authenticated session
- never trust frontend amount
- never trust frontend customer ID

==================================================
RAZORPAY ORDER CREATION
==================================================

Create:

POST /api/payments/create-order

Customer authentication required.

Frontend should send only:

{
  "serviceId": "..."
}

Backend must:

1. Read authenticated customer identity from session.
2. Validate serviceId.
3. Find active service in server-side catalog.
4. Read authoritative amount from server.
5. Never accept arbitrary amount from frontend.
6. Create Razorpay order.
7. Save Payment record with status "created".
8. Link payment to authenticated customer.
9. Return only frontend-required data.

Do not expose unnecessary internal IDs.

==================================================
RAZORPAY PAYMENT VERIFICATION
==================================================

Create:

POST /api/payments/verify

Requirements:

1. Customer authentication required.
2. Find the server-created payment/order.
3. Verify ownership.
4. Verify Razorpay payment signature server-side.
5. Never trust frontend success alone.
6. Prevent replay side effects.
7. Mark payment paid only once.
8. Store Razorpay payment ID.
9. Record paidAt.
10. Generate a secure opaque bookingReference.
11. Generate booking access details.
12. Return booking URL only after verified payment.

Example safe response:

{
  "success": true,
  "data": {
    "paymentStatus": "paid",
    "bookingReference": "...",
    "bookingUrl": "..."
  }
}

Do not expose MongoDB IDs unnecessarily.

==================================================
RAZORPAY WEBHOOK
==================================================

Create:

POST /api/webhooks/razorpay

Requirements:

- raw request body handling where required
- webhook signature verification
- idempotent processing
- reject invalid signatures
- process only supported event types
- reconcile database state if frontend callback was missed
- safe event metadata logging
- no secret logging

Handle useful events such as:

- successful payment
- failed payment
- refund-related status if included in project scope

Never mark payment successful based on an unverified webhook.

Ensure webhook route ordering works correctly with global JSON parsing.

==================================================
PAYMENT SECURITY
==================================================

Critical rules:

- Customer must be authenticated before starting paid booking flow.
- Use authenticated customer identity.
- Accept serviceId only.
- Get price from server-side catalog.
- Create Razorpay orders server-side.
- Verify payment server-side.
- Verify Razorpay signatures.
- Verify Razorpay webhooks.
- Use idempotent processing.

A customer must not be able to:

- change ₹10 into ₹1
- claim another user's payment
- unlock booking using another payment
- replay verification to create duplicate success
- use a fake Razorpay payload
- reuse one payment for unlimited protected bookings

Securely link:

customerId
orderId
paymentId
bookingReference

==================================================
BOOKING FLOW
==================================================

Expected flow:

Customer visits website
→ registers or signs in
→ uses Google OR email/password
→ selects service
→ backend reads authenticated customer
→ backend reads server-side service price
→ Razorpay order is created
→ payment is securely verified
→ booking access is unlocked
→ customer opens Calendly
→ customer selects an available slot
→ Calendly handles availability
→ Google Calendar / Google Meet is handled through Mohnish Patwari's Calendly configuration
→ booking record is synchronized
→ customer can view own booking
→ admin can view all authorized booking records

Do NOT build a custom slot-management system.

Mohnish Patwari will manage inside Calendly:

- available days
- available hours
- session duration
- buffer time
- unavailable dates

==================================================
BOOKING REFERENCE LINKING
==================================================

After verified payment:

1. Generate a cryptographically secure opaque bookingReference.
2. Link it to the paid Payment record.
3. Attach it to the Calendly scheduling URL using an appropriate supported tracking mechanism.
4. Do not expose sensitive database information.
5. Return the resulting booking URL to the frontend.

Goal:

Payment
→ secure bookingReference
→ Calendly booking
→ webhook contains tracking reference
→ backend links booking to the correct Payment and Customer

If tracking data is missing:

- never link random bookings
- use a safe fallback only when unambiguous
- otherwise save booking as needs_review

Possible safe fallback:

- same verified email
- recent paid unbooked payment
- only one unambiguous candidate

If ambiguous:

status = needs_review

==================================================
BOOKING MODEL
==================================================

Store:

- customerId
- paymentId
- bookingReference
- customer details snapshot if needed
- service details snapshot
- Calendly event URI
- Calendly invitee URI
- event name
- start time
- end time
- timezone
- booking status
- cancellation information
- reschedule information if available
- createdAt
- updatedAt

Statuses:

- scheduled
- canceled
- rescheduled
- needs_review

Prevent duplicate webhook processing.

==================================================
CALENDLY WEBHOOK
==================================================

Create:

POST /api/webhooks/calendly

Use the currently supported Calendly API behavior.

Handle:

- invitee.created
- invitee.canceled
- reschedule behavior

Requirements:

- verify webhook authenticity/signature using the currently supported official method
- idempotent processing
- reject invalid requests
- extract booking reference from supported tracking data
- link booking to payment and customer
- save event/invitee details
- update cancellation state
- handle reschedules without corrupt duplicate records
- log safe metadata only

Do not store unnecessarily huge webhook payloads.

==================================================
CALENDLY AVAILABILITY / PLAN FALLBACK
==================================================

Do not blindly assume every Calendly account has the same API/webhook access.

Support:

MODE A:
Calendly webhook synchronization

Where possible:

MODE B:
Protected manual/admin-triggered sync using the supported Calendly API

Possible endpoint:

POST /api/admin/bookings/sync

Only implement manual sync if the current Calendly API and available account plan support it cleanly.

If availability depends on Calendly subscription:

- document it clearly
- do not fake functionality
- keep the rest of the backend working
- list the exact manual setup needed

==================================================
CUSTOMER SELF-SERVICE APIS
==================================================

Create:

GET /api/me/profile
PATCH /api/me/profile

GET /api/me/payments
GET /api/me/payments/:id

GET /api/me/bookings
GET /api/me/bookings/:id

Requirements:

- customer authentication required
- customer identity derived from session
- ownership enforced
- no customerId accepted for access decisions
- pagination where needed
- minimal safe fields
- no sensitive internal data

Customers can only access their own:

- profile
- payments
- bookings

Customers cannot access:

- all customers
- all enquiries
- all payments
- all bookings
- admin reports
- dashboard totals
- admin endpoints
- CMS

==================================================
ADMIN DATA APIS
==================================================

All admin routes must live under:

/api/admin/*

All require ADMIN authorization.

Dashboard:

GET /api/admin/dashboard/summary

Return useful totals such as:

- total enquiries
- new enquiries
- successful payments
- total revenue
- bookings
- upcoming bookings

Enquiries:

GET /api/admin/enquiries
GET /api/admin/enquiries/:id
PATCH /api/admin/enquiries/:id/status

Payments:

GET /api/admin/payments
GET /api/admin/payments/:id

Bookings:

GET /api/admin/bookings
GET /api/admin/bookings/:id

Customers:

GET /api/admin/customers
GET /api/admin/customers/:id

Support where appropriate:

- pagination
- date range
- status filters
- safe search
- safe sort with whitelisting

Do not return secrets or unnecessary internal fields.

==================================================
CUSTOMER DATA AGGREGATION
==================================================

Customer account exists for authentication and ownership.

Operational customer view may aggregate:

- Customer account
- Enquiries
- Payments
- Bookings

Avoid unnecessary duplicate customer documents.

Use secure database relationships.

Never accept customerId from the frontend for ownership decisions.

==================================================
PDF REPORTS
==================================================

Create protected admin PDF endpoints.

Support basic reports for:

- enquiries
- payments
- bookings
- customers

Examples:

GET /api/admin/reports/enquiries?from=&to=
GET /api/admin/reports/payments?from=&to=
GET /api/admin/reports/bookings?from=&to=
GET /api/admin/reports/customers?from=&to=

Requirements:

- admin authentication required
- date-range filtering
- readable professional layout
- dynamically generated
- downloadable PDF
- report title
- generation date
- selected date range
- basic summary
- tabular records

Do not overbuild analytics.

The project requires only basic reports.

==================================================
API SECURITY
==================================================

Classify every route as one of:

PUBLIC
CUSTOMER
ADMIN
WEBHOOK

Every route must have explicit access rules.

Requirements:

- validate inputs
- whitelist allowed fields
- reject unexpected sensitive fields
- sanitize where appropriate
- route-specific rate limits
- request body size limits
- safe minimal errors
- centralized errors
- no stack traces in production

Never do:

Model.find(req.query)

Never do:

Model.findOne(req.body)

Never pass complete req.body directly into database updates.

Explicitly whitelist fields for:

- create
- update
- filters
- sort
- search

==================================================
DATABASE SECURITY
==================================================

Use MongoDB and Mongoose securely.

Requirements:

- strict schema validation
- NoSQL injection prevention
- reject Mongo operators from untrusted input
- validate object IDs safely
- whitelist filters
- whitelist sortable fields
- never trust dynamic query objects
- least-privilege database credentials
- no database secrets in responses or logs

Never allow user input to directly control:

- Mongo operators
- collection names
- aggregation pipelines
- database commands

Production app database user must use only the permissions required by the application.

Do not use root/admin database credentials from the application unless absolutely unavoidable.

==================================================
CORS AND CSRF
==================================================

Use a strict CORS allowlist.

Origins must come from environment variables.

Example:

FRONTEND_URL=
ADMIN_FRONTEND_URL=
ADDITIONAL_ALLOWED_ORIGINS=

Rules:

- exact allowed origins only
- never reflect arbitrary Origin
- no wildcard authenticated CORS
- credentials enabled only where required

If cookie-based auth is used:

- assess CSRF risk
- implement CSRF protection on state-changing requests where required
- validate Origin/Referer where appropriate
- use secure SameSite settings

Document the final CORS and CSRF strategy.

==================================================
RATE LIMITING AND ABUSE PROTECTION
==================================================

Use separate limits for:

- admin login
- customer login
- registration
- Google login
- forgot password
- password reset
- enquiry submission
- payment order creation
- payment verification

Do not use one single generic rate limiter for everything.

Protect against:

- brute force
- credential stuffing
- account enumeration
- enquiry spam
- payment endpoint abuse
- password reset abuse

==================================================
SECRET MANAGEMENT
==================================================

Never hardcode:

- API keys
- passwords
- JWT secrets
- Google credentials
- Razorpay secrets
- webhook secrets
- MongoDB URI
- Calendly tokens
- admin passwords

Use environment variables.

Never expose secrets through:

- API responses
- logs
- frontend bundles
- source control
- error messages

Create:

.env.example

with placeholders only.

Ensure real environment files are in .gitignore.

Before completion:

- scan project for secrets
- scan Git-tracked files
- report any risk

==================================================
FILE UPLOAD SECURITY
==================================================

This backend does NOT own:

- CMS
- training clip upload
- media management

Therefore:

DO NOT CREATE FILE UPLOAD ENDPOINTS unless genuinely required by final agreed backend scope.

If file upload is ever added later:

- strict maximum size
- extension validation
- MIME validation
- magic byte verification
- random server-side filenames
- prevent executable uploads
- prevent path traversal
- store outside executable/public app directories
- use object storage where practical
- scan before public availability where scanning infrastructure exists

Never trust original filenames.

==================================================
WEBSITE INTEGRITY
==================================================

This operational backend must NOT provide APIs that can:

- modify deployed source code
- execute shell commands
- upload executable code
- change server configuration
- modify arbitrary files
- deploy frontend code
- access CMS editing functionality

Admin access to:

- enquiries
- customers
- payments
- bookings
- reports

does not mean server or deployment access.

Never create dangerous endpoints such as:

POST /api/admin/run-command
POST /api/admin/database-query
POST /api/admin/update-anything

==================================================
LOGGING AND AUDIT
==================================================

Create security-aware logging.

Log safe events such as:

- successful admin login
- failed admin login
- customer login
- failed customer login
- password reset request
- authorization failure
- payment state changes
- webhook verification failure
- important admin data access where useful

Never log:

- passwords
- access tokens
- refresh tokens
- Google ID tokens
- Razorpay secrets
- full sensitive payment payloads
- environment variables
- complete sensitive customer payloads

Create basic audit records for high-risk admin actions where appropriate.

==================================================
ENVIRONMENT VARIABLES
==================================================

Create a complete .env.example.

Include placeholders such as:

PORT=
NODE_ENV=
MONGODB_URI=

ACCESS_TOKEN_SECRET=
ACCESS_TOKEN_EXPIRES_IN=
REFRESH_TOKEN_SECRET=
REFRESH_TOKEN_EXPIRES_IN=

ADMIN_SEED_ID=
ADMIN_SEED_EMAIL=
ADMIN_SEED_PASSWORD=

FRONTEND_URL=
ADMIN_FRONTEND_URL=
ADDITIONAL_ALLOWED_ORIGINS=

GOOGLE_CLIENT_ID=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

CALENDLY_ACCESS_TOKEN=
CALENDLY_WEBHOOK_SIGNING_KEY=
CALENDLY_SCHEDULING_URL=

EMAIL_PROVIDER=
EMAIL_FROM=
EMAIL_API_KEY=
APP_BASE_URL=

Add only other genuinely required variables.

Never put real credentials in files.

==================================================
ERROR HANDLING
==================================================

Implement:

- centralized error middleware
- safe custom errors
- 404 handling
- validation errors
- authentication errors
- authorization errors
- integration errors
- production-safe responses

Use a consistent shape.

Success:

{
  "success": true,
  "data": {}
}

Error:

{
  "success": false,
  "message": "Safe user-facing message"
}

Never expose stack traces in production.

Never expose internal database messages directly.

==================================================
TESTING
==================================================

The frontend is not required for testing.

Test using:

- automated tests
- supertest where appropriate
- Postman collection
- mocked third-party services when necessary

Use a separate test database.

Do not perform real payments in automated tests.

==================================================
REQUIRED AUTHENTICATION TESTS
==================================================

Test:

- customer registration
- duplicate registration
- valid customer login
- invalid customer login
- Google login success
- invalid Google token
- expired Google token
- admin login
- invalid admin login
- customer cannot use admin routes
- admin cannot be created through customer registration
- role fields are ignored/rejected
- disabled customer cannot authenticate
- disabled admin cannot authenticate
- logout revokes session
- refresh flow works
- refresh token replay is handled safely where implemented
- password reset revokes relevant sessions

==================================================
REQUIRED AUTHORIZATION / IDOR TESTS
==================================================

Test:

- Customer A cannot access Customer B profile
- Customer A cannot access Customer B payment
- Customer A cannot access Customer B booking
- customer cannot change own role
- customer cannot submit isAdmin
- customer cannot access reports
- customer cannot access admin dashboard
- customer cannot list all customers
- unauthorized protected requests fail safely

==================================================
REQUIRED PAYMENT TESTS
==================================================

Test:

- valid order creation
- invalid service ID
- inactive service
- frontend amount tampering ignored/rejected
- server-controlled pricing
- customer cannot claim another payment
- signature verification
- invalid payment signature
- replayed payment verification
- payment cannot unlock booking before verification
- one payment cannot unlock unlimited bookings
- Razorpay webhook idempotency
- invalid Razorpay webhook cannot modify state
- missed frontend callback can be reconciled by valid webhook

==================================================
REQUIRED CALENDLY TESTS
==================================================

Test:

- valid booking webhook
- invalid webhook authenticity
- duplicate webhook event
- booking cancellation
- reschedule behavior
- missing tracking reference
- ambiguous fallback becomes needs_review
- customer/payment/booking linkage remains correct

==================================================
REQUIRED API SECURITY TESTS
==================================================

Test:

- Mongo operator injection rejected
- malformed object IDs handled safely
- unexpected sensitive fields rejected
- wildcard CORS not used
- unknown origins rejected
- rate limits work
- body size limits work
- production errors do not expose stack traces
- unsafe mass assignment is prevented
- untrusted query objects cannot control Mongo queries

==================================================
POSTMAN COLLECTION
==================================================

Create a complete Postman collection in:

postman/

Include:

- health
- customer register
- customer login
- Google login placeholder/testing notes
- customer profile
- customer payments
- customer bookings
- admin login
- admin me
- enquiries
- payment order creation
- payment verification
- admin dashboard
- admin enquiries
- admin payments
- admin bookings
- admin customers
- reports
- webhook testing notes

Use environment variables in Postman.

Do not hardcode secrets.

==================================================
FRONTEND API DOCUMENTATION
==================================================

Create:

docs/API_CONTRACT.md

For every endpoint document:

- method
- URL
- access type
- authentication requirement
- cookie/session requirements
- request body
- query parameters
- response body
- errors

Create:

docs/FRONTEND_INTEGRATION.md

Explain:

1. Customer registration flow
2. Customer login flow
3. Google login flow
4. Cookie/session usage
5. CSRF requirements if used
6. Enquiry form integration
7. Razorpay order flow
8. Razorpay Checkout frontend flow
9. Payment verification flow
10. Booking URL receipt
11. Calendly redirect/embed flow
12. Customer payments screen
13. Customer bookings screen
14. Admin login flow
15. Admin data APIs
16. PDF report downloads

==================================================
DEPLOYMENT READINESS
==================================================

Create:

GET /api/health

Include:

- graceful shutdown
- database connection handling
- environment validation
- production CORS
- secure cookies
- production logging
- trust proxy configuration only when deployment requires it
- npm scripts

Required command equivalents:

npm run dev
npm start
npm test

README.md must explain:

1. Installation
2. Environment setup
3. MongoDB setup
4. Least-privilege MongoDB user setup
5. Initial admin seeding
6. Service catalog setup
7. Google login setup
8. Razorpay test mode setup
9. Razorpay webhook setup
10. Calendly setup
11. Calendly webhook setup
12. Running locally
13. Running tests
14. Postman usage
15. Production deployment
16. CORS configuration
17. Cookie configuration
18. CSRF configuration if applicable
19. Secret management
20. Manual external account setup

==================================================
FINAL SECURITY REVIEW
==================================================

Before claiming completion:

1. Run all tests.
2. Review every route.
3. Classify every route as PUBLIC, CUSTOMER, ADMIN or WEBHOOK.
4. Confirm every protected route has required middleware.
5. Test IDOR manually.
6. Test role escalation.
7. Test payment amount tampering.
8. Test payment replay.
9. Test invalid webhook signatures.
10. Test unknown CORS origins.
11. Search for exposed secrets.
12. Search for unsafe req.body database usage.
13. Search for wildcard CORS.
14. Search for tokens stored in browser storage.
15. Review logs for sensitive information.
16. Verify production error responses expose no stack traces.
17. Verify admin registration does not exist.
18. Verify no CMS functionality was accidentally added.
19. Verify no dangerous code-execution endpoints exist.
20. Verify frontend can be developed independently from API documentation.

Create:

SECURITY_FINAL_REPORT.md

The report must contain:

- protections implemented
- tests performed
- test results
- known limitations
- manual setup still required
- deployment-dependent controls
- remaining risks
- recommended future improvements

Do not state:

"the application is fully secure"
or
"the application is unhackable"

State exactly:

- what was protected
- what was tested
- what still depends on deployment and third-party setup

==================================================
FINAL EXECUTION INSTRUCTIONS
==================================================

After implementation:

1. Install dependencies.
2. Run linting if configured.
3. Run all automated tests.
4. Fix errors automatically.
5. Start backend locally.
6. Verify /api/health.
7. Test main auth flows.
8. Test admin/customer separation.
9. Test enquiry creation.
10. Test payment order creation.
11. Test payment verification with mocked/test flow.
12. Test booking linkage logic.
13. Test report generation.
14. Ensure backend works without frontend.
15. Review for exposed secrets.
16. Review for accidental CMS implementation.
17. Review for accidental frontend modifications.
18. Generate final documentation.
19. Generate SECURITY_FINAL_REPORT.md.

Then provide a final implementation summary containing:

- files created
- architecture
- database models
- API endpoints
- authentication design
- security protections
- tests run
- test results
- environment variables still needed
- Google setup I must do manually
- Razorpay setup I must do manually
- Calendly setup Mohnish Patwari must do manually
- frontend integration instructions
- remaining TODO items
- known limitations

Do not claim a feature works unless it was actually implemented and tested.

START NOW:

1. Inspect the workspace.
2. Create BACKEND_PLAN.md.
3. Create SECURITY_REVIEW.md.
4. Proceed with the backend implementation.
