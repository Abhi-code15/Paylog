/**
 * UPI Payment and Intent Service for Paylog
 */

/**
 * Validates a UPI ID / Virtual Payment Address (VPA) format.
 * Format: username@bankname (e.g. abhi@okhdfcbank, merchant@upi)
 * @param {string} upiId
 * @returns {boolean}
 */
export function validateUpiId(upiId) {
  if (!upiId || typeof upiId !== 'string') return false;
  const trimmed = upiId.trim();
  // Standard VPA: alphanumeric, dot, hyphen, underscore before @, alphanumeric, hyphen after @
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z0-9.\-_]{2,64}$/;
  return upiRegex.test(trimmed);
}

/**
 * Generates an RFC-compliant, minimal NPCI UPI URI with only non-blocking parameters.
 * Note: To bypass strict anti-fraud risk policies in UPI apps (Paytm, PhonePe, GPay)
 * that block third-party web intent requests with pre-filled amounts and automated descriptions:
 * - 'am' (amount) is completely omitted.
 * - 'tn' (transaction note/description) is completely omitted.
 * Only payee UPI ID ('pa'), payee name ('pn'), and merchant code ('mc' if present) are included.
 * The user manually inputs the amount and description in their UPI app.
 *
 * @param {{ upiId: string, name?: string, merchantCode?: string }} params
 * @returns {string} upi://pay?... URI
 */
export function buildUpiUri({ upiId, name = '', merchantCode = '' }) {
  if (!validateUpiId(upiId)) {
    throw new Error('Invalid UPI ID format');
  }

  const queryParams = new URLSearchParams();

  queryParams.set('pa', upiId.trim());
  if (name && name.trim()) {
    queryParams.set('pn', name.trim().slice(0, 100));
  }
  if (merchantCode && merchantCode.trim()) {
    queryParams.set('mc', merchantCode.trim().slice(0, 30));
  }

  return `upi://pay?${queryParams.toString()}`;
}

/**
 * Parses raw text scanned from a UPI QR code.
 * Extracts `pa` (VPA), `pn` (Payee name), `am` (Amount if present), `tn` (Transaction note).
 *
 * @param {string} rawString
 * @returns {{ upiId: string|null, name: string|null, amountPaise: number|null, note: string|null, isValid: boolean, error?: string }}
 */
export function parseUpiQr(rawString) {
  if (!rawString || typeof rawString !== 'string') {
    return { upiId: null, name: null, amountPaise: null, note: null, isValid: false, error: 'Empty QR code data' };
  }

  const trimmed = rawString.trim();

  // If user scanned raw UPI ID directly
  if (validateUpiId(trimmed)) {
    return {
      upiId: trimmed,
      name: null,
      amountPaise: null,
      note: null,
      isValid: true,
    };
  }

  // Must start with upi://pay
  if (!trimmed.toLowerCase().startsWith('upi://pay')) {
    return {
      upiId: null,
      name: null,
      amountPaise: null,
      note: null,
      isValid: false,
      error: 'Not a recognized UPI payment QR code',
    };
  }

  try {
    const questionIndex = trimmed.indexOf('?');
    if (questionIndex === -1) {
      return { upiId: null, name: null, amountPaise: null, note: null, isValid: false, error: 'Missing UPI parameters' };
    }

    const queryString = trimmed.slice(questionIndex + 1);
    const params = new URLSearchParams(queryString);

    const pa = params.get('pa')?.trim() || null;
    const pn = params.get('pn')?.trim() || null;
    const am = params.get('am')?.trim() || null;
    const tn = params.get('tn')?.trim() || null;
    const mc = params.get('mc')?.trim() || null;

    if (!pa || !validateUpiId(pa)) {
      return { upiId: null, name: null, amountPaise: null, note: null, merchantCode: null, isValid: false, error: 'QR contains invalid or missing UPI ID' };
    }

    let amountPaise = null;
    if (am) {
      const parsedNum = parseFloat(am);
      if (!isNaN(parsedNum) && parsedNum > 0 && parsedNum <= 10000000) {
        amountPaise = Math.round(parsedNum * 100);
      }
    }

    return {
      upiId: pa,
      name: pn,
      amountPaise,
      note: tn,
      merchantCode: mc,
      isValid: true,
    };
  } catch (err) {
    return {
      upiId: null,
      name: null,
      amountPaise: null,
      note: null,
      isValid: false,
      error: `Failed to parse QR code: ${err.message}`,
    };
  }
}
