import React from 'react';
import { Header } from './components/Header';
import { ComparisonSection } from './components/ComparisonSection';
import { ConfigGenerator } from './components/ConfigGenerator';
import { WorkflowSteps } from './components/WorkflowSteps';
import { DiffViewer } from './components/DiffViewer';
import { ApiTester } from './components/ApiTester';
import { FolderGit2, CheckCircle, Terminal } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-xs">
              <FolderGit2 className="h-3.5 w-3.5" />
              Fork: Amm1rr/WebAI-to-API
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Sử dụng Google Chrome có sẵn trên máy tính
            </h2>
            <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
              Dự án đã được tùy biến để khởi chạy trực tiếp Google Chrome của hệ điều hành (Windows / macOS / Linux) thay vì tải về bộ Chromium của Playwright. Giúp tiết kiệm dung lượng, tăng độ chân thực và giảm nguy cơ checkpoint Google.
            </p>
          </div>

          <div className="bg-white/10 rounded-xl p-4 border border-white/20 text-xs space-y-1.5 shrink-0">
            <div className="flex items-center gap-2 text-emerald-300 font-semibold">
              <CheckCircle className="h-4 w-4" />
              <span>Chế độ: System Chrome</span>
            </div>
            <div className="text-blue-100 font-mono">
              Thư mục: <code className="bg-black/30 px-1.5 py-0.5 rounded">./webai-to-api-chrome/</code>
            </div>
          </div>
        </div>

        {/* Comparison Section */}
        <ComparisonSection />

        {/* 3 Step Workflow */}
        <WorkflowSteps />

        {/* Configuration Generator */}
        <ConfigGenerator />

        {/* Code Diff Viewer */}
        <DiffViewer />

        {/* API Tester */}
        <ApiTester />
      </main>

      <footer className="border-t border-zinc-200 bg-white py-6 mt-12 text-center text-xs text-zinc-500">
        <p>
          WebAI-to-API System Chrome Edition • Mã nguồn tại thư mục{' '}
          <code className="text-zinc-800 font-mono font-medium">webai-to-api-chrome/</code>
        </p>
      </footer>
    </div>
  );
}
