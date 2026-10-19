import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal.jsx';
import { QrScanner } from '../upi/QrScanner.jsx';
import { UpiOutcomeModal } from '../upi/UpiOutcomeModal.jsx';
import { api } from '../../services/api.js';
import { formatInr } from '../../utils/formatters.js';
import {
  QrCode,
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Banknote,
  MoreHorizontal,
  Check,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export function AddTransactionModal({ isOpen, onClose, onSuccess, initialType = 'expense' }) {
  const [type, setType] = useState(initialType);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [transactionDate, setTransactionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('upi_instant');
  const [merchantName, setMerchantName] = useState('');
  const [notes, setNotes] = useState('');

  // UPI Specific state
  const [upiMode, setUpiMode] = useState('pay_now'); // 'pay_now' | 'already_paid'
  const [payeeUpiId, setPayeeUpiId] = useState('');
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [activePaymentAttempt, setActivePaymentAttempt] = useState(null);
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load categories
  useEffect(() => {
    if (isOpen) {
      api.categories.list()
        .then((data) => {
          setCategories(data.categories || []);
          // Preselect first matching category
          const matching = (data.categories || []).filter((c) => c.type === type);
          if (matching.length > 0 && !categoryId) {
            setCategoryId(matching[0].id);
          }
        })
        .catch(console.error);
    }
  }, [isOpen, type]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setType(initialType);
      setAmount('');
      setDescription('');
      setPaymentMethod('upi_instant');
      setUpiMode('pay_now');
      setPayeeUpiId('');
      setMerchantName('');
      setNotes('');
      setError(null);
      setShowQrScanner(false);
      setActivePaymentAttempt(null);
      setShowOutcomeModal(false);
      setTransactionDate(new Date().toISOString().slice(0, 10));
    }
  }, [isOpen, initialType]);

  // Filter categories by selected type
  const availableCategories = categories.filter((c) => c.type === type);

  // Handle QR scan result
  const handleQrScanSuccess = (rawData) => {
    setShowQrScanner(false);
    try {
      // Dynamic parse helper on frontend or via regex
      const trimmed = rawData.trim();
      let scannedUpiId = '';
      let scannedName = '';
      let scannedAmount = null;
      let scannedNote = '';

      if (trimmed.toLowerCase().startsWith('upi://pay?')) {
        const query = trimmed.slice(trimmed.indexOf('?') + 1);
        const params = new URLSearchParams(query);
        scannedUpiId = params.get('pa') || '';
        scannedName = params.get('pn') || '';
        const amStr = params.get('am');
        if (amStr && !isNaN(parseFloat(amStr))) {
          scannedAmount = parseFloat(amStr);
        }
        scannedNote = params.get('tn') || '';
      } else if (trimmed.includes('@')) {
        scannedUpiId = trimmed;
      }

      if (scannedUpiId) {
        setPayeeUpiId(scannedUpiId);
        if (scannedName) setMerchantName(scannedName);
        if (scannedNote && !description) setDescription(scannedNote);

        // Crucial PRD requirement: If QR contains an amount, replace form amount with QR amount
        if (scannedAmount !== null && scannedAmount > 0) {
          setAmount(scannedAmount.toFixed(2));
        }
        setError(null);
      } else {
        setError('QR code does not contain a valid UPI payment address.');
      }
    } catch (err) {
      setError('Could not read payment information from scanned QR code.');
    }
  };

  // Direct Save (Cash, Other, or Already Paid UPI, or Income)
  const handleDirectSave = async (e) => {
    e.preventDefault();
    setError(null);

    const parsedNum = parseFloat(amount);
    if (isNaN(parsedNum) || parsedNum <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    if (!description.trim()) {
      setError('Please enter a short description.');
      return;
    }

    setLoading(true);
    try {
      const selectedCategory = categories.find((c) => c.id === categoryId);
      const confirmationSource = paymentMethod === 'upi_instant' ? 'already_paid' : 'manual';

      await api.transactions.create({
        amount: parsedNum,
        type,
        description: description.trim(),
        categoryId: categoryId || null,
        categoryName: selectedCategory?.name || (type === 'income' ? 'Salary' : 'Other'),
        transactionDate,
        paymentMethod,
        recipientOrMerchant: merchantName.trim() || (paymentMethod === 'upi_instant' ? payeeUpiId : null),
        notes: notes.trim() || null,
        confirmationSource,
      });

      setLoading(false);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Failed to save transaction.');
    }
  };

  // Launch UPI Payment
  const handleLaunchUpi = async (e) => {
    e.preventDefault();
    setError(null);

    const parsedNum = parseFloat(amount);
    if (isNaN(parsedNum) || parsedNum <= 0) {
      setError('Please enter a valid payment amount.');
      return;
    }

    if (!payeeUpiId.trim() || !payeeUpiId.includes('@')) {
      setError('Please enter or scan a valid Payee UPI ID (e.g. name@bank).');
      return;
    }

    setLoading(true);
    try {
      // 1. Persist payment attempt on backend before external handoff
      const response = await api.paymentAttempts.create({
        amount: parsedNum,
        recipientUpiId: payeeUpiId.trim(),
        recipientName: merchantName.trim() || payeeUpiId.trim(),
        note: description.trim() || 'Paylog Expense',
        paymentPath: showQrScanner ? 'qr_scan' : 'upi_intent',
      });

      const attempt = response.paymentAttempt;
      const upiUri = response.upiUri;

      setActivePaymentAttempt(attempt);
      setLoading(false);

      // 2. Launch native UPI intent
      window.location.href = upiUri;

      // 3. Prompt user for outcome upon return
      setShowOutcomeModal(true);
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Could not initiate UPI payment.');
    }
  };

  // Handle outcome reporting from UpiOutcomeModal
  const handleReportOutcome = async (outcomeStatus) => {
    if (!activePaymentAttempt) return;

    setLoading(true);
    try {
      const selectedCategory = categories.find((c) => c.id === categoryId);
      await api.paymentAttempts.reportOutcome(activePaymentAttempt.id, {
        status: outcomeStatus,
        categoryId: categoryId || null,
        categoryName: selectedCategory?.name || 'Other',
        description: description.trim() || 'UPI Payment',
        transactionDate,
      });

      setLoading(false);
      setShowOutcomeModal(false);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Failed to report payment outcome.');
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen && !showOutcomeModal}
        onClose={onClose}
        title="Add Transaction"
        subtitle="Record your personal spending or income"
        maxWidth="max-w-lg"
      >
        {/* Type Toggle: Expense vs Income */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 mb-5">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              type === 'expense'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            Expense
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              type === 'income'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            Income
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* QR Scanner Mode */}
        {showQrScanner ? (
          <QrScanner
            onScanSuccess={handleQrScanSuccess}
            onFallbackToManual={() => setShowQrScanner(false)}
            onClose={() => setShowQrScanner(false)}
          />
        ) : (
          <form onSubmit={type === 'expense' && paymentMethod === 'upi_instant' && upiMode === 'pay_now' ? handleLaunchUpi : handleDirectSave} className="space-y-4">
            {/* Amount Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Amount (INR ₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="10000000"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xl font-bold placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Category & Date Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {availableCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Transaction Date
                </label>
                <input
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Description Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Description / Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={255}
                placeholder={type === 'expense' ? 'e.g. Lunch at Cafe, Supermarket' : 'e.g. October Salary, Freelance'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Payment Method Selector (Exactly: UPI Instant, Cash, Other) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi_instant')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    paymentMethod === 'upi_instant'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 ring-1 ring-blue-600'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <CreditCard className="w-4 h-4 mb-1" />
                  UPI Instant
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    paymentMethod === 'cash'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 ring-1 ring-blue-600'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Banknote className="w-4 h-4 mb-1" />
                  Cash
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('other')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    paymentMethod === 'other'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 ring-1 ring-blue-600'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <MoreHorizontal className="w-4 h-4 mb-1" />
                  Other
                </button>
              </div>
            </div>

            {/* UPI Workflow Options (Only for Outgoing Expenses with UPI Instant) */}
            {type === 'expense' && paymentMethod === 'upi_instant' && (
              <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 space-y-3 animate-in fade-in duration-150">
                {/* Mode: Pay Now vs Already Paid */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Payment Action
                  </span>
                  <div className="flex items-center gap-1.5 p-0.5 rounded-lg bg-slate-200/60 dark:bg-slate-800 text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setUpiMode('pay_now')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        upiMode === 'pay_now'
                          ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Pay Now via App
                    </button>
                    <button
                      type="button"
                      onClick={() => setUpiMode('already_paid')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        upiMode === 'already_paid'
                          ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Already Paid? Record
                    </button>
                  </div>
                </div>

                {upiMode === 'pay_now' && (
                  <div className="space-y-3 pt-1">
                    {/* Payee UPI ID or QR Scan Trigger */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Payee UPI ID <span className="text-rose-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowQrScanner(true)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          Scan QR Code
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="merchant@upi or name@okhdfcbank"
                        value={payeeUpiId}
                        onChange={(e) => setPayeeUpiId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Payee Merchant Name (Optional) */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Merchant / Payee Name (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Cafe Central"
                        value={merchantName}
                        onChange={(e) => setMerchantName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Tapping Pay Now opens your installed UPI app (GPay, PhonePe, Paytm). Return here to report the outcome.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Merchant / Source for Cash/Other/Already Paid */}
            {(paymentMethod !== 'upi_instant' || upiMode === 'already_paid' || type === 'income') && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {type === 'income' ? 'Received From (Optional)' : 'Paid To / Merchant (Optional)'}
                </label>
                <input
                  type="text"
                  placeholder={type === 'income' ? 'e.g. Employer, Client' : 'e.g. Cafe, Landlord, Store'}
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Submit Actions */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>

              {type === 'expense' && paymentMethod === 'upi_instant' && upiMode === 'pay_now' ? (
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
                >
                  <span>{loading ? 'Initiating...' : 'Pay Now / Launch UPI'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{loading ? 'Saving...' : type === 'income' ? 'Record Income' : 'Record Expense'}</span>
                </button>
              )}
            </div>
          </form>
        )}
      </Modal>

      {/* Outcome Reporting Modal */}
      <UpiOutcomeModal
        isOpen={showOutcomeModal}
        attempt={activePaymentAttempt}
        onReportOutcome={handleReportOutcome}
        isSubmitting={loading}
      />
    </>
  );
}
