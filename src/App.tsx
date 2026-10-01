/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Sliders,
  Key,
  Share2,
  Trash2,
  Download,
  Zap,
  Sparkles,
  Bot,
  RefreshCw,
  Plus,
  AlertCircle,
} from 'lucide-react';
import {
  Provider,
  Conversation,
  Message,
  FileAttachment,
  NVIDIA_MODELS,
  GEMINI_MODELS,
} from './types/chat';
import { Sidebar } from './components/Sidebar';
import { ModelSelector } from './components/ModelSelector';
import { MessageItem } from './components/MessageItem';
import { ChatInput } from './components/ChatInput';
import { WelcomeScreen } from './components/WelcomeScreen';
import { NvidiaKeyModal } from './components/NvidiaKeyModal';
import { ChatParametersModal } from './components/ChatParametersModal';

const STORAGE_CONVERSATIONS = 'omnichat_conversations_v1';
const STORAGE_NVIDIA_KEY = 'omnichat_nvidia_api_key';
const STORAGE_NVIDIA_URL = 'omnichat_nvidia_base_url';
const STORAGE_PROVIDER = 'omnichat_provider';
const STORAGE_MODEL = 'omnichat_model';
const STORAGE_SYS_PROMPT = 'omnichat_sys_prompt';

export default function App() {
  // Persistence & Global Settings
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_CONVERSATIONS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [activeConversationId, setActiveConversationId] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_CONVERSATIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.length > 0 ? parsed[0].id : null;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [nvidiaApiKey, setNvidiaApiKey] = useState<string>(() => {
    return localStorage.getItem(STORAGE_NVIDIA_KEY) || '';
  });

  const [nvidiaBaseUrl, setNvidiaBaseUrl] = useState<string>(() => {
    return localStorage.getItem(STORAGE_NVIDIA_URL) || 'https://integrate.api.nvidia.com/v1';
  });

  const [currentProvider, setCurrentProvider] = useState<Provider>(() => {
    return (localStorage.getItem(STORAGE_PROVIDER) as Provider) || 'nvidia';
  });

  const [currentModel, setCurrentModel] = useState<string>(() => {
    return (
      localStorage.getItem(STORAGE_MODEL) ||
      (currentProvider === 'nvidia' ? NVIDIA_MODELS[0].id : GEMINI_MODELS[0].id)
    );
  });

  const [systemInstruction, setSystemInstruction] = useState<string>(() => {
    return localStorage.getItem(STORAGE_SYS_PROMPT) || '';
  });

  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number>(4096);

  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isParamsModalOpen, setIsParamsModalOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [serverNvidiaEnvConfigured, setServerNvidiaEnvConfigured] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Save conversations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CONVERSATIONS, JSON.stringify(conversations));
    } catch (e) {
      console.error('Failed to save conversations:', e);
    }
  }, [conversations]);

  // Check server configuration status
  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.nvidiaEnvKeyAvailable) {
          setServerNvidiaEnvConfigured(true);
        }
      })
      .catch((err) => console.log('Status ping error:', err));
  }, []);

  // Keyboard shortcut Ctrl/Cmd+K for new chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, isStreaming]);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  const hasNvidiaKey = Boolean(nvidiaApiKey.trim() || serverNvidiaEnvConfigured);

  // New Chat handler
  const handleNewChat = () => {
    setActiveConversationId(null);
  };

  const handleSelectModel = (provider: Provider, modelId: string) => {
    setCurrentProvider(provider);
    setCurrentModel(modelId);
    localStorage.setItem(STORAGE_PROVIDER, provider);
    localStorage.setItem(STORAGE_MODEL, modelId);

    // If on active conversation, update its preferred model too
    if (activeConversationId) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversationId
            ? { ...c, provider, model: modelId, updatedAt: Date.now() }
            : c
        )
      );
    }
  };

  const handleSaveNvidiaKey = (key: string, url: string) => {
    setNvidiaApiKey(key);
    setNvidiaBaseUrl(url);
    localStorage.setItem(STORAGE_NVIDIA_KEY, key);
    localStorage.setItem(STORAGE_NVIDIA_URL, url);
  };

  const handleSaveParams = (newPrompt: string, newTemp: number, newTokens: number) => {
    setSystemInstruction(newPrompt);
    setTemperature(newTemp);
    setMaxTokens(newTokens);
    localStorage.setItem(STORAGE_SYS_PROMPT, newPrompt);

    if (activeConversationId) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversationId
            ? {
                ...c,
                systemInstruction: newPrompt,
                temperature: newTemp,
                updatedAt: Date.now(),
              }
            : c
        )
      );
    }
  };

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      setActiveConversationId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c))
    );
  };

  const handleTogglePin = (id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c))
    );
  };

  const handleExportConversation = (id: string, format: 'markdown' | 'json') => {
    const conv = conversations.find((c) => c.id === id);
    if (!conv) return;

    let content = '';
    let filename = `${conv.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${
      format === 'markdown' ? 'md' : 'json'
    }`;
    let mimeType = format === 'markdown' ? 'text/markdown' : 'application/json';

    if (format === 'markdown') {
      content = `# ${conv.title}\n\n`;
      content += `*Date: ${new Date(conv.createdAt).toLocaleString()}*\n`;
      content += `*Model: ${conv.model} (${conv.provider.toUpperCase()})*\n\n---\n\n`;

      for (const msg of conv.messages) {
        content += `### ${msg.role === 'user' ? 'User' : 'Assistant'}\n\n`;
        if (msg.reasoning) {
          content += `> **Reasoning:**\n> ${msg.reasoning.replace(/\n/g, '\n> ')}\n\n`;
        }
        content += `${msg.content}\n\n---\n\n`;
      }
    } else {
      content = JSON.stringify(conv, null, 2);
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Main streaming request sender
  const handleSendMessage = async (promptContent: string, files?: FileAttachment[]) => {
    if (isStreaming) return;

    let targetConvId = activeConversationId;
    let targetConv = activeConversation;

    const userMessage: Message = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content: promptContent,
      files,
      timestamp: Date.now(),
    };

    const assistantPlaceholderId = Math.random().toString(36).substring(7);
    const assistantMessage: Message = {
      id: assistantPlaceholderId,
      role: 'assistant',
      content: '',
      provider: currentProvider,
      model: currentModel,
      isStreaming: true,
      timestamp: Date.now(),
    };

    // If there is no active conversation, create one
    if (!targetConvId || !targetConv) {
      const summaryTitle =
        promptContent.length > 36 ? promptContent.slice(0, 36) + '...' : promptContent || 'New Chat';
      const newConv: Conversation = {
        id: Math.random().toString(36).substring(7),
        title: summaryTitle,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        provider: currentProvider,
        model: currentModel,
        systemInstruction,
        temperature,
        messages: [userMessage, assistantMessage],
      };

      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      targetConvId = newConv.id;
      targetConv = newConv;
    } else {
      // Append to existing conversation
      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetConvId
            ? {
                ...c,
                updatedAt: Date.now(),
                messages: [...c.messages, userMessage, assistantMessage],
              }
            : c
        )
      );
    }

    // Set streaming active
    setIsStreaming(true);
    abortControllerRef.current = new AbortController();

    const historyMessages = (targetConv ? targetConv.messages : []).concat([userMessage]);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (currentProvider === 'nvidia' && nvidiaApiKey.trim()) {
        headers['x-nvidia-api-key'] = nvidiaApiKey.trim();
      }

      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          provider: currentProvider,
          model: currentModel,
          messages: historyMessages.map((m) => ({
            role: m.role,
            content: m.content,
            files: m.files,
          })),
          temperature,
          systemInstruction,
          maxTokens,
          baseUrl: nvidiaBaseUrl,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server returned ${res.status}: ${errorText}`);
      }

      if (!res.body) {
        throw new Error('No readable stream from response');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let streamBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        streamBuffer += decoder.decode(value, { stream: true });
        const events = streamBuffer.split('\n\n');
        streamBuffer = events.pop() || '';

        for (const evt of events) {
          const lines = evt.split('\n');
          let eventType = 'message';
          let dataStr = '';

          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventType = line.replace('event:', '').trim();
            } else if (line.startsWith('data:')) {
              dataStr = line.replace('data:', '').trim();
            }
          }

          if (!dataStr) continue;

          try {
            const parsed = JSON.parse(dataStr);

            if (eventType === 'content') {
              setConversations((prev) =>
                prev.map((c) =>
                  c.id === targetConvId
                    ? {
                        ...c,
                        messages: c.messages.map((m) =>
                          m.id === assistantPlaceholderId
                            ? { ...m, content: (m.content || '') + parsed.text }
                            : m
                        ),
                      }
                    : c
                )
              );
            } else if (eventType === 'reasoning') {
              setConversations((prev) =>
                prev.map((c) =>
                  c.id === targetConvId
                    ? {
                        ...c,
                        messages: c.messages.map((m) =>
                          m.id === assistantPlaceholderId
                            ? {
                                ...m,
                                reasoning: (m.reasoning || '') + parsed.text,
                              }
                            : m
                        ),
                      }
                    : c
                )
              );
            } else if (eventType === 'error') {
              setConversations((prev) =>
                prev.map((c) =>
                  c.id === targetConvId
                    ? {
                        ...c,
                        messages: c.messages.map((m) =>
                          m.id === assistantPlaceholderId
                            ? {
                                ...m,
                                isStreaming: false,
                                error: parsed.error || 'Stream error occurred',
                              }
                            : m
                        ),
                      }
                    : c
                )
              );
            } else if (eventType === 'done') {
              setConversations((prev) =>
                prev.map((c) =>
                  c.id === targetConvId
                    ? {
                        ...c,
                        messages: c.messages.map((m) =>
                          m.id === assistantPlaceholderId ? { ...m, isStreaming: false } : m
                        ),
                      }
                    : c
                )
              );
            }
          } catch (e) {
            console.error('Failed to parse SSE line:', e, dataStr);
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === targetConvId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantPlaceholderId
                      ? {
                          ...m,
                          isStreaming: false,
                          error: err.message || 'Network connection failed during generation',
                        }
                      : m
                  ),
                }
              : c
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
      // Mark assistant message done
      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetConvId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantPlaceholderId ? { ...m, isStreaming: false } : m
                ),
              }
            : c
        )
      );
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  };

  const handleRegenerateLast = () => {
    if (!activeConversation || isStreaming) return;
    const msgs = activeConversation.messages;
    if (msgs.length < 2) return;

    const lastMsg = msgs[msgs.length - 1];
    if (lastMsg.role !== 'assistant') return;

    // Find previous user prompt
    const prevUserMsg = msgs[msgs.length - 2];
    if (prevUserMsg && prevUserMsg.role === 'user') {
      // Remove last assistant message
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversation.id
            ? {
                ...c,
                messages: c.messages.slice(0, -1),
              }
            : c
        )
      );

      // Re-send user prompt
      handleSendMessage(prevUserMsg.content, prevUserMsg.files);
    }
  };

  const handleEditUserPrompt = (promptText: string) => {
    // Populate into input
    const inputElement = document.querySelector('textarea');
    if (inputElement) {
      inputElement.value = promptText;
      inputElement.focus();
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#212121] text-gray-100 font-sans">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeId={activeConversationId}
        onSelectConversation={(id) => setActiveConversationId(id)}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onTogglePin={handleTogglePin}
        onExportConversation={handleExportConversation}
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
        hasNvidiaKey={hasNvidiaKey}
        onOpenKeyModal={() => setIsKeyModalOpen(true)}
        onOpenParamsModal={() => setIsParamsModalOpen(true)}
      />

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-[#212121] relative overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="h-14 px-4 border-b border-gray-800/80 flex items-center justify-between bg-[#212121]/90 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            {/* Sidebar toggle button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/60 transition-colors cursor-pointer"
              title="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Model Selector Dropdown */}
            <ModelSelector
              currentProvider={currentProvider}
              currentModel={currentModel}
              onSelectModel={handleSelectModel}
              hasNvidiaKey={hasNvidiaKey}
              onOpenKeyModal={() => setIsKeyModalOpen(true)}
            />
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quick NVIDIA Key config button */}
            <button
              onClick={() => setIsKeyModalOpen(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                hasNvidiaKey
                  ? 'border-[#76B900]/40 bg-[#76B900]/10 text-[#76B900] hover:bg-[#76B900]/20'
                  : 'border-amber-500/50 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
              }`}
              title="Configure NVIDIA NIM API Key"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">
                {hasNvidiaKey ? 'NVIDIA Key Active' : 'Setup NVIDIA Key'}
              </span>
            </button>

            {/* Parameters button */}
            <button
              onClick={() => setIsParamsModalOpen(true)}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/60 transition-colors cursor-pointer"
              title="Model Persona & Parameters"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Export active chat button */}
            {activeConversation && activeConversation.messages.length > 0 && (
              <button
                onClick={() => handleExportConversation(activeConversation.id, 'markdown')}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/60 transition-colors cursor-pointer"
                title="Export Chat as Markdown"
              >
                <Download className="w-4 h-4" />
              </button>
            )}

            {/* New chat icon */}
            <button
              onClick={handleNewChat}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/60 transition-colors cursor-pointer md:hidden"
              title="New Chat"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Message Feed Area */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {!activeConversation || activeConversation.messages.length === 0 ? (
            <WelcomeScreen
              provider={currentProvider}
              model={currentModel}
              hasNvidiaKey={hasNvidiaKey}
              onSelectPrompt={(prompt) => handleSendMessage(prompt)}
              onOpenKeyModal={() => setIsKeyModalOpen(true)}
            />
          ) : (
            <div className="flex-1 py-4">
              {activeConversation.messages.map((message, index) => {
                const isLastAssistant =
                  index === activeConversation.messages.length - 1 &&
                  message.role === 'assistant';

                return (
                  <MessageItem
                    key={message.id}
                    message={message}
                    isLastAssistant={isLastAssistant}
                    onRegenerate={handleRegenerateLast}
                    onEditUserPrompt={handleEditUserPrompt}
                  />
                );
              })}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        {/* Bottom Chat Input */}
        <ChatInput
          onSendMessage={handleSendMessage}
          isStreaming={isStreaming}
          onStopStreaming={handleStopStreaming}
          hasNvidiaKey={hasNvidiaKey}
          isNvidiaProvider={currentProvider === 'nvidia'}
          onOpenKeyModal={() => setIsKeyModalOpen(true)}
        />
      </main>

      {/* NVIDIA Key Manager Dialog */}
      <NvidiaKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        apiKey={nvidiaApiKey}
        baseUrl={nvidiaBaseUrl}
        onSave={handleSaveNvidiaKey}
        serverNvidiaEnvConfigured={serverNvidiaEnvConfigured}
      />

      {/* Chat Parameters & Persona Dialog */}
      <ChatParametersModal
        isOpen={isParamsModalOpen}
        onClose={() => setIsParamsModalOpen(false)}
        systemInstruction={systemInstruction}
        temperature={temperature}
        maxTokens={maxTokens}
        onSave={handleSaveParams}
      />
    </div>
  );
}
