# Paylog — Pay it. Log it. Done.

[![Tests](https://img.shields.io/badge/tests-34%20passed-emerald)](./docs/07-test-plan.md)
[![Database](https://img.shields.io/badge/database-PostgreSQL%2018-blue)](./docs/04-data-model.md)
[![Language](https://img.shields.io/badge/language-JavaScript%20(Pure)-yellow)](./package.json)
[![License](https://img.shields.io/badge/license-MIT-slate)](./LICENSE)

**Paylog** is a personal-finance and shared-expense application engineered to eliminate the manual friction of tracking everyday transactions. Built specifically for the Indian financial ecosystem (INR ₹), Paylog bridges two core pillars:

1. **Personal Transactions with UPI-Assisted Recording:** Enter an expense, scan a standard merchant UPI QR code or enter a UPI ID, review payee details, launch an installed UPI application (GPay, PhonePe, Paytm, BHIM) via standard deep link, and report the outcome (`Successful`, `Failed`, or `Pending`) upon returning.
2. **Splitwise-Style Shared Expenses & Groups:** Create groups with registered friends or offline manual participants, split shared bills equally with deterministic integer-paise remainder distribution, compute viewer-centric net balances ("You are owed ₹X" / "You owe ₹Y"), simplify multi-party debts into minimal settlements, and export/share summaries.

---

## 1. Key Highlights & Technical Principles

- **100% Pure JavaScript:** Built strictly in JavaScript & JSX (`.js`, `.jsx`). Zero TypeScript toolchains or `.ts`/`.tsx` files.
- **PostgreSQL Single Source of Truth:** All transactions, budgets, groups, member allocations, and payment attempts are persisted strictly in PostgreSQL using parameterized queries and versioned migrations. Zero JSON-file, in-memory, or SQLite fallbacks.
- **Integer Paise Money Arithmetic:** All monetary amounts are stored and calculated in integer Paise ($1\text{ INR} = 100\text{ Paise}$). Remainder paise during equal splits are deterministically allocated. Total shares always equal the total expense down to the exact paisa.
- **Idempotent UPI Lifecycle:** Payment attempts are persisted before external app handoff. Reporting outcomes is idempotent, preventing duplicate ledger entries.
- **Dedicated Profile & Settings:** Configure user display name, read-only email, optional UPI ID, and persistent monthly budget.
- **Safe CSV Export:** Streams sanitized CSVs escaping spreadsheet formula characters (`=`, `+`, `-`, `@`) to prevent CSV injection.
- **Clean UI & Theme:** Responsive on desktop and mobile (pinned bottom navigation), supporting light and dark modes.

---

## 2. Tech Stack

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | React 19 + Vite | JavaScript / JSX client with responsive layout |
| **Styling** | Tailwind CSS v4 | Clean, professional UI matching Paylog's blue/navy identity |
| **Backend** | Node.js + Express | RESTful API with centralized error handling |
| **Database** | PostgreSQL 18 | Relational database with foreign keys & check constraints |
| **DB Driver** | `pg` (node-postgres) | Connection pool with parameterized SQL queries |
| **Sessions** | `express-session` + `connect-pg-simple` | Secure, HttpOnly cookie sessions stored in PostgreSQL |
| **Security** | `helmet`, `bcryptjs`, `express-rate-limit` | Password hashing, security headers, rate limiting |
| **Test Runner**| Node.js native test runner (`node:test`) | Unit tests and live API integration tests |

---

## 3. Quick Start & Local Setup

### Prerequisites
- **Node.js:** v20.x, v22.x, or v24.x (`node -v`)
- **PostgreSQL:** Running PostgreSQL instance (`psql --version`)

### Installation & Database Initialization

1. **Clone and enter the workspace:**
   ```bash
   cd PayLog
   ```

2. **Configure Environment Variables:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Ensure `DATABASE_URL` points to your PostgreSQL instance (e.g. `postgresql://postgres:postgres@localhost:5432/paylog`).

3. **Install Dependencies:**
   ```bash
   npm install
   ```

4. **Run Database Migrations:**
   Executes idempotent SQL migrations in `server/db/migrations/`:
   ```bash
   npm run migrate
   ```

5. **(Optional) Seed Isolated Fictional Demo Data:**
   ```bash
   npm run seed
   ```

6. **Run Automated Test Suite:**
   Executes 34 domain unit tests and integration tests against PostgreSQL:
   ```bash
   npm test
   ```

7. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

8. **Build for Production:**
   ```bash
   npm run build
   npm start
   ```

---

## 4. Documentation Index

Comprehensive documentation is maintained in the `docs/` directory:

1. [01-product-research.md](./docs/01-product-research.md) — Current-state codebase audit, problem statement, benchmarks, and risk analysis.
2. [02-users-and-journeys.md](./docs/02-users-and-journeys.md) — User types, permissions matrix, and step-by-step user journeys.
3. [03-PRD.md](./docs/03-PRD.md) — Product requirements document, acceptance criteria, and feature scopes.
4. [04-data-model.md](./docs/04-data-model.md) — Entity-relationship diagram, table schemas, and integer paise money rules.
5. [05-api-contract.md](./docs/05-api-contract.md) — REST API endpoint schemas, request/response bodies, and error formats.
6. [06-security-review.md](./docs/06-security-review.md) — Threat model, IDOR protection, session security, and formula injection mitigations.
7. [07-test-plan.md](./docs/07-test-plan.md) — Test plan, test cases, and test execution report (34 passing tests).
8. [08-operations-and-deployment.md](./docs/08-operations-and-deployment.md) — Deployment instructions, Docker containerization, and backup/restore procedures.

---

## 5. Known Limitations & Roadmap

- **UPI Verification:** Payment outcomes are user-reported. Paylog does not act as a payment gateway or connect to bank APIs.
- **Splitting Methods:** Equal splitting with remainder paise distribution is fully supported in MVP. Custom percentage/share splitting is ready in database schema and planned for future release.
- **Offline Members:** Offline manual participants are group-scoped participant records and do not receive login access or automated SMS/WhatsApp alerts.
