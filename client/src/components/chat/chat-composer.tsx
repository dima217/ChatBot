"use client";

import * as React from "react";
import { Send, ImagePlus, FileUp, Loader2, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ChatDoc, LlmProvider } from "@/lib/api";

export type ChatComposerHandle = {
  /** Images go to attachments; other files trigger document upload (like ChatGPT). */
  ingestFiles: (files: File[]) => void;
};

type Props = {
  disabled?: boolean;
  busy?: boolean;
  onSend: (payload: {
    content: string;
    imageUrls: string[];
  }) => void;
  provider: LlmProvider;
  onProviderChange: (p: LlmProvider) => void;
  onUploadDoc: (file: File) => void;
  docUploading?: boolean;
  attachedDocuments: ChatDoc[];
  documentsLoading?: boolean;
};

const DOC_MIMES = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "text/json",
]);

function isLikelyDocFile(file: File): boolean {
  if (DOC_MIMES.has(file.type)) return true;
  const name = file.name.toLowerCase();
  const byExt = /\.(txt|md|csv|json)$/i.test(name);
  if (file.type === "application/octet-stream" || !file.type) return byExt;
  if (file.type.startsWith("text/")) return true;
  return byExt;
}

export const ChatComposer = React.forwardRef<ChatComposerHandle, Props>(
  function ChatComposer(
    {
      disabled,
      busy,
      onSend,
      provider,
      onProviderChange,
      onUploadDoc,
      docUploading,
      attachedDocuments,
      documentsLoading,
    },
    ref
  ) {
    const [text, setText] = React.useState("");
    const [images, setImages] = React.useState<{ id: string; url: string }[]>([]);
    const fileRef = React.useRef<HTMLInputElement>(null);
    const docRef = React.useRef<HTMLInputElement>(null);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    React.useLayoutEffect(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.style.height = "0px";
      const maxPx = Math.min(typeof window !== "undefined" ? window.innerHeight * 0.38 : 400, 14 * 16);
      el.style.height = `${Math.min(el.scrollHeight, maxPx)}px`;
    }, [text]);

    const hasText = text.trim().length > 0;
    const hasImages = images.length > 0;
    const canSend = !disabled && !busy && (hasText || hasImages);

    function appendImageFromFile(file: File) {
      const reader = new FileReader();
      reader.onload = () => {
        const r = reader.result as string;
        setImages((prev) =>
          [...prev, { id: crypto.randomUUID(), url: r }].slice(-6)
        );
      };
      reader.readAsDataURL(file);
    }

    function ingestFiles(files: File[]) {
      if (disabled || busy || !files.length) return;
      for (const file of files) {
        if (file.type.startsWith("image/")) {
          appendImageFromFile(file);
        } else if (isLikelyDocFile(file)) {
          void onUploadDoc(file);
        }
      }
    }

    React.useImperativeHandle(ref, () => ({
      ingestFiles,
    }));

    function addFiles(files: FileList | null) {
      if (!files?.length) return;
      ingestFiles(Array.from(files));
    }

    function removeImage(id: string) {
      setImages((prev) => prev.filter((img) => img.id !== id));
    }

    function onPaste(e: React.ClipboardEvent) {
      const items = e.clipboardData?.files;
      if (items?.length) addFiles(items);
    }

    function submit() {
      if (!canSend) return;
      onSend({
        content: text.trim(),
        imageUrls: images.map((i) => i.url),
      });
      setText("");
      setImages([]);
    }

    const showFilesBar =
      documentsLoading || attachedDocuments.length > 0 || docUploading;

    const surfaceDisabled = !!disabled || !!busy;

    return (
      <div className="relative border-t border-zinc-200/80 bg-gradient-to-t from-zinc-100/95 via-zinc-50/90 to-transparent px-4 pb-5 pt-3 dark:border-zinc-800/80 dark:from-zinc-950 dark:via-zinc-950/95 dark:to-transparent">
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          {showFilesBar && (
            <div className="flex max-w-full items-center gap-2 rounded-2xl border border-zinc-200/70 bg-white/80 px-3 py-2 shadow-sm backdrop-blur-sm dark:border-zinc-700/80 dark:bg-zinc-900/70">
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Context
              </span>
              <div
                className={cn(
                  "scrollbar-none flex min-h-8 flex-1 items-center gap-2 overflow-x-auto overflow-y-hidden"
                )}
              >
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
          )}

          {hasImages && (
            <div className="scrollbar-none flex max-w-full items-center gap-2.5 overflow-x-auto overflow-y-hidden pb-0.5">
              {images.map((img) => (
                <div key={img.id} className="relative shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt=""
                    className="h-16 w-16 rounded-xl object-cover ring-1 ring-black/5 dark:ring-white/10"
                  />
                  <button
                    type="button"
                    className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-md dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                    aria-label="Remove image"
                    onClick={() => removeImage(img.id)}
                    disabled={disabled || busy}
                  >
                    <X className="size-3" strokeWidth={2.5} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 px-1 text-[11px] text-zinc-500 dark:text-zinc-400">
            <label className="flex cursor-pointer items-center gap-2">
              <span className="font-medium text-zinc-600 dark:text-zinc-300">Model</span>
              <select
                value={provider}
                onChange={(e) => onProviderChange(e.target.value as LlmProvider)}
                disabled={surfaceDisabled}
                className={cn(
                  "rounded-lg border border-zinc-200/90 bg-white/90 py-1.5 pl-2.5 pr-8 text-xs font-medium text-zinc-800 shadow-sm outline-none transition-colors hover:border-zinc-300 focus-visible:ring-2 focus-visible:ring-violet-500/25 dark:border-zinc-600 dark:bg-zinc-900/90 dark:text-zinc-100 dark:hover:border-zinc-500",
                  surfaceDisabled && "cursor-not-allowed opacity-50"
                )}
              >
                <option value="openai">OpenAI</option>
                <option value="gemini">Gemini</option>
              </select>
            </label>
            <span className="hidden text-zinc-400 sm:inline dark:text-zinc-500">
              Enter to send · Shift+Enter new line
            </span>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <input
            ref={docRef}
            type="file"
            accept=".txt,.md,.csv,.json,text/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUploadDoc(f);
              e.target.value = "";
            }}
          />

          <div
            className={cn(
              "flex min-h-[3.25rem] items-end gap-1 rounded-[1.35rem] border border-zinc-200/90 bg-white pl-2 pr-1.5 shadow-md shadow-zinc-900/5 transition-[box-shadow,border-color] dark:border-zinc-700/90 dark:bg-zinc-900/80 dark:shadow-none",
              !surfaceDisabled &&
                "focus-within:border-violet-300/90 focus-within:shadow-lg focus-within:shadow-violet-500/10 focus-within:ring-2 focus-within:ring-violet-500/15 dark:focus-within:border-violet-600/50 dark:focus-within:ring-violet-400/10",
              surfaceDisabled && "opacity-60"
            )}
          >
            <div className="flex shrink-0 items-center gap-0.5 self-end pb-1.5">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-9 rounded-xl text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                aria-label="Attach image"
                disabled={surfaceDisabled}
                onClick={() => fileRef.current?.click()}
              >
                <ImagePlus className="size-[1.15rem]" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-9 rounded-xl text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                aria-label="Upload document"
                disabled={surfaceDisabled || docUploading}
                onClick={() => docRef.current?.click()}
              >
                <FileUp className="size-[1.15rem]" />
              </Button>
            </div>

            <Textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onPaste={onPaste}
              placeholder={
                disabled
                  ? "Select a chat to start…"
                  : busy
                    ? "Reply in progress…"
                    : "Ask anything…"
              }
              disabled={surfaceDisabled}
              rows={1}
              className="max-h-[min(40vh,14rem)] min-h-[2.75rem] flex-1 resize-none border-0 bg-transparent py-3 pr-1 text-[15px] leading-[1.45] text-zinc-900 placeholder:text-zinc-400/90 shadow-none focus-visible:ring-0 dark:text-zinc-50 dark:placeholder:text-zinc-500"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
            />

            <div className="shrink-0 self-end pb-1.5">
              <Button
                type="button"
                size="icon"
                disabled={!canSend}
                onClick={submit}
                aria-label="Send"
                className={cn(
                  "size-10 rounded-full shadow-sm transition-all",
                  canSend
                    ? "bg-violet-600 text-white hover:bg-violet-500 dark:bg-violet-600 dark:hover:bg-violet-500"
                    : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                )}
              >
                {busy ? (
                  <Loader2 className="size-[1.15rem] animate-spin" />
                ) : (
                  <Send className="size-[1.15rem] translate-x-px" />
                )}
              </Button>
            </div>
          </div>
        </div>

      </div>
    );
  }
);
