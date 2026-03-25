"use client";

import { StoreProvider } from "@/store/store-provider";
import {
  AuthBootstrap,
  TokenExpiryWatcher,
} from "@/store/auth-bootstrap";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <AuthBootstrap>
        <TokenExpiryWatcher />
        {children}
      </AuthBootstrap>
    </StoreProvider>
  );
}
