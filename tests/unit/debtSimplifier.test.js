import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateNetBalances, simplifyDebts } from '../../server/services/debtSimplifier.js';

describe('Debt Simplifier - Unit Tests', () => {
  it('correctly calculates net balances from expenses and allocations', () => {
    const members = [
      { id: 'm1', name: 'Abhishek' },
      { id: 'm2', name: 'Rohit' },
      { id: 'm3', name: 'Priya' },
    ];

    // Abhishek paid ₹300 (30000 paise) for a dinner split equally among all 3 (10000 each)
    const payers = [{ member_id: 'm1', amount_paise: 30000 }];
    const allocations = [
      { member_id: 'm1', amount_paise: 10000 },
      { member_id: 'm2', amount_paise: 10000 },
      { member_id: 'm3', amount_paise: 10000 },
    ];

    const netMap = calculateNetBalances(members, payers, allocations, []);

    // Abhishek net: +30000 - 10000 = +20000
    // Rohit net: -10000
    // Priya net: -10000
    assert.equal(netMap.get('m1'), 20000);
    assert.equal(netMap.get('m2'), -10000);
    assert.equal(netMap.get('m3'), -10000);

    // Sum of net balances must always equal 0
    const totalNet = Array.from(netMap.values()).reduce((a, b) => a + b, 0);
    assert.equal(totalNet, 0);
  });

  it('adjusts net balances when settlements are recorded', () => {
    const members = [
      { id: 'm1', name: 'Abhishek' },
      { id: 'm2', name: 'Rohit' },
    ];

    // Abhishek paid ₹200 for Rohit
    const payers = [{ member_id: 'm1', amount_paise: 20000 }];
    const allocations = [
      { member_id: 'm1', amount_paise: 0 },
      { member_id: 'm2', amount_paise: 20000 },
    ];

    // Rohit pays Abhishek ₹100 partial settlement
    const settlements = [
      { from_member_id: 'm2', to_member_id: 'm1', amount_paise: 10000, status: 'completed' },
    ];

    const netMap = calculateNetBalances(members, payers, allocations, settlements);

    // Abhishek: +20000 - 10000 (received) = +10000
    // Rohit: -20000 + 10000 (sent) = -10000
    assert.equal(netMap.get('m1'), 10000);
    assert.equal(netMap.get('m2'), -10000);
  });

  it('simplifies 3-way circular debts into minimal direct payments', () => {
    // Suppose:
    // A owes B ₹100
    // B owes C ₹100
    // Net: A is -100, B is 0, C is +100
    const netMap = new Map([
      ['A', -10000],
      ['B', 0],
      ['C', 10000],
    ]);

    const names = new Map([['A', 'Alice'], ['B', 'Bob'], ['C', 'Charlie']]);
    const simplified = simplifyDebts(netMap, names);

    // Should yield exactly 1 transaction: A -> C for ₹100
    assert.equal(simplified.length, 1);
    assert.equal(simplified[0].fromMemberId, 'A');
    assert.equal(simplified[0].toMemberId, 'C');
    assert.equal(simplified[0].amountPaise, 10000);
  });

  it('preserves all individual net balances after simplification in complex 4-person group', () => {
    const netMap = new Map([
      ['m1', 35000],
      ['m2', -15000],
      ['m3', -10000],
      ['m4', -10000],
    ]);

    const names = new Map([
      ['m1', 'User 1'],
      ['m2', 'User 2'],
      ['m3', 'User 3'],
      ['m4', 'User 4'],
    ]);

    const simplified = simplifyDebts(new Map(netMap), names);

    // Reconstruct net balances from simplified transfers
    const reconstructed = new Map([
      ['m1', 0],
      ['m2', 0],
      ['m3', 0],
      ['m4', 0],
    ]);

    for (const tx of simplified) {
      reconstructed.set(tx.fromMemberId, reconstructed.get(tx.fromMemberId) - tx.amountPaise);
      reconstructed.set(tx.toMemberId, reconstructed.get(tx.toMemberId) + tx.amountPaise);
    }

    assert.equal(reconstructed.get('m1'), netMap.get('m1'));
    assert.equal(reconstructed.get('m2'), netMap.get('m2'));
    assert.equal(reconstructed.get('m3'), netMap.get('m3'));
    assert.equal(reconstructed.get('m4'), netMap.get('m4'));
  });
});
