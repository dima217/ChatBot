"use client";

import * as React from "react";
import { LogIn, LogOut, Sparkles } from "lucide-react";
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
      <header className="flex h-[3.25rem] shrink-0 items-center justify-between border-b border-zinc-200/70 bg-white/70 px-4 backdrop-blur-lg dark:border-zinc-800/80 dark:bg-zinc-950/70">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 shadow-sm shadow-violet-500/25">
            <Sparkles className="size-4 text-white" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Studio Chat
          </span>
        </div>
        <div className="flex items-center gap-2">
          {sendError && (
            <span className="max-w-[200px] truncate text-xs text-red-600 sm:max-w-md dark:text-red-400">
              {sendError}
            </span>
          )}
          {user ? (
            <>
              <span className="hidden max-w-[10rem] truncate text-xs text-zinc-500 sm:inline dark:text-zinc-400">
                {user.email ?? user.id.slice(0, 8)}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 rounded-lg border-zinc-200 text-xs dark:border-zinc-700"
                onClick={signOut}
              >
                <LogOut className="size-3.5" />
                Sign out
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              className="h-8 gap-1.5 rounded-lg bg-violet-600 text-xs hover:bg-violet-500 dark:bg-violet-600 dark:hover:bg-violet-500"
              onClick={() => setAuthOpen(true)}
            >
              <LogIn className="size-3.5" />
              Sign in
            </Button>
          )}
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <ChatSidebar
          chats={chatsQuery.data?.chats}
          loading={chatsQuery.isLoading}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onNew={handleNewChat}
          onDelete={handleDelete}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
          anonymousBanner={user ? null : anonymousUsage ?? null}
        />
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
              <div className="rounded-3xl border-2 border-dashed border-violet-400/90 bg-white/95 px-12 py-10 text-center shadow-xl dark:border-violet-600 dark:bg-zinc-900/95">
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
