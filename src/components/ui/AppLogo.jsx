import React from 'react';

export function AppLogo({ className = 'h-8', showText = true, textClassName = 'text-xl' }) {
  return (
    <div className={`flex items-center gap-2.5 font-bold tracking-tight select-none ${className}`}>
      <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 shadow-md shadow-blue-500/20 text-white font-extrabold text-base">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>
      {showText && (
        <span className={`font-extrabold tracking-tight text-slate-900 dark:text-white ${textClassName}`}>
          Pay<span className="text-blue-600 dark:text-blue-400">log</span>
        </span>
      )}
    </div>
  );
}
