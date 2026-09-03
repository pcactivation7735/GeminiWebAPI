import React, { useState } from 'react';
import { Send, Copy, Check, Sparkles } from 'lucide-react';

export const ApiTester: React.FC = () => {
  const [lang, setLang] = useState<'curl' | 'python' | 'node'>('curl');
  const [copied, setCopied] = useState(false);

  const snippets = {
    curl: `curl -X POST http://localhost:6969/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gemini-2.5-flash",
    "messages": [
      {"role": "user", "content": "Xin chào! Bạn đang chạy trên Chrome cài sẵn máy phải không?"}
    ],
    "stream": true
  }'`,
    python: `from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:6969/v1",
    api_key="not-needed"
)

response = client.chat.completions.create(
    model="gemini-2.5-flash",
    messages=[
        {"role": "user", "content": "Xin chào Google Gemini!"}
    ],
    stream=True
)

for chunk in response:
    content = chunk.choices[0].delta.content
    if content:
        print(content, end="", flush=True)`,
    node: `import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "http://localhost:6969/v1",
  apiKey: "not-needed",
});

const stream = await openai.chat.completions.create({
  model: "gemini-2.5-flash",
  messages: [{ role: "user", content: "Xin chào từ Node.js!" }],
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || "");
}`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[lang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <h2 className="font-semibold text-zinc-900 text-sm">Thử nghiệm OpenAI-Compatible API</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-zinc-100 p-0.5 rounded-lg text-xs">
            {(['curl', 'python', 'node'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                  lang === l
                    ? 'bg-white text-zinc-900 shadow-xs font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
          </button>
        </div>
      </div>

      <div className="p-5">
        <div className="bg-zinc-900 rounded-lg p-4 font-mono text-xs text-zinc-200 overflow-x-auto border border-zinc-800 leading-relaxed">
          <pre>{snippets[lang]}</pre>
        </div>
      </div>
    </div>
  );
};
