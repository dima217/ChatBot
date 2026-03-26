"use client";

import { FileText, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChatDoc } from "@/lib/api";

type Props = {
  show: boolean;
  documentsLoading?: boolean;
  attachedDocuments: ChatDoc[];
  docUploading?: boolean;
};

export function ChatComposerContextBar({
  show,
  documentsLoading,
  attachedDocuments,
  docUploading,
}: Props) {
  if (!show) return null;
  return (
    <div className="flex max-w-full items-center gap-2 rounded-2xl border border-zinc-200/70 bg-white/80 px-3 py-2 shadow-sm backdrop-blur-sm dark:border-zinc-700/80 dark:bg-zinc-900/70">
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
        Context
      </span>
      <div className="scrollbar-none flex min-h-8 flex-1 items-center gap-2 overflow-x-auto overflow-y-hidden">
        {documentsLoading && <Skeleton className="h-7 w-28 shrink-0 rounded-full" />}
        {!documentsLoading &&
          attachedDocuments.map((d) => (
            <span
              key={d.id}
              className="inline-flex max-w-[200px] shrink-0 items-center gap-1.5 truncate rounded-full border border-violet-200/80 bg-violet-50/90 px-3 py-1 text-xs text-violet-950 dark:border-violet-800/60 dark:bg-violet-950/35 dark:text-violet-100"
              title={d.filename}
            >
              <FileText className="size-3.5 shrink-0 opacity-75" />
              <span className="truncate">{d.filename}</span>
            </span>
          ))}
        {docUploading && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-200/80 bg-zinc-50 px-3 py-1 text-xs text-zinc-600 dark:border-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-300">
            <Loader2 className="size-3.5 animate-spin" />
            Uploading…
          </span>
        )}
      </div>
    </div>
  );
}
