import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Search,
  Trash2,
  Edit2,
  Pin,
  Check,
  X,
  Key,
  Sliders,
  Download,
  Zap,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
} from 'lucide-react';
import { Conversation, Provider } from '../types/chat';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onTogglePin: (id: string) => void;
  onExportConversation: (id: string, format: 'markdown' | 'json') => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  hasNvidiaKey: boolean;
  onOpenKeyModal: () => void;
  onOpenParamsModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onTogglePin,
  onExportConversation,
  isOpen,
  onToggleOpen,
  hasNvidiaKey,
  onOpenKeyModal,
  onOpenParamsModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const startRename = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
    setActiveMenuId(null);
  };

  const handleSaveRename = (id: string) => {
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  // Filter conversations
  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by pinned vs time
  const pinnedConvs = filtered.filter((c) => c.pinned);
  const unpinnedConvs = filtered.filter((c) => !c.pinned);

  // Group unpinned by date
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  const todayConvs = unpinnedConvs.filter((c) => now - c.updatedAt < oneDay);
  const yesterdayConvs = unpinnedConvs.filter(
    (c) => now - c.updatedAt >= oneDay && now - c.updatedAt < 2 * oneDay
  );
  const olderConvs = unpinnedConvs.filter((c) => now - c.updatedAt >= 2 * oneDay);

  const renderConvItem = (conv: Conversation) => {
    const isActive = conv.id === activeId;
    const isEditing = conv.id === editingId;

    return (
      <div
        key={conv.id}
        className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all cursor-pointer ${
          isActive
            ? 'bg-[#2a2a2a] text-white font-medium shadow-sm'
            : 'text-gray-300 hover:bg-[#212121] hover:text-white'
        }`}
        onClick={() => {
          if (!isEditing) onSelectConversation(conv.id);
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <MessageSquare
            className={`w-4 h-4 shrink-0 ${
              conv.provider === 'nvidia' ? 'text-[#76B900]' : 'text-blue-400'
            }`}
          />

          {isEditing ? (
            <div className="flex items-center gap-1.5 flex-1" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveRename(conv.id);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                autoFocus
                className="w-full px-2 py-0.5 rounded bg-black border border-emerald-500 text-xs text-white outline-none"
              />
              <button
                onClick={() => handleSaveRename(conv.id)}
                className="p-1 hover:text-emerald-400"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="p-1 hover:text-red-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <span className="truncate flex-1 text-[13px]">{conv.title}</span>
          )}
        </div>

        {/* Hover / Options Menu */}
        {!isEditing && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin(conv.id);
              }}
              className={`p-1 rounded hover:bg-gray-700 ${
                conv.pinned ? 'text-amber-400 opacity-100' : 'text-gray-400 hover:text-gray-200'
              }`}
              title={conv.pinned ? 'Unpin chat' : 'Pin chat'}
            >
              <Pin className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                startRename(conv);
              }}
              className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-gray-200"
              title="Rename chat"
            >
              <Edit2 className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onExportConversation(conv.id, 'markdown');
              }}
              className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-gray-200"
              title="Export as Markdown"
            >
              <Download className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteConversation(conv.id);
              }}
              className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-red-400"
              title="Delete chat"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={onToggleOpen}
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-[#171717] border-r border-gray-800/80 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:border-r-0 md:overflow-hidden'
        }`}
      >
        {/* Top Header & New Chat button */}
        <div className="p-3 space-y-2 border-b border-gray-800/60">
          <div className="flex items-center justify-between">
            <button
              onClick={onNewChat}
              className="flex-1 flex items-center justify-between px-3 py-2 rounded-xl bg-gray-800/70 hover:bg-gray-700 text-gray-200 hover:text-white transition-all text-sm font-semibold cursor-pointer active:scale-98 border border-gray-700/60 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>New chat</span>
              </div>
              <span className="text-[10px] text-gray-400 font-mono">Ctrl+K</span>
            </button>
            <button
              onClick={onToggleOpen}
              className="md:hidden ml-2 p-2 rounded-lg text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#0f0f0f] border border-gray-800 text-xs text-gray-200 placeholder-gray-500 outline-none focus:border-gray-600"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {conversations.length === 0 ? (
            <div className="text-center py-10 px-4 text-gray-500 text-xs">
              No conversations yet. Start a new chat to begin!
            </div>
          ) : null}

          {/* Pinned section */}
          {pinnedConvs.length > 0 && (
            <div className="space-y-1">
              <span className="px-3 text-[11px] font-semibold text-amber-400/90 uppercase tracking-wider flex items-center gap-1.5">
                <Pin className="w-3 h-3" />
                Pinned
              </span>
              {pinnedConvs.map(renderConvItem)}
            </div>
          )}

          {/* Today section */}
          {todayConvs.length > 0 && (
            <div className="space-y-1">
              <span className="px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Today
              </span>
              {todayConvs.map(renderConvItem)}
            </div>
          )}

          {/* Yesterday section */}
          {yesterdayConvs.length > 0 && (
            <div className="space-y-1">
              <span className="px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Yesterday
              </span>
              {yesterdayConvs.map(renderConvItem)}
            </div>
          )}

          {/* Older section */}
          {olderConvs.length > 0 && (
            <div className="space-y-1">
              <span className="px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Previous
              </span>
              {olderConvs.map(renderConvItem)}
            </div>
          )}
        </div>

        {/* Bottom Provider & Settings Dock */}
        <div className="p-3 border-t border-gray-800/80 bg-[#121212] space-y-2">
          {/* NVIDIA Key status button */}
          <button
            onClick={onOpenKeyModal}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gray-800/50 hover:bg-gray-800 border border-gray-700/60 text-xs font-medium text-gray-200 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  hasNvidiaKey ? 'bg-[#76B900] shadow-[0_0_8px_#76b900]' : 'bg-amber-500'
                }`}
              />
              <span className="font-semibold">NVIDIA API Key</span>
            </div>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-md font-bold ${
                hasNvidiaKey
                  ? 'bg-[#76B900]/20 text-[#76B900]'
                  : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              {hasNvidiaKey ? 'Ready' : 'Setup'}
            </span>
          </button>

          {/* Parameters & Persona button */}
          <button
            onClick={onOpenParamsModal}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-800/60 transition-colors cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>Chat Persona & Temperature</span>
          </button>
        </div>
      </aside>
    </>
  );
};
