export type Provider = 'nvidia' | 'gemini';

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  text?: string;
  base64?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning?: string;
  isStreaming?: boolean;
  provider?: Provider;
  model?: string;
  timestamp: number;
  files?: FileAttachment[];
  error?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  provider: Provider;
  model: string;
  pinned?: boolean;
  systemInstruction?: string;
  temperature?: number;
  messages: Message[];
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: Provider;
  badge?: string;
  description: string;
  contextWindow: string;
  hasReasoning?: boolean;
  isVision?: boolean;
  recommended?: boolean;
}

export const NVIDIA_MODELS: ModelInfo[] = [
  {
    id: 'meta/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B Instruct',
    provider: 'nvidia',
    badge: 'Recommended',
    description: 'State-of-the-art open weights model with GPT-4 class coding, math, and knowledge.',
    contextWindow: '128k',
    recommended: true,
  },
  {
    id: 'deepseek-ai/deepseek-r1',
    name: 'DeepSeek R1 (Reasoning)',
    provider: 'nvidia',
    badge: 'Reasoning CoT',
    description: 'Open reasoning model rivaling OpenAI o1, outputs step-by-step chain of thought.',
    contextWindow: '64k',
    hasReasoning: true,
  },
  {
    id: 'deepseek-ai/deepseek-v3',
    name: 'DeepSeek V3',
    provider: 'nvidia',
    badge: 'Ultra Fast',
    description: 'Ultra-fast MoE model with exceptional coding and conversational versatility.',
    contextWindow: '64k',
  },
  {
    id: 'mistralai/mistral-large-2-instruct',
    name: 'Mistral Large 2',
    provider: 'nvidia',
    badge: 'Flagship Multilingual',
    description: '123B model with top-tier reasoning, multilingual proficiency, and math.',
    contextWindow: '128k',
  },
  {
    id: 'nvidia/llama-3.1-nemotron-70b-instruct',
    name: 'NVIDIA Nemotron 70B',
    provider: 'nvidia',
    badge: 'NVIDIA Tuned',
    description: 'Optimized by NVIDIA for high human preference alignment and accurate code.',
    contextWindow: '128k',
  },
  {
    id: 'qwen/qwen2.5-72b-instruct',
    name: 'Qwen 2.5 72B Instruct',
    provider: 'nvidia',
    badge: 'Code & Math',
    description: 'Leading benchmark performance for coding, complex instructions, and STEM.',
    contextWindow: '128k',
  },
  {
    id: 'meta/llama-3.1-405b-instruct',
    name: 'Llama 3.1 405B Instruct',
    provider: 'nvidia',
    badge: 'Frontier 405B',
    description: 'Massive frontier-scale model running on NVIDIA DGX Cloud clusters.',
    contextWindow: '128k',
  },
];

export const GEMINI_MODELS: ModelInfo[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    provider: 'gemini',
    badge: 'Default Gemini',
    description: 'Google flagship speed & intelligence model with native multimodal capabilities.',
    contextWindow: '1M',
    isVision: true,
    recommended: true,
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    provider: 'gemini',
    badge: 'Ultra Low Latency',
    description: 'Optimized for instant responses and lightweight conversational queries.',
    contextWindow: '1M',
  },
];
