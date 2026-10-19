import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal.jsx';
import { api } from '../../services/api.js';
import { formatInr, formatRelativeDate } from '../../utils/formatters.js';
import { Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

export function PendingPaymentsModal({ isOpen, onClose, onUpdated }) {
  const [pendingAttempts, setPendingAttempts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState(null);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const data = await api.paymentAttempts.listPending();
      setPendingAttempts(data.pendingAttempts || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load pending payments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPending();
    }
  }, [isOpen]);

  const handleUpdateStatus = async (attempt, targetStatus) => {
    setUpdatingId(attempt.id);
    setError(null);
    try {
      await api.paymentAttempts.reportOutcome(attempt.id, {
        status: targetStatus,
        description: attempt.note || 'UPI Payment',
      });

      // Optimistically remove from list
      setPendingAttempts((prev) => prev.filter((a) => a.id !== attempt.id));
      if (onUpdated) onUpdated();
    } catch (err) {
      setError(err.message || 'Failed to update payment status.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pending Payments"
      subtitle="Unresolved UPI payment attempts awaiting your outcome confirmation"
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading && pendingAttempts.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mb-2" />
            <p className="text-xs">Checking pending payments...</p>
          </div>
        ) : pendingAttempts.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              All caught up!
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
              You have no unresolved UPI payment attempts pending.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {pendingAttempts.map((attempt) => {
              const isUpdating = updatingId === attempt.id;
              return (
                <div key={attempt.id} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-extrabold text-slate-900 dark:text-white">
                        {formatInr(attempt.amountPaise)}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                        <Clock className="w-2.5 h-2.5" /> Pending
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                      To: {attempt.recipientName || attempt.recipientUpiId}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {attempt.recipientUpiId} • {formatRelativeDate(attempt.createdAt)}
                    </p>
                  </div>

                  {/* 1-Click Update Actions (Direct without extra popup) */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus(attempt, 'successful')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:opacity-50 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Mark Successful
                    </button>

                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus(attempt, 'failed_or_cancelled')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-700 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Failed
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
