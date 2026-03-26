"use client";

import { LogIn, LogOut, Menu, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/store/authSlice";

type Props = {
  user: AuthUser | null;
  mobileSidebarOpen: boolean;
  sendError: string | null;
  onToggleMobileSidebar: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
};

export function ChatShellHeader({
  user,
  mobileSidebarOpen,
  sendError,
  onToggleMobileSidebar,
  onOpenAuth,
  onLogout,
}: Props) {
  return (
    <header className="flex h-[3.25rem] shrink-0 items-center justify-between gap-2 border-b border-zinc-200/70 bg-white/70 px-2 backdrop-blur-lg sm:gap-3 sm:px-4 dark:border-zinc-800/80 dark:bg-zinc-950/70">
      <div className="flex min-w-0 items-center gap-1.5 sm:gap-2.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 shrink-0 rounded-lg text-zinc-600 md:hidden dark:text-zinc-300"
          aria-label={mobileSidebarOpen ? "Close chats" : "Open chats"}
          aria-expanded={mobileSidebarOpen}
          onClick={onToggleMobileSidebar}
        >
          <span className="relative block size-5">
            <Menu
              className={cn(
                "absolute inset-0 size-5 transition-all duration-200",
                mobileSidebarOpen
                  ? "scale-75 rotate-90 opacity-0"
                  : "scale-100 rotate-0 opacity-100"
              )}
            />
            <X
              className={cn(
                "absolute inset-0 size-5 transition-all duration-200",
                mobileSidebarOpen
                  ? "scale-100 rotate-0 opacity-100"
                  : "scale-75 -rotate-90 opacity-0"
              )}
            />
          </span>
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
              onClick={onLogout}
            >
              <LogOut className="size-3.5 shrink-0" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            className="h-8 gap-1 rounded-lg bg-violet-600 px-2 text-xs hover:bg-violet-500 sm:gap-1.5 sm:px-3 dark:bg-violet-600 dark:hover:bg-violet-500"
            onClick={onOpenAuth}
          >
            <LogIn className="size-3.5 shrink-0" />
            <span className="hidden min-[400px]:inline">Sign in</span>
          </Button>
        )}
      </div>
    </header>
  );
}
