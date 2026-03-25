"use client";

import * as React from "react";
import {
  hydrateFromStorage,
  logout,
  REFRESH_KEY,
  TOKEN_KEY,
  USER_KEY,
  type AuthUser,
} from "./authSlice";
import { useAppDispatch, useAppSelector } from "./index";

function jwtExpiryMs(token: string): number | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
    const json = atob(padded);
    const { exp } = JSON.parse(json) as { exp?: number };
    if (typeof exp !== "number") return null;
    return exp * 1000;
  } catch {
    return null;
  }
}

export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const hydrated = React.useRef(false);

  React.useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const token = localStorage.getItem(TOKEN_KEY);
    const refresh = localStorage.getItem(REFRESH_KEY);
    const rawUser = localStorage.getItem(USER_KEY);
    if (token && rawUser) {
      try {
        const user = JSON.parse(rawUser) as AuthUser;
        dispatch(hydrateFromStorage({ token, refreshToken: refresh, user }));
      } catch {
        dispatch(logout());
      }
    }
  }, [dispatch]);

  return <>{children}</>;
}

export function TokenExpiryWatcher() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.token);

  React.useEffect(() => {
    if (!token) return;
    const expMs = jwtExpiryMs(token);
    if (expMs == null) return;
    const ms = expMs - Date.now() - 2000;
    if (ms <= 0) {
      dispatch(logout());
      return;
    }
    const id = window.setTimeout(() => dispatch(logout()), ms);
    return () => clearTimeout(id);
  }, [token, dispatch]);

  return null;
}
