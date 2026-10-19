import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { formatInr, formatDate } from '../utils/formatters.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  PlusCircle,
  Users,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Receipt,
  Sparkles,
  PieChart,
} from 'lucide-react';

export function DashboardPage({ onOpenAddTransaction, onNavigate, onOpenPendingModal }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.dashboard.get();
      setData(res);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Banner & Two Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Welcome back, {user?.name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Here's what happened with your money this month.
          </p>
        </div>

        {/* The ONLY Two Primary Overview Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onOpenAddTransaction()}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('groups')}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs sm:text-sm shadow-sm transition-all"
          >
            <Users className="w-4 h-4 text-indigo-500" />
            <span>Split Bill / Groups</span>
          </button>
        </div>
      </div>

      {/* Pending Payments Shortcut Card (if any pending) */}
      {data?.pendingPaymentsCount > 0 && (
        <div
          onClick={onOpenPendingModal}
          className="flex items-center justify-between p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 cursor-pointer hover:bg-amber-100/70 transition-all shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-bold">
                {data.pendingPaymentsCount} Pending Payment{data.pendingPaymentsCount > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                Click here to confirm your payment outcomes in one tap.
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
      )}

      {/* 4 Core Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: This Month Spent */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>This Month Spent</span>
            <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2 font-mono">
            {formatInr(data?.monthSpentPaise || 0)}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Completed personal expenses
          </p>
        </div>

        {/* Card 2: This Month Income */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>This Month Income</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2 font-mono">
            {formatInr(data?.monthIncomePaise || 0)}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Net cash flow: {formatInr(data?.netCashFlowPaise || 0)}
          </p>
        </div>

        {/* Card 3: Remaining Budget / Overspent */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Remaining Budget</span>
            <div className={`p-1.5 rounded-lg ${data?.isOverspent ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'}`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          {data?.monthlyBudgetPaise === null ? (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => onNavigate('settings')}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                Set Monthly Budget →
              </button>
              <p className="text-[11px] text-slate-400 mt-1">No limit configured</p>
            </div>
          ) : (
            <>
              <p className={`text-2xl font-extrabold mt-2 font-mono ${data?.isOverspent ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                {formatInr(data?.remainingBudgetPaise || 0)}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                {data?.isOverspent ? 'Budget exceeded' : `${data?.budgetUtilizationPercent}% of ₹${(data?.monthlyBudgetPaise / 100).toLocaleString('en-IN')}`}
              </p>
            </>
          )}
        </div>

        {/* Card 4: Shared Group Balance */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Shared Group Balance</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-extrabold mt-2 font-mono ${
            (data?.sharedGroupNetPaise || 0) > 0
              ? 'text-emerald-600 dark:text-emerald-400'
              : (data?.sharedGroupNetPaise || 0) < 0
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-slate-900 dark:text-white'
          }`}>
            {formatInr(Math.abs(data?.sharedGroupNetPaise || 0))}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
            {data?.sharedGroupText || 'All groups settled up'}
          </p>
        </div>
      </div>

      {/* Visual Analytics Grid: Spending by Category & Six-Month Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Spending by Category */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-blue-600" />
              Spending by Category
            </h3>
            <span className="text-xs text-slate-400">This Month</span>
          </div>

          {!data?.categoryBreakdown || data.categoryBreakdown.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400 flex-1">
              <Receipt className="w-8 h-8 stroke-1 mb-2" />
              <p className="text-xs font-semibold">No expenses recorded this month.</p>
            </div>
          ) : (
            <div className="space-y-3.5 flex-1 justify-center flex flex-col">
              {data.categoryBreakdown.map((cat) => (
                <div key={cat.categoryName}>
                  <div className="flex items-center justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-800 dark:text-slate-200">{cat.categoryName}</span>
                    <span className="font-mono text-slate-600 dark:text-slate-400">
                      {formatInr(cat.amountPaise)} ({cat.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-600 dark:bg-blue-500 transition-all duration-500"
                      style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Six-Month Spending Trend */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Six-Month Spending Trend
            </h3>
            <span className="text-xs text-slate-400">Recent Months</span>
          </div>

          {!data?.sixMonthTrend || data.sixMonthTrend.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400 flex-1">
              <TrendingUp className="w-8 h-8 stroke-1 mb-2" />
              <p className="text-xs font-semibold">No historical data available yet.</p>
            </div>
          ) : (
            <div className="h-44 flex items-end justify-between gap-2 pt-6">
              {data.sixMonthTrend.map((m) => {
                const max = Math.max(...data.sixMonthTrend.map((t) => t.expensePaise), 1000);
                const heightPercent = Math.max(Math.round((m.expensePaise / max) * 100), 8);
                return (
                  <div key={m.monthKey} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[10px] font-mono text-slate-400">
                      ₹{Math.round(m.expensePaise / 100).toLocaleString('en-IN')}
                    </span>
                    <div className="w-full max-w-[40px] h-full flex items-end">
                      <div
                        className="w-full rounded-t-lg bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 transition-all duration-300"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {m.monthKey.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Personal Transactions */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Recent Personal Expenses
          </h3>
          <button
            type="button"
            onClick={() => onNavigate('expenses')}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5"
          >
            View all ({data?.recentTransactions?.length || 0}) →
          </button>
        </div>

        {!data?.recentTransactions || data.recentTransactions.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No transactions yet. Click "+ Add Transaction" to log your first payment!
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.recentTransactions.map((tx) => (
              <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    tx.type === 'income'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                  }`}>
                    {tx.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {tx.description}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {tx.categoryName} • {formatDate(tx.transactionDate)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`text-xs font-mono font-bold ${
                    tx.type === 'income'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-900 dark:text-white'
                  }`}>
                    {tx.type === 'income' ? '+' : '-'}{formatInr(tx.amountPaise)}
                  </p>
                  <span className="text-[10px] text-slate-400 capitalize">
                    {tx.paymentMethod === 'upi_instant' ? 'UPI' : tx.paymentMethod}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
