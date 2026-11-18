# Paylog — Pay it. Log it. Done.

[![Tests](https://img.shields.io/badge/tests-35%20passed-emerald)](./tests/)
[![Database](https://img.shields.io/badge/database-PostgreSQL%2018-blue)](./server/db/)
[![Language](https://img.shields.io/badge/language-JavaScript%20(Pure)-yellow)](./package.json)
[![License](https://img.shields.io/badge/license-MIT-slate)](./LICENSE)

**Paylog** is an easy-to-use personal finance tracker and shared-expense manager built for India (INR ₹).

It helps you track your daily spending, manage monthly budgets, and split group bills with friends — without complicated math or rounding errors.

Created with ❤️ by **Abhishek Tiwari**.

---

## 🚀 How It Works

Here is a simple flow diagram showing how Paylog works:

```mermaid
flowchart TD
    User["👤 You (User)"] --> Choice{"What do you want to do?"}

    %% Personal Spending Flow
    Choice -->|"Track Personal Expense"| Personal["1. Enter Expense or Scan UPI QR"]
    Personal --> UpiLink["2. Paylog generates Anti-Fraud UPI Link<br/>(Leaves amount blank to stop app blocks)"]
    UpiLink --> UpiApp["3. Opens your UPI App<br/>(GPay / PhonePe / Paytm)"]
    UpiApp --> Confirm["4. You type amount & pay in your UPI app"]
    Confirm --> Ledger["5. Paylog saves it in PostgreSQL<br/>(Saved in exact paise, zero math errors)"]

    %% Shared Expenses Flow
    Choice -->|"Split Bill with Friends"| Group["1. Create a Group & Add Friends"]
    Group --> AddBill["2. Add a Shared Bill (e.g. ₹8,400 Trip)"]
    AddBill --> Math["3. Exact Integer Split<br/>(Everyone gets fair share down to 1 paisa)"]
    Math --> Simplify["4. Debt Simplification<br/>(Simplifies who pays who in fewest steps)"]
    Simplify --> Settle["5. Settle balances directly via UPI"]
```

---

## ✨ Key Features

- **Exact Math (Zero Float Errors):** All money is calculated in integer **Paise** (₹1 = 100 paise). You will never lose even 1 paisa to computer rounding bugs.
- **Smart Anti-Fraud UPI Links:** When creating UPI payment links, Paylog leaves out the `am` (amount) parameter. This stops apps like Paytm and PhonePe from flagging or blocking the payment. You type the amount safely inside your UPI app.
- **Easy Bill Splitting:** Split group expenses equally with friends or flatmates. Remainder paise are shared fairly and automatically.
- **Debt Simplification:** If person A owes B, and B owes C, Paylog calculates a shortcut so A can pay C directly.
- **Pure Dark & Light Mode:** Sleek, true OLED black dark theme (no ugly blue tint) and clean, responsive design that works on mobile phones and computers.
- **Interactive Landing Page:** Try out the bill-split simulator and smart UPI generator live directly on the home page before signing up.
- **Google Sign-In & Email Login:** Quick access with Google authentication or standard email login.
- **Safe CSV Exports:** Download your expense history anytime in CSV format, safely protected against spreadsheet formula tricks.
- **PostgreSQL Database:** Reliable and secure data storage backed by relational PostgreSQL.

---

## 🛠️ Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 19 + Vite | Fast, modern client app built with pure JavaScript & JSX |
| **Styling** | Tailwind CSS v4 | Clean UI with true black dark mode and mobile-ready layouts |
| **Icons** | Lucide React | Lightweight and modern UI icons |
| **Backend** | Node.js + Express | REST API with clean error handling and session management |
| **Database** | PostgreSQL | Relational database with strict integer paise storage |
| **Testing** | Node.js Native Runner | 35 automated unit and integration tests |

---

## 🏁 Quick Start & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (version 20 or higher)
- [PostgreSQL](https://www.postgresql.org/) (running locally or remotely)

### Step-by-Step Guide

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Abhi-code15/Paylog.git
   cd Paylog
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment settings:**
   Copy the example `.env` file:
   ```bash
   cp .env.example .env
   ```
   Set your database connection URL inside `.env`:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/paylog
   PORT=3000
   ```

4. **Run database migrations:**
   ```bash
   npm run migrate
   ```

5. **(Optional) Add sample demo data:**
   ```bash
   npm run seed
   ```

6. **Run tests:**
   ```bash
   npm test
   ```
   *(All 35 tests should pass)*

7. **Start the local server:**
   ```bash
   npm run dev
   ```
   Open **http://localhost:3000** in your web browser!

---

## 📄 Project Documentation

For deeper technical details, explore the `docs/` folder:
- [01-product-research.md](./docs/01-product-research.md) — Research and goals
- [02-users-and-journeys.md](./docs/02-users-and-journeys.md) — User flows and permissions
- [03-PRD.md](./docs/03-PRD.md) — Product requirements document
- [04-data-model.md](./docs/04-data-model.md) — Database schema & paise math rules
- [05-api-contract.md](./docs/05-api-contract.md) — API endpoints & request formats
- [06-security-review.md](./docs/06-security-review.md) — Security safeguards
- [07-test-plan.md](./docs/07-test-plan.md) — Test cases & test coverage
- [08-operations-and-deployment.md](./docs/08-operations-and-deployment.md) — Deployment & production setup

---

## 📝 License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.
