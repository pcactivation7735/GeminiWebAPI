import React from 'react';
import { Chrome, Terminal, ShieldCheck, Zap } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="border-b border-zinc-200 bg-white shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
                <Chrome className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
                    WebAI-to-API
                  </h1>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    System Chrome Edition
                  </span>
                </div>
                <p className="text-xs text-zinc-500">
                  Forked from <code className="text-zinc-700">Amm1rr/WebAI-to-API</code> • Optimized for Host Chrome
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
              <ShieldCheck className="h-4 w-4" />
              <span>Real Chrome Fingerprint</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium">
              <Zap className="h-4 w-4" />
              <span>Zero Chromium Download</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
