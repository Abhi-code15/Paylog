# Paylog — Product Requirements Document (PRD)

**Document:** 03-PRD.md  
**Author:** Paylog Product & Engineering  
**Date:** October 2026  
**Status:** Approved for Implementation  

---

## 1. Product Vision & Goals

Paylog delivers a clean, professional, privacy-conscious personal finance tracker and Splitwise-style shared expense manager built specifically for the Indian financial ecosystem (INR / ₹) with seamless UPI deep-linking assistance.

### Non-Goals
- No bank account credentials, banking OTPs, or UPI PIN collection.
- No automated bank SMS scraping or synthetic claims of automated bank transaction verification.
- No automated WhatsApp sending, push notifications, or external messaging delivery claims.
- No cryptocurrency, investment tracking, multi-currency conversions, or loans in MVP.

---

## 2. Functional Feature Requirements

### 2.1 Navigation & Shell
- **Desktop Navigation:** Top navbar with Paylog logo, active links (Overview, Expenses, Groups, Friends, Reports), Pending Payments badge (when count > 0), Day/Night theme toggle, and Avatar menu leading to Profile & Settings and Sign Out.
- **Mobile Navigation:** Bottom navigation bar pinned at screen bottom displaying 5 primary tabs:
  1. `Overview` (Home icon)
  2. `Expenses` (Receipt/List icon)
  3. `Groups` (Users/Split icon)
  4. `Friends` (UserPlus/Handshake icon)
  5. `Reports` (BarChart/Pie icon)
- **Theme Support:** Dark mode and Light mode supported across all views and persisted to PostgreSQL `users.theme_preference` (and `localStorage` for pre-hydration rendering).

### 2.2 Public Landing Page
- **Hero Section:** Paylog logo mark, primary headline *"Pay it. Log it. Done."*, secondary description *"Make a payment, record your spending, and understand your money — all in one simple place."*.
- **Primary CTAs:**
  - `Explore Demo` — launches isolated fictional demo session.
  - `Sign In` — opens authentication modal.
  - `Create Free Account` — opens registration form.
- **Value Cards:**
  1. `Expense Tracking` — Log income and expenses, review transactions, and understand where money goes.
  2. `Easy Bill Splitting` — Split shared expenses with friends and see who owes whom.
  3. `Spending Insights` — View monthly spending summaries and useful trends.
- **Refinements:**
  - Removed "Hosting-Ready & Hardened Release" badge.
  - Removed unsupported "Enterprise-grade security" marketing claims.

### 2.3 Overview Dashboard
- **Primary Metrics Cards:**
  1. **This Month Spent:** Sum of completed expenses for current calendar month (`amount_paise`).
  2. **This Month Income:** Sum of completed income transactions for current calendar month.
  3. **Remaining Budget:** Configured monthly budget minus completed expenses.
     - *Unset Budget State:* Displays *"Set Monthly Budget"* linking directly to Settings. Never shows a fake ₹50,000 budget.
     - *Overspending State:* If spending exceeds budget, displays negative balance in alert red (e.g. `₹-4,500 Overspent`).
  4. **Shared Group Balance:** Net aggregated balance across all user's shared groups (positive = *"You are owed ₹X"*, negative = *"You owe ₹Y"*).
- **Charts & Visualizations:**
  - **Spending by Category:** Interactive breakdown of current month's expenses.
  - **Six-Month Spending Trend:** Historical monthly spending bars.
- **Recent Personal Expenses:** List of latest 5 personal transactions.
- **Pending Payments Shortcut:** Visible shortcut card/badge showing unresolved payment attempts with 1-click status update.
- **Two Primary Actions (Exclusively):**
  1. `Add Transaction` (opens unified transaction modal)
  2. `Split Bill / Groups` (navigates to Groups)

### 2.4 Unified Personal Transaction Module
- **Entry Point:** Unified `Add Transaction` modal with toggle for `Expense` vs `Income`.
- **Fields:**
  - **Type:** Expense (default) or Income.
  - **Amount:** Positive numeric value, stored as integer paise.
  - **Category:** Selected from predefined/custom categories. Separate categories for Income vs Expense.
  - **Transaction Date:** Defaults to current date (YYYY-MM-DD); editable for historical logging.
  - **Description / Note:** Optional text field.
  - **Payment Method:** Exactly 3 options:
    - `UPI Instant` (`upi_instant`)
    - `Cash` (`cash`)
    - `Other` (`other`)
- **Direct Recording vs Pay Now:**
  - For `Cash` and `Other`, form shows **"Save Transaction"** and records directly to PostgreSQL.
  - For `UPI Instant`:
    - If already paid elsewhere: Option **"Already Paid? Record It"** records the ledger expense directly without launching an external app.
    - If paying now: Option **"Pay Now / Launch UPI"** triggers the UPI flow.
  - For `Income` with `UPI Instant`: Treated as incoming ledger entry; **never** launches an outgoing UPI payment.

