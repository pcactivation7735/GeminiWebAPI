import React from 'react';
import { CheckCircle2, XCircle, HardDrive, Shield, Laptop, RefreshCw } from 'lucide-react';

export const ComparisonSection: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Playwright Chromium (Old) */}
      <div className="p-5 rounded-xl border border-red-200 bg-red-50/40 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <h2 className="font-semibold text-zinc-900 text-sm">Playwright Chromium (Original)</h2>
          </div>
          <span className="text-[11px] font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded">
            Removed
          </span>
        </div>

        <ul className="space-y-2.5 text-xs text-zinc-600">
          <li className="flex items-start gap-2">
            <span className="text-red-500 font-bold mt-0.5">✕</span>
            <span>Bắt buộc tải thêm <strong>~280 MB binary Chromium</strong> từ Microsoft CDN mỗi lần cài đặt.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500 font-bold mt-0.5">✕</span>
            <span>Dễ bị Google Gemini kích hoạt bot-check do fingerprint tự động của Chromium headless.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500 font-bold mt-0.5">✕</span>
            <span>Gặp lỗi thiếu thư viện phụ thuộc (`libasound2`, `libgbm1`, etc.) trên một số bản phân phối Linux/Arch.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500 font-bold mt-0.5">✕</span>
            <span>Mỗi lần reset môi trường phải chạy lại <code>poetry run playwright install chromium</code>.</span>
          </li>
        </ul>
      </div>

      {/* Host System Chrome (New Fork) */}
      <div className="p-5 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <h2 className="font-semibold text-zinc-900 text-sm">Host Google Chrome (Bản Fork này)</h2>
          </div>
          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
            Mặc định kích hoạt
          </span>
        </div>

        <ul className="space-y-2.5 text-xs text-zinc-700">
          <li className="flex items-start gap-2">
            <span className="text-emerald-600 font-bold mt-0.5">✓</span>
            <span><strong>0 MB tải thêm</strong>: Sử dụng trực tiếp Google Chrome đã cài sẵn trên Windows, macOS hoặc Linux.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-600 font-bold mt-0.5">✓</span>
            <span><strong>Anti-bot stealth cao hơn</strong>: Dùng chính engine Chrome chính chủ của người dùng, hạn chế checkpoint/captcha của Google.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-600 font-bold mt-0.5">✓</span>
            <span><strong>Tự động quét đường dẫn (Auto-discovery)</strong> trên Windows (`Program Files`), macOS (`/Applications`), Linux (`/usr/bin/google-chrome`).</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-600 font-bold mt-0.5">✓</span>
            <span>Có thể tùy chỉnh linh hoạt file cấu hình <code>config.conf</code> hoặc chỉ định file binary riêng.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
