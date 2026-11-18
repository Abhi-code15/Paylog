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
    it('generates standard RFC compliant upi://pay URI without am or tn parameters (anti-fraud bypass)', () => {
      const uri = buildUpiUri({
        upiId: 'merchant@okhdfcbank',
        name: 'Fresh Supermarket',
        merchantCode: '5411',
      });

      assert.match(uri, /^upi:\/\/pay\?/);
      assert.match(uri, /pa=merchant%40okhdfcbank/);
      assert.match(uri, /pn=Fresh\+Supermarket/);
      assert.match(uri, /mc=5411/);
      // 'am' and 'tn' must not be in the query string to prevent anti-fraud blocks in Paytm/GPay/PhonePe
      assert.equal(/am=/.test(uri), false, 'UPI URI must omit the am parameter to bypass anti-fraud blocks');
      assert.equal(/tn=/.test(uri), false, 'UPI URI must omit the tn parameter to bypass anti-fraud blocks');
    });

    it('generates minimal URI with only pa when name and merchantCode are omitted', () => {
      const uri = buildUpiUri({
        upiId: 'user@okhdfcbank',
      });

      assert.equal(uri, 'upi://pay?pa=user%40okhdfcbank');
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
