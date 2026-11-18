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
  Menu,
  X,
  Check,
} from 'lucide-react';

export function LandingPage() {
  const { login, register, demoLogin, googleLogin } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Authentication modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);

  // Interactive Live Demo Terminal state ('overview' | 'split' | 'upi')
  const [previewTab, setPreviewTab] = useState('overview');
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Slide-over info sidebar drawer state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('capabilities'); // 'capabilities' | 'workflow' | 'security'

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (authMode === 'login') {
        await login(email, password);
      } else {
        if (!name.trim()) {
          throw new Error('Please enter your full name.');
        }
        await register(name, email, password);
      }
      setAuthModalOpen(false);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      const promptEmail = prompt('Enter your Google account email to sign in via Google OAuth:', 'user@gmail.com');
      if (!promptEmail) {
        setGoogleLoading(false);
        return;
      }

      await googleLogin({
        email: promptEmail.trim(),
        name: promptEmail.split('@')[0],
      });
      setAuthModalOpen(false);
    } catch (err) {
      setError(err.message || 'Google authentication failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleDemoLaunch = async () => {
    setDemoLoading(true);
    setError(null);
    try {
      await demoLogin();
    } catch (err) {
      setError('Failed to launch interactive demo session.');
    } finally {
      setDemoLoading(false);
    }
  };

  const openAuth = (mode) => {
    setAuthMode(mode);
    setError(null);
    setAuthModalOpen(true);
  };

  const handleCopyUpi = () => {
    navigator.clipboard?.writeText('upi://pay?pa=abhishek@okhdfcbank&pn=Abhishek%20Tiwari&tn=Dinner%20Split&cu=INR');
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-black text-slate-900 dark:text-zinc-100 transition-colors duration-200 relative overflow-x-hidden">
      
      {/* ─── Header Navigation (Zero Overlap, Mobile-Responsive) ───────────── */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-black/90 backdrop-blur-md transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          
          {/* Left: Brand Logo (Clean & Prominent) */}
          <div className="shrink-0 flex items-center">
            <AppLogo />
          </div>

          {/* Right: Theme Toggle, Sign In, and Features & Docs (Replacing Get Started) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Sign In Button */}
            <button
              type="button"
              onClick={() => openAuth('login')}
              className="px-2.5 py-1.5 sm:px-3 text-xs sm:text-sm font-semibold text-slate-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Sign In
            </button>

            {/* Features & Docs Sidebar Trigger (Rightmost Position, Replacing Get Started) */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Features & Docs"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-black dark:hover:bg-zinc-200 text-xs sm:text-sm font-bold shadow-sm transition-all"
            >
              <Menu className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>Features & Docs</span>
            </button>

          </div>

        </div>
      </header>

      {/* ─── Hero Section (Minimal, Punchy, Zero Mobile Overlap) ───────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Focused Copy & CTAs */}
          <div className="lg:col-span-6 flex flex-col items-start text-left">
            
            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.12]">
              Pay it. Log it.{' '}
              <span className="text-blue-600 dark:text-blue-500">Done.</span>
            </h1>

            {/* Short, Concise Subtext (No Overlong Walls of Text) */}
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-zinc-400 leading-relaxed max-w-lg font-normal">
              Track personal spending, manage monthly budgets, and split group bills — with exact integer precision.
            </p>

            {/* Action Buttons (Full-Width on Mobile, Inline on Desktop) */}
            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => openAuth('register')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md shadow-blue-600/20 transition-all"
              >
                <span>Create Free Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleDemoLaunch}
                disabled={demoLoading}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-[#161619] hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800 font-bold text-sm transition-all disabled:opacity-60 shadow-sm"
              >
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{demoLoading ? 'Starting Demo...' : 'Explore Demo'}</span>
              </button>
            </div>

            {/* Trust Reassurance Notes */}
            <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-5 text-xs text-slate-500 dark:text-zinc-400">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>No bank passwords or UPI PINs needed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Anti-fraud optimized UPI handoff</span>
              </div>
            </div>

          </div>

          {/* Right Column: High-Craft True Black Interactive Preview Window */}
          <div className="lg:col-span-6 w-full">
            <div className="relative rounded-2xl border border-slate-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#0c0c0e] shadow-xl dark:shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden transition-all">
              
              {/* Window Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/90 dark:bg-[#111114]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-xs font-bold text-slate-700 dark:text-zinc-200">
                    Live Demo Terminal
                  </span>
                </div>
                
                {/* Mode Selector Tabs */}
                <div className="flex items-center p-0.5 rounded-lg bg-slate-200/60 dark:bg-[#18181c] text-[10px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setPreviewTab('overview')}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      previewTab === 'overview'
                        ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    Ledger
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab('split')}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      previewTab === 'split'
                        ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    Bill Split
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab('upi')}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      previewTab === 'upi'
                        ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    Smart UPI
                  </button>
                </div>
              </div>

              {/* Window Body: TAB 1 - OVERVIEW */}
              {previewTab === 'overview' && (
                <div className="p-4 sm:p-5 space-y-4">
                  {/* 2-column Metrics */}
                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
                    <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-[#141417] border border-slate-200/60 dark:border-zinc-800/80">
                      <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                        Monthly Spending
                      </div>
                      <div className="mt-1 text-base sm:text-xl font-bold font-mono text-slate-900 dark:text-white">
                        ₹14,250
                      </div>
                      <div className="mt-0.5 text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                        Budget: ₹25,000 (57%)
                      </div>
                    </div>

                    <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-[#141417] border border-slate-200/60 dark:border-zinc-800/80">
                      <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                        Shared Balance
                      </div>
                      <div className="mt-1 text-base sm:text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        +₹2,650
                      </div>
                      <div className="mt-0.5 text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                        Owed across 2 groups
                      </div>
                    </div>
                  </div>

                  {/* Budget Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-600 dark:text-zinc-400 text-[11px] sm:text-xs">Budget Burn Rate</span>
                      <span className="text-slate-900 dark:text-white font-mono font-bold text-[11px] sm:text-xs">₹10,750 remaining</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                      <div className="h-full rounded-full bg-blue-600 dark:bg-blue-500" style={{ width: '57%' }} />
                    </div>
                  </div>

                  {/* Recent Activity List */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
                      <span>Recent Activity</span>
                      <button
                        type="button"
                        onClick={handleDemoLaunch}
                        className="text-blue-600 dark:text-blue-400 font-semibold hover:underline normal-case text-xs"
                      >
                        Launch Interactive Sandbox &rarr;
                      </button>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-zinc-800/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-[#121215]">
                      {/* Item 1 */}
                      <div className="flex items-center justify-between p-2.5 text-xs hover:bg-slate-100/50 dark:hover:bg-zinc-800/40 transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
                            <ArrowDownRight className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 dark:text-zinc-100 truncate">Swiggy Order</div>
                            <div className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">Food &bull; UPI Instant</div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-mono font-bold text-slate-900 dark:text-zinc-100">-₹420.00</div>
                          <div className="text-[10px] text-slate-400 dark:text-zinc-500">Today</div>
                        </div>
                      </div>

                      {/* Item 2 */}
                      <div className="flex items-center justify-between p-2.5 text-xs hover:bg-slate-100/50 dark:hover:bg-zinc-800/40 transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                            <Users className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 dark:text-zinc-100 truncate">Flat WiFi Bill</div>
                            <div className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">Shared &bull; 4 Friends</div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">+₹800.00</div>
                          <div className="text-[10px] text-slate-400 dark:text-zinc-500">Yesterday</div>
                        </div>
                      </div>

                      {/* Item 3 */}
                      <div className="flex items-center justify-between p-2.5 text-xs hover:bg-slate-100/50 dark:hover:bg-zinc-800/40 transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 dark:text-zinc-100 truncate">Freelance Payout</div>
                            <div className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">Income &bull; Direct Transfer</div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">+₹35,000.00</div>
                          <div className="text-[10px] text-slate-400 dark:text-zinc-500">15 Oct</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Window Body: TAB 2 - BILL SPLIT SIMULATOR */}
              {previewTab === 'split' && (
                <div className="p-4 sm:p-5 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/80 pb-2.5">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Weekend Trip &bull; Goa Villa</div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400">Total bill: ₹8,400 &bull; Paid by Abhishek Tiwari</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60">
                      Exact Integer Split
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#141417] border border-slate-200/60 dark:border-zinc-800/80 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">A</div>
                        <span className="font-semibold text-slate-900 dark:text-zinc-100">Abhishek Tiwari (You)</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">+₹6,300.00 (Gets back)</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#141417] border border-slate-200/60 dark:border-zinc-800/80 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-slate-300 dark:bg-zinc-700 text-slate-800 dark:text-zinc-200 flex items-center justify-center text-[10px] font-bold">R</div>
                        <span className="font-medium text-slate-700 dark:text-zinc-300">Rahul Sharma</span>
                      </div>
                      <span className="font-mono font-bold text-rose-500 dark:text-rose-400">-₹2,100.00 (Owes)</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#141417] border border-slate-200/60 dark:border-zinc-800/80 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-slate-300 dark:bg-zinc-700 text-slate-800 dark:text-zinc-200 flex items-center justify-center text-[10px] font-bold">P</div>
                        <span className="font-medium text-slate-700 dark:text-zinc-300">Priya Patel</span>
                      </div>
                      <span className="font-mono font-bold text-rose-500 dark:text-rose-400">-₹2,100.00 (Owes)</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#141417] border border-slate-200/60 dark:border-zinc-800/80 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-slate-300 dark:bg-zinc-700 text-slate-800 dark:text-zinc-200 flex items-center justify-center text-[10px] font-bold">S</div>
                        <span className="font-medium text-slate-700 dark:text-zinc-300">Sneha Verma</span>
                      </div>
                      <span className="font-mono font-bold text-rose-500 dark:text-rose-400">-₹2,100.00 (Owes)</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-[11px] text-blue-800 dark:text-blue-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>0.00 Paise remainder error: all splits resolve precisely with no floating-point discrepancy.</span>
                  </div>
                </div>
              )}

              {/* Window Body: TAB 3 - SMART UPI HANDOFF */}
              {previewTab === 'upi' && (
                <div className="p-4 sm:p-5 space-y-3.5">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#141417] border border-slate-200/60 dark:border-zinc-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-zinc-400">Target VPA (Payee):</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">abhishek@okhdfcbank</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-zinc-400">Payee Name:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">Abhishek Tiwari</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-zinc-400">Transaction Note:</span>
                      <span className="font-mono text-slate-700 dark:text-zinc-300">Dinner Split</span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 dark:border-zinc-800/60">
                      <span className="text-slate-500 dark:text-zinc-400">Amount Parameter (am):</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-[11px] bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                        OMITTED (Anti-Fraud Safe)
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#111114] border border-slate-200/80 dark:border-zinc-800 text-[11px] font-mono text-slate-600 dark:text-zinc-400 break-all select-all">
                    upi://pay?pa=abhishek@okhdfcbank&pn=Abhishek%20Tiwari&tn=Dinner%20Split&cu=INR
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                    >
                      {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <QrCode className="w-3.5 h-3.5" />}
                      <span>{copiedUpi ? 'Copied Intent URL' : 'Copy Clean UPI Link'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDemoLaunch}
                      className="py-2 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-semibold transition-colors"
                    >
                      Test in Sandbox
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-500 dark:text-zinc-500 leading-normal">
                    * By omitting <code className="text-blue-500">am=</code>, Paytm and PhonePe security risk engines allow payments without blocking browser deep-links. Users confirm amount directly inside the app.
                  </p>
                </div>
              )}

            </div>
          </div>

        </div>

        {/* ─── Feature Highlights Section (Fintech Architecture Pillars) ─────── */}
        <div className="mt-12 sm:mt-16 pt-10 border-t border-slate-200/80 dark:border-zinc-800/80">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Engineered for the Indian Financial Ecosystem
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
              Built with relational integrity, integer ledger precision, and zero floating-point discrepancies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            
            {/* Feature 1 */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#0c0c0e] border border-slate-200/90 dark:border-zinc-800/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold mb-3.5">
                  <Receipt className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  0.00% Float Drift
                </h3>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Every transaction is stored as an integer quantity in Paise (₹1.00 = 100 paise). Eliminates cumulative IEEE 754 float rounding errors across monthly summaries.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                <span>Integer Precision</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">100 paise = ₹1</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#0c0c0e] border border-slate-200/90 dark:border-zinc-800/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold mb-3.5">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Anti-Fraud UPI Assistant
                </h3>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Safely opens official UPI apps (GPay, PhonePe, Paytm) without the <code className="text-emerald-500">am=</code> trigger that sets off third-party fraud risk flags.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                <span>Risk Policy</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Pass-Through</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#0c0c0e] border border-slate-200/90 dark:border-zinc-800/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-purple-950/40 text-indigo-600 dark:text-purple-400 flex items-center justify-center font-bold mb-3.5">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Transitive Balance Simplification
                </h3>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Automatically condenses circular group debts into direct settlements. If A owes B and B owes C, Paylog lets A settle directly with C in one transaction.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                <span>Algorithm</span>
                <span className="font-bold text-purple-600 dark:text-purple-400">Minimal Flow</span>
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* ─── Footer (With Abhishek Tiwari Signature) ────────────────────── */}
      <footer className="border-t border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-black py-5 px-4 text-center text-xs text-slate-500 dark:text-zinc-400 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>
            © {new Date().getFullYear()} Paylog. Created with ❤️ by Abhishek Tiwari
          </span>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Features & Architecture
            </button>
            <button
              type="button"
              onClick={() => openAuth('login')}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </footer>

      {/* ─── Slide-Over Sidebar / Drawer for Features, Workflow & Specs ─── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
            <div className="w-screen max-w-md bg-white dark:bg-[#0c0c0e] border-l border-slate-200 dark:border-zinc-800 shadow-2xl flex flex-col">
              
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Features & Documentation
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Explore capabilities, payment workflow, and architecture
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Tabs */}
              <div className="flex border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50 dark:bg-[#121215] p-2 gap-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setSidebarTab('capabilities')}
                  className={`flex-1 py-1.5 rounded-lg transition-colors ${
                    sidebarTab === 'capabilities'
                      ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/50 dark:border-zinc-700'
                      : 'text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  Capabilities
                </button>
                <button
                  type="button"
                  onClick={() => setSidebarTab('workflow')}
                  className={`flex-1 py-1.5 rounded-lg transition-colors ${
                    sidebarTab === 'workflow'
                      ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/50 dark:border-zinc-700'
                      : 'text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  Workflow
                </button>
                <button
                  type="button"
                  onClick={() => setSidebarTab('security')}
                  className={`flex-1 py-1.5 rounded-lg transition-colors ${
                    sidebarTab === 'security'
                      ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/50 dark:border-zinc-700'
                      : 'text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  Security
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 text-sm">
                
                {/* TAB 1: CAPABILITIES */}
                {sidebarTab === 'capabilities' && (
                  <div className="space-y-3.5">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#161619] border border-slate-200 dark:border-zinc-800">
                      <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                        <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>Daily Expense Tracking</span>
                      </div>
                      <p className="mt-1.5 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                        Log cash, card, and UPI transactions. Built-in merchant QR scanner parses payee details, with outcome logging for complete personal records.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#161619] border border-slate-200 dark:border-zinc-800">
                      <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                        <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span>Shared Expense Splitting</span>
                      </div>
                      <p className="mt-1.5 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                        Organize group expenses for trips, flatmates, and dinners. Transitive balance cancellation eliminates circular debts so members settle directly.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#161619] border border-slate-200 dark:border-zinc-800">
                      <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                        <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Monthly Budgets & Reports</span>
                      </div>
                      <p className="mt-1.5 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                        Set spending caps, inspect category distributions, and monitor your 6-month net cash flow. Download formula-sanitized RFC 4180 CSV tables anytime.
                      </p>
                    </div>
                  </div>
                )}

                {/* TAB 2: WORKFLOW */}
                {sidebarTab === 'workflow' && (
                  <div className="space-y-3.5">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#161619] border border-slate-200 dark:border-zinc-800">
                      <div className="font-bold text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        Step 01 / Record & Pay
                      </div>
                      <p className="mt-1 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                        Scan merchant QR or input VPA. Paylog prepares the UPI intent without amount parameters to avoid anti-fraud blocks in UPI apps.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#161619] border border-slate-200 dark:border-zinc-800">
                      <div className="font-bold text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        Step 02 / Group Settle
                      </div>
                      <p className="mt-1 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                        Add shared bills to your group. Paylog calculates exact integer-paisa split allocations with deterministic remainder distribution.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#161619] border border-slate-200 dark:border-zinc-800">
                      <div className="font-bold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        Step 03 / Audit & Export
                      </div>
                      <p className="mt-1 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                        Review your real-time budget status and download secure CSV exports with formula injection safeguards (=, +, -, @ neutralized).
                      </p>
                    </div>
                  </div>
                )}

                {/* TAB 3: SECURITY & SPECS */}
                {sidebarTab === 'security' && (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#161619] border border-slate-200 dark:border-zinc-800">
                      <div className="font-mono text-base font-bold text-slate-900 dark:text-white">0.00% Float Drift</div>
                      <div className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                        All monetary math computed and stored as integer Paise (₹1.00 = 100 paise).
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#161619] border border-slate-200 dark:border-zinc-800">
                      <div className="font-mono text-base font-bold text-slate-900 dark:text-white">Zero Credential Exposure</div>
                      <div className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                        No bank logins or UPI PINs stored. Payments hand off cleanly to official UPI applications.
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#161619] border border-slate-200 dark:border-zinc-800">
                      <div className="font-mono text-base font-bold text-slate-900 dark:text-white">PostgreSQL Persistence</div>
                      <div className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                        Single-source-of-truth ACID persistence with relational constraint integrity.
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Drawer Bottom Actions */}
              <div className="p-4 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50 dark:bg-[#121215] flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setSidebarOpen(false);
                    openAuth('register');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition-colors text-center"
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSidebarOpen(false);
                    handleDemoLaunch();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 font-bold text-xs transition-colors text-center"
                >
                  Try Demo
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ─── Authentication Modal (with Google Sign-In) ────────────────── */}
      <Modal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        title={authMode === 'login' ? 'Sign in to Paylog' : 'Create your account'}
        subtitle={
          authMode === 'login'
            ? 'Access your personal finance records and group splits'
            : 'Start tracking expenses and splitting bills in seconds'
        }
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          
          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 text-xs"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#18181c] hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-100 font-semibold text-xs shadow-sm transition-all disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{googleLoading ? 'Signing in with Google...' : 'Continue with Google'}</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200 dark:bg-zinc-800" />
            <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
              Or with email
            </span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-zinc-800" />
          </div>

          {/* Standard Email/Password Form */}
          <form onSubmit={handleAuthSubmit} className="space-y-3.5">
            {authMode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Abhishek Tiwari"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#18181c] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#18181c] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#18181c] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? 'Please wait...' : authMode === 'login' ? 'Sign In' : 'Create Account'}
            </button>

            <div className="text-center pt-1.5">
              {authMode === 'login' ? (
                <p className="text-xs text-slate-600 dark:text-zinc-400">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('register');
                      setError(null);
                    }}
                    className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Create one now
                  </button>
                </p>
              ) : (
                <p className="text-xs text-slate-600 dark:text-zinc-400">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setError(null);
                    }}
                    className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </form>

        </div>
      </Modal>

    </div>
  );
}
