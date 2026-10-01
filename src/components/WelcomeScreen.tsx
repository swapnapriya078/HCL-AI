import React from 'react';
import {
  Code,
  Brain,
  Lightbulb,
  Cpu,
  Zap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { Provider } from '../types/chat';

interface WelcomeScreenProps {
  provider: Provider;
  model: string;
  hasNvidiaKey: boolean;
  onSelectPrompt: (prompt: string) => void;
  onOpenKeyModal: () => void;
}

const PROMPT_SUGGESTIONS = [
  {
    category: 'Coding & Architecture',
    icon: Code,
    color: 'text-emerald-400',
    title: 'Python Async Gateway',
    prompt:
      'Write a high-performance Python FastAPI service with streaming SSE endpoints, request validation, and clean error handling.',
  },
  {
    category: 'AI Reasoning',
    icon: Brain,
    color: 'text-purple-400',
    title: 'DeepSeek R1 vs Llama 3.3',
    prompt:
      'Explain the key differences in training, reasoning architecture (RL chain-of-thought vs standard instruct), and inference cost between DeepSeek R1 and Llama 3.3.',
  },
  {
    category: 'Brainstorm & Strategy',
    icon: Lightbulb,
    color: 'text-amber-400',
    title: 'NVIDIA GPU Cluster Scale',
    prompt:
      'How does NVIDIA NIM optimize inference latency using TensorRT-LLM and vLLM compared to naive PyTorch serving? Provide numbers and architecture overview.',
  },
  {
    category: 'Full-Stack Web',
    icon: Terminal,
    color: 'text-cyan-400',
    title: 'React Interactive Dashboard',
    prompt:
      'Write a modern React component with Tailwind CSS that renders an interactive live metric chart with animated status pings and dark theme styling.',
  },
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  provider,
  model,
  hasNvidiaKey,
  onSelectPrompt,
  onOpenKeyModal,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-3xl mx-auto my-auto animate-in fade-in duration-300">
      {/* Brand Icon */}
      <div className="mb-5 relative">
        {provider === 'nvidia' ? (
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#76B900]/20 to-[#76B900]/40 border-2 border-[#76B900]/50 flex items-center justify-center text-[#76B900] shadow-xl shadow-[#76B900]/20">
            <Zap className="w-8 h-8 fill-current" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600/30 to-indigo-600/40 border-2 border-blue-500/50 flex items-center justify-center text-blue-400 shadow-xl shadow-blue-500/20">
            <Sparkles className="w-8 h-8" />
          </div>
        )}
      </div>

      {/* Main Title */}
      <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
        What can I help with today?
      </h1>
      <p className="text-gray-400 text-sm max-w-lg mb-6 leading-relaxed">
        ChatGPT-grade interface connected to{' '}
        <span className="text-white font-medium">
          {provider === 'nvidia' ? 'NVIDIA NIM DGX Cloud' : 'Google Gemini'}
        </span>{' '}
        running <span className="font-mono text-emerald-400 text-xs">{model}</span>.
      </p>

      {/* NVIDIA Key Alert Banner if on NVIDIA and no key */}
      {provider === 'nvidia' && !hasNvidiaKey && (
        <div className="w-full max-w-xl mb-6 p-3.5 rounded-2xl bg-[#76B900]/10 border border-[#76B900]/30 flex items-center justify-between text-left">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#76B900]/20 flex items-center justify-center text-[#76B900] shrink-0">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">NVIDIA NIM API Key Required</p>
              <p className="text-[11px] text-gray-300">
                Get 1,000 free inference credits on build.nvidia.com to run Llama 3.3 & DeepSeek R1.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenKeyModal}
            className="px-3 py-1.5 rounded-lg bg-[#76B900] text-black font-bold text-xs hover:bg-[#85cc05] transition-all shrink-0 cursor-pointer"
          >
            Setup Key
          </button>
        </div>
      )}

      {/* Prompt Suggestions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl text-left">
        {PROMPT_SUGGESTIONS.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              onClick={() => onSelectPrompt(item.prompt)}
              className="group p-4 rounded-2xl bg-[#1c1c1c] hover:bg-[#252525] border border-gray-800 hover:border-gray-700 transition-all duration-150 flex flex-col justify-between text-left cursor-pointer active:scale-98 shadow-sm hover:shadow-md"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${item.color}`} />
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      {item.category}
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                </div>
                <h3 className="text-sm font-semibold text-gray-100 group-hover:text-white">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                  {item.prompt}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
