"use client";

import { AuthDialog } from "@/components/auth/auth-dialog";
import { ChatShellBody } from "./chat-shell-body";
import { ChatShellHeader } from "./chat-shell-header";
import { useChatShellState } from "../../hooks/use-chat-shell-state";

export function ChatShell() {
  const s = useChatShellState();

  return (
    <div className="flex h-[100dvh] w-full flex-col bg-gradient-to-b from-zinc-100 via-zinc-100 to-zinc-200/80 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900">
      <ChatShellHeader
        user={s.user}
        mobileSidebarOpen={s.mobileSidebarOpen}
        sendError={s.sendError}
        onToggleMobileSidebar={() => s.setMobileSidebarOpen((v) => !v)}
        onOpenAuth={() => s.setAuthOpen(true)}
        onLogout={s.handleLogout}
      />
      <ChatShellBody
        mobileSidebarOpen={s.mobileSidebarOpen}
        onCloseMobileSidebar={() => s.setMobileSidebarOpen(false)}
        onToggleSidebarCollapse={() => s.setSidebarCollapsed((c) => !c)}
        sidebarCollapsedEffective={s.sidebarCollapsedEffective}
        chats={s.chatsQuery.data?.chats}
        chatsLoading={s.chatsQuery.isLoading}
        selectedId={s.selectedId}
        onSelectChat={s.setSelectedId}
        onNewChat={s.handleNewChat}
        onDeleteChat={s.handleDelete}
        anonymousBanner={s.user ? null : s.anonymousUsage ?? null}
        fileDragOver={s.fileDragOver}
        setFileDragOver={s.setFileDragOver}
        composerBlocked={s.composerBlocked}
        streaming={s.streaming}
        messages={s.detail.data?.messages}
        messagesLoading={!!s.selectedId && s.detail.isLoading}
        streamingText={s.streamingText}
        composerRef={s.composerRef}
        onSend={s.handleSend}
        provider={s.provider}
        onProviderChange={s.setProvider}
        onUploadDoc={(file) => {
          if (!s.selectedId) return;
          void s.uploadDocMut({ chatId: s.selectedId, file });
        }}
        docUploading={s.uploadDocState.isLoading}
        documents={s.docsQuery.data?.documents ?? []}
        documentsLoading={!!s.selectedId && s.docsQuery.isLoading}
      />
      <AuthDialog
        open={s.authOpen}
        onOpenChange={s.setAuthOpen}
        onSuccess={() => void s.chatsQuery.refetch()}
      />
    </div>
  );
}
