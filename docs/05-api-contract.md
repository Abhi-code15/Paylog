# Paylog — API Contract & Endpoint Specification

**Document:** 05-api-contract.md  
**Author:** Paylog Engineering Team  
**Date:** October 2026  
**Status:** Approved Specification  

---

## 1. General Principles & Error Shape

### Standard Success Response
All endpoints return standard JSON responses with semantic HTTP status codes (`200 OK`, `201 Created`, `204 No Content`).

### Standard Error Response Shape
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please check the entered values.",
    "details": [
      { "field": "amountPaise", "message": "Amount must be a positive integer" }
    ]
  }
}
```

Standard Error Codes:
- `UNAUTHORIZED` (401) — Not logged in or session expired.
- `FORBIDDEN` (403) — Authenticated user lacks permission to access or modify resource.
- `NOT_FOUND` (404) — Requested entity does not exist.
- `VALIDATION_ERROR` (400) — Malformed payload, invalid field types, or out-of-range values.
- `CONFLICT` (409) — Uniqueness or idempotency violation (e.g. duplicate friend request).
- `INTERNAL_SERVER_ERROR` (500) — Unexpected server failure. Never leaks stack traces in production.

---

## 2. Authentication & Session Endpoints (`/api/auth`)

### `POST /api/auth/register`
- **Auth:** Public
- **Request Body:**
  ```json
  {
    "name": "Abhishek Tiwari",
    "email": "abhi@example.com",
    "password": "SecurePassword123"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "user": {
      "id": "usr_uuid",
      "name": "Abhishek Tiwari",
      "email": "abhi@example.com",
      "upiId": null,
      "monthlyBudgetPaise": null,
      "themePreference": "light"
    }
  }
  ```
- **Sets Cookie:** `paylog.sid` (HttpOnly, Secure, SameSite)

### `POST /api/auth/login`
- **Auth:** Public
- **Request Body:**
  ```json
  {
    "email": "abhi@example.com",
    "password": "SecurePassword123"
  }
  ```
- **Response (200 OK):** User profile object. Sets session cookie.

### `GET /api/auth/me`
- **Auth:** Protected (Cookie)
- **Response (200 OK):** Current session user or `{ "user": null }` if unauthenticated.

### `POST /api/auth/logout`
- **Auth:** Protected (Cookie)
- **Response (200 OK):**
  ```json
  { "success": true, "message": "Logged out successfully" }
  ```
- Clears session cookie and destroys session in PostgreSQL.

### `POST /api/auth/demo`
- **Auth:** Public
- **Description:** Establishes isolated demo session with synthetic data.
- **Response (200 OK):** Demo user profile object.

---

## 3. Profile & Settings (`/api/profile`)

### `GET /api/profile`
- **Auth:** Protected
- **Response (200 OK):** Profile details, monthly budget, theme preference, UPI ID.

### `PUT /api/profile`
- **Auth:** Protected
- **Request Body:**
  ```json
  {
    "name": "Abhishek T.",
    "upiId": "abhishek@okhdfcbank",
    "monthlyBudgetPaise": 4500000,
    "themePreference": "dark"
  }
  ```
- **Rules:**
  - `monthlyBudgetPaise` can be `null` to clear budget.
  - `email` cannot be updated here.

---

## 4. Categories (`/api/categories`)

### `GET /api/categories`
- **Auth:** Protected
- **Response (200 OK):** List of default system categories + user custom categories.

### `POST /api/categories`
- **Auth:** Protected
- **Request Body:**
  ```json
  {
    "name": "Gym & Fitness",
    "type": "expense",
    "icon": "Dumbbell",
    "color": "#10B981"
  }
  ```
- **Response (201 Created):** Created category record.

---

## 5. Personal Transactions (`/api/transactions`)

### `GET /api/transactions`
- **Auth:** Protected
- **Query Params:**
  - `search` (string) — matches description, merchant, or notes
  - `type` (`expense` | `income`)
  - `categoryId` (string)
  - `paymentMethod` (`upi_instant` | `cash` | `other`)
  - `status` (`completed` | `pending` | `failed` | `cancelled`)
  - `startDate`, `endDate` (YYYY-MM-DD)
  - `limit`, `offset`
- **Response (200 OK):**
  ```json
  {
    "transactions": [
      {
        "id": "tx_uuid",
        "amountPaise": 45000,
        "type": "expense",
        "description": "Lunch at Cafe",
        "categoryId": "cat_food",
        "categoryName": "Food",
        "transactionDate": "2026-10-19",
        "paymentMethod": "upi_instant",
        "recipientOrMerchant": "Cafe Central",
        "status": "completed",
        "confirmationSource": "manual",
        "createdAt": "2026-10-19T05:00:00.000Z"
      }
    ],
    "totalCount": 1,
    "completedExpensePaise": 45000,
    "completedIncomePaise": 0
  }
  ```

### `POST /api/transactions`
- **Auth:** Protected
- **Request Body:**
  ```json
  {
    "amountPaise": 45000,
    "type": "expense",
    "description": "Lunch at Cafe",
    "categoryId": "cat_food",
    "transactionDate": "2026-10-19",
    "paymentMethod": "cash",
    "recipientOrMerchant": "Cafe Central",
    "notes": "With team",
    "confirmationSource": "manual"
  }
  ```
- **Response (201 Created):** Persisted transaction object.

### `DELETE /api/transactions/:id`
- **Auth:** Protected (Must own transaction)
- **Response (200 OK):** `{ "success": true }`

---

## 6. Payment Attempts & UPI Workflow (`/api/payment-attempts`)

### `POST /api/payment-attempts`
- **Auth:** Protected
- **Request Body:**
  ```json
  {
    "amountPaise": 35000,
    "recipientUpiId": "merchant@icici",
    "recipientName": "Fresh Supermarket",
    "note": "Groceries",
    "paymentPath": "qr_scan",
    "idempotencyKey": "idem_12345678"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "paymentAttempt": {
      "id": "pi_uuid",
      "amountPaise": 35000,
      "recipientUpiId": "merchant@icici",
      "recipientName": "Fresh Supermarket",
      "status": "created",
      "idempotencyKey": "idem_12345678"
    },
    "upiUri": "upi://pay?pa=merchant@icici&pn=Fresh%20Supermarket&am=350.00&cu=INR&tn=Groceries"
  }
  ```

### `POST /api/payment-attempts/:id/outcome`
- **Auth:** Protected (Must own attempt)
- **Request Body:**
  ```json
  {
    "status": "successful",
    "categoryId": "cat_groceries",
    "description": "Weekly Groceries",
    "transactionDate": "2026-10-19"
  }
  ```
- **Rules:**
  - Idempotent: If attempt is already `completed`, returns existing linked transaction without creating a duplicate.
  - Allowed status: `successful` (creates transaction), `failed_or_cancelled` (marks failed, 0 transactions), `pending` (marks pending).
- **Response (200 OK):**
  ```json
  {
    "paymentAttempt": { "id": "pi_uuid", "status": "completed" },
    "transaction": { "id": "tx_uuid", "amountPaise": 35000, "status": "completed" }
  }
  ```

### `GET /api/payment-attempts/pending`
- **Auth:** Protected
- **Response (200 OK):** List of attempts where `status = 'pending'` or `status = 'created'`.

### `POST /api/payment-attempts/:id/retry`
- **Auth:** Protected (Must own attempt)
- **Request Body:** (Optional updated payee/amount)
- **Response (201 Created):** New payment attempt referencing `previous_attempt_id`.

---

## 7. Groups & Shared Expenses (`/api/groups`)

### `POST /api/groups`
- **Auth:** Protected
- **Request Body:**
  ```json
  {
    "name": "Goa Trip 2026",
    "groupType": "trip",
    "currency": "INR",
    "description": "Beach vacation expenses",
    "members": [
      { "type": "friend", "userId": "usr_rohit_id" },
      { "type": "manual", "name": "Karan", "email": "karan@example.com", "upiId": "karan@upi" }
    ]
  }
  ```
- **Response (201 Created):** Group object with member array (including creator).

### `GET /api/groups`
- **Auth:** Protected
- **Response (200 OK):** List of groups current user is a member of, with member count, total expenses, and viewer's net balance.

### `GET /api/groups/:id`
- **Auth:** Protected (Must be group member)
- **Response (200 OK):**
  ```json
  {
    "group": { "id": "grp_uuid", "name": "Goa Trip 2026", "groupType": "trip" },
    "members": [
      { "id": "gm_1", "userId": "usr_abhi", "name": "Abhishek", "isCurrentUser": true },
      { "id": "gm_2", "userId": null, "name": "Karan", "isManual": true }
    ],
    "expenses": [...],
    "netBalances": [
      { "memberId": "gm_1", "name": "Abhishek", "netPaise": 250000 },
      { "memberId": "gm_2", "name": "Karan", "netPaise": -250000 }
    ],
    "viewerBalance": {
      "netPaise": 250000,
      "text": "You are owed ₹2,500.00"
    },
    "simplifiedDebts": [
      { "fromMemberId": "gm_2", "fromName": "Karan", "toMemberId": "gm_1", "toName": "Abhishek", "amountPaise": 250000 }
    ]
  }
  ```

### `POST /api/groups/:id/expenses`
- **Auth:** Protected (Group member)
- **Request Body:**
  ```json
  {
    "title": "Villa Booking",
    "totalAmountPaise": 1200000,
    "categoryId": "cat_travel",
    "expenseDate": "2026-10-19",
    "payerMemberId": "gm_1",
    "participantMemberIds": ["gm_1", "gm_2", "gm_3"],
    "splitMethod": "equal"
  }
  ```
- **Response (201 Created):** Created expense and allocations.

---

## 8. Settlements (`/api/settlements`)

### `POST /api/settlements`
- **Auth:** Protected (Member of relevant group)
- **Request Body:**
  ```json
  {
    "groupId": "grp_uuid",
    "fromMemberId": "gm_2",
    "toMemberId": "gm_1",
    "amountPaise": 250000,
    "settlementDate": "2026-10-19",
    "paymentMethod": "upi",
    "notes": "Paid via PhonePe"
  }
  ```
- **Response (201 Created):** Persisted settlement.

---

## 9. Friends (`/api/friends`)

### `GET /api/friends`
- **Auth:** Protected
- **Response (200 OK):** List of accepted friends and incoming/outgoing pending requests.

### `POST /api/friends/request`
- **Auth:** Protected
- **Request Body:**
  ```json
  { "emailOrUsername": "rohit@example.com" }
  ```
- **Response (201 Created):** Request created.

### `POST /api/friends/requests/:id/respond`
- **Auth:** Protected (Recipient of request)
- **Request Body:**
  ```json
  { "action": "accept" } // or "decline"
  ```
- **Response (200 OK):** Updated connection status.

---

## 10. Reports & CSV Export (`/api/reports`)

### `GET /api/reports/summary`
- **Auth:** Protected
- **Query Params:** `year` (e.g. 2026), `month` (e.g. 10)
- **Response (200 OK):**
  ```json
  {
    "month": 10,
    "year": 2026,
    "completedExpensePaise": 350000,
    "completedIncomePaise": 750000,
    "netCashFlowPaise": 400000,
    "monthlyBudgetPaise": 500000,
    "remainingBudgetPaise": 150000,
    "isOverspent": false,
    "categoryBreakdown": [
      { "categoryName": "Food", "amountPaise": 150000, "percentage": 42.86 }
    ],
    "sixMonthTrend": [
      { "month": "2026-05", "expensePaise": 280000, "incomePaise": 700000 }
    ]
  }
  ```

### `GET /api/reports/export-csv`
- **Auth:** Protected
- **Query Params:** `startDate`, `endDate`
- **Response:** Content-Type: `text/csv; charset=utf-8`, Content-Disposition: `attachment; filename="paylog_transactions.csv"`
- Sanitized against spreadsheet formula injection.
