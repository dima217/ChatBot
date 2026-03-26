"use client";

import * as React from "react";
import {
  chatApi,
  useCreateChatMutation,
  useDeleteChatMutation,
  useGetChatQuery,
  useGetChatsQuery,
  useGetDocumentsQuery,
  useUploadDocumentMutation,
} from "@/store/chatApi";
import { useAuth } from "@/store/use-auth";
import { logout } from "@/store/authSlice";
import { sendMessageStream, type LlmProvider } from "@/lib/api";
import { useAppDispatch, useAppSelector } from "@/store/index";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useChatSync } from "@/hooks/use-chat-sync";
import type { ChatComposerHandle } from "../components/chat/chat-composer";

const PROVIDER_KEY = "chatbot_llm_provider";

export function useChatShellState() {
  const dispatch = useAppDispatch();
  const authHydrated = useAppSelector((s) => s.auth.hydrated);
  const { token, user } = useAuth();
  const sessionKey = token ?? "__anon__";

  const chatsQuery = useGetChatsQuery(sessionKey, { skip: !authHydrated });
  const [createChatMut] = useCreateChatMutation();
  const [deleteChatMut] = useDeleteChatMutation();
  const [uploadDocMut, uploadDocState] = useUploadDocumentMutation();

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
    } catch {}
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
    !user && anonymousUsage != null && anonymousUsage.remaining <= 0;

  const handleLogout = React.useCallback(() => {
    dispatch(logout());
    dispatch(chatApi.util.resetApiState());
    setSelectedId(null);
    setMobileSidebarOpen(false);
    setStreaming(false);
    setStreamingText("");
    setSendError(null);
  }, [dispatch]);

  async function handleNewChat() {
    try {
      const r = await createChatMut(undefined).unwrap();
      setSelectedId(r.chat.id);
      void chatsQuery.refetch();
    } catch {}
  }

  async function handleDelete(id: string) {
    try {
      await deleteChatMut(id).unwrap();
      if (selectedId === id) setSelectedId(null);
      void detail.refetch();
    } catch {}
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
        onUnauthorized: handleLogout,
      }
    );
  }

  return {
    user,
    token,
    chatsQuery,
    detail,
    docsQuery,
    uploadDocState,
    selectedId,
    setSelectedId,
    authOpen,
    setAuthOpen,
    sidebarCollapsedEffective,
    setSidebarCollapsed,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    provider,
    setProvider,
    streamingText,
    streaming,
    sendError,
    fileDragOver,
    setFileDragOver,
    composerRef,
    composerBlocked,
    anonymousUsage,
    handleLogout,
    handleNewChat,
    handleDelete,
    handleSend,
    uploadDocMut,
  };
}
