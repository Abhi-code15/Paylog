# Paylog — Product Research & Current-State Audit

**Document:** 01-product-research.md  
**Author:** Paylog Engineering Team  
**Date:** October 2026  
**Status:** Approved Baseline  

---

## 1. Executive Summary

Paylog is a personal-finance and shared-expense application engineered to eliminate the manual friction of tracking everyday transactions. It bridges two distinct but complementary financial needs:
1. **Core Pillar A (Personal Transactions):** Recording daily income and expenses with integrated, non-custodial UPI payment assistance, manual fallback, and monthly budget tracking.
2. **Core Pillar B (Shared Expenses & Group Splitting):** Splitwise-style group bill splitting supporting registered Paylog users and offline manual participants, deterministic equal splitting (integer paise with exact remainder distribution), viewer-centric net balances ("You owe ₹X" / "You are owed ₹Y"), debt simplification, and settlement tracking.

This document records the current-state codebase audit, visual reference review, user problem definition, competitive product benchmarks, risks, and foundational decisions before implementation.

---

## 2. Repository & Workspace Audit Findings

### 2.1 Workspace Overview
- **Active Workspace Directory:** `c:\Users\Vikash Tiwari\Desktop\Documents\Abhishek Tiwari\2028\Intern-Project\PayLog`
- **Prior Prototype Location:** `C:\Users\Vikash Tiwari\Desktop\Documents\Abhishek Tiwari\2028\Project\intern\Paylog`
- **Reference Spec & Asset Packages:**
  - `C:\Users\Vikash Tiwari\Desktop\Documents\Abhishek Tiwari\important\Paylog_Landing_Page_Spec_Bundle.zip`
  - `C:\Users\Vikash Tiwari\Downloads\Paylog_AI_Studio_Prompt_Package.zip`
  - `C:\Users\Vikash Tiwari\Downloads\Paylog_Final_Master_Build_Prompt.md`

### 2.2 Feature Classification of Prior Prototype

| Feature / Area | File Reference in Prior Repo | Status in Prior Prototype | Audit Evidence & Gap Analysis |
| :--- | :--- | :--- | :--- |
| **Language & Toolchain** | `package.json`, `tsconfig.json`, `server.ts`, `src/App.tsx` | **Non-Compliant (TypeScript)** | Built using TypeScript (`.ts`, `.tsx`, `tsx` runner). Master prompt strictly mandates JavaScript only (`.js`, `.jsx`). |
| **Data Persistence** | `server/db.ts`, `data/db.json` | **Mocked / File Fallback** | Runtime business logic fell back to reading/writing `data/db.json` when `DATABASE_URL` was unset. Violates Section 0.1 rule 7: PostgreSQL must be the single source of truth. |
| **Database Integration** | `server/db/postgres.ts`, `server/db/schema.sql` | **Partly Working / Disconnected** | `schema.sql` defined 15 tables with integer paise constraints, but was bypassed by `db.ts` file storage. |
| **Authentication & Sessions** | `server/routes/auth.ts`, `server.ts` | **Partly Working / Insecure** | Used in-memory session store when PostgreSQL unconfigured. Contained a 4-demo-identity switch menu (`usr_abhi`, `usr_rohit`, `usr_priya`, `usr_aarav`) violating privacy rules. |
| **Budget Management** | `server/db/schema.sql` (line 16: `DEFAULT 5000000`) | **Hardcoded Default** | Hardcoded ₹50,000 monthly budget default. An unset budget was not represented properly. |
| **UPI Flow & QR** | `src/components/upi/UpiPaymentFlow.tsx`, `server/routes/expenses.ts` | **Partly Working / Fragmented** | Separate "Scan & Pay" button on Overview/Expenses. Did not properly integrate QR amount replacement or link retry attempts cleanly. |
| **Groups & Splitting** | `server/routes/groups.ts`, `src/components/modals/CreateGroupModal.tsx` | **Hardcoded Demos** | Create group modal rendered a fixed array of demo friends rather than query registered friends and offline participants. |
| **Debt Simplification** | `server/financeEngine.ts` | **Working in Theory** | Implemented graph reduction for balances, but not tied to versioned SQL migrations. |
| **Landing Page Claims** | `src/components/auth/WelcomeLanding.tsx` | **Misleading Marketing** | Displayed "Hosting-Ready & Hardened Release" badge and unverified "Enterprise-grade security" claims. |

---

## 3. Visual Baseline & UI Reference Analysis

