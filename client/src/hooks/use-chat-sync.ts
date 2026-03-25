"use client";

import * as React from "react";
import { io, type Socket } from "socket.io-client";
import { chatApi } from "@/store/chatApi";
import { useAppDispatch } from "@/store/index";
import { getPublicApiBase } from "@/lib/publicEnv";

const API_BASE = getPublicApiBase();

export function useChatSync(
  token: string | null,
  anonymousSessionId: string | null
) {
  const dispatch = useAppDispatch();
  const socketRef = React.useRef<Socket | null>(null);

  React.useEffect(() => {
    if (!token && !anonymousSessionId) return;

    const socket = io(API_BASE, {
      transports: ["websocket", "polling"],
      auth: token
        ? { token }
        : { anonSessionId: anonymousSessionId },
    });

    socketRef.current = socket;

    const invalidate = () => {
      dispatch(
        chatApi.util.invalidateTags([{ type: "ChatList", id: "LIST" }])
      );
    };

    socket.on("chats:invalidate", invalidate);

    return () => {
      socket.off("chats:invalidate", invalidate);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, anonymousSessionId, dispatch]);
}
