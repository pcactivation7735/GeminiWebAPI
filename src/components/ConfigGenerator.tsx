import React, { useState } from 'react';
import { Settings, Copy, Check, Sliders, FolderOpen, Terminal } from 'lucide-react';
import { ChromeConfig } from '../types';

export const ConfigGenerator: React.FC = () => {
  const [config, setConfig] = useState<ChromeConfig>({
    name: 'chrome',
    runtime: 'playwright',
    use_system_chrome: true,
    chrome_channel: 'chrome',
    chrome_path: '',
    headless: false,
  });

  const [copied, setCopied] = useState(false);

  const presetPaths = [
    { label: 'Auto (Khuyên dùng)', path: '' },
    { label: 'Windows', path: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' },
    { label: 'macOS', path: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' },
    { label: 'Linux (Ubuntu/Debian)', path: '/usr/bin/google-chrome' },
    { label: 'MS Edge', path: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' },
  ];

  const generatedConfig = `[General]
check_updates = true

[Browser]
name = ${config.name}
runtime = ${config.runtime}
use_system_chrome = ${config.use_system_chrome ? 'true' : 'false'}
chrome_channel = ${config.chrome_channel}
chrome_path = ${config.chrome_path}

[Playwright]
headless = ${config.headless ? 'true' : 'false'}
max_concurrent_pages = 5
max_total_tabs = 50

[Gemini]
backend = playwright
default_model = gemini-2.5-flash
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedConfig);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-blue-600" />
          <h2 className="font-semibold text-zinc-900 text-sm">Trình tùy biến cấu hình Browser (`config.conf`)</h2>
        </div>
        <span className="text-xs text-zinc-500">Auto-generated</span>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">
              Sử dụng Chrome cài sẵn trên máy (`use_system_chrome`)
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setConfig({ ...config, use_system_chrome: !config.use_system_chrome })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  config.use_system_chrome ? 'bg-blue-600' : 'bg-zinc-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    config.use_system_chrome ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-xs text-zinc-600 font-medium">
                {config.use_system_chrome ? 'Bật (Dùng Google Chrome trên máy)' : 'Tắt (Dùng Playwright Chromium gốc)'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              Khi bật, WebAI-to-API sẽ không tải thêm Chromium mà dùng trực tiếp binary Chrome trong máy.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">
              Browser Channel (`chrome_channel`)
            </label>
            <select
              value={config.chrome_channel}
              onChange={(e) => setConfig({ ...config, chrome_channel: e.target.value })}
              className="w-full text-xs rounded-lg border border-zinc-300 px-3 py-2 bg-white text-zinc-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="chrome">chrome (Google Chrome Standard)</option>
              <option value="chrome-beta">chrome-beta (Google Chrome Beta)</option>
              <option value="chrome-canary">chrome-canary (Google Chrome Canary)</option>
              <option value="msedge">msedge (Microsoft Edge)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">
              Đường dẫn Chrome cụ thể (`chrome_path`)
            </label>
            <input
              type="text"
              placeholder="Để trống để tự động nhận diện..."
              value={config.chrome_path}
              onChange={(e) => setConfig({ ...config, chrome_path: e.target.value })}
              className="w-full text-xs rounded-lg border border-zinc-300 px-3 py-2 text-zinc-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="text-[11px] text-zinc-400 mr-1 self-center">Mẫu:</span>
              {presetPaths.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setConfig({ ...config, chrome_path: preset.path })}
                  className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                    config.chrome_path === preset.path
                      ? 'bg-blue-50 text-blue-700 border-blue-200 font-medium'
                      : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-100">
            <label className="text-xs font-semibold text-zinc-700 block mb-1">
              Chế độ ẩn danh / Không cửa sổ (`headless`)
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setConfig({ ...config, headless: !config.headless })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  config.headless ? 'bg-blue-600' : 'bg-zinc-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    config.headless ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-xs text-zinc-600 font-medium">
                {config.headless ? 'Bật Headless (ẩn cửa sổ)' : 'Tắt (hiện cửa sổ Chrome để dễ debug/login)'}
              </span>
            </div>
          </div>
        </div>

        {/* Code Output */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-medium text-zinc-500 font-mono">config.conf</span>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Đã sao chép!' : 'Sao chép config'}</span>
            </button>
          </div>
          <div className="bg-zinc-900 rounded-lg p-3 text-zinc-200 text-xs font-mono overflow-x-auto flex-1 leading-relaxed border border-zinc-800">
            <pre>{generatedConfig}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
