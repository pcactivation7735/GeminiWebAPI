import React, { useState } from 'react';
import { Terminal, KeyRound, PlayCircle, Check, Copy } from 'lucide-react';

export const WorkflowSteps: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const steps = [
    {
      step: '1',
      title: 'Cài đặt Dependencies',
      desc: 'Chỉ cài đặt Python dependencies qua Poetry. Không cần tải thêm Playwright Chromium (~280MB).',
      command: 'poetry install',
      note: 'Trước đây cần: poetry run playwright install chromium (giờ đã bỏ qua hoàn toàn)',
    },
    {
      step: '2',
      title: 'Đăng nhập Gemini qua Chrome thật',
      desc: 'Mở trực tiếp trình duyệt Google Chrome cài sẵn trên máy của bạn để đăng nhập tài khoản Google.',
      command: 'poetry run python verify_login.py',
      note: 'Trình duyệt Chrome trên máy bạn sẽ bật lên trang https://gemini.google.com/app, tự động lưu session vào runtime/auth/gemini.json',
    },
    {
      step: '3',
      title: 'Khởi động API Server',
      desc: 'Khởi chạy máy chủ WebAI-to-API tương thích chuẩn OpenAI `/v1/chat/completions`.',
      command: 'poetry run python src/run.py',
      note: 'API Server hoạt động tại http://localhost:6969 và Web Dashboard tại http://localhost:6969/ui',
    },
  ];

  const handleCopy = (command: string, index: number) => {
    navigator.clipboard.writeText(command);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <PlayCircle className="h-4 w-4 text-blue-600" />
        <h2 className="font-semibold text-zinc-900 text-sm">Hướng dẫn khởi chạy 3 bước</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((item, idx) => (
          <div
            key={item.step}
            className="p-4 rounded-xl border border-zinc-200 bg-white shadow-xs space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                  {item.step}
                </span>
                <h3 className="font-semibold text-zinc-900 text-sm">{item.title}</h3>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">{item.desc}</p>
            </div>

            <div className="space-y-2 pt-2 border-t border-zinc-100">
              <div className="relative group">
                <div className="bg-zinc-900 text-emerald-400 font-mono text-xs px-3 py-2 rounded-lg flex items-center justify-between border border-zinc-800">
                  <span className="truncate">{item.command}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(item.command, idx)}
                    className="text-zinc-400 hover:text-white p-1 rounded transition-colors shrink-0 ml-2"
                    title="Sao chép lệnh"
                  >
                    {copiedIndex === idx ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-zinc-400 italic leading-snug">{item.note}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
