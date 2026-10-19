import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  toPaise,
  formatInr,
  splitEqual,
  calculateBudgetStatus,
  calculateNetCashFlow,
} from '../../server/services/moneyService.js';

describe('Money Service - Unit Tests', () => {
  describe('toPaise', () => {
    it('converts decimal amounts to integer paise accurately', () => {
      assert.equal(toPaise(100), 10000);
      assert.equal(toPaise('150.50'), 15050);
      assert.equal(toPaise('19.99'), 1999);
      assert.equal(toPaise('0.01'), 1);
      assert.equal(toPaise('1,250.75'), 125075);
    });

    it('rejects negative, zero, and invalid amounts', () => {
      assert.throws(() => toPaise(0), /Amount must be greater than zero/);
      assert.throws(() => toPaise(-50), /Amount must be greater than zero/);
      assert.throws(() => toPaise('abc'), /Invalid monetary amount/);
      assert.throws(() => toPaise(null), /Amount is required/);
    });
  });

  describe('formatInr', () => {
    it('formats integer paise into INR currency format', () => {
      assert.equal(formatInr(10000), '₹100.00');
      assert.equal(formatInr(15050), '₹150.50');
      assert.equal(formatInr(125075), '₹1,250.75');
      assert.equal(formatInr(-5000), '-₹50.00');
      assert.equal(formatInr(0), '₹0.00');
    });

    it('can omit currency symbol when requested', () => {
      assert.equal(formatInr(10000, false), '100.00');
      assert.equal(formatInr(-5000, false), '-50.00');
    });
  });

  describe('splitEqual', () => {
    it('splits evenly divisible amounts exactly', () => {
      const shares = splitEqual(9000, 3);
      assert.deepEqual(shares, [3000, 3000, 3000]);
      assert.equal(shares.reduce((a, b) => a + b, 0), 9000);
    });

    it('deterministically distributes remainder paise', () => {
      // 100.00 split among 3 people (10000 paise / 3 = 3333 with remainder 1)
      const shares = splitEqual(10000, 3);
      assert.deepEqual(shares, [3334, 3333, 3333]);
      assert.equal(shares.reduce((a, b) => a + b, 0), 10000);
    });

    it('handles remainder larger than 1 paisa', () => {
      // 100 paise among 7 people: 100 / 7 = 14 base, remainder 2 -> first 2 get 15
      const shares = splitEqual(100, 7);
      assert.deepEqual(shares, [15, 15, 14, 14, 14, 14, 14]);
      assert.equal(shares.reduce((a, b) => a + b, 0), 100);
    });

    it('rejects invalid inputs', () => {
      assert.throws(() => splitEqual(0, 3));
      assert.throws(() => splitEqual(1000, 0));
      assert.throws(() => splitEqual(-500, 2));
    });
  });

  describe('calculateBudgetStatus', () => {
    it('returns remaining balance and overspent status correctly', () => {
      const under = calculateBudgetStatus(5000000, 3500000);
      assert.equal(under.remainingPaise, 1500000);
      assert.equal(under.isOverspent, false);
      assert.equal(under.utilizationPercent, 70);

      const over = calculateBudgetStatus(5000000, 6000000);
      assert.equal(over.remainingPaise, -1000000);
      assert.equal(over.isOverspent, true);
      assert.equal(over.utilizationPercent, 120);
    });

    it('handles unset budget safely without fabricating a default', () => {
      const unset = calculateBudgetStatus(null, 2500000);
      assert.equal(unset.remainingPaise, null);
      assert.equal(unset.isOverspent, false);
      assert.equal(unset.utilizationPercent, null);
    });
  });

  describe('calculateNetCashFlow', () => {
    it('computes completed income minus completed expenses', () => {
      assert.equal(calculateNetCashFlow(800000, 500000), 300000);
      assert.equal(calculateNetCashFlow(200000, 500000), -300000);
      assert.equal(calculateNetCashFlow(0, 500000), -500000);
    });
  });
});
