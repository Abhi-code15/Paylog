import React, { useState } from 'react';
import { AppLogo } from '../components/ui/AppLogo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import {
  Sun,
  Moon,
  ArrowRight,
  Receipt,
  Users,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  QrCode,
  Sparkles,
  Layers,
  ChevronRight,
  IndianRupee,
} from 'lucide-react';

export function LandingPage() {
  const { login, register, demoLogin } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (authMode === 'login') {
        await login(email, password);
      } else {
        if (!name.trim()) {
          throw new Error('Please enter your name.');
        }
        await register(name, email, password);
      }
      setAuthModalOpen(false);
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLaunch = async () => {
    setDemoLoading(true);
    setError(null);
    try {
      await demoLogin();
    } catch (err) {
      setError('Failed to launch demo session.');
    } finally {
      setDemoLoading(false);
    }
  };

  const openAuth = (mode) => {
    setAuthMode(mode);
    setError(null);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* ─── Header ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <AppLogo />
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
              <a href="#features" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                How It Works
              </a>
              <a href="#preview" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                Product Preview
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => openAuth('login')}
              className="px-3 sm:px-3.5 py-1.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Sign In
            </button>

            <button
              type="button"
              onClick={() => openAuth('register')}
              className="px-3.5 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* ─── Hero Section (Two-Column Desktop) ───────────────────── */}
      <section className="relative overflow-hidden border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Column: Value Proposition & CTAs */}
            <div className="lg:col-span-6 flex flex-col items-start text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 text-xs font-medium mb-6">
                <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                <span>Personal Ledger & Shared Group Expenses</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 leading-[1.15]">
                Pay it. Log it.{' '}
                <span className="text-blue-600 dark:text-blue-400">Done.</span>
              </h1>

              <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                Track your income and expenses, keep an eye on your monthly budget, and split shared expenses in one place. Built with exact integer arithmetic for the Indian financial ecosystem.
              </p>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => openAuth('register')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-colors"
                >
                  <span>Create Free Account</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleDemoLaunch}
                  disabled={demoLoading}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold text-sm transition-colors disabled:opacity-60 shadow-sm"
                >
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>{demoLoading ? 'Starting Demo...' : 'Explore Demo'}</span>
                </button>
              </div>

              {/* Trust & Clarity Note */}
              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  No bank passwords or UPI PINs needed
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Free forever with instant demo mode
                </span>
              </div>
            </div>

            {/* Right Column: Realistic Product Preview */}
            <div id="preview" className="lg:col-span-6 w-full">
              <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xl overflow-hidden transition-colors">
                
                {/* Preview Window Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/50">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <span className="ml-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Dashboard Summary
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium tracking-wide uppercase bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Illustrative Sample Preview
                  </span>
                </div>

                {/* Preview Body */}
                <div className="p-5 sm:p-6 space-y-5">
                  
                  {/* Budget & Cash Flow Overview */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        Monthly Spending
                      </div>
                      <div className="mt-1 text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                        ₹14,250
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        Budget: ₹25,000 (57% used)
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        Shared Balance
                      </div>
                      <div className="mt-1 text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        +₹2,650
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        You are owed across 2 groups
                      </div>
                    </div>
                  </div>

                  {/* Budget Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-600 dark:text-slate-400">Monthly Budget Progress</span>
                      <span className="text-slate-900 dark:text-white font-semibold">₹10,750 remaining</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-600 dark:bg-blue-500 transition-all"
                        style={{ width: '57%' }}
                      />
                    </div>
                  </div>

                  {/* Recent Transactions List */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Recent Transactions
                      </span>
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        View All
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/40 dark:bg-slate-900/40">
                      {/* Tx 1 */}
                      <div className="flex items-center justify-between p-3 text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                            <ArrowDownRight className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">Swiggy Order</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">Food • UPI Instant</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-900 dark:text-white">-₹420.00</div>
                          <div className="text-[10px] text-slate-400">Today, 2:15 PM</div>
                        </div>
                      </div>

                      {/* Tx 2 */}
                      <div className="flex items-center justify-between p-3 text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                            <Users className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">Flat WiFi Bill (Split)</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">Utilities • You paid ₹1,200</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-emerald-600 dark:text-emerald-400">+₹800.00 owed</div>
                          <div className="text-[10px] text-slate-400">Yesterday</div>
                        </div>
                      </div>

                      {/* Tx 3 */}
                      <div className="flex items-center justify-between p-3 text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">Client Project Payout</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">Income • Direct Transfer</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-emerald-600 dark:text-emerald-400">+₹35,000.00</div>
                          <div className="text-[10px] text-slate-400">15 Oct</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Micro UPI / Split banner inside preview */}
                  <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <QrCode className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Scan UPI QR & log outcomes seamlessly</span>
                    </div>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">Assisted</span>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── Core Features Section ──────────────────────────────── */}
      <section id="features" className="py-16 sm:py-24 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-2xl">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Core Capabilities
            </h2>
            <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Everything you need for clean money management
            </p>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Designed specifically for everyday personal spending and group shared expenses, without bloated interfaces or unnecessary complexity.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Feature 1: Expense Tracking */}
            <div className="flex flex-col p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-700">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-5">
                <Receipt className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                1. Daily Expense Tracking
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed flex-1">
                Log income and expenses, review your complete transaction history, and understand where your money goes. Record payments made via UPI, cash, card, or net banking with custom categories.
              </p>
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>UPI payment intent & QR scan assistance</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>User-reported transaction outcome logging</span>
                </div>
              </div>
            </div>

            {/* Feature 2: Shared Expense Splitting */}
            <div className="flex flex-col p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-700">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-5">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                2. Shared Expense Splitting
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed flex-1">
                Organize group expenses for trips, flatmates, and group dinners. Deterministic integer arithmetic guarantees split shares always equal the total down to the exact paisa, with no rounding errors.
              </p>
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Debt simplification & settle-up workflows</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Supports registered and offline group members</span>
                </div>
              </div>
            </div>

            {/* Feature 3: Spending Insights */}
            <div className="flex flex-col p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-700">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                3. Spending Insights & Budgets
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed flex-1">
                Set monthly spending budgets, track progress indicators, and inspect category breakdowns. Gain visibility into your net cash flow with persistent PostgreSQL storage and clean CSV exports.
              </p>
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Monthly budget tracking & status alerts</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Category summaries & net cash flow analysis</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── How It Works / Product Clarity Section ─────────────── */}
      <section id="how-it-works" className="py-16 sm:py-20 border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Workflow
            </h2>
            <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              How Paylog works in practice
            </p>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
              A transparent, privacy-first ledger designed to keep record-keeping fast and straightforward.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="text-sm font-bold text-blue-600 dark:text-blue-400">Step 01</div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Record or Pay</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Log transactions manually or launch your preferred UPI app directly from Paylog with prepopulated merchant details and amounts.
              </p>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-bold text-blue-600 dark:text-blue-400">Step 02</div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Split Group Costs</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Add shared bills to your groups. Paylog calculates exactly who owes whom using deterministic balance algorithms without fractions.
              </p>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-bold text-blue-600 dark:text-blue-400">Step 03</div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Stay On Budget</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Monitor your spending limit for the month, inspect your category distributions, and export clean records whenever you need them.
              </p>
            </div>
          </div>

          {/* Privacy & Honesty Banner */}
          <div className="mt-14 p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Privacy-first and direct
                </h4>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 max-w-2xl">
                  Paylog does not connect to banking APIs or store UPI PINs. Transactions are logged either directly by you or recorded via UPI payment assistance with user confirmation.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDemoLaunch}
                disabled={demoLoading}
                className="shrink-0 px-4 py-2 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Try Demo Mode
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ─── Bottom CTA Banner ──────────────────────────────────── */}
      <section className="py-16 bg-slate-100/70 dark:bg-slate-900/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Take control of your day-to-day finances
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Create an account in 30 seconds or launch the pre-populated demo session to explore all features right away.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => openAuth('register')}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-colors"
            >
              Create Free Account
            </button>
            <button
              type="button"
              onClick={handleDemoLaunch}
              disabled={demoLoading}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold text-sm transition-colors"
            >
              Explore Interactive Demo
            </button>
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-10 px-4 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center sm:items-start gap-1">
            <AppLogo textClassName="text-lg" />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Personal ledger & shared expense management for the Indian financial ecosystem.
            </p>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400">
            <a href="#features" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              How It Works
            </a>
            <button
              type="button"
              onClick={() => openAuth('login')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/60 text-center text-[11px] text-slate-400 dark:text-slate-500">
          © {new Date().getFullYear()} Paylog. All rights reserved.
        </div>
      </footer>

      {/* ─── Authentication Modal ───────────────────────────────── */}
      <Modal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        title={authMode === 'login' ? 'Sign in to Paylog' : 'Create your account'}
        subtitle={
          authMode === 'login'
            ? 'Enter your credentials to access your financial records'
            : 'Start tracking transactions and splitting bills in seconds'
        }
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAuthSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {authMode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="Abhishek Tiwari"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Please wait...' : authMode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          <div className="text-center pt-2">
            {authMode === 'login' ? (
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setError(null);
                  }}
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Create one now
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setError(null);
                  }}
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
}
