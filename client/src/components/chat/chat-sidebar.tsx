"use client";

import * as React from "react";
import { Plus, MessageSquare, Trash2, PanelLeftClose, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Chat } from "@/lib/api";

type Props = {
  chats: Chat[] | undefined;
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  anonymousBanner?: { remaining: number; limit: number } | null;
};

export function ChatSidebar({
  chats,
  loading,
  selectedId,
  onSelect,
  onNew,
  onDelete,
  collapsed,
  onToggleCollapse,
  anonymousBanner,
}: Props) {
  return (
    <aside
      className={cn(
        "flex h-full min-h-0 shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950",
        "box-border transition-[width] duration-200 ease-out",
        collapsed ? "w-[4.25rem]" : "w-[min(100%,21rem)]"
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center gap-2 border-b border-zinc-100 bg-zinc-50/95 py-3 dark:border-zinc-800/80 dark:bg-zinc-900/50",
          collapsed ? "flex-col px-2.5" : "px-3"
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 rounded-lg text-zinc-500 hover:bg-zinc-200/70 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeft className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </Button>
        {!collapsed && (
          <Button
            className="h-8 min-w-0 flex-1 gap-1.5 rounded-lg bg-violet-600 px-3 text-xs font-semibold text-white shadow-sm hover:bg-violet-500 dark:bg-violet-600 dark:hover:bg-violet-500"
            onClick={onNew}
          >
            <Plus className="size-3.5 shrink-0" />
            New Chat
          </Button>
        )}
        {collapsed && (
          <Button
            size="icon"
            className="size-8 shrink-0 rounded-lg bg-violet-600 text-white shadow-sm hover:bg-violet-500 dark:bg-violet-600 dark:hover:bg-violet-500"
            onClick={onNew}
            aria-label="New Chat"
          >
            <Plus className="size-3.5" />
          </Button>
        )}
      </div>

      {anonymousBanner && !collapsed && (
        <div className="shrink-0 border-b border-amber-100/90 bg-amber-50 px-3 py-2.5 text-[11px] leading-snug text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/35 dark:text-amber-100">
          <span className="font-semibold">Guest mode:</span> {anonymousBanner.remaining} of{" "}
          {anonymousBanner.limit} free messages left. Sign in for unlimited access.
        </div>
      )}

      <ScrollArea className="min-h-0 min-w-0 flex-1">
        {/* pr-3.5: keep row controls clear of Radix scrollbar overlay */}
        <div className={cn("min-w-0 py-3", collapsed ? "px-2.5" : "px-3 pr-3.5")}>
          {loading && (
            <div className="space-y-2 px-0.5">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          )}
          {!loading && (!chats || chats.length === 0) && !collapsed && (
            <div className="flex flex-col items-center justify-center gap-2 px-2 py-14 text-center">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800/90">
                <MessageSquare className="size-5 text-zinc-400 dark:text-zinc-500" />
              </div>
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                No chats yet
              </p>
              <p className="max-w-[11rem] text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500">
                Use <span className="font-medium text-zinc-500 dark:text-zinc-400">New Chat</span> above.
              </p>
            </div>
          )}
          <ul className="min-w-0 space-y-1">
            {chats?.map((c) => {
              const selected = selectedId === c.id;
              return (
                <li key={c.id} className="min-w-0">
                  <div
                    className={cn(
                      "group flex min-w-0 items-center gap-1 rounded-lg border border-transparent transition-colors",
                      collapsed ? "justify-center px-1 py-1" : "pl-2 pr-1",
                      selected
                        ? "border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
                        : "hover:border-zinc-200/80 hover:bg-zinc-50 dark:hover:border-zinc-800 dark:hover:bg-zinc-900/70"
                    )}
                  >
                    <button
                      type="button"
                      className={cn(
                        "flex min-w-0 items-center gap-2 py-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40",
                        collapsed
                          ? "justify-center px-0"
                          : "min-h-[2.5rem] flex-1 overflow-hidden pl-0 pr-0"
                      )}
                      onClick={() => onSelect(c.id)}
                      title={c.title}
                    >
                      <span
                        className={cn(
                          "flex size-7 shrink-0 items-center justify-center rounded-md",
                          selected
                            ? "bg-violet-600 text-white"
                            : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                        )}
                      >
                        <MessageSquare className="size-3.5 opacity-95" />
                      </span>
                      {!collapsed && (
                        <span
                          className={cn(
                            "min-w-0 flex-1 truncate text-[13px] font-medium leading-tight",
                            selected
                              ? "text-zinc-900 dark:text-zinc-50"
                              : "text-zinc-700 dark:text-zinc-200"
                          )}
                        >
                          {c.title}
                        </span>
                      )}
                    </button>
                    {!collapsed && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0 rounded-md text-zinc-400 hover:bg-red-50 hover:text-red-600 max-sm:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                        aria-label="Delete chat"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(c.id);
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </ScrollArea>
    </aside>
  );
}
