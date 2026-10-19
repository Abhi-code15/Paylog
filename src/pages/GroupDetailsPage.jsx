import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';
import { formatInr, formatDate } from '../utils/formatters.js';
import { AddSharedExpenseModal } from '../components/modals/AddSharedExpenseModal.jsx';
import { SettleUpModal } from '../components/modals/SettleUpModal.jsx';
import {
  ArrowLeft,
  PlusCircle,
  CheckCircle2,
  Share2,
  Users,
  Receipt,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';

export function GroupDetailsPage({ groupId, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Modals state
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [settleUpOpen, setSettleUpOpen] = useState(false);
  const [settlePrefill, setSettlePrefill] = useState({ fromId: '', toId: '', amount: null });

  const fetchGroupDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.groups.get(groupId);
      setData(res);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load group details.');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroupDetails();
  }, [fetchGroupDetails]);

  // Copy readable summary to clipboard
  const handleCopySummary = async () => {
    if (!data) return;

    const group = data.group;
    const memberNames = data.members.map((m) => m.name).join(', ');
    const debtLines = data.simplifiedDebts.length > 0
      ? data.simplifiedDebts.map((d) => `- ${d.fromName} pays ${d.toName} ${formatInr(d.amountPaise)}`).join('\n')
      : 'All debts are fully settled up!';

    const summaryText = `${group.name} — Shared Expense Summary
Total shared expenses: ${formatInr(data.totalSharedPaise)}
Members: ${memberNames}

Outstanding Balances:
${debtLines}

(Generated via Paylog. Please verify with group organizer.)`;

    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  const handleOpenSettle = (fromId = '', toId = '', amount = null) => {
    setSettlePrefill({ fromId, toId, amount });
    setSettleUpOpen(true);
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400">
        <RefreshCw className="w-7 h-7 animate-spin mb-3" />
        <p className="text-sm font-semibold">Loading group details...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">{error || 'Group not found.'}</p>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
        >
          Back to Groups
        </button>
      </div>
    );
  }

  const group = data.group;
  const viewerBalance = data.viewerBalance;

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Back Button & Group Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {group.name}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {group.groupType}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {data.members.length} members • Total shared: {formatInr(data.totalSharedPaise)}
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-sm transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? 'Summary Copied!' : 'Share Summary'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenSettle()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 text-xs font-bold transition-all shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settle Up</span>
          </button>

          <button
            type="button"
            onClick={() => setAddExpenseOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Viewer Balance Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
        viewerBalance.netPaise > 0
          ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 text-emerald-950 dark:text-emerald-200'
          : viewerBalance.netPaise < 0
            ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60 text-rose-950 dark:text-rose-200'
            : 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider font-bold opacity-75">Your Net Balance in this group</p>
            <p className="text-xl sm:text-2xl font-extrabold mt-0.5">
              {viewerBalance.text}
            </p>
          </div>

          {viewerBalance.netPaise !== 0 && (
            <button
              type="button"
              onClick={() => handleOpenSettle(
                viewerBalance.netPaise < 0 ? data.currentMemberId : '',
                viewerBalance.netPaise > 0 ? data.currentMemberId : '',
                Math.abs(viewerBalance.netPaise)
              )}
              className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 text-xs font-bold shadow-sm hover:shadow transition-all border border-slate-200 dark:border-slate-700"
            >
              Settle Balance
            </button>
          )}
        </div>
      </div>

      {/* Simplified Debts Section */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Simplified Practical Settlements
          </h3>
          <span className="text-[11px] text-slate-400">Preserves exact net balances</span>
        </div>

        {data.simplifiedDebts.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center">
            All debts in this group are currently settled up!
          </p>
        ) : (
          <div className="space-y-2">
            {data.simplifiedDebts.map((debt, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs"
              >
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <span className="font-bold">{debt.fromName}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-bold">{debt.toName}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono font-extrabold text-slate-900 dark:text-white">
                    {formatInr(debt.amountPaise)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenSettle(debt.fromMemberId, debt.toMemberId, debt.amountPaise)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-colors"
                  >
                    Settle
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Members & Balances Breakdown */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-600" />
          Member Balances
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {data.netBalances.map((m) => (
            <div
              key={m.memberId}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs"
            >
              <span className="font-bold text-slate-900 dark:text-white">
                {m.name} {m.isCurrentUser && '(You)'}
              </span>
              <span className={`font-mono font-bold ${
                m.netPaise > 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : m.netPaise < 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-slate-400'
              }`}>
                {m.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Shared Expenses History */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-blue-600" />
            Group Expense History ({data.expenses.length})
          </h3>
        </div>

        {data.expenses.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No expenses recorded yet. Click "+ Add Expense" to log your first shared bill!
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.expenses.map((exp) => (
              <div key={exp.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {exp.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Paid by <strong className="text-slate-700 dark:text-slate-300 font-semibold">{exp.payerName}</strong> on {formatDate(exp.expenseDate)}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {exp.participants.map((p) => (
                      <span
                        key={p.memberId}
                        className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300 font-medium"
                      >
                        {p.memberName}: {formatInr(p.amountPaise)}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm sm:text-base font-mono font-extrabold text-slate-900 dark:text-white">
                    {formatInr(exp.totalAmountPaise)}
                  </p>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    {exp.splitMethod} split
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settlements History */}
      {data.settlements.length > 0 && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Settlement Payments ({data.settlements.length})
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.settlements.map((s) => (
              <div key={s.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">{s.fromName}</span>
                  <span className="text-slate-400 mx-1.5">paid</span>
                  <span className="font-bold text-slate-900 dark:text-white">{s.toName}</span>
                  <span className="text-slate-400 text-[11px] ml-2">• {formatDate(s.settlementDate)}</span>
                </div>

                <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                  {formatInr(s.amountPaise)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <AddSharedExpenseModal
        isOpen={addExpenseOpen}
        onClose={() => setAddExpenseOpen(false)}
        group={data}
        onSuccess={fetchGroupDetails}
      />

      <SettleUpModal
        isOpen={settleUpOpen}
        onClose={() => setSettleUpOpen(false)}
        group={data}
        initialFromId={settlePrefill.fromId}
        initialToId={settlePrefill.toId}
        initialAmount={settlePrefill.amount}
        onSuccess={fetchGroupDetails}
      />
    </div>
  );
}
