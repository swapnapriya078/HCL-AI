import React, { useState } from 'react';
import {
  User,
  Zap,
  Sparkles,
  Copy,
  Check,
  RotateCw,
  Edit3,
  Volume2,
  VolumeX,
  Brain,
  ChevronDown,
  ChevronRight,
  FileText,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { Message } from '../types/chat';
import { MarkdownRenderer } from './MarkdownRenderer';

interface MessageItemProps {
  message: Message;
  onRegenerate?: () => void;
  onEditUserPrompt?: (content: string) => void;
  isLastAssistant?: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onRegenerate,
  onEditUserPrompt,
  isLastAssistant,
}) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isReasoningOpen, setIsReasoningOpen] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeech = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean text for speech
    const cleanText = message.content
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/[#*`_~]/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div
      className={`py-6 px-4 md:px-8 border-b border-gray-800/40 transition-colors ${
        isUser ? 'bg-transparent' : 'bg-[#1b1b1b]/50'
      }`}
    >
      <div className="max-w-3xl mx-auto flex items-start gap-4">
        {/* Avatar */}
        <div className="shrink-0 pt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm ring-2 ring-emerald-500/20">
              <User className="w-4 h-4" />
            </div>
          ) : message.provider === 'nvidia' ? (
            <div className="w-8 h-8 rounded-full bg-[#76B900] text-black flex items-center justify-center font-bold shadow-sm shadow-[#76B900]/30 ring-2 ring-[#76B900]/30">
              <Zap className="w-4 h-4 fill-current" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-sm ring-2 ring-blue-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header Tag for Assistant */}
          {!isUser && (
            <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
              <span className="text-gray-200 font-semibold">
                {message.provider === 'nvidia' ? 'NVIDIA NIM' : 'Google Gemini'}
              </span>
              {message.model && (
                <>
                  <span>•</span>
                  <span className="font-mono text-gray-400 text-[11px]">
                    {message.model.split('/').pop()}
                  </span>
                </>
              )}
            </div>
          )}

          {/* User Attachments */}
          {isUser && message.files && message.files.length > 0 && (
            <div className="flex flex-wrap gap-2 pb-1">
              {message.files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-800/80 border border-gray-700/70 text-xs text-gray-200"
                >
                  {file.base64 && file.type.startsWith('image/') ? (
                    <img
                      src={`data:${file.type};base64,${file.base64}`}
                      alt={file.name}
                      className="w-6 h-6 rounded object-cover"
                    />
                  ) : (
                    <FileText className="w-4 h-4 text-emerald-400" />
                  )}
                  <span className="truncate max-w-[180px] font-medium">{file.name}</span>
                  <span className="text-[10px] text-gray-400">
                    ({(file.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Reasoning / Thinking Process Accordion (DeepSeek R1 / Reasoning models) */}
          {!isUser && message.reasoning && (
            <div className="my-2 rounded-xl bg-[#141414] border border-purple-900/40 overflow-hidden">
              <button
                type="button"
                onClick={() => setIsReasoningOpen(!isReasoningOpen)}
                className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium text-purple-300 hover:bg-purple-950/20 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-400 animate-pulse" />
                  <span className="font-semibold">Reasoning Process</span>
                  <span className="text-[11px] text-gray-400">
                    (Chain-of-thought analysis)
                  </span>
                </div>
                {isReasoningOpen ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {isReasoningOpen && (
                <div className="p-3.5 bg-black/40 border-t border-purple-900/30 text-xs text-gray-300 font-mono leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto selection:bg-purple-900">
                  {message.reasoning}
                </div>
              )}
            </div>
          )}

          {/* Message Error State */}
          {message.error ? (
            <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-800/60 text-xs text-red-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-red-300">Request Error</p>
                <p className="text-gray-300 leading-normal">{message.error}</p>
              </div>
            </div>
          ) : (
            /* Message Body */
            <div className="text-[15px] text-gray-100">
              <MarkdownRenderer content={message.content} isStreaming={message.isStreaming} />
            </div>
          )}

          {/* Action Toolbar */}
          {!message.isStreaming && (
            <div className="flex items-center gap-2 pt-2 text-gray-400">
              {/* Copy */}
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-gray-800 hover:text-gray-200 text-xs transition-colors cursor-pointer"
                title="Copy message"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 text-[11px]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Copy</span>
                  </>
                )}
              </button>

              {/* Text to Speech */}
              {!isUser && (
                <button
                  type="button"
                  onClick={handleSpeech}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-gray-800 text-xs transition-colors cursor-pointer ${
                    isSpeaking ? 'text-emerald-400 font-semibold' : 'hover:text-gray-200'
                  }`}
                  title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[11px]">Stop</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Read Aloud</span>
                    </>
                  )}
                </button>
              )}

              {/* Regenerate if last assistant message */}
              {!isUser && isLastAssistant && onRegenerate && (
                <button
                  type="button"
                  onClick={onRegenerate}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-gray-800 hover:text-gray-200 text-xs transition-colors cursor-pointer"
                  title="Regenerate response"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Regenerate</span>
                </button>
              )}

              {/* Edit prompt if user */}
              {isUser && onEditUserPrompt && (
                <button
                  type="button"
                  onClick={() => onEditUserPrompt(message.content)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-gray-800 hover:text-gray-200 text-xs transition-colors cursor-pointer"
                  title="Edit prompt"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Edit</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
