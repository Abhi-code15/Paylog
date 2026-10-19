import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal.jsx';
import { api } from '../../services/api.js';
import { formatInr } from '../../utils/formatters.js';
import { splitEqual } from '../../utils/money.js';
import { AlertCircle, Check, Users } from 'lucide-react';

export function AddSharedExpenseModal({ isOpen, onClose, group, onSuccess }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [payerMemberId, setPayerMemberId] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const members = group?.members || [];

  useEffect(() => {
    if (isOpen && group) {
      setTitle('');
      setAmount('');
      setError(null);
      setExpenseDate(new Date().toISOString().slice(0, 10));

      // Default payer: current user's member ID, or first member
      const currentUserMember = members.find((m) => m.isCurrentUser);
      setPayerMemberId(currentUserMember ? currentUserMember.id : members[0]?.id || '');

      // Default participants: all members
      setSelectedMemberIds(members.map((m) => m.id));

      api.categories.list()
        .then((data) => {
          const expenseCats = (data.categories || []).filter((c) => c.type === 'expense');
          setCategories(expenseCats);
          if (expenseCats.length > 0) {
            setCategoryId(expenseCats[0].id);
          }
        })
        .catch(console.error);
    }
  }, [isOpen, group]);

  const toggleParticipant = (memberId) => {
    setSelectedMemberIds((prev) => {
      if (prev.includes(memberId)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((id) => id !== memberId);
      }
      return [...prev, memberId];
    });
  };

  const handleSelectAll = () => {
    setSelectedMemberIds(members.map((m) => m.id));
  };

  // Preview split shares
  let previewShares = [];
  const parsedAmount = parseFloat(amount);
  if (!isNaN(parsedAmount) && parsedAmount > 0 && selectedMemberIds.length > 0) {
    try {
      const paise = Math.round(parsedAmount * 100);
      previewShares = splitEqual(paise, selectedMemberIds.length);
    } catch (e) {
      previewShares = [];
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    if (!payerMemberId) {
      setError('Payer member is required.');
      return;
    }

    if (selectedMemberIds.length === 0) {
      setError('At least one member must participate in the split.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const selectedCategory = categories.find((c) => c.id === categoryId);

      await api.groups.addExpense(group.group.id, {
        title: title.trim(),
        amount: parsedAmount,
        categoryId: categoryId || null,
        categoryName: selectedCategory?.name || 'Other',
        expenseDate,
        payerMemberId,
        participantMemberIds: selectedMemberIds,
        splitMethod: 'equal',
      });

      setLoading(false);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Failed to add shared expense.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Group Expense"
      subtitle={`Split a bill in ${group?.group?.name}`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Expense Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Dinner at Fisherman's Wharf, Villa Rent"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Total Amount (INR ₹) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
              ₹
            </span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xl font-bold placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Category & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Expense Date
            </label>
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Paid By Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Paid By
          </label>
          <select
            value={payerMemberId}
            onChange={(e) => setPayerMemberId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} {m.isCurrentUser ? '(You)' : m.isManual ? '(Offline)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Split Between Participants */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600" />
              Split Equally Among ({selectedMemberIds.length} people)
            </span>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Select All
            </button>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {members.map((m) => {
              const isChecked = selectedMemberIds.includes(m.id);
              const participantIndex = selectedMemberIds.indexOf(m.id);
              const sharePaise = participantIndex !== -1 && previewShares[participantIndex]
                ? previewShares[participantIndex]
                : null;

              return (
                <label
                  key={m.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isChecked
                      ? 'border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleParticipant(m.id)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      {m.name} {m.isCurrentUser && '(You)'}
                    </span>
                  </div>

                  {sharePaise !== null && (
                    <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                      {formatInr(sharePaise)}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{loading ? 'Adding Expense...' : 'Add Expense'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
