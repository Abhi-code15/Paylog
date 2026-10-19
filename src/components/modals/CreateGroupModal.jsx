import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal.jsx';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Users, UserPlus, Trash2, AlertCircle, Check } from 'lucide-react';

export function CreateGroupModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [groupType, setGroupType] = useState('trip');
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [manualMembers, setManualMembers] = useState([]);

  // Manual member input fields
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualUpi, setManualUpi] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setGroupType('trip');
      setSelectedFriends([]);
      setManualMembers([]);
      setManualName('');
      setManualEmail('');
      setManualUpi('');
      setError(null);

      // Load accepted friends
      api.friends.list()
        .then((data) => setFriends(data.friends || []))
        .catch(console.error);
    }
  }, [isOpen]);

  const handleAddManualMember = (e) => {
    e.preventDefault();
    if (!manualName.trim()) return;

    const lower = manualName.trim().toLowerCase();
    // Check duplicates
    if (manualMembers.some((m) => m.name.toLowerCase() === lower)) {
      setError(`Member "${manualName}" is already added.`);
      return;
    }

    setManualMembers((prev) => [
      ...prev,
      {
        type: 'manual',
        name: manualName.trim(),
        email: manualEmail.trim() || null,
        upiId: manualUpi.trim() || null,
      },
    ]);

    setManualName('');
    setManualEmail('');
    setManualUpi('');
    setError(null);
  };

  const handleToggleFriend = (friend) => {
    setSelectedFriends((prev) => {
      const exists = prev.some((f) => f.id === friend.id);
      if (exists) {
        return prev.filter((f) => f.id !== friend.id);
      }
      return [...prev, friend];
    });
  };

  const handleRemoveManual = (index) => {
    setManualMembers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Group name is required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const membersPayload = [
        ...selectedFriends.map((f) => ({ type: 'friend', userId: f.id })),
        ...manualMembers.map((m) => ({
          type: 'manual',
          name: m.name,
          email: m.email,
          upiId: m.upiId,
        })),
      ];

      await api.groups.create({
        name: name.trim(),
        description: description.trim() || null,
        groupType,
        currency: 'INR',
        members: membersPayload,
      });

      setLoading(false);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Failed to create group.');
    }
  };

  const totalMembersCount = 1 + selectedFriends.length + manualMembers.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Group"
      subtitle="Organize shared expenses for trips, flatmates, or events"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Group Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Group Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Goa Trip 2026, Flat 402, Friday Dinner"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Group Type */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {['trip', 'apartment', 'friends', 'family', 'event', 'other'].map((gt) => (
            <button
              key={gt}
              type="button"
              onClick={() => setGroupType(gt)}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold capitalize transition-all ${
                groupType === gt
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 ring-1 ring-blue-600'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {gt}
            </button>
          ))}
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Description (Optional)
          </label>
          <input
            type="text"
            placeholder="Short note about the purpose of this group"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Members Management Section */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600" />
              Members ({totalMembersCount} including you)
            </span>
          </div>

          {/* Current selected members pills */}
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {user?.name} (You)
            </span>

            {selectedFriends.map((f) => (
              <span
                key={f.id}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              >
                {f.name}
                <button
                  type="button"
                  onClick={() => handleToggleFriend(f)}
                  className="hover:text-emerald-900 dark:hover:text-white ml-0.5"
                >
                  &times;
                </button>
              </span>
            ))}

            {manualMembers.map((m, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              >
                {m.name} (Offline)
                <button
                  type="button"
                  onClick={() => handleRemoveManual(idx)}
                  className="hover:text-slate-900 dark:hover:text-white ml-0.5"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>

          {/* 1. Add Registered Paylog Friend */}
          {friends.length > 0 && (
            <div className="mb-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Select from Accepted Friends:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {friends.map((f) => {
                  const isSelected = selectedFriends.some((sf) => sf.id === f.id);
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => handleToggleFriend(f)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                      }`}
                    >
                      {isSelected ? `✓ ${f.name}` : `+ ${f.name}`}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Add Offline Participant Manually */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Add Offline Member (Name only, no login required):
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Participant Name"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400"
              />
              <button
                type="button"
                onClick={handleAddManualMember}
                className="px-3 py-1.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
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
            <span>{loading ? 'Creating...' : 'Create Group'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
