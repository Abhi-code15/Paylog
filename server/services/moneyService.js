/**
 * Money Service for Paylog
 * All internal financial arithmetic is strictly performed on integer Paise (1 INR = 100 Paise).
 */

/**
 * Converts a decimal monetary amount (number or string, e.g. 150.50 or "150.50") to integer Paise.
 * Rejects negative, NaN, or non-finite values.
 * @param {number|string} amount
 * @returns {number} Integer paise
 */
export function toPaise(amount) {
  if (amount === null || amount === undefined || amount === '') {
    throw new Error('Amount is required');
  }

  const str = String(amount).trim().replace(/,/g, '');
  const num = Number(str);

  if (!Number.isFinite(num) || isNaN(num)) {
    throw new Error('Invalid monetary amount');
  }

  if (num <= 0) {
    throw new Error('Amount must be greater than zero');
  }

  // Multiply by 100 with Math.round to avoid floating point artifact like 19.99 * 100 = 1998.9999999999998
  const paise = Math.round(num * 100);

  if (paise > 1000000000) { // Max ₹10,000,000 (1 crore)
    throw new Error('Amount exceeds maximum permissible limit');
  }

  return paise;
}

/**
 * Formats integer paise into a human-readable INR string.
 * E.g. 15050 -> "₹150.50", -5000 -> "-₹50.00"
 * @param {number} paise
 * @param {boolean} includeSymbol
 * @returns {string}
 */
export function formatInr(paise, includeSymbol = true) {
  if (paise === null || paise === undefined || isNaN(paise)) {
    return includeSymbol ? '₹0.00' : '0.00';
  }

  const isNegative = paise < 0;
  const absPaise = Math.abs(Math.round(paise));
  const rupees = Math.floor(absPaise / 100);
  const cents = absPaise % 100;

  const centsStr = cents < 10 ? `0${cents}` : `${cents}`;

  // Format Indian numbering format (e.g. 1,00,000)
  const rupeesStr = rupees.toLocaleString('en-IN');
  const formatted = `${rupeesStr}.${centsStr}`;

  if (isNegative) {
    return includeSymbol ? `-₹${formatted}` : `-${formatted}`;
  }
  return includeSymbol ? `₹${formatted}` : formatted;
}

/**
 * Splits an amount in integer paise equally among N participants.
 * Deterministically allocates remainder paise across the first `remainder` participants.
 * Guarantees that sum(shares) === totalPaise exactly.
 *
 * @param {number} totalPaise
 * @param {number} participantCount
 * @returns {number[]} Array of shares in paise
 */
export function splitEqual(totalPaise, participantCount) {
  if (!Number.isInteger(totalPaise) || totalPaise <= 0) {
    throw new Error('Total amount must be a positive integer in paise');
  }
  if (!Number.isInteger(participantCount) || participantCount <= 0) {
    throw new Error('Participant count must be a positive integer');
  }

  const base = Math.floor(totalPaise / participantCount);
  const remainder = totalPaise % participantCount;

  const shares = [];
  for (let i = 0; i < participantCount; i++) {
    // First `remainder` participants get 1 extra paisa
    shares.push(i < remainder ? base + 1 : base);
  }

  // Safety invariant check
  const sum = shares.reduce((a, b) => a + b, 0);
  if (sum !== totalPaise) {
    throw new Error(`Split invariant failed: sum ${sum} != total ${totalPaise}`);
  }

  return shares;
}

/**
 * Calculates remaining budget and overspending status.
 * @param {number|null} monthlyBudgetPaise
 * @param {number} completedExpensePaise
 * @returns {{ remainingPaise: number|null, isOverspent: boolean, utilizationPercent: number|null }}
 */
export function calculateBudgetStatus(monthlyBudgetPaise, completedExpensePaise) {
  if (monthlyBudgetPaise === null || monthlyBudgetPaise === undefined || monthlyBudgetPaise <= 0) {
    return {
      remainingPaise: null,
      isOverspent: false,
      utilizationPercent: null,
    };
  }

  const remainingPaise = monthlyBudgetPaise - completedExpensePaise;
  const isOverspent = remainingPaise < 0;
  const utilizationPercent = Math.min(
    Math.round((completedExpensePaise / monthlyBudgetPaise) * 100),
    999
  );

  return {
    remainingPaise,
    isOverspent,
    utilizationPercent,
  };
}

/**
 * Calculates net cash flow (completed income - completed expense).
 * @param {number} completedIncomePaise
 * @param {number} completedExpensePaise
 * @returns {number}
 */
export function calculateNetCashFlow(completedIncomePaise, completedExpensePaise) {
  return (completedIncomePaise || 0) - (completedExpensePaise || 0);
}
