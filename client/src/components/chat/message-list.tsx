"use client";

import * as React from "react";
import { Bot, Check, Copy, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { MarkdownContent } from "@/components/chat/markdown-content";
import { cn } from "@/lib/utils";
import type { Message } from "@/lib/api";

type Props = {
  messages: Message[] | undefined;
  loading: boolean;
  streamingText: string;
  streaming?: boolean;
};

export function MessageList({
  messages,
  loading,
  streamingText,
  streaming,
}: Props) {
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText, streaming]);

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-6">
        <Skeleton className="ml-10 h-16 w-[70%] rounded-2xl" />
        <Skeleton className="mr-10 h-20 w-[75%] self-end rounded-2xl" />
        <Skeleton className="ml-10 h-14 w-[60%] rounded-2xl" />
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-3 py-6 sm:gap-5 sm:px-6 sm:py-8">
        {(!messages || messages.length === 0) && !streamingText && (
          <div className="flex flex-col items-center justify-center gap-3 px-2 py-12 text-center sm:gap-4 sm:py-24">
            <div className="flex size-[3.75rem] items-center justify-center rounded-3xl bg-gradient-to-br from-violet-100 to-violet-50 shadow-inner dark:from-violet-950/60 dark:to-zinc-900">
              <Bot className="size-9 text-violet-600 dark:text-violet-300" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                How can I help?
              </h2>
              <p className="max-w-[26rem] text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                Type below, add images or documents, and get streamed Markdown answers.
              </p>
            </div>
          </div>
        )}
        {messages?.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {(streaming || streamingText) && (
          <div className="flex gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-600/15 text-violet-700 dark:text-violet-300">
              <Bot className="size-4" />
            </div>
            <div
              className={cn(
                "relative min-w-0 flex-1 rounded-2xl border border-zinc-200/90 bg-white px-4 py-3.5 text-sm shadow-sm dark:border-zinc-800/90 dark:bg-zinc-900/60",
                streamingText.trim().length > 0 && "pr-11"
              )}
            >
              {streamingText.trim().length > 0 && (
                <CopyReplyButton
                  text={streamingText}
                  className="absolute right-2 top-2"
                />
              )}
              <MarkdownContent>{streamingText}</MarkdownContent>
              {streaming && (
                <span className="ml-0.5 inline-block h-4 w-1 animate-pulse rounded-sm bg-violet-500 align-middle" />
              )}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
    </ScrollArea>
  );
}

function CopyReplyButton({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("size-8 shrink-0 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100", className)}
      aria-label={copied ? "Copied" : "Copy reply"}
      onClick={() => void copy()}
    >
      {copied ? (
        <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <Copy className="size-4" />
      )}
    </Button>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div
      className={cn("flex gap-3", isUser && "flex-row-reverse")}
    >
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900"
            : "bg-violet-600/15 text-violet-700 dark:text-violet-300"
        )}
      >
        {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
      </div>
      <div
        className={cn(
          "relative min-w-0 max-w-full break-words overflow-hidden rounded-2xl border px-3 py-3 text-[0.9375rem] shadow-sm",
          isUser
            ? "border-zinc-900/10 bg-zinc-900 text-zinc-50 dark:border-zinc-100/10 dark:bg-zinc-100 dark:text-zinc-900"
            : "border-zinc-200/90 bg-white dark:border-zinc-800/90 dark:bg-zinc-900/60",
          !isUser && message.content.trim().length > 0 && "pr-11"
        )}
      >
        {!isUser && message.content.trim().length > 0 && (
          <CopyReplyButton
            text={message.content}
            className="absolute right-1 top-1"
          />
        )}
        {message.image_urls?.length ? (
          <div className="mb-2 flex flex-wrap gap-2">
            {message.image_urls.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={url}
                alt=""
                className="max-h-48 max-w-full rounded-lg object-contain"
              />
            ))}
          </div>
        ) : null}
        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <MarkdownContent>{message.content}</MarkdownContent>
        )}
        {message.provider && !isUser && (
          <p className="mt-2 text-[10px] uppercase tracking-wider text-zinc-400">
            {message.provider}
          </p>
        )}
      </div>
    </div>
  );
}
