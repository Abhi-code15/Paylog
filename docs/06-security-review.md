# Paylog — Security Review & Threat Mitigation

**Document:** 06-security-review.md  
**Author:** Paylog Engineering Team & Application Security Review  
**Date:** October 2026  
**Status:** Approved Security Baseline  

---

## 1. Threat Modeling & Mitigation Matrix

| Threat Category | Potential Vulnerability | Impact | Implemented Mitigation | Verification Mechanism |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication** | Brute-force credential guessing | Account takeover | `express-rate-limit` on `/api/auth/*` (max 20 attempts per 15 min window); `bcryptjs` salt rounds 10. | Integration test with repeated failed logins. |
| **Session Hijacking** | XSS stealing session token | Session theft | `connect-pg-simple` server session with `httpOnly: true`, `secure: true` in production, `sameSite: 'lax'`, rolling expiration. | Inspect `Set-Cookie` response headers in test. |
| **Insecure Direct Object Reference (IDOR)** | Attacker alters UUID in `/api/transactions/:id` or `/api/groups/:id` | Data breach / unauthorized modification | All SQL queries explicitly bind `user_id = $sessionUserId` or verify `group_members.user_id = $sessionUserId` via server-side JOIN. | Automated multi-user authorization tests. |
| **SQL Injection** | Malicious characters in search or payload | Data exfiltration / corruption | Exclusively parameterized queries (`$1, $2...`) via `pg` pool. Zero string concatenation in SQL queries. | Static analysis and test payloads containing SQL metacharacters (`' OR 1=1 --`). |
| **Cross-Site Request Forgery (CSRF)** | Malicious third-party site triggers state changes | Unauthorized transaction creation | Cookie set with `SameSite: 'lax'` (or `'strict'`), exact-origin CORS verification for API routes, `application/json` content-type enforcement. | Cross-origin fetch verification tests. |
| **CSV Formula Injection** | Descriptions starting with `=`, `+`, `-`, `@` execute in Excel | Remote command execution on user machine | CSV serializer prepends single-quote `'` to any cell starting with `=`, `+`, `-`, `@`, `\t`, `\r`. | Unit tests for malicious CSV payloads. |
| **UPI Double-Spend / Duplicate Expense** | User clicks "Pay Now" or reports outcome repeatedly | Corrupted ledger totals | Server generates unique `idempotency_key` on payment attempt. `outcome` handler uses PostgreSQL transaction to ensure at most one transaction per attempt. | Automated parallel outcome submission tests. |
| **Malicious QR Payee Spoofing** | Untrusted QR contains invalid scheme or huge values | URI injection / app crash | Strict regex validation of `pa` (VPA format) and `am` (max ₹10,000,000). Sanitized encoding of `pn` and `tn`. | QR parser fuzzing tests with invalid strings. |

---

## 2. Secrets & Environmental Discipline

1. **Zero Secret Leakage:**
   - No hardcoded secrets, database passwords, or JWT secrets exist in source code.
   - `.env` is explicitly ignored in `.gitignore`.
   - `.env.example` provides descriptive placeholders only.
2. **PostgreSQL Least Privilege:**
   - App communicates through dedicated connection string with parameterized queries.
3. **Demo Data Isolation:**
   - Demo session operates strictly under a dedicated fictional identity (`demo@paylog.local`).
   - Mutations by the demo user affect only synthetic data and cannot query or corrupt real registered users.
