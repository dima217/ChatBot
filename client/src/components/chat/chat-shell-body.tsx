"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChatSidebar } from "./chat-sidebar";
import { MessageList } from "./message-list";
import { ChatComposer, type ChatComposerHandle } from "./chat-composer";
import type { ChatDoc, ChatListResponse, Message, LlmProvider } from "@/lib/api";

type Props = {
  mobileSidebarOpen: boolean;
  onCloseMobileSidebar: () => void;
  onToggleSidebarCollapse: () => void;
  sidebarCollapsedEffective: boolean;
  chats: ChatListResponse["chats"] | undefined;
  chatsLoading: boolean;
  selectedId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  anonymousBanner: { remaining: number; limit: number } | null;
  fileDragOver: boolean;
  setFileDragOver: (value: boolean) => void;
  composerBlocked: boolean;
  streaming: boolean;
  messages: Message[] | undefined;
  messagesLoading: boolean;
  streamingText: string;
  composerRef: React.RefObject<ChatComposerHandle | null>;
  onSend: (payload: { content: string; imageUrls: string[] }) => void;
  provider: LlmProvider;
  onProviderChange: (p: LlmProvider) => void;
  onUploadDoc: (file: File) => void;
  docUploading: boolean;
  documents: ChatDoc[];
  documentsLoading: boolean;
};

export function ChatShellBody(props: Props) {
  const {
    mobileSidebarOpen,
    onCloseMobileSidebar,
    onToggleSidebarCollapse,
    sidebarCollapsedEffective,
    chats,
    chatsLoading,
    selectedId,
    onSelectChat,
    onNewChat,
    onDeleteChat,
    anonymousBanner,
    fileDragOver,
    setFileDragOver,
    composerBlocked,
    streaming,
    messages,
    messagesLoading,
    streamingText,
    composerRef,
    onSend,
    provider,
    onProviderChange,
    onUploadDoc,
    docUploading,
    documents,
    documentsLoading,
  } = props;

  return (
    <div className="relative flex min-h-0 flex-1">
      {mobileSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 top-[3.25rem] z-40 bg-zinc-950/45 backdrop-blur-[1px] md:hidden"
          aria-label="Close chat list"
          onClick={onCloseMobileSidebar}
        />
      )}

      <div
        className={cn(
          "fixed bottom-0 left-0 z-50 flex h-[calc(100dvh-3.25rem)] w-[min(18.5rem,88vw)] transition-transform duration-200 ease-out md:static md:z-auto md:h-full md:w-auto md:shrink-0 md:translate-x-0 md:transition-none",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <ChatSidebar
          chats={chats}
          loading={chatsLoading}
          selectedId={selectedId}
          onSelect={onSelectChat}
          onNew={onNewChat}
          onDelete={onDeleteChat}
          collapsed={sidebarCollapsedEffective}
          onToggleCollapse={onToggleSidebarCollapse}
          anonymousBanner={anonymousBanner}
          onAfterNavigate={onCloseMobileSidebar}
        />
      </div>

      <main
        className="relative flex min-w-0 flex-1 flex-col bg-zinc-50/50 dark:bg-zinc-950/40"
        onDragEnter={(e) => {
          e.preventDefault();
          if (e.dataTransfer.types.includes("Files")) setFileDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          const rel = e.relatedTarget as Node | null;
          if (!rel || !e.currentTarget.contains(rel)) setFileDragOver(false);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDrop={(e) => {
          e.preventDefault();
          setFileDragOver(false);
          if (!selectedId || composerBlocked || streaming) return;
          const files = Array.from(e.dataTransfer.files);
          if (files.length) composerRef.current?.ingestFiles(files);
        }}
      >
        {fileDragOver && selectedId && !composerBlocked && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-violet-500/10 backdrop-blur-[2px] dark:bg-violet-950/35">
            <div className="mx-4 max-w-md rounded-3xl border-2 border-dashed border-violet-400/90 bg-white/95 px-8 py-8 text-center shadow-xl sm:px-12 sm:py-10 dark:border-violet-600 dark:bg-zinc-900/95">
              <p className="text-sm font-semibold text-violet-900 dark:text-violet-100">
                Drop to attach
              </p>
              <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                Images attach · documents add context
              </p>
            </div>
          </div>
        )}

        <MessageList
          messages={messages}
          loading={messagesLoading}
          streamingText={streamingText}
          streaming={streaming}
        />
        <ChatComposer
          ref={composerRef}
          disabled={!selectedId || composerBlocked}
          busy={streaming}
          onSend={onSend}
          provider={provider}
          onProviderChange={onProviderChange}
          onUploadDoc={onUploadDoc}
          docUploading={docUploading}
          attachedDocuments={documents}
          documentsLoading={documentsLoading}
        />
      </main>
    </div>
  );
}
