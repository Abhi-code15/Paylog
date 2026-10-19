import React, { useState } from 'react';
import { Modal } from '../ui/Modal.jsx';
import { formatInr } from '../../utils/formatters.js';
import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

export function UpiOutcomeModal({ isOpen, attempt, onReportOutcome, isSubmitting }) {
  if (!attempt) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => onReportOutcome('pending')} // Closing defaults to pending for safety
      title="How did your payment go?"
      subtitle="Report the outcome to keep your records updated"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Payment Summary Card */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Payment to</p>
          <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
            {attempt.recipientName || attempt.recipientUpiId}
          </p>
          <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
            {attempt.recipientUpiId}
          </p>
          <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-2">
            {formatInr(attempt.amountPaise)}
          </p>
        </div>

        {/* Notice of User-Reported Status */}
        <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Paylog is an honest personal ledger and does not independently verify bank transactions. Please report your actual payment result.
          </span>
        </div>

        {/* 3 Clear Outcome Actions */}
        <div className="space-y-2.5 pt-2">
          {/* Successful */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => onReportOutcome('successful')}
            className="w-full flex items-center justify-between p-3.5 rounded-xl border-2 border-emerald-500/40 bg-emerald-50/50 hover:bg-emerald-100/60 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 font-bold text-sm transition-all shadow-sm hover:border-emerald-500"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="text-left">
                <p>Payment Successful</p>
                <p className="text-xs font-normal text-emerald-700 dark:text-emerald-400">
                  Record as completed expense
                </p>
              </div>
            </div>
            <span className="text-xs uppercase tracking-wider font-extrabold text-emerald-700 dark:text-emerald-400">Select</span>
          </button>

          {/* Failed / Cancelled */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => onReportOutcome('failed_or_cancelled')}
            className="w-full flex items-center justify-between p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 hover:bg-rose-100/60 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 text-rose-900 dark:text-rose-200 font-bold text-sm transition-all"
          >
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
              <div className="text-left">
                <p>Failed or Cancelled</p>
                <p className="text-xs font-normal text-rose-600/80 dark:text-rose-400">
                  Did not go through (zero expense recorded)
                </p>
              </div>
            </div>
            <span className="text-xs uppercase tracking-wider font-semibold text-rose-700 dark:text-rose-400">Select</span>
          </button>

          {/* Pending / Unresolved */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => onReportOutcome('pending')}
            className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700/60 text-slate-800 dark:text-slate-200 font-semibold text-sm transition-all"
          >
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="text-left">
                <p>Payment Pending / Not Sure</p>
                <p className="text-xs font-normal text-slate-500 dark:text-slate-400">
                  Keep in pending payments to update later
                </p>
              </div>
            </div>
            <span className="text-xs uppercase tracking-wider text-slate-400">Resolve Later</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
