import crypto from 'crypto';
import { pool, withTransaction } from '../pool.js';
import { seedUserCategories } from '../../services/categoryService.js';

export async function seedDemoData() {
  console.log('[Seed Demo] Initializing isolated fictional demo fixtures...');

  const demoUserId = 'usr_demo_fictional';
  const friend1Id = 'usr_demo_rohit';
  const friend2Id = 'usr_demo_priya';
  const friend3Id = 'usr_demo_aarav';

  await withTransaction(async (client) => {
    // 1. Create Demo User
    await client.query(
      `INSERT INTO users (id, name, email, upi_id, monthly_budget_paise, theme_preference, is_demo)
       VALUES ($1, 'Abhishek Tiwari', 'demo@paylog.local', 'abhishek@okhdfcbank', 5000000, 'light', TRUE)
       ON CONFLICT (id) DO UPDATE
       SET name = EXCLUDED.name, monthly_budget_paise = EXCLUDED.monthly_budget_paise;`,
      [demoUserId]
    );

    // 2. Create Fictional Friends
    const friends = [
      { id: friend1Id, name: 'Rohit Sharma', email: 'rohit.sharma@paylog.demo', upiId: 'rohit@icici' },
      { id: friend2Id, name: 'Priya Verma', email: 'priya.verma@paylog.demo', upiId: 'priya@okhdfcbank' },
      { id: friend3Id, name: 'Aarav Patel', email: 'aarav.patel@paylog.demo', upiId: 'aarav@axisbank' },
    ];

    for (const f of friends) {
      await client.query(
        `INSERT INTO users (id, name, email, upi_id, is_demo)
         VALUES ($1, $2, $3, $4, TRUE)
         ON CONFLICT (id) DO NOTHING;`,
        [f.id, f.name, f.email, f.upiId]
      );

      // Create accepted friendship with demo user
      const fcId = `fc_demo_${f.id}`;
      await client.query(
        `INSERT INTO friend_connections (id, user_id, friend_user_id, status)
         VALUES ($1, $2, $3, 'accepted')
         ON CONFLICT DO NOTHING;`,
        [fcId, demoUserId, f.id]
      );
    }

    // 3. Seed Categories
    await seedUserCategories(demoUserId, client);

    // Fetch food & transport categories
    const catRes = await client.query('SELECT id, name FROM categories WHERE user_id = $1;', [demoUserId]);
    const catMap = new Map(catRes.rows.map((r) => [r.name, r.id]));

    // 4. Seed Personal Transactions for Demo User
    const today = new Date();
    const curYear = today.getFullYear();
    const curMonth = String(today.getMonth() + 1).padStart(2, '0');

    const sampleTransactions = [
      {
        desc: 'Monthly Tech Salary',
        type: 'income',
        amount: 8500000, // ₹85,000
        cat: 'Salary',
        method: 'other',
        date: `${curYear}-${curMonth}-01`,
        merchant: 'Acme Corp',
      },
      {
        desc: 'Weekly Supermarket Groceries',
        type: 'expense',
        amount: 345000, // ₹3,450
        cat: 'Groceries',
        method: 'upi_instant',
        date: `${curYear}-${curMonth}-04`,
        merchant: 'Nature Basket',
      },
      {
        desc: 'Team Italian Dinner',
        type: 'expense',
        amount: 185000, // ₹1,850
        cat: 'Food',
        method: 'upi_instant',
        date: `${curYear}-${curMonth}-08`,
        merchant: 'Trattoria Cafe',
      },
      {
        desc: 'Cab to Airport',
        type: 'expense',
        amount: 85000, // ₹850
        cat: 'Transport',
        method: 'cash',
        date: `${curYear}-${curMonth}-12`,
        merchant: 'City Cabs',
      },
      {
        desc: 'Fiber Internet Bill',
        type: 'expense',
        amount: 119900, // ₹1,199
        cat: 'Bills & Utilities',
        method: 'upi_instant',
        date: `${curYear}-${curMonth}-15`,
        merchant: 'Airtel Broadband',
      },
    ];

    for (const tx of sampleTransactions) {
      const txId = `tx_demo_${crypto.randomUUID()}`;
      const catId = catMap.get(tx.cat) || null;
      await client.query(
        `INSERT INTO personal_transactions (
          id, user_id, amount_paise, type, description, category_id, category_name,
          transaction_date, payment_method, recipient_or_merchant, status, confirmation_source
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'completed', 'manual')
        ON CONFLICT DO NOTHING;`,
        [txId, demoUserId, tx.amount, tx.type, tx.desc, catId, tx.cat, tx.date, tx.method, tx.merchant]
      );
    }

    // 5. Create a Shared Group: "Goa Beach Trip 2026"
    const grpId = 'grp_demo_goa';
    await client.query(
      `INSERT INTO groups (id, name, description, group_type, currency, created_by_user_id)
       VALUES ($1, 'Goa Beach Trip 2026', 'Villa, transport, and seafood expenses', 'trip', 'INR', $2)
       ON CONFLICT (id) DO NOTHING;`,
      [grpId, demoUserId]
    );

    // Group Members: Abhishek (creator), Rohit, Priya, and an offline friend "Karan"
    const mCreatorId = 'gm_demo_abhi';
    const mRohitId = 'gm_demo_rohit';
    const mPriyaId = 'gm_demo_priya';
    const mKaranId = 'gm_demo_karan';

    await client.query(
      `INSERT INTO group_members (id, group_id, user_id, role)
       VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (id) DO NOTHING;`,
      [mCreatorId, grpId, demoUserId]
    );

    await client.query(
      `INSERT INTO group_members (id, group_id, user_id, role)
       VALUES ($1, $2, $3, 'member')
       ON CONFLICT (id) DO NOTHING;`,
      [mRohitId, grpId, friend1Id]
    );

    await client.query(
      `INSERT INTO group_members (id, group_id, user_id, role)
       VALUES ($1, $2, $3, 'member')
       ON CONFLICT (id) DO NOTHING;`,
      [mPriyaId, grpId, friend2Id]
    );

    // Manual offline participant
    await client.query(
      `INSERT INTO group_members (id, group_id, manual_name, manual_email, manual_upi_id, role)
       VALUES ($1, $2, 'Karan Verma', 'karan@gmail.com', 'karan@paytm', 'member')
       ON CONFLICT (id) DO NOTHING;`,
      [mKaranId, grpId]
    );

    // 6. Add Group Expense: Villa Booking (₹12,000 paid by Abhishek, split 4 ways)
    const exp1Id = 'se_demo_villa';
    await client.query(
      `INSERT INTO shared_expenses (
        id, group_id, title, total_amount_paise, category_name, expense_date, created_by_user_id, split_method
      ) VALUES ($1, $2, 'Luxury Beach Villa (3 nights)', 1200000, 'Travel', $3, $4, 'equal')
      ON CONFLICT (id) DO NOTHING;`,
      [exp1Id, grpId, `${curYear}-${curMonth}-10`, demoUserId]
    );

    // Payer: Abhishek paid ₹12,000
    await client.query(
      `INSERT INTO shared_expense_payers (id, expense_id, member_id, amount_paise)
       VALUES ('sep_demo_1', $1, $2, 1200000)
       ON CONFLICT (id) DO NOTHING;`,
      [exp1Id, mCreatorId]
    );

    // 4 Allocations: ₹3,000 each
    const members = [mCreatorId, mRohitId, mPriyaId, mKaranId];
    for (let i = 0; i < members.length; i++) {
      await client.query(
        `INSERT INTO shared_expense_allocations (id, expense_id, member_id, amount_paise)
         VALUES ($1, $2, $3, 300000)
         ON CONFLICT (id) DO NOTHING;`,
        [`sea_demo_1_${i}`, exp1Id, members[i]]
      );
    }

    // 7. Settle Up: Rohit partially paid Abhishek ₹1,500 back
    await client.query(
      `INSERT INTO settlements (
        id, group_id, from_member_id, to_member_id, amount_paise,
        settlement_date, payment_method, status, notes, recorded_by_user_id
      ) VALUES ($1, $2, $3, $4, 150000, $5, 'upi', 'completed', 'Partial payment for villa', $6)
      ON CONFLICT (id) DO NOTHING;`,
      ['stl_demo_1', grpId, mRohitId, mCreatorId, `${curYear}-${curMonth}-14`, demoUserId]
    );
  });

  console.log('[Seed Demo] Successfully seeded fictional demo data.');
}

if (process.argv[1].endsWith('seed-demo.js')) {
  seedDemoData()
    .then(() => {
      console.log('[Seed Demo] Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed Demo] Error:', err);
      process.exit(1);
    });
}
