import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import { Navbar } from './components/layout/Navbar.jsx';
import { BottomNav } from './components/layout/BottomNav.jsx';
import { LandingPage } from './pages/LandingPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { ExpensesPage } from './pages/ExpensesPage.jsx';
import { GroupsPage } from './pages/GroupsPage.jsx';
import { GroupDetailsPage } from './pages/GroupDetailsPage.jsx';
import { FriendsPage } from './pages/FriendsPage.jsx';
import { ReportsPage } from './pages/ReportsPage.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';
import { AddTransactionModal } from './components/modals/AddTransactionModal.jsx';
import { PendingPaymentsModal } from './components/modals/PendingPaymentsModal.jsx';
import { AppLogo } from './components/ui/AppLogo.jsx';
import { api } from './services/api.js';
import { RefreshCw, AlertCircle } from 'lucide-react';

export function App() {
  const { user, loading, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  // Modals
  const [addTxOpen, setAddTxOpen] = useState(false);
  const [addTxInitialType, setAddTxInitialType] = useState('expense');
  const [pendingModalOpen, setPendingModalOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Splash timeout recovery
  const [splashTimeout, setSplashTimeout] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashTimeout(true);
    }, 7000);
    return () => clearTimeout(timer);
  }, []);

  // Fetch pending count periodically when signed in
  const fetchPendingCount = async () => {
    if (!user) return;
    try {
      const data = await api.paymentAttempts.listPending();
      setPendingCount((data.pendingAttempts || []).length);
    } catch (e) {
      // Ignore background poll errors
    }
  };

  useEffect(() => {
    if (user) {
      fetchPendingCount();
      const interval = setInterval(fetchPendingCount, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Loading / Splash Screen
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors">
        <div className="flex flex-col items-center gap-4 text-center">
          <AppLogo className="h-12" textClassName="text-3xl" />
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-medium mt-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
            <span>Loading Paylog...</span>
          </div>

          {splashTimeout && (
            <div className="mt-6 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm max-w-xs animate-in fade-in">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                Loading is taking longer than usual. You can retry connecting to the server.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSplashTimeout(false);
                  refreshUser();
                }}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                Retry Connection
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Not signed in -> Landing Page
  if (!user) {
    return <LandingPage />;
  }

  const handleNavigate = (tab) => {
    setActiveTab(tab);
    if (tab !== 'group_detail') {
      setSelectedGroupId(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAddTransaction = (initialType = 'expense') => {
    setAddTxInitialType(initialType);
    setAddTxOpen(true);
  };

  const handleSelectGroup = (groupId) => {
    setSelectedGroupId(groupId);
    setActiveTab('group_detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab === 'group_detail' ? 'groups' : activeTab}
        onNavigate={handleNavigate}
        onOpenPendingModal={() => setPendingModalOpen(true)}
        pendingCount={pendingCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {activeTab === 'overview' && (
          <DashboardPage
            onOpenAddTransaction={handleOpenAddTransaction}
            onNavigate={handleNavigate}
            onOpenPendingModal={() => setPendingModalOpen(true)}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesPage onOpenAddTransaction={handleOpenAddTransaction} />
        )}

        {activeTab === 'groups' && (
          <GroupsPage onSelectGroup={handleSelectGroup} />
        )}

        {activeTab === 'group_detail' && selectedGroupId && (
          <GroupDetailsPage
            groupId={selectedGroupId}
            onBack={() => handleNavigate('groups')}
          />
        )}

        {activeTab === 'friends' && <FriendsPage />}

        {activeTab === 'reports' && <ReportsPage onNavigate={handleNavigate} />}

        {activeTab === 'settings' && <SettingsPage />}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab === 'group_detail' ? 'groups' : activeTab}
        onNavigate={handleNavigate}
      />

      {/* Global Add Transaction Modal */}
      <AddTransactionModal
        isOpen={addTxOpen}
        onClose={() => setAddTxOpen(false)}
        initialType={addTxInitialType}
        onSuccess={() => {
          fetchPendingCount();
          // Trigger tab re-renders by small state pulse if needed
        }}
      />

      {/* Global Pending Payments Modal */}
      <PendingPaymentsModal
        isOpen={pendingModalOpen}
        onClose={() => setPendingModalOpen(false)}
        onUpdated={fetchPendingCount}
      />
    </div>
  );
}
