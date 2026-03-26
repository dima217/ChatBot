"use client";

import * as React from "react";
import type { ChatDoc, LlmProvider } from "@/lib/api";
import { ChatComposerContextBar } from "./chat-composer-context-bar";
import { ChatComposerImageStrip } from "./chat-composer-image-strip";
import { ChatComposerInputArea } from "./chat-composer-input-area";
import { useChatComposerState } from "../../hooks/use-chat-composer-state";

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
    const c = useChatComposerState({ disabled, busy, onSend, onUploadDoc });

    React.useImperativeHandle(ref, () => ({
      ingestFiles: c.ingestFiles,
    }));

    const showFilesBar = Boolean(
      documentsLoading || attachedDocuments.length > 0 || docUploading
    );
    const placeholder = disabled
      ? "Select a chat to start…"
      : busy
        ? "Reply in progress…"
        : "Ask anything…";

    return (
      <div className="relative border-t border-zinc-200/80 bg-gradient-to-t from-zinc-100/95 via-zinc-50/90 to-transparent px-2 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-2 sm:px-4 sm:pb-5 sm:pt-3 dark:border-zinc-800/80 dark:from-zinc-950 dark:via-zinc-950/95 dark:to-transparent">
        <div className="mx-auto flex max-w-3xl flex-col gap-2 sm:gap-3">
          <ChatComposerContextBar
            show={showFilesBar}
            documentsLoading={documentsLoading}
            attachedDocuments={attachedDocuments}
            docUploading={docUploading}
          />
          <ChatComposerImageStrip
            images={c.images}
            disabled={disabled}
            busy={busy}
            onRemove={c.removeImage}
          />
          <ChatComposerInputArea
            provider={provider}
            onProviderChange={onProviderChange}
            surfaceDisabled={c.surfaceDisabled}
            text={c.text}
            setText={c.setText}
            onPaste={c.onPaste}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                c.submit();
              }
            }}
            placeholder={placeholder}
            textareaRef={c.textareaRef}
            fileRef={c.fileRef}
            docRef={c.docRef}
            onImageInputChange={c.addFiles}
            onDocInputChange={(f) => {
              if (f) onUploadDoc(f);
            }}
            docUploading={docUploading}
            canSend={c.canSend}
            busy={busy}
            onSubmit={c.submit}
          />
        </div>
      </div>
    );
  }
);
