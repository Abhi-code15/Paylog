import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { formatInr, formatDate } from '../utils/formatters.js';
import {
  UserPlus,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Search,
  Check,
  RefreshCw,
} from 'lucide-react';

export function FriendsPage() {
  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [emailQuery, setEmailQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const data = await api.friends.list();
      setFriends(data.friends || []);
      setIncoming(data.incomingRequests || []);
      setOutgoing(data.outgoingRequests || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load friends.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!emailQuery.trim()) return;

    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await api.friends.sendRequest(emailQuery.trim());
      setSuccessMsg(res.message || 'Friend request sent!');
      setEmailQuery('');
      fetchFriends();
    } catch (err) {
      setError(err.message || 'Failed to send friend request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRespond = async (id, action) => {
    setActionLoading(true);
    setError(null);
    try {
      await api.friends.respondRequest(id, action);
      fetchFriends();
    } catch (err) {
      setError(err.message || `Failed to ${action} request.`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Friends & 1-on-1 Debts
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Connect with registered Paylog users to easily add them to group splits.
        </p>
      </div>

      {/* Add Friend Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-blue-600" />
          Add a Friend by Email
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Enter the exact email address of a registered Paylog user.
        </p>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 p-3 mb-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSendRequest} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="email"
              required
              placeholder="friend@example.com"
              value={emailQuery}
              onChange={(e) => setEmailQuery(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={actionLoading}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 shrink-0"
          >
            {actionLoading ? 'Sending...' : 'Send Request'}
          </button>
        </form>
      </div>

      {/* Incoming Requests Section (if any) */}
      {incoming.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            Incoming Friend Requests ({incoming.length})
          </h3>

          <div className="divide-y divide-amber-200/60 dark:divide-amber-900/40">
            {incoming.map((req) => (
              <div key={req.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {req.requester_name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {req.requester_email}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleRespond(req.id, 'accept')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleRespond(req.id, 'decline')}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-rose-100 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outgoing Pending Requests (if any) */}
      {outgoing.length > 0 && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Outgoing Pending Requests ({outgoing.length})
          </h3>
          <div className="space-y-1.5">
            {outgoing.map((req) => (
              <div key={req.id} className="flex items-center justify-between text-xs py-1.5">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {req.recipient_name} ({req.recipient_email})
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                  Pending Acceptance
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accepted Friends List */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600" />
          Connected Friends ({friends.length})
        </h3>

        {loading ? (
          <div className="py-8 flex justify-center text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin" />
          </div>
        ) : friends.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No friends connected yet. Use the form above to add friends by their email!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {friends.map((f) => (
              <div
                key={f.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {f.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {f.email}
                  </p>
                  {f.upiId && (
                    <p className="text-[10px] font-mono text-blue-600 dark:text-blue-400 mt-0.5">
                      UPI: {f.upiId}
                    </p>
                  )}
                </div>

                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  Connected
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
