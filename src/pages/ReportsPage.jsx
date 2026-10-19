import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';
import { formatInr } from '../utils/formatters.js';
import {
  BarChart3,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  PieChart,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

export function ReportsPage({ onNavigate }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.reports.getSummary(year, month);
      setData(res);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load report analytics.');
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const handleExportCsv = () => {
    const url = api.reports.getExportCsvUrl();
    window.location.href = url;
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Reports & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review monthly spending trends, category distributions, and budget health.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Month & Year Selectors */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value, 10))}
              className="px-2.5 py-1.5 rounded-lg bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              {monthNames.map((name, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>

            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              className="px-2.5 py-1.5 rounded-lg bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              {[2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <RefreshCw className="w-7 h-7 animate-spin mb-3" />
          <p className="text-xs font-semibold">Calculating report data...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 text-xs">
          {error}
        </div>
      ) : (
        <>
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Total Expense */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
                <span>Completed Expenses</span>
                <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2 font-mono">
                {formatInr(data?.completedExpensePaise || 0)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                For {monthNames[month - 1]} {year}
              </p>
            </div>

            {/* Total Income */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
                <span>Completed Income</span>
                <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2 font-mono">
                {formatInr(data?.completedIncomePaise || 0)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                For {monthNames[month - 1]} {year}
              </p>
            </div>

            {/* Net Cash Flow */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
                <span>Net Cash Flow</span>
                <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className={`text-2xl font-extrabold mt-2 font-mono ${
                (data?.netCashFlowPaise || 0) >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}>
                {formatInr(data?.netCashFlowPaise || 0)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Income minus expenses
              </p>
            </div>

            {/* Budget Health */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
                <span>Monthly Budget</span>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">Limit</span>
              </div>

              {data?.monthlyBudgetPaise === null ? (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => onNavigate('settings')}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Configure Budget →
                  </button>
                  <p className="text-[11px] text-slate-400 mt-1">No limit set in settings</p>
                </div>
              ) : (
                <>
                  <p className={`text-2xl font-extrabold mt-2 font-mono ${data?.isOverspent ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                    {formatInr(data?.remainingBudgetPaise || 0)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {data?.isOverspent ? 'Exceeded monthly budget' : `${data?.budgetUtilizationPercent}% utilized`}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Detailed Category Distribution */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-blue-600" />
              Category Breakdown for {monthNames[month - 1]} {year}
            </h3>

            {!data?.categoryBreakdown || data.categoryBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No expense transactions recorded in this month.
              </p>
            ) : (
              <div className="space-y-4">
                {data.categoryBreakdown.map((cat) => (
                  <div key={cat.categoryName}>
                    <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-800 dark:text-slate-200">{cat.categoryName}</span>
                      <span className="font-mono text-slate-600 dark:text-slate-400">
                        {formatInr(cat.amountPaise)} ({cat.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500"
                        style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Six-Month Trend Bar Chart */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              Six-Month Spending & Income Trend
            </h3>

            {!data?.sixMonthTrend || data.sixMonthTrend.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No trend data available.
              </p>
            ) : (
              <div className="h-52 flex items-end justify-between gap-3 pt-6 border-b border-slate-100 dark:border-slate-800 pb-2">
                {data.sixMonthTrend.map((m) => {
                  const maxVal = Math.max(
                    ...data.sixMonthTrend.flatMap((t) => [t.expensePaise, t.incomePaise]),
                    1000
                  );
                  const expHeight = Math.max(Math.round((m.expensePaise / maxVal) * 100), 4);
                  const incHeight = Math.max(Math.round((m.incomePaise / maxVal) * 100), 4);

                  return (
                    <div key={m.monthKey} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <div className="w-full flex items-end justify-center gap-1 h-full">
                        {/* Expense Bar */}
                        <div
                          title={`Expense: ${formatInr(m.expensePaise)}`}
                          className="w-1/2 max-w-[20px] rounded-t-md bg-rose-500 dark:bg-rose-600 transition-all duration-300"
                          style={{ height: `${expHeight}%` }}
                        />
                        {/* Income Bar */}
                        <div
                          title={`Income: ${formatInr(m.incomePaise)}`}
                          className="w-1/2 max-w-[20px] rounded-t-md bg-emerald-500 dark:bg-emerald-600 transition-all duration-300"
                          style={{ height: `${incHeight}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {m.monthKey}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-center gap-6 mt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-rose-500" />
                <span>Expense</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-emerald-500" />
                <span>Income</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
