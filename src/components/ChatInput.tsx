import React, { useRef, useEffect, useState } from 'react';
import {
  ArrowUp,
  Square,
  Paperclip,
  Globe,
  X,
  FileCode,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import { FileAttachment } from '../types/chat';

interface ChatInputProps {
  onSendMessage: (content: string, files?: FileAttachment[]) => void;
  isStreaming: boolean;
  onStopStreaming: () => void;
  hasNvidiaKey: boolean;
  isNvidiaProvider: boolean;
  onOpenKeyModal: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isStreaming,
  onStopStreaming,
  hasNvidiaKey,
  isNvidiaProvider,
  onOpenKeyModal,
}) => {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 220);
      textareaRef.current.style.height = `${Math.max(newHeight, 52)}px`;
    }
  }, [content]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (isStreaming) {
      onStopStreaming();
      return;
    }

    const trimmed = content.trim();
    if (!trimmed && attachments.length === 0) return;

    // Check if on NVIDIA and no key
    if (isNvidiaProvider && !hasNvidiaKey) {
      onOpenKeyModal();
      return;
    }

    let finalPrompt = trimmed;
    if (webSearchEnabled) {
      finalPrompt = `[Web Search Active: Please provide the latest up-to-date and verified information]\n\n${trimmed}`;
    }

    onSendMessage(finalPrompt, attachments.length > 0 ? attachments : undefined);
    setContent('');
    setAttachments([]);

    if (textareaRef.current) {
      textareaRef.current.style.height = '52px';
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const isImg = file.type.startsWith('image/');
      const reader = new FileReader();

      if (isImg) {
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          setAttachments((prev) => [
            ...prev,
            {
              id: Math.random().toString(36).substring(7),
              name: file.name,
              size: file.size,
              type: file.type,
              base64,
            },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        // Read text/code files
        reader.onload = () => {
          setAttachments((prev) => [
            ...prev,
            {
              id: Math.random().toString(36).substring(7),
              name: file.name,
              size: file.size,
              type: file.type || 'text/plain',
              text: reader.result as string,
            },
          ]);
        };
        reader.readAsText(file);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4">
      {/* Attachments preview tray */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 p-2 rounded-xl bg-[#1c1c1c] border border-gray-700/60 animate-in fade-in">
          {attachments.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-2 pl-2.5 pr-2 py-1.5 rounded-lg bg-gray-800 text-xs text-gray-200 border border-gray-700"
            >
              {file.base64 ? (
                <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
              ) : (
                <FileCode className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span className="truncate max-w-[140px] font-medium">{file.name}</span>
              <button
                type="button"
                onClick={() => removeAttachment(file.id)}
                className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Input Box */}
      <div className="relative rounded-3xl bg-[#2f2f2f] border border-gray-700/80 shadow-xl focus-within:border-gray-500 transition-all overflow-hidden">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message OmniChat... (Shift+Enter for newline)"
          rows={1}
          className="w-full pt-3.5 pb-12 pl-4 pr-14 bg-transparent text-gray-100 placeholder-gray-400 text-[15px] outline-none resize-none leading-relaxed"
          style={{ minHeight: '52px' }}
        />

        {/* Bottom bar inside input */}
        <div className="absolute left-3 bottom-2.5 right-3 flex items-center justify-between pointer-events-none">
          {/* Left tools (Attachment, Web search) */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {/* File Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-full hover:bg-gray-700/70 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
              title="Attach code file or image"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".py,.js,.ts,.tsx,.jsx,.json,.md,.txt,.html,.css,.sql,.sh,.c,.cpp,.java,.go,.rs,image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Web Search Simulation Toggle */}
            <button
              type="button"
              onClick={() => setWebSearchEnabled(!webSearchEnabled)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                webSearchEnabled
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50'
                  : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
              }`}
              title="Toggle search grounding"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search</span>
            </button>
          </div>

          {/* Right Action (Send / Stop button) */}
          <div className="pointer-events-auto">
            {isStreaming ? (
              <button
                type="button"
                onClick={onStopStreaming}
                className="w-8 h-8 rounded-full bg-white text-black hover:bg-gray-200 flex items-center justify-center transition-transform active:scale-95 shadow-md cursor-pointer"
                title="Stop generating"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={!content.trim() && attachments.length === 0}
                className="w-8 h-8 rounded-full bg-white text-black hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-transform active:scale-95 shadow-md cursor-pointer"
                title="Send message"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="text-center pt-2">
        <p className="text-[11px] text-gray-500">
          OmniChat can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  );
};