### 2.5 UPI Workflow & Deep-Link Intent
- **Step 1: Payee Identification:**
  - **Scan QR Code:** Accesses camera via HTML5 `getUserMedia`. Decodes standard UPI QR formats (`upi://pay?...`). Parses `pa` (payee VPA), `pn` (payee name), `am` (amount), `tn` (transaction note).
    - If QR contains an encoded amount: **Automatically replaces the form amount** with the QR amount.
    - If QR has no amount: Preserves the previously entered form amount.
    - If camera is denied or unavailable: Displays clear error message with immediate fallback to manual entry.
  - **Enter UPI ID Manually:** Accepts valid UPI format (`user@bank`).
- **Step 2: Payee Review:**
  - Displays payee name, UPI ID, and amount for user verification before initiating payment.
  - Missing payee name does not block payment launch.
- **Step 3: Launch Payment:**
  - Persists payment attempt to `payment_intents` table with status `created` and idempotency key.
  - Generates RFC-compliant UPI URI:
    `upi://pay?pa={encodedVpa}&pn={encodedName}&am={formattedAmount}&cu=INR&tn={encodedNote}`
  - Dispatches intent via `window.location.href = upiUri`.
- **Step 4: Outcome Reporting Upon Return:**
  - When user returns to Paylog tab/window, UI prompts:
    - `Successful`
    - `Failed / Cancelled`
    - `Pending`
  - Explicitly labelled as **User-Reported Outcome** (not bank verified).
  - Status updates are idempotent:
    - `Successful` creates exactly one linked transaction in `personal_transactions`.
    - `Failed / Cancelled` updates attempt status, creating zero ledger entries.
    - `Pending` preserves attempt for later resolution via Dashboard shortcut.
- **Step 5: Retry Failed Payment:**
  - Provides **"Retry Payment"** action on failed attempts.
  - Preserves prior transaction draft (amount, category, description).
  - Creates a new linked `payment_intent` record referencing the previous attempt ID; does not overwrite historical attempt.

### 2.6 Splitwise-Style Shared Expenses & Groups
- **Group Creation:**
  - Fields: Group Name, Group Type (`Trip`, `Apartment`, `Friends`, `Family`, `Event`, `Other`), Currency (`INR`), Optional Description.
  - Creator is automatically included as a member exactly once.
  - **Dynamic Member Management:**
    1. Select from accepted Paylog friends.
    2. Add manual participant by name (optional email/UPI ID).
  - Validates uniqueness to prevent duplicate members.
- **Group Expenses:**
  - Amount (> 0), Description, Date, Payer (selected from group members), Participants included in split.
  - **Equal Split Calculation:**
    - Uses exact integer paise arithmetic.
    - Deterministic remainder distribution: remainder paise assigned to the payer or first participant sequentially.
    - Sum of member shares equals total expense amount with zero rounding drift.
  - Atomically saved in `shared_expenses` and `shared_expense_allocations` via PostgreSQL transaction.
- **Group Balances & Perspectives:**
  - Displays total group expenses.
  - Computes net balance for each member.
  - Current viewer sees explicit status: *"You owe ₹250.00"* or *"You are owed ₹250.00"*.
  - Graph-based debt simplification minimizes total settlement transactions while preserving every member's net balance.
- **Settlement Recording:**
  - Record settlement between two members (payer, recipient, amount, date, payment method).
  - Applied atomically in PostgreSQL to reduce balances.
- **Share Summary:**
  - One-click **"Copy Summary"** generates human-readable text for sharing via WhatsApp, email, or message.

### 2.7 Friends & 1-on-1 Debts
- **Friend Discovery:** Search registered Paylog users by exact normalized email or username.
- **Request Lifecycle:** Send request (`pending`), Accept (`accepted`), Decline (`rejected`).
- **1-on-1 Balances:** View bilateral debts and record repayments between registered friends.

### 2.8 Reports, Search, & Sanitized CSV Export
- **Monthly Filters:** View spending and income filtered by month and year.
- **Financial Metrics:** Net cash flow (`completed_income - completed_expense`), budget utilization %, category breakdown.
- **Zero-Income Handling:** If income is zero, savings rate is cleanly hidden rather than displaying misleading percentages.
- **Sanitized CSV Export:**
  - Streams authorized transactions for the authenticated user only.
  - Sanitizes against CSV formula injection by prepending `'` to fields starting with `=`, `+`, `-`, or `@`.

### 2.9 Profile & Settings
- **Profile Details:** Edit display name. Account email is read-only.
- **Payment Detail:** Edit optional UPI ID with basic format validation.
- **Monthly Budget:** Set, update, or clear monthly budget in INR (persisted to PostgreSQL `users.monthly_budget_paise`).
- **Theme Preference:** Switch between light and dark themes.
- **Sign Out:** Terminates server session and clears cookie.
- **Demo Mode:** Single isolated fictional demo account (`demo@paylog.local`).

---

## 3. Acceptance Criteria & Definition of Done

1. **JavaScript Only:** No `.ts` or `.tsx` files in repository.
2. **PostgreSQL as Single Source of Truth:** Zero reliance on JSON file persistence or in-memory mock storage.
3. **Integer Money Calculations:** All financial operations use integer paise arithmetic; splits sum to exact total.
4. **Idempotent UPI Lifecycle:** Payment attempts cannot be duplicated into multiple ledger transactions.
5. **Security & Authorization:** Server validates session ownership on all routes; direct-object-reference attacks are prevented.
6. **Mobile UX:** Bottom navigation and responsive layouts function cleanly on viewports from 360px width upwards.
