import React, { useState, useEffect } from 'react';
import {
  Key,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Zap,
  RefreshCw,
  X,
  Server,
  Sparkles,
  Trash2,
} from 'lucide-react';

interface NvidiaKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  baseUrl: string;
  onSave: (apiKey: string, baseUrl: string) => void;
  serverNvidiaEnvConfigured?: boolean;
}

export const NvidiaKeyModal: React.FC<NvidiaKeyModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  baseUrl,
  onSave,
  serverNvidiaEnvConfigured = false,
}) => {
  const [currentKey, setCurrentKey] = useState(apiKey);
  const [currentUrl, setCurrentUrl] = useState(baseUrl || 'https://integrate.api.nvidia.com/v1');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
  } | null>(null);

  useEffect(() => {
    setCurrentKey(apiKey);
    setCurrentUrl(baseUrl || 'https://integrate.api.nvidia.com/v1');
    setTestResult(null);
  }, [apiKey, baseUrl, isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    const keyToTest = currentKey.trim();
    if (!keyToTest && !serverNvidiaEnvConfigured) {
      setTestResult({
        success: false,
        message: 'Please paste your NVIDIA API key before testing.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'nvidia',
          apiKey: keyToTest,
          baseUrl: currentUrl.trim() || 'https://integrate.api.nvidia.com/v1',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message || 'Connected successfully to NVIDIA NIM API!',
          latencyMs: data.latencyMs,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Failed to authenticate with NVIDIA NIM.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Network error connecting to verification endpoint.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    onSave(currentKey.trim(), currentUrl.trim());
    onClose();
  };

  const handleClear = () => {
    setCurrentKey('');
    onSave('', currentUrl.trim());
    setTestResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl bg-[#1e1e1e] border border-gray-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/60 bg-[#252525]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#76B900]/20 to-[#76B900]/40 border border-[#76B900]/40 flex items-center justify-center text-[#76B900]">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                NVIDIA NIM API Configuration
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#76B900]/20 text-[#76B900] border border-[#76B900]/30">
                  OpenAI Compatible
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Run Meta Llama 3.3, DeepSeek R1, Nemotron & Mistral via NVIDIA DGX Cloud
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Guide Card */}
          <div className="rounded-xl p-4 bg-[#141414] border border-gray-800 text-sm space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-300">
              <span className="flex items-center gap-1.5 text-[#76B900]">
                <Sparkles className="w-4 h-4" />
                How to get your free NVIDIA API Key:
              </span>
              <a
                href="https://build.nvidia.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[#76B900] hover:underline"
              >
                build.nvidia.com
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-gray-300 leading-relaxed pl-1">
              <li>
                Sign in to <span className="text-white font-medium">NVIDIA NIM</span> at{' '}
                <a
                  href="https://build.nvidia.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline"
                >
                  build.nvidia.com
                </a>{' '}
                (new accounts get 1,000 free inference credits).
              </li>
              <li>
                Select any model (e.g.{' '}
                <span className="text-white font-mono">meta/llama-3.3-70b-instruct</span> or{' '}
                <span className="text-white font-mono">deepseek-ai/deepseek-r1</span>).
              </li>
              <li>Click the green <span className="text-white font-semibold">"Get API Key"</span> button.</li>
              <li>Generate and paste your key starting with <code className="text-emerald-300 font-mono">nvapi-...</code> below.</li>
            </ol>
          </div>

          {serverNvidiaEnvConfigured && (
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Server has <code className="font-mono">NVIDIA_API_KEY</code> set in environment variables! You can still supply your personal key below to override.
              </span>
            </div>
          )}

          {/* API Key Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
              NVIDIA API Key <span className="text-[#76B900]">*</span>
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={currentKey}
                onChange={(e) => setCurrentKey(e.target.value)}
                placeholder="nvapi-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3.5 py-2.5 pr-20 rounded-xl bg-[#141414] border border-gray-700 focus:border-[#76B900] focus:ring-1 focus:ring-[#76B900] text-sm text-gray-100 placeholder-gray-500 font-mono outline-none transition-all"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="p-1.5 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
                  title={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                {currentKey && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-1.5 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                    title="Clear key"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-[11px] text-gray-400">
              Your key is saved locally in your browser storage and transmitted securely via Bearer header.
            </p>
          </div>

          {/* Base URL (Optional customization) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                API Base Endpoint
              </label>
              <button
                type="button"
                onClick={() => setCurrentUrl('https://integrate.api.nvidia.com/v1')}
                className="text-[11px] text-gray-400 hover:text-[#76B900] transition-colors"
              >
                Reset Default
              </button>
            </div>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Server className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={currentUrl}
                onChange={(e) => setCurrentUrl(e.target.value)}
                placeholder="https://integrate.api.nvidia.com/v1"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#141414] border border-gray-700 focus:border-[#76B900] focus:ring-1 focus:ring-[#76B900] text-xs text-gray-100 placeholder-gray-500 font-mono outline-none transition-all"
              />
            </div>
            <p className="text-[11px] text-gray-400">
              Default is NVIDIA NIM DGX cloud. You can also point to self-hosted NVIDIA NIM microservices.
            </p>
          </div>

          {/* Test Status Feedback */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 ${
                testResult.success
                  ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
                  : 'bg-red-950/40 border-red-800/80 text-red-200'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-medium">{testResult.message}</p>
                {testResult.latencyMs && (
                  <p className="text-[11px] opacity-80 font-mono">
                    Response Latency: {testResult.latencyMs} ms
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-gray-700/60 bg-[#252525] flex items-center justify-between">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting || (!currentKey && !serverNvidiaEnvConfigured)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-600 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-200 text-xs font-semibold transition-all cursor-pointer active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-[#76B900]' : ''}`} />
            <span>{isTesting ? 'Testing Ping...' : 'Test Connection'}</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-gray-700/50 text-xs font-semibold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#76B900] hover:bg-[#85cc05] text-black text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Save & Apply</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
