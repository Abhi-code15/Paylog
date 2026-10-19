import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';
import { formatInr, formatDate } from '../utils/formatters.js';
import {
  Search,
  PlusCircle,
  Download,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  Trash2,
  AlertCircle,
  CreditCard,
  Banknote,
  MoreHorizontal,
  RefreshCw,
} from 'lucide-react';

export function ExpensesPage({ onOpenAddTransaction }) {
  const [transactions, setTransactions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [completedExpensePaise, setCompletedExpensePaise] = useState(0);
  const [completedIncomePaise, setCompletedIncomePaise] = useState(0);

  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load categories once
  useEffect(() => {
    api.categories.list()
      .then((data) => setCategories(data.categories || []))
      .catch(console.error);
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedType) params.type = selectedType;
      if (selectedCategory) params.categoryId = selectedCategory;
      if (selectedMethod) params.paymentMethod = selectedMethod;
      if (selectedStatus) params.status = selectedStatus;

      const data = await api.transactions.list(params);
      setTransactions(data.transactions || []);
      setTotalCount(data.totalCount || 0);
      setCompletedExpensePaise(data.completedExpensePaise || 0);
      setCompletedIncomePaise(data.completedIncomePaise || 0);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load transactions.');
    } finally {
      setLoading(false);
    }
  }, [search, selectedType, selectedCategory, selectedMethod, selectedStatus]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await api.transactions.delete(id);
      fetchTransactions();
    } catch (err) {
      alert(err.message || 'Failed to delete transaction.');
    }
  };

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
            Personal Transactions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Search, filter, and review all your personal spending and income records.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenAddTransaction()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by description, merchant, or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filter Selectors Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="expense">Expenses Only</option>
            <option value="income">Income Only</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.type})
              </option>
            ))}
          </select>

          {/* Payment Method Filter */}
          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Methods</option>
            <option value="upi_instant">UPI Instant</option>
            <option value="cash">Cash</option>
            <option value="other">Other</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Filtered Dynamic Totals Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-xs font-semibold">
        <div className="flex items-center gap-4 text-slate-700 dark:text-slate-300">
          <span>
            Showing <strong className="text-slate-900 dark:text-white font-bold">{totalCount}</strong> transaction{totalCount !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-slate-600 dark:text-slate-400">
            Total Spent: <strong className="text-rose-600 dark:text-rose-400 font-mono font-bold">{formatInr(completedExpensePaise)}</strong>
          </span>
          <span className="text-slate-600 dark:text-slate-400">
            Total Income: <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{formatInr(completedIncomePaise)}</strong>
          </span>
        </div>
      </div>

      {/* Transactions List */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mb-2" />
          <p className="text-xs">Loading transactions...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <PlusCircle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            No transactions found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {search || selectedType || selectedCategory || selectedMethod || selectedStatus
              ? 'Try adjusting your search terms or filters.'
              : 'You have not recorded any transactions yet. Click below to add your first expense or income!'}
          </p>
          <button
            type="button"
            onClick={() => onOpenAddTransaction()}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Add Transaction
          </button>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    tx.type === 'income'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {tx.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {tx.description}
                    </p>
                    {tx.status !== 'completed' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 capitalize">
                        {tx.status}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <span>{tx.categoryName}</span>
                    <span>•</span>
                    <span>{formatDate(tx.transactionDate)}</span>
                    {tx.recipientOrMerchant && (
                      <>
                        <span>•</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {tx.recipientOrMerchant}
                        </span>
                      </>
                    )}
                    <span>•</span>
                    <span className="capitalize">
                      {tx.paymentMethod === 'upi_instant' ? 'UPI' : tx.paymentMethod}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <p
                  className={`text-sm sm:text-base font-mono font-extrabold ${
                    tx.type === 'income'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {tx.type === 'income' ? '+' : '-'}{formatInr(tx.amountPaise)}
                </p>

                <button
                  type="button"
                  onClick={() => handleDelete(tx.id)}
                  title="Delete transaction"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
