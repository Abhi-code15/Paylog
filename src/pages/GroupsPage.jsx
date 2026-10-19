import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { formatInr } from '../utils/formatters.js';
import { CreateGroupModal } from '../components/modals/CreateGroupModal.jsx';
import {
  Users,
  PlusCircle,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  MapPin,
  Home,
  PartyPopper,
  Calendar,
} from 'lucide-react';

export function GroupsPage({ onSelectGroup }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const data = await api.groups.list();
      setGroups(data.groups || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load groups.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'trip': return <MapPin className="w-4 h-4 text-emerald-500" />;
      case 'apartment': return <Home className="w-4 h-4 text-blue-500" />;
      case 'event': return <PartyPopper className="w-4 h-4 text-amber-500" />;
      default: return <Users className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Split Groups
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage shared expenses for trips, flatmates, and events with equal split & debt simplification.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition-all self-start sm:self-center"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Group</span>
        </button>
      </div>

      {/* Groups List */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mb-2" />
          <p className="text-xs">Loading groups...</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            No groups created yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Create a group for your next road trip, dinner party, or flat sharing to keep track of shared bills without manual calculations.
          </p>
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Create Your First Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {groups.map((grp) => (
            <div
              key={grp.id}
              onClick={() => onSelectGroup(grp.id)}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-400/60 dark:hover:border-blue-500/40 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                      {getTypeIcon(grp.groupType)}
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {grp.groupType}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {grp.memberCount} member{grp.memberCount !== 1 ? 's' : ''}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {grp.name}
                </h3>
                {grp.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {grp.description}
                  </p>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    Your Balance
                  </p>
                  <p className={`text-sm font-extrabold font-mono ${
                    grp.viewerNetPaise > 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : grp.viewerNetPaise < 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-600 dark:text-slate-400'
                  }`}>
                    {grp.viewerBalanceText}
                  </p>
                </div>

                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/60 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={fetchGroups}
      />
    </div>
  );
}
