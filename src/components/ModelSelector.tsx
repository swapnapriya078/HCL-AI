import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  Zap,
  Sparkles,
  Brain,
  Check,
  Plus,
  Key,
  Flame,
  Info,
} from 'lucide-react';
import {
  Provider,
  ModelInfo,
  NVIDIA_MODELS,
  GEMINI_MODELS,
} from '../types/chat';

interface ModelSelectorProps {
  currentProvider: Provider;
  currentModel: string;
  onSelectModel: (provider: Provider, modelId: string) => void;
  hasNvidiaKey: boolean;
  onOpenKeyModal: () => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  currentProvider,
  currentModel,
  onSelectModel,
  hasNvidiaKey,
  onOpenKeyModal,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Provider>(currentProvider);
  const [customModelId, setCustomModelId] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const allModels = [...NVIDIA_MODELS, ...GEMINI_MODELS];
  const activeModelInfo = allModels.find(
    (m) => m.id === currentModel && m.provider === currentProvider
  );

  const displayName = activeModelInfo?.name || currentModel.split('/').pop() || currentModel;

  const handleSelect = (provider: Provider, modelId: string) => {
    onSelectModel(provider, modelId);
    setIsOpen(false);
  };

  const handleApplyCustom = () => {
    if (customModelId.trim()) {
      onSelectModel('nvidia', customModelId.trim());
      setIsOpen(false);
      setShowCustomInput(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selector Trigger Button */}
      <button
        onClick={() => {
          setActiveTab(currentProvider);
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700/80 text-sm font-semibold text-gray-100 transition-all cursor-pointer active:scale-98 shadow-sm"
      >
        {currentProvider === 'nvidia' ? (
          <div className="w-5 h-5 rounded-md bg-[#76B900]/20 border border-[#76B900]/40 flex items-center justify-center text-[#76B900]">
            <Zap className="w-3.5 h-3.5 fill-current" />
          </div>
        ) : (
          <div className="w-5 h-5 rounded-md bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        )}

        <span className="truncate max-w-[170px] sm:max-w-[240px] text-gray-200">
          {displayName}
        </span>

        {activeModelInfo?.hasReasoning && (
          <span className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-purple-950/80 text-purple-300 border border-purple-800 font-normal">
            <Brain className="w-3 h-3 text-purple-400" />
            Reasoning
          </span>
        )}

        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[340px] sm:w-[420px] rounded-2xl bg-[#1e1e1e] border border-gray-700 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Provider Tabs */}
          <div className="flex items-center border-b border-gray-700/70 bg-[#252525] p-1.5 gap-1.5">
            <button
              onClick={() => setActiveTab('nvidia')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'nvidia'
                  ? 'bg-black text-[#76B900] shadow-sm border border-[#76B900]/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>NVIDIA NIM ({NVIDIA_MODELS.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('gemini')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'gemini'
                  ? 'bg-black text-blue-400 shadow-sm border border-blue-500/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Google Gemini</span>
            </button>
          </div>

          {/* Model List */}
          <div className="p-2 space-y-1.5 max-h-[360px] overflow-y-auto">
            {activeTab === 'nvidia' && (
              <>
                {/* NVIDIA Key Notice if missing */}
                {!hasNvidiaKey && (
                  <div
                    onClick={() => {
                      setIsOpen(false);
                      onOpenKeyModal();
                    }}
                    className="flex items-center justify-between p-2.5 mb-2 rounded-xl bg-[#76B900]/10 border border-[#76B900]/30 text-[#76B900] text-xs cursor-pointer hover:bg-[#76B900]/15 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 shrink-0" />
                      <span className="font-semibold">NVIDIA API Key Needed</span>
                    </div>
                    <span className="text-[11px] underline">Add Key</span>
                  </div>
                )}

                {NVIDIA_MODELS.map((model) => {
                  const isSelected =
                    currentProvider === 'nvidia' && currentModel === model.id;
                  return (
                    <div
                      key={model.id}
                      onClick={() => handleSelect('nvidia', model.id)}
                      className={`flex items-start justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-[#76B900]/10 border-[#76B900]/40 text-white'
                          : 'border-transparent hover:bg-gray-800/70 text-gray-300'
                      }`}
                    >
                      <div className="space-y-1 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-gray-100">
                            {model.name}
                          </span>
                          {model.badge && (
                            <span
                              className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                                model.hasReasoning
                                  ? 'bg-purple-900/50 text-purple-300 border border-purple-800'
                                  : model.recommended
                                  ? 'bg-[#76B900]/20 text-[#76B900] border border-[#76B900]/40'
                                  : 'bg-gray-700/60 text-gray-300'
                              }`}
                            >
                              {model.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-1">
                          {model.description}
                        </p>
                      </div>

                      {isSelected && (
                        <Check className="w-4 h-4 text-[#76B900] shrink-0 mt-1" />
                      )}
                    </div>
                  );
                })}

                {/* Custom NVIDIA Model Option */}
                <div className="pt-2 border-t border-gray-800">
                  {!showCustomInput ? (
                    <button
                      onClick={() => setShowCustomInput(true)}
                      className="w-full flex items-center gap-2 p-2 rounded-xl text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#76B900]" />
                      <span>Use custom NVIDIA NIM Model ID</span>
                    </button>
                  ) : (
                    <div className="p-2 space-y-2 bg-[#171717] rounded-xl border border-gray-700">
                      <label className="text-[11px] font-semibold text-gray-300">
                        NVIDIA Model ID from catalog:
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={customModelId}
                          onChange={(e) => setCustomModelId(e.target.value)}
                          placeholder="e.g. mistralai/mixtral-8x7b-instruct-v0.1"
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-black border border-gray-700 text-xs font-mono text-gray-100 placeholder-gray-500 outline-none focus:border-[#76B900]"
                        />
                        <button
                          onClick={handleApplyCustom}
                          className="px-3 py-1.5 rounded-lg bg-[#76B900] text-black font-bold text-xs hover:bg-[#85cc05] cursor-pointer"
                        >
                          Use
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'gemini' && (
              <>
                {GEMINI_MODELS.map((model) => {
                  const isSelected =
                    currentProvider === 'gemini' && currentModel === model.id;
                  return (
                    <div
                      key={model.id}
                      onClick={() => handleSelect('gemini', model.id)}
                      className={`flex items-start justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-blue-500/10 border-blue-500/40 text-white'
                          : 'border-transparent hover:bg-gray-800/70 text-gray-300'
                      }`}
                    >
                      <div className="space-y-1 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-gray-100">
                            {model.name}
                          </span>
                          {model.badge && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-blue-900/40 text-blue-300 border border-blue-800">
                              {model.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-1">
                          {model.description}
                        </p>
                      </div>

                      {isSelected && (
                        <Check className="w-4 h-4 text-blue-400 shrink-0 mt-1" />
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Footer with Key & Settings shortcut */}
          <div className="p-2.5 bg-[#252525] border-t border-gray-700/60 flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1.5 text-[11px]">
              <Info className="w-3.5 h-3.5 text-gray-400" />
              Switch models at any point in chat
            </span>
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenKeyModal();
              }}
              className="flex items-center gap-1.5 text-xs text-[#76B900] hover:underline font-semibold cursor-pointer"
            >
              <Key className="w-3 h-3" />
              Manage NVIDIA Key
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
