import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { logout } from "./authSlice";
import type {
  Chat,
  ChatDoc,
  ChatListResponse,
  Message,
} from "@/lib/api";
import { getPublicApiBase } from "@/lib/publicEnv";

const API_BASE = getPublicApiBase();

export type AuthResponse = {
  access_token: string;
  refresh_token: string;
  user: { id: string; email?: string };
};

type RootSlice = { auth: { token: string | null } };

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootSlice).auth.token;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

const baseQueryWithLogout: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  if (result.error?.status === 401) {
    const token = (api.getState() as RootSlice).auth.token;
    if (token) api.dispatch(logout());
  }
  return result;
};

export const chatApi = createApi({
  reducerPath: "chatApi",
  baseQuery: baseQueryWithLogout,
  tagTypes: ["ChatList", "Chat", "Documents"],
  endpoints: (build) => ({
    getChats: build.query<ChatListResponse, string>({
      query: () => "/api/chats",
      providesTags: [{ type: "ChatList", id: "LIST" }],
    }),
    createChat: build.mutation<
      { chat: Chat; anonymousSessionId?: string },
      { title?: string } | void
    >({
      query: (body) => ({
        url: "/api/chats",
        method: "POST",
        body: body === undefined ? {} : body,
      }),
      invalidatesTags: [{ type: "ChatList", id: "LIST" }],
    }),
    getChat: build.query<
      { chat: Chat; messages: Message[] },
      { chatId: string; sessionKey: string }
    >({
      query: ({ chatId }) => `/api/chats/${chatId}`,
      providesTags: (_r, _e, { chatId }) => [{ type: "Chat", id: chatId }],
    }),
    deleteChat: build.mutation<void, string>({
      query: (id) => ({ url: `/api/chats/${id}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, id) => [
        { type: "ChatList", id: "LIST" },
        { type: "Chat", id },
      ],
    }),
    getDocuments: build.query<
      { documents: ChatDoc[] },
      { chatId: string; sessionKey: string }
    >({
      query: ({ chatId }) => `/api/chats/${chatId}/documents`,
      providesTags: (_r, _e, { chatId }) => [{ type: "Documents", id: chatId }],
    }),
    uploadDocument: build.mutation<
      { document: ChatDoc },
      { chatId: string; file: File }
    >({
      query: ({ chatId, file }) => {
        const fd = new FormData();
        fd.append("file", file);
        return {
          url: `/api/chats/${chatId}/documents`,
          method: "POST",
          body: fd,
        };
      },
      invalidatesTags: (_r, _e, { chatId }) => [
        { type: "Documents", id: chatId },
      ],
    }),
    login: build.mutation<AuthResponse, { email: string; password: string }>({
      query: (body) => ({
        url: "/api/auth/login",
        method: "POST",
        body,
      }),
    }),
    register: build.mutation<
      AuthResponse,
      { email: string; password: string; fullName?: string }
    >({
      query: (body) => ({
        url: "/api/auth/register",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useGetChatsQuery,
  useCreateChatMutation,
  useGetChatQuery,
  useDeleteChatMutation,
  useGetDocumentsQuery,
  useUploadDocumentMutation,
  useLoginMutation,
  useRegisterMutation,
} = chatApi;
