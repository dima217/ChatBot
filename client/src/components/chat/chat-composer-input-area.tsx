"use client";

import { FileUp, ImagePlus, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { LlmProvider } from "@/lib/api";

type Props = {
  provider: LlmProvider;
  onProviderChange: (p: LlmProvider) => void;
  surfaceDisabled: boolean;
  text: string;
  setText: (v: string) => void;
  onPaste: (e: React.ClipboardEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  placeholder: string;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  fileRef: React.RefObject<HTMLInputElement | null>;
  docRef: React.RefObject<HTMLInputElement | null>;
  onImageInputChange: (files: FileList | null) => void;
  onDocInputChange: (file: File | null) => void;
  docUploading?: boolean;
  canSend: boolean;
  busy?: boolean;
  onSubmit: () => void;
};

export function ChatComposerInputArea(props: Props) {
  const {
    provider,
    onProviderChange,
    surfaceDisabled,
    text,
    setText,
    onPaste,
    onKeyDown,
    placeholder,
    textareaRef,
    fileRef,
    docRef,
    onImageInputChange,
    onDocInputChange,
    docUploading,
    canSend,
    busy,
    onSubmit,
  } = props;

  return (
    <>
      <div className="flex flex-col gap-2 px-0.5 text-[11px] text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:gap-3 dark:text-zinc-400">
        <label className="flex min-w-0 cursor-pointer flex-wrap items-center gap-2">
          <span className="shrink-0 font-medium text-zinc-600 dark:text-zinc-300">
            Model
          </span>
          <select
            value={provider}
            onChange={(e) => onProviderChange(e.target.value as LlmProvider)}
            disabled={surfaceDisabled}
            className={cn(
              "min-w-0 max-w-full flex-1 rounded-lg border border-zinc-200/90 bg-white/90 py-1.5 pl-2.5 pr-8 text-xs font-medium text-zinc-800 shadow-sm outline-none transition-colors hover:border-zinc-300 focus-visible:ring-2 focus-visible:ring-violet-500/25 dark:border-zinc-600 dark:bg-zinc-900/90 dark:text-zinc-100 dark:hover:border-zinc-500 sm:max-w-[11rem] sm:flex-none",
              surfaceDisabled && "cursor-not-allowed opacity-50"
            )}
          >
            <option value="openai">OpenAI</option>
            <option value="gemini">Gemini</option>
          </select>
        </label>
        <span className="text-[10px] text-zinc-400 sm:text-[11px] dark:text-zinc-500">
          <span className="sm:hidden">Enter — send · Shift+Enter — newline</span>
          <span className="hidden sm:inline">Enter to send · Shift+Enter new line</span>
        </span>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          onImageInputChange(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={docRef}
        type="file"
        accept=".txt,.md,.csv,.json,text/*"
        className="hidden"
        onChange={(e) => {
          onDocInputChange(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />

      <div
        className={cn(
          "flex min-h-[3rem] items-end gap-0.5 rounded-2xl border border-zinc-200/90 bg-white pl-1.5 pr-1 shadow-md shadow-zinc-900/5 transition-[box-shadow,border-color] sm:min-h-[3.25rem] sm:gap-1 sm:rounded-[1.35rem] sm:pl-2 sm:pr-1.5 dark:border-zinc-700/90 dark:bg-zinc-900/80 dark:shadow-none",
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
          placeholder={placeholder}
          disabled={surfaceDisabled}
          rows={1}
          className="max-h-[min(40vh,14rem)] min-h-[2.75rem] flex-1 resize-none border-0 bg-transparent py-3 pr-1 text-[15px] leading-[1.45] text-zinc-900 placeholder:text-zinc-400/90 shadow-none focus-visible:ring-0 dark:text-zinc-50 dark:placeholder:text-zinc-500"
          onKeyDown={onKeyDown}
        />

        <div className="shrink-0 self-end pb-1.5">
          <Button
            type="button"
            size="icon"
            disabled={!canSend}
            onClick={onSubmit}
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
    </>
  );
}
