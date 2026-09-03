import React, { useState } from 'react';
import { Code, FileCode2, Info } from 'lucide-react';
import { MODIFIED_FILES } from '../data/diffs';

export const DiffViewer: React.FC = () => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const activeFile = MODIFIED_FILES[selectedIdx];

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Code className="h-4 w-4 text-blue-600" />
          <h2 className="font-semibold text-zinc-900 text-sm">Các thay đổi chi tiết trong mã nguồn Fork</h2>
        </div>
        <span className="text-xs text-zinc-500">
          Đã chỉnh sửa {MODIFIED_FILES.length} file cốt lõi
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 bg-zinc-50 overflow-x-auto px-4 gap-1">
        {MODIFIED_FILES.map((file, idx) => (
          <button
            key={file.filename}
            type="button"
            onClick={() => setSelectedIdx(idx)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              selectedIdx === idx
                ? 'border-blue-600 text-blue-700 bg-white shadow-xs font-semibold'
                : 'border-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/50'
            }`}
          >
            <FileCode2 className="h-3.5 w-3.5" />
            <span>{file.filename}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        <div className="flex items-start gap-2 bg-blue-50/70 border border-blue-100 rounded-lg p-3 text-xs text-blue-900">
          <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">{activeFile.path}: </span>
            <span>{activeFile.description}</span>
          </div>
        </div>

        <div className="bg-zinc-950 rounded-lg p-4 font-mono text-xs text-zinc-200 overflow-x-auto border border-zinc-800 leading-relaxed max-h-96">
          <pre>
            {activeFile.diff.split('\n').map((line, lIdx) => {
              const isAdd = line.startsWith('+');
              const isDel = line.startsWith('-');
              return (
                <div
                  key={lIdx}
                  className={`px-1 rounded ${
                    isAdd
                      ? 'bg-emerald-950/80 text-emerald-300 font-medium'
                      : isDel
                      ? 'bg-red-950/80 text-red-300 line-through opacity-80'
                      : 'text-zinc-400'
                  }`}
                >
                  {line}
                </div>
              );
            })}
          </pre>
        </div>
      </div>
    </div>
  );
};
