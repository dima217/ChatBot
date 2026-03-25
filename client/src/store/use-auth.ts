"use client";

import * as React from "react";
import { logout } from "./authSlice";
import { useAppDispatch, useAppSelector } from "./index";

export function useAuth() {
  const token = useAppSelector((s) => s.auth.token);
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const signOut = React.useCallback(() => {
    dispatch(logout());
  }, [dispatch]);
  return { token, user, logout: signOut };
}
