import React, { useState } from 'react';
import { Sliders, X, Sparkles, Code, BookOpen, Wand2, RotateCcw } from 'lucide-react';

interface ChatParametersModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemInstruction: string;
  temperature: number;
  maxTokens: number;
  onSave: (systemInstruction: string, temperature: number, maxTokens: number) => void;
}

const PRESET_PROMPTS = [
  {
    name: 'Standard ChatGPT',
    icon: Sparkles,
    prompt: 'You are a helpful, brilliant, and respectful AI assistant.',
  },
  {
    name: 'Senior Architect & Coder',
    icon: Code,
    prompt:
      'You are a staff software engineer. Provide concise, clean, production-ready code with minimal fluff and modern patterns. Always specify language tags.',
  },
  {
    name: 'Socratic Tutor',
    icon: BookOpen,
    prompt:
      'You are an expert tutor. Guide the user to understand concepts step-by-step with clear analogies, intuitive examples, and thought-provoking questions.',
  },
  {
    name: 'Concise & Bulleted',
    icon: Wand2,
    prompt:
      'Give extremely direct, highly factual, and concise answers using clean bullet points and bold highlights. Omit polite filler sentences.',
  },
];

export const ChatParametersModal: React.FC<ChatParametersModalProps> = ({
  isOpen,
  onClose,
  systemInstruction,
  temperature,
  maxTokens,
  onSave,
}) => {
  const [currSysPrompt, setCurrSysPrompt] = useState(systemInstruction);
  const [currTemp, setCurrTemp] = useState(temperature);
  const [currTokens, setCurrTokens] = useState(maxTokens);

  if (!isOpen) return null;

  const handleReset = () => {
    setCurrSysPrompt('');
    setCurrTemp(0.7);
    setCurrTokens(4096);
  };

  const handleApply = () => {
    onSave(currSysPrompt.trim(), currTemp, currTokens);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-[#1e1e1e] border border-gray-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/60 bg-[#252525]">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Model Parameters & Persona</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* System Prompt */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                System Prompt / Custom Instructions
              </label>
              {currSysPrompt && (
                <button
                  type="button"
                  onClick={() => setCurrSysPrompt('')}
                  className="text-[11px] text-gray-400 hover:text-red-400"
                >
                  Clear
                </button>
              )}
            </div>

            <textarea
              rows={4}
              value={currSysPrompt}
              onChange={(e) => setCurrSysPrompt(e.target.value)}
              placeholder="e.g. You are an expert AI engineer. Answer with production-ready code..."
              className="w-full p-3 rounded-xl bg-[#141414] border border-gray-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-gray-100 placeholder-gray-500 outline-none transition-all resize-none"
            />

            {/* Presets */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-gray-400">Presets:</span>
              <div className="grid grid-cols-2 gap-1.5">
                {PRESET_PROMPTS.map((p, idx) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrSysPrompt(p.prompt)}
                      className="flex items-center gap-2 p-2 rounded-lg bg-gray-800/60 hover:bg-gray-800 border border-gray-700/50 text-left text-xs text-gray-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <Icon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Temperature Slider */}
          <div className="space-y-2 pt-2 border-t border-gray-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-300 uppercase tracking-wider">
                Temperature
              </span>
              <span className="font-mono text-emerald-400 font-bold px-2 py-0.5 rounded bg-gray-800">
                {currTemp.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.05"
              value={currTemp}
              onChange={(e) => setCurrTemp(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-gray-400">
              <span>0.0 (Precise / Coding)</span>
              <span>0.7 (Balanced)</span>
              <span>1.5 (Creative)</span>
            </div>
          </div>

          {/* Max Tokens */}
          <div className="space-y-2 pt-2 border-t border-gray-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-300 uppercase tracking-wider">
                Max Output Tokens
              </span>
              <span className="font-mono text-emerald-400 font-bold px-2 py-0.5 rounded bg-gray-800">
                {currTokens}
              </span>
            </div>
            <input
              type="range"
              min="1024"
              max="8192"
              step="512"
              value={currTokens}
              onChange={(e) => setCurrTokens(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-gray-400">
              <span>1024 (Short)</span>
              <span>4096 (Standard)</span>
              <span>8192 (Detailed / Long-form)</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700/60 bg-[#252525] flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-gray-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-gray-700/50 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Apply Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