Screenshots provided in `Paylog_AI_Studio_Prompt_Package/references/`:
1. **`loading-splash-reference.jpg`**: Minimalist branded splash screen featuring the Paylog logo and "Loading Paylog...". Must provide a timeout and recoverable retry if the server is unreachable.
2. **`landing-page-reference.jpg`**: Navy/blue header, clear hero headline "Pay it. Log it. Done.", secondary copy, CTA buttons (Explore Demo, Sign In, Create Free Account), and 3 value-proposition feature cards.
3. **`01-expenses-page.jpg`**: Expenses ledger with Search input, Category and Payment Method filters, Transaction count badge, Totals bar, and transaction list items.
4. **`02-groups-page.jpg`**: Split Groups hub displaying active group cards with member counts, total shared expenses, net user balance, and "+ Create New Group" action.
5. **`03-create-group-modal.jpg`**: Group creation modal with Group Name, Group Type selector, Currency, Description, and Member selection.
6. **`04-friends-page.jpg`**: Friends list with 1-on-1 balances, search, and friend request actions.
7. **`05-reports-page.jpg`**: Monthly budget utilization gauge, Net Cash Flow breakdown, Category spending distribution, and spending trends.
8. **`06-profile-menu.jpg`**: Profile avatar dropdown with user details, theme toggle, and settings link.

### Explicit UI Refinements Required:
- Remove the "Hosting-Ready & Hardened Release" badge and unsupported "enterprise-grade security" claims.
- Remove independent "Scan & Pay" buttons from Overview and Expenses; unify all payment initiation under the **Add Transaction** flow.
- Retain only two primary Overview actions: **Add Transaction** and **Split Bill / Groups**.
- Remove the 4-demo-identity switcher; support exactly one isolated fictional demo session.
- Add a **Pending Payments** shortcut on the Dashboard to resolve awaiting UPI outcomes in 1 click.
- Add dedicated **Profile & Settings** page with editable display name, read-only email, optional UPI ID, and monthly budget configuration.

---

## 4. Problem Statement & Core Value

### The Problem
- **Expense Tracking Friction:** Most users pay instantly via UPI apps (GPay, PhonePe, Paytm, BHIM) on their phones, but manually logging them into a separate finance app is tedious, leading to forgotten records and inaccurate budgets.
- **Fragmented Group Splitting:** Group expenses on trips or flat shares require calculating who paid what, who shares which item, and manual reminders. Existing solutions either require all members to register with phonebook access or force complex account linking.

### Paylog's Solution
1. **Convenient Unified Transaction Flow:** When entering an expense, the user can choose `UPI Instant`, scan a merchant QR code or enter a UPI ID, review payee details, launch the external UPI app via standard `upi://pay` deep link, and immediately report the outcome (`Successful`, `Failed/Cancelled`, or `Pending`) upon returning.
2. **Frictionless Group Management:** Create groups with registered friends or manual offline participants. Calculate exact split shares with deterministic remainder distribution. Settle up recorded payments atomically.

---

## 5. Benchmarks & Product Observations

- **Splitwise:** Excellent debt simplification and equal/unequal splitting; however, lacks personal UPI intent integration and requires extensive contact-book uploads. Paylog adopts the debt simplification and balance model while prioritizing user privacy (no address-book uploads) and offline member support.
- **Axio (formerly Walnut) / Fold:** Uses SMS parsing or account aggregators. Paylog deliberately avoids reading private SMS or bank credentials; it operates as an honest user-directed ledger.
- **Standard UPI Deep Linking (NPCI Specifications):** `upi://pay?pa={vpa}&pn={name}&am={amount}&cu=INR&tn={note}` is supported natively across Indian UPI apps (Google Pay, PhonePe, Paytm, Cred, BHIM). Paylog initiates deep links cleanly and handles app handoffs responsibly.

---

## 6. Key Risks & Mitigation Strategy

1. **Floating Point Rounding Errors:**
   - *Risk:* Splitting ₹100.00 among 3 participants yields ₹33.3333..., causing balances to drift.
   - *Mitigation:* Store all financial values in integer paise (bigint/integer in PostgreSQL and JS). Deterministically allocate remainder paise (e.g., ₹33.34, ₹33.33, ₹33.33 = ₹100.00 exact).
2. **Duplicate Payment Attempts / Double Booking:**
   - *Risk:* User clicks "Pay Now" repeatedly or refreshes page, creating multiple completed expenses.
   - *Mitigation:* Generate server-persisted payment attempt with idempotency key before launching the external URI. State transitions to `completed` are atomic and idempotent.
3. **Data Isolation & Direct Object Reference (IDOR):**
   - *Risk:* User A queries User B's transaction or group by tampering with UUID in the API URL.
   - *Mitigation:* Server enforces session-based user authentication on every query (`WHERE user_id = $session_user_id` or verifies explicit group membership in SQL).
4. **CSV Injection:**
   - *Risk:* Malicious description starting with `=`, `+`, `-`, or `@` executes code when opened in Excel/Google Sheets.
   - *Mitigation:* Sanitize and prefix formula characters with `'` before exporting.

---

## 7. Strategic Decisions & MVP Scope

- **Language:** Pure JavaScript (Node.js + Express backend, React + Vite frontend). Zero TypeScript.
- **Database:** PostgreSQL only (running locally on port 5433 for dev/test, managed PostgreSQL for production). No JSON or SQLite fallbacks.
- **Currency:** Indian Rupee (INR / ₹) exclusively.
- **Splitting Logic:** Equal split with integer-paise remainder distribution in MVP.
- **Demo Mode:** Exactly one isolated fictional demo account (`demo@paylog.local`) operating on isolated fixtures without mutating real user accounts.
