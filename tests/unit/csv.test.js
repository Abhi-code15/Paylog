import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { escapeCsvCell, generateCsv } from '../../server/utils/csv.js';

describe('CSV Sanitization & Export - Unit Tests', () => {
  it('escapes standard text values cleanly', () => {
    assert.equal(escapeCsvCell('Lunch at Cafe'), '"Lunch at Cafe"');
    assert.equal(escapeCsvCell('150.50'), '"150.50"');
  });

  it('doubles internal double quotes according to RFC 4180', () => {
    assert.equal(escapeCsvCell('Book "Atomic Habits"'), '"Book ""Atomic Habits"""');
  });

  it('neutralizes formula injection characters (=, +, -, @, \\t, \\r)', () => {
    assert.equal(escapeCsvCell('=1+1'), '"\'=1+1"');
    assert.equal(escapeCsvCell('+SUM(A1:A10)'), '"\'+SUM(A1:A10)"');
    assert.equal(escapeCsvCell('-2+3*cmd|'), '"\'-2+3*cmd|"');
    assert.equal(escapeCsvCell('@cmd'), '"\'@cmd"');
  });

  it('generates a full sanitized CSV table', () => {
    const headers = ['Date', 'Description', 'Amount'];
    const rows = [
      ['2026-10-19', 'Groceries', '₹350.00'],
      ['2026-10-18', '=DDE("cmd";"calc")', '₹100.00'],
    ];

    const csv = generateCsv(headers, rows);
    assert.match(csv, /"Date","Description","Amount"/);
    assert.match(csv, /"2026-10-19","Groceries","₹350\.00"/);
    assert.match(csv, /"'=DDE\(""cmd"";""calc""\)"/);
  });
});
