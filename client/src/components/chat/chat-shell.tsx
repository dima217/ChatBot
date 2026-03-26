"use client";

import * as React from "react";
import { LogIn, LogOut, Menu, Sparkles } from "lucide-react";
import { ChatSidebar } from "./chat-sidebar";
import { MessageList } from "./message-list";
import { ChatComposer, type ChatComposerHandle } from "./chat-composer";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/store/use-auth";
import { useChatSync } from "@/hooks/use-chat-sync";
import {
  chatApi,
  useCreateChatMutation,
  useDeleteChatMutation,
  useGetChatQuery,
  useGetChatsQuery,
  useGetDocumentsQuery,
  useUploadDocumentMutation,
} from "@/store/chatApi";
import { logout } from "@/store/authSlice";
import { sendMessageStream, type LlmProvider } from "@/lib/api";
import { useAppDispatch } from "@/store/index";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

const PROVIDER_KEY = "chatbot_llm_provider";

export function ChatShell() {
  const dispatch = useAppDispatch();
  const { token, user, logout: signOut } = useAuth();
  const sessionKey = token ?? "__anon__";

  const chatsQuery = useGetChatsQuery(sessionKey);
  const [createChatMut] = useCreateChatMutation();
  const [deleteChatMut] = useDeleteChatMutation();

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [authOpen, setAuthOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const mdUp = useMediaQuery("(min-width: 768px)");
  const sidebarCollapsedEffective = mdUp && sidebarCollapsed;
  const [provider, setProvider] = React.useState<LlmProvider>("openai");
  const [streamingText, setStreamingText] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const [sendError, setSendError] = React.useState<string | null>(null);
  const [fileDragOver, setFileDragOver] = React.useState(false);
  const composerRef = React.useRef<ChatComposerHandle>(null);

  React.useEffect(() => {
    try {
      const p = localStorage.getItem(PROVIDER_KEY) as LlmProvider | null;
      if (p === "openai" || p === "gemini") setProvider(p);
    } catch {
      /* ignore */
    }
  }, []);

  React.useEffect(() => {
    localStorage.setItem(PROVIDER_KEY, provider);
  }, [provider]);

  React.useEffect(() => {
    if (mdUp) setMobileSidebarOpen(false);
  }, [mdUp]);

  const anonSessionId = chatsQuery.data?.anonymousSessionId ?? null;
  useChatSync(token, user ? null : anonSessionId);

  const detail = useGetChatQuery(
    { chatId: selectedId!, sessionKey },
    { skip: !selectedId }
  );
  const docsQuery = useGetDocumentsQuery(
    { chatId: selectedId!, sessionKey },
    { skip: !selectedId }
  );
  const [uploadDocMut, uploadDocState] = useUploadDocumentMutation();

  React.useEffect(() => {
    const list = chatsQuery.data?.chats;
    if (!list?.length) {
      if (selectedId) setSelectedId(null);
      return;
    }
    if (selectedId && list.some((c) => c.id === selectedId)) return;
    setSelectedId(list[0].id);
  }, [chatsQuery.data?.chats, selectedId]);

  const anonymousUsage = chatsQuery.data?.anonymousUsage;
  const composerBlocked =
    !user &&
    anonymousUsage !== null &&
    anonymousUsage !== undefined &&
    anonymousUsage.remaining <= 0;

  async function handleNewChat() {
    try {
      const r = await createChatMut(undefined).unwrap();
      setSelectedId(r.chat.id);
      void chatsQuery.refetch();
    } catch {
      /* toast */
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteChatMut(id).unwrap();
      if (selectedId === id) setSelectedId(null);
      void detail.refetch();
    } catch {
      /* ignore */
    }
  }

  async function handleSend(payload: { content: string; imageUrls: string[] }) {
    if (!selectedId || composerBlocked) return;
    setSendError(null);
    setStreaming(true);
    setStreamingText("");
    await sendMessageStream(
      token,
      selectedId,
      { content: payload.content, imageUrls: payload.imageUrls, provider },
      {
        onUserMessage: () => {
          dispatch(
            chatApi.util.invalidateTags([
              { type: "Chat", id: selectedId },
              { type: "ChatList", id: "LIST" },
            ])
          );
        },
        onToken: (t) => setStreamingText((s) => s + t),
        onDone: () => {
          setStreaming(false);
          setStreamingText("");
          dispatch(
            chatApi.util.invalidateTags([
              { type: "Chat", id: selectedId },
              { type: "Documents", id: selectedId },
              { type: "ChatList", id: "LIST" },
            ])
          );
          void chatsQuery.refetch();
        },
        onError: (msg) => {
          setSendError(msg);
          setStreaming(false);
          setStreamingText("");
        },
        onUnauthorized: () => {
          dispatch(logout());
        },
      }
    );
  }

  return (
    <div className="flex h-[100dvh] w-full flex-col bg-gradient-to-b from-zinc-100 via-zinc-100 to-zinc-200/80 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900">
      <header className="flex h-[3.25rem] shrink-0 items-center justify-between gap-2 border-b border-zinc-200/70 bg-white/70 px-2 backdrop-blur-lg sm:gap-3 sm:px-4 dark:border-zinc-800/80 dark:bg-zinc-950/70">
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 rounded-lg text-zinc-600 md:hidden dark:text-zinc-300"
            aria-label="Open chats"
            aria-expanded={mobileSidebarOpen}
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 shadow-sm shadow-violet-500/25">
            <Sparkles className="size-4 text-white" />
          </div>
          <span className="truncate text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Studio Chat
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {sendError && (
            <span
              className="hidden max-w-[min(48vw,14rem)] truncate text-xs text-red-600 sm:inline sm:max-w-md dark:text-red-400"
              title={sendError}
            >
              {sendError}
            </span>
          )}
          {user ? (
            <>
              <span className="hidden max-w-[10rem] truncate text-xs text-zinc-500 lg:inline dark:text-zinc-400">
                {user.email ?? user.id.slice(0, 8)}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1 rounded-lg border-zinc-200 px-2 text-xs sm:gap-1.5 sm:px-3 dark:border-zinc-700"
                onClick={signOut}
              >
                <LogOut className="size-3.5 shrink-0" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              className="h-8 gap-1 rounded-lg bg-violet-600 px-2 text-xs hover:bg-violet-500 sm:gap-1.5 sm:px-3 dark:bg-violet-600 dark:hover:bg-violet-500"
              onClick={() => setAuthOpen(true)}
            >
              <LogIn className="size-3.5 shrink-0" />
              <span className="hidden min-[400px]:inline">Sign in</span>
            </Button>
          )}
        </div>
      </header>
      <div className="relative flex min-h-0 flex-1">
        {mobileSidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 top-[3.25rem] z-40 bg-zinc-950/45 backdrop-blur-[1px] md:hidden"
            aria-label="Close chat list"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
        <div
          className={cn(
            "fixed bottom-0 left-0 z-50 flex h-[calc(100dvh-3.25rem)] w-[min(18.5rem,88vw)] transition-transform duration-200 ease-out md:static md:z-auto md:h-full md:w-auto md:shrink-0 md:translate-x-0 md:transition-none",
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          )}
        >
          <ChatSidebar
            chats={chatsQuery.data?.chats}
            loading={chatsQuery.isLoading}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onNew={handleNewChat}
            onDelete={handleDelete}
            collapsed={sidebarCollapsedEffective}
            onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
            anonymousBanner={user ? null : anonymousUsage ?? null}
            onAfterNavigate={() => setMobileSidebarOpen(false)}
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
            messages={detail.data?.messages}
            loading={!!selectedId && detail.isLoading}
            streamingText={streamingText}
            streaming={streaming}
          />
          <ChatComposer
            ref={composerRef}
            disabled={!selectedId || composerBlocked}
            busy={streaming}
            onSend={handleSend}
            provider={provider}
            onProviderChange={setProvider}
            onUploadDoc={(file) => {
              if (!selectedId) return;
              void uploadDocMut({ chatId: selectedId, file });
            }}
            docUploading={uploadDocState.isLoading}
            attachedDocuments={docsQuery.data?.documents ?? []}
            documentsLoading={!!selectedId && docsQuery.isLoading}
          />
        </main>
      </div>
      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        onSuccess={() => void chatsQuery.refetch()}
      />
    </div>
  );
}
