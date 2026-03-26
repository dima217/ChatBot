import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export const TOKEN_KEY = "chatbot_access_token";
export const REFRESH_KEY = "chatbot_refresh_token";
export const USER_KEY = "chatbot_user";

export type AuthUser = { id: string; email?: string };

export type AuthState = {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  hydrated: boolean;
};

const initialState: AuthState = {
  token: null,
  refreshToken: null,
  user: null,
  hydrated: false,
};

export type SessionPayload = {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
};

function persistSession(payload: SessionPayload) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, payload.access_token);
  localStorage.setItem(REFRESH_KEY, payload.refresh_token);
  localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
}

function clearPersistedSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<SessionPayload>) => {
      state.token = action.payload.access_token;
      state.refreshToken = action.payload.refresh_token;
      state.user = action.payload.user;
      state.hydrated = true;
      persistSession(action.payload);
    },
    logout: (state) => {
      state.token = null;
      state.refreshToken = null;
      state.user = null;
      state.hydrated = true;
      clearPersistedSession();
    },
    hydrateFromStorage: (
      state,
      action: PayloadAction<{
        token: string;
        refreshToken: string | null;
        user: AuthUser;
      } | null>
    ) => {
      const p = action.payload;
      if (p) {
        state.token = p.token;
        state.refreshToken = p.refreshToken;
        state.user = p.user;
      }
      state.hydrated = true;
    },
  },
});

export const { setCredentials, logout, hydrateFromStorage } = authSlice.actions;

export const authReducer = authSlice.reducer;
