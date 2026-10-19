# Paylog — Comprehensive Test Plan & Verification Results

**Document:** 07-test-plan.md  
**Author:** Paylog QA & Engineering  
**Date:** October 2026  
**Status:** Executed & Verified  

---

## 1. Test Strategy Overview

Paylog employs a multi-tiered testing strategy ensuring that all financial operations, UPI intent generation, group split arithmetic, and PostgreSQL persistence operate with mathematical precision, strict data isolation, and idempotent reliability.

Testing Layers:
1. **Domain Unit Tests (`tests/unit/*.test.js`):** Pure functional testing of money calculations, integer paise conversions, deterministic remainder distribution, debt simplification, UPI QR parsing/URI building, and CSV formula injection sanitization.
2. **API Integration Tests (`tests/integration/*.test.js`):** Full end-to-end integration tests over HTTP against a live PostgreSQL 18 test database, verifying cookie-authenticated sessions, CSRF headers, IDOR security, atomic transactions, and idempotency.
3. **Frontend Build Verification (`npm run build`):** Verifies bundle compilation, JSX syntax, asset chunking, and Tailwind CSS tree-shaking with zero errors.

---

## 2. Test Execution Results

The entire test suite was executed against Node.js v24.12.0 and PostgreSQL 18.6:

```text
> paylog@1.0.0 test
> node --test tests/unit/*.test.js tests/integration/*.test.js

▶ Paylog API Integration Tests
  ✔ 1. Registers User A and receives session cookie (366ms)
  ✔ 2. User A sets monthly budget to ₹45,000 in profile (30ms)
  ✔ 3. User A creates a personal transaction (14ms)
  ✔ 4. Registers User B with separate session (139ms)
  ✔ 5. User B CANNOT delete or see User A transaction (IDOR Protection) (21ms)
  ✔ 6. UPI Payment Attempt Lifecycle & Idempotency (39ms)
  ✔ 7. Group creation, equal split with remainder, and settlement (112ms)
  ✔ 8. Safe CSV Export streams sanitized headers and authorized rows (8ms)
✔ Paylog API Integration Tests (743ms)

▶ CSV Sanitization & Export - Unit Tests
  ✔ escapes standard text values cleanly (1.5ms)
  ✔ doubles internal double quotes according to RFC 4180 (0.3ms)
  ✔ neutralizes formula injection characters (=, +, -, @, \t, \r) (1.7ms)
  ✔ generates a full sanitized CSV table (1.8ms)
✔ CSV Sanitization & Export - Unit Tests (7.4ms)

▶ Debt Simplifier - Unit Tests
  ✔ correctly calculates net balances from expenses and allocations (1.9ms)
  ✔ adjusts net balances when settlements are recorded (0.5ms)
  ✔ simplifies 3-way circular debts into minimal direct payments (3.6ms)
  ✔ preserves all individual net balances after simplification in complex 4-person group (0.4ms)
✔ Debt Simplifier - Unit Tests (8.6ms)

▶ Money Service - Unit Tests
  ▶ toPaise
    ✔ converts decimal amounts to integer paise accurately (1.5ms)
    ✔ rejects negative, zero, and invalid amounts (1.1ms)
  ✔ toPaise (4.1ms)
  ▶ formatInr
    ✔ formats integer paise into INR currency format (46.1ms)
    ✔ can omit currency symbol when requested (0.3ms)
  ✔ formatInr (48.1ms)
  ▶ splitEqual
    ✔ splits evenly divisible amounts exactly (1.3ms)
    ✔ deterministically distributes remainder paise (0.2ms)
    ✔ handles remainder larger than 1 paisa (2.5ms)
    ✔ rejects invalid inputs (1.1ms)
  ✔ splitEqual (6.0ms)
  ▶ calculateBudgetStatus
    ✔ returns remaining balance and overspent status correctly (0.5ms)
    ✔ handles unset budget safely without fabricating a default (0.3ms)
  ✔ calculateBudgetStatus (1.1ms)
  ▶ calculateNetCashFlow
    ✔ computes completed income minus completed expenses (0.4ms)
  ✔ calculateNetCashFlow (0.7ms)
✔ Money Service - Unit Tests (61.3ms)

▶ Payment Service - Unit Tests
  ▶ validateUpiId
    ✔ accepts valid UPI IDs (4.6ms)
    ✔ rejects invalid UPI IDs (0.4ms)
  ✔ validateUpiId (6.4ms)
  ▶ buildUpiUri
    ✔ generates standard RFC compliant upi://pay URI (0.8ms)
  ✔ buildUpiUri (1.1ms)
  ▶ parseUpiQr
    ✔ parses valid UPI QR code with amount (0.8ms)
    ✔ parses valid UPI QR code without amount (0.4ms)
    ✔ parses raw VPA string directly (0.3ms)
    ✔ rejects malformed and non-UPI strings (0.4ms)
  ✔ parseUpiQr (2.4ms)
✔ Payment Service - Unit Tests (12.8ms)

=======================================================
ℹ total tests: 34
ℹ suites: 13
ℹ passed: 34 (100%)
ℹ failed: 0
ℹ duration: 1.40s
=======================================================
```

---

## 3. Detailed Verification Breakdown

### 3.1 Financial Arithmetic & Remainder Distribution
- **Scenario:** Splitting ₹100.00 among 3 members.
  - $10,000 \text{ paise} / 3 = 3,333 \text{ base paise}, \text{ remainder } = 1 \text{ paisa}$.
  - Allocation: `[3334, 3333, 3333]`.
  - Invariant Verified: $\sum \text{shares} = 10,000 \text{ paise}$ exact. Zero floating point drift.
- **Scenario:** Negative Budget Overspending.
  - Configured budget: ₹50,000 (5,000,000 paise). Completed expenses: ₹60,000 (6,000,000 paise).
  - Remaining: -₹10,000 (-1,000,000 paise). `isOverspent: true`, `utilization: 120%`. Correctly displays overspent alert without crashing.
- **Scenario:** Unset Budget.
  - Returns `remainingPaise: null`. UI displays "Set Monthly Budget". Does not fabricate a fake ₹50,000 default.

### 3.2 Debt Simplification & Net Balances
- **Circular Debt Test:** Member A owes B ₹100; B owes C ₹100.
  - Simplifier reduces 2 multi-party transactions to 1 direct settlement: Member A pays Member C ₹100.
  - Net balances verified identical before and after simplification.

### 3.3 Security & IDOR Authorization
- **Test:** User B submits `DELETE /api/transactions/:userA_txId` using User B's session cookie.
  - Server verifies `WHERE id = $1 AND user_id = $2`.
  - Returns `404 Not Found` / `403 Forbidden`. User A's transaction is unaffected.
- **Test:** CSV Formula Injection.
  - Cells starting with `=DDE("cmd";"calc")` are sanitized to `"'=DDE(\"\"cmd\"\";\"\"calc\"\")"`.

### 3.4 UPI Lifecycle & Idempotency
- **Test:** Submitting identical `idempotencyKey` on `POST /api/payment-attempts`.
  - Server returns existing attempt without creating duplicate row.
- **Test:** Repeated `POST /api/payment-attempts/:id/outcome` with `status: 'successful'`.
  - Exactly 1 row inserted into `personal_transactions`. Subsequent outcome calls return existing transaction without duplicates.
