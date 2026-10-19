import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateUpiId, buildUpiUri, parseUpiQr } from '../../server/services/paymentService.js';

describe('Payment Service - Unit Tests', () => {
  describe('validateUpiId', () => {
    it('accepts valid UPI IDs', () => {
      assert.equal(validateUpiId('abhi@okhdfcbank'), true);
      assert.equal(validateUpiId('merchant123@icici'), true);
      assert.equal(validateUpiId('john.doe@upi'), true);
      assert.equal(validateUpiId('store-support@paytm'), true);
    });

    it('rejects invalid UPI IDs', () => {
      assert.equal(validateUpiId(''), false);
      assert.equal(validateUpiId('notanupiid'), false);
      assert.equal(validateUpiId('@bank'), false);
      assert.equal(validateUpiId('user@'), false);
      assert.equal(validateUpiId('user@bank@extra'), false);
    });
  });

  describe('buildUpiUri', () => {
    it('generates standard RFC compliant upi://pay URI', () => {
      const uri = buildUpiUri({
        upiId: 'merchant@okhdfcbank',
        name: 'Fresh Supermarket',
        amountPaise: 45000,
        note: 'Weekly Fruits',
      });

      assert.match(uri, /^upi:\/\/pay\?/);
      assert.match(uri, /pa=merchant%40okhdfcbank/);
      assert.match(uri, /pn=Fresh\+Supermarket/);
      assert.match(uri, /am=450\.00/);
      assert.match(uri, /cu=INR/);
      assert.match(uri, /tn=Weekly\+Fruits/);
    });
  });

  describe('parseUpiQr', () => {
    it('parses valid UPI QR code with amount', () => {
      const raw = 'upi://pay?pa=store@icici&pn=BookStore&am=250.50&cu=INR&tn=Novels';
      const parsed = parseUpiQr(raw);

      assert.equal(parsed.isValid, true);
      assert.equal(parsed.upiId, 'store@icici');
      assert.equal(parsed.name, 'BookStore');
      assert.equal(parsed.amountPaise, 25050);
      assert.equal(parsed.note, 'Novels');
    });

    it('parses valid UPI QR code without amount', () => {
      const raw = 'upi://pay?pa=store@icici&pn=BookStore&cu=INR';
      const parsed = parseUpiQr(raw);

      assert.equal(parsed.isValid, true);
      assert.equal(parsed.upiId, 'store@icici');
      assert.equal(parsed.amountPaise, null);
    });

    it('parses raw VPA string directly', () => {
      const parsed = parseUpiQr('rahul@okhdfcbank');
      assert.equal(parsed.isValid, true);
      assert.equal(parsed.upiId, 'rahul@okhdfcbank');
    });

    it('rejects malformed and non-UPI strings', () => {
      const invalid = parseUpiQr('https://example.com/not-upi');
      assert.equal(invalid.isValid, false);
      assert.match(invalid.error, /Not a recognized UPI/);
    });
  });
});
