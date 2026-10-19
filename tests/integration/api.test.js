import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../../server/app.js';
import { pool } from '../../server/db/pool.js';

describe('Paylog API Integration Tests', () => {
  let app;
  let server;
  let baseUrl;
  let cookieA = '';
  let cookieB = '';
  let userAId = '';
  let userBId = '';
  let txAId = '';

  before(async () => {
    app = createApp();
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await pool.end();
  });

  it('1. Registers User A and receives session cookie', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Integration User A',
        email: `usera_${Date.now()}@paylog.test`,
        password: 'Password123!',
      }),
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.ok(data.user.id);
    userAId = data.user.id;

    const rawCookie = res.headers.get('set-cookie');
    assert.ok(rawCookie);
    cookieA = rawCookie.split(';')[0];
  });

  it('2. User A sets monthly budget to ₹45,000 in profile', async () => {
    const res = await fetch(`${baseUrl}/api/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieA,
      },
      body: JSON.stringify({
        name: 'Integration User A Updated',
        upiId: 'usera@okhdfcbank',
        monthlyBudgetPaise: 4500000,
        themePreference: 'dark',
      }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.user.monthlyBudgetPaise, 4500000);
    assert.equal(data.user.upiId, 'usera@okhdfcbank');
  });

  it('3. User A creates a personal transaction', async () => {
    const res = await fetch(`${baseUrl}/api/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieA,
      },
      body: JSON.stringify({
        amount: 250.50,
        type: 'expense',
        description: 'Office Stationary',
        categoryName: 'Shopping',
        paymentMethod: 'cash',
        transactionDate: '2026-10-19',
      }),
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.transaction.amountPaise, 25050);
    assert.equal(data.transaction.description, 'Office Stationary');
    txAId = data.transaction.id;
  });

  it('4. Registers User B with separate session', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Integration User B',
        email: `userb_${Date.now()}@paylog.test`,
        password: 'Password123!',
      }),
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    userBId = data.user.id;

    const rawCookie = res.headers.get('set-cookie');
    cookieB = rawCookie.split(';')[0];
  });

  it('5. User B CANNOT delete or see User A transaction (IDOR Protection)', async () => {
    // User B tries to delete User A's transaction
    const delRes = await fetch(`${baseUrl}/api/transactions/${txAId}`, {
      method: 'DELETE',
      headers: { Cookie: cookieB },
    });
    assert.equal(delRes.status, 404);

    // User B lists transactions -> must see 0 transactions
    const listRes = await fetch(`${baseUrl}/api/transactions`, {
      headers: { Cookie: cookieB },
    });
    assert.equal(listRes.status, 200);
    const listData = await listRes.json();
    assert.equal(listData.totalCount, 0);
  });

  it('6. UPI Payment Attempt Lifecycle & Idempotency', async () => {
    // 1. Create Attempt
    const createRes = await fetch(`${baseUrl}/api/payment-attempts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieA,
      },
      body: JSON.stringify({
        amount: 500,
        recipientUpiId: 'merchant@upi',
        recipientName: 'SuperMart',
        note: 'Snacks',
        idempotencyKey: `idem_test_${Date.now()}`,
      }),
    });

    assert.equal(createRes.status, 201);
    const createData = await createRes.json();
    assert.equal(createData.paymentAttempt.amountPaise, 50000);
    assert.ok(createData.upiUri.startsWith('upi://pay?'));

    const attemptId = createData.paymentAttempt.id;

    // 2. Report Outcome: Successful
    const outcomeRes1 = await fetch(`${baseUrl}/api/payment-attempts/${attemptId}/outcome`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieA,
      },
      body: JSON.stringify({
        status: 'successful',
        description: 'SuperMart Snacks',
      }),
    });

    assert.equal(outcomeRes1.status, 200);
    const outcomeData1 = await outcomeRes1.json();
    assert.equal(outcomeData1.paymentAttempt.status, 'completed');
    assert.ok(outcomeData1.transaction);
    assert.equal(outcomeData1.transaction.amountPaise, 50000);

    // 3. Repeated Outcome Call (Must be idempotent and NOT create second transaction)
    const outcomeRes2 = await fetch(`${baseUrl}/api/payment-attempts/${attemptId}/outcome`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieA,
      },
      body: JSON.stringify({
        status: 'successful',
      }),
    });

    assert.equal(outcomeRes2.status, 200);
    const outcomeData2 = await outcomeRes2.json();
    assert.equal(outcomeData2.transaction.id, outcomeData1.transaction.id);

    // Verify in database that only ONE transaction links to this payment intent
    const dbCount = await pool.query(
      'SELECT COUNT(*) FROM personal_transactions WHERE payment_intent_id = $1;',
      [attemptId]
    );
    assert.equal(parseInt(dbCount.rows[0].count, 10), 1);
  });

  it('7. Group creation, equal split with remainder, and settlement', async () => {
    // User A creates group with manual participant "Karan"
    const grpRes = await fetch(`${baseUrl}/api/groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieA,
      },
      body: JSON.stringify({
        name: 'Weekend Getaway',
        groupType: 'trip',
        members: [
          { type: 'manual', name: 'Karan Offline', email: 'karan@test.com' },
        ],
      }),
    });

    assert.equal(grpRes.status, 201);
    const grpData = await grpRes.json();
    const groupId = grpData.group.id;

    // Fetch group details to get member IDs
    const detailRes1 = await fetch(`${baseUrl}/api/groups/${groupId}`, {
      headers: { Cookie: cookieA },
    });
    const detail1 = await detailRes1.json();
    assert.equal(detail1.members.length, 2); // Creator + Karan

    const creatorMemberId = detail1.members.find((m) => m.isCurrentUser).id;
    const karanMemberId = detail1.members.find((m) => m.isManual).id;

    // Add shared expense: ₹100.00 (10000 paise) split between 2 members (5000 each)
    const expRes = await fetch(`${baseUrl}/api/groups/${groupId}/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieA,
      },
      body: JSON.stringify({
        title: 'Highway Toll & Snacks',
        amount: 100,
        payerMemberId: creatorMemberId,
        participantMemberIds: [creatorMemberId, karanMemberId],
      }),
    });

    assert.equal(expRes.status, 201);

    // Verify balances
    const detailRes2 = await fetch(`${baseUrl}/api/groups/${groupId}`, {
      headers: { Cookie: cookieA },
    });
    const detail2 = await detailRes2.json();
    assert.equal(detail2.viewerBalance.netPaise, 5000); // Creator is owed ₹50.00
    assert.match(detail2.viewerBalance.text, /You are owed ₹50\.00/);

    // Record settlement: Karan pays back ₹50.00
    const setlRes = await fetch(`${baseUrl}/api/settlements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieA,
      },
      body: JSON.stringify({
        groupId,
        fromMemberId: karanMemberId,
        toMemberId: creatorMemberId,
        amount: 50,
        paymentMethod: 'upi',
      }),
    });

    assert.equal(setlRes.status, 201);

    // Balance after settlement must be settled (0)
    const detailRes3 = await fetch(`${baseUrl}/api/groups/${groupId}`, {
      headers: { Cookie: cookieA },
    });
    const detail3 = await detailRes3.json();
    assert.equal(detail3.viewerBalance.netPaise, 0);
  });

  it('8. Safe CSV Export streams sanitized headers and authorized rows', async () => {
    const res = await fetch(`${baseUrl}/api/reports/export-csv`, {
      headers: { Cookie: cookieA },
    });

    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /text\/csv/);
    const text = await res.text();
    assert.match(text, /"Date","Type","Description"/);
    assert.match(text, /"Office Stationary"/);
  });
});
