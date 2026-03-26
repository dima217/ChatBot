"use client";

import * as React from "react";

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

type Args = {
  disabled?: boolean;
  busy?: boolean;
  onSend: (payload: { content: string; imageUrls: string[] }) => void;
  onUploadDoc: (file: File) => void;
};

export function useChatComposerState({ disabled, busy, onSend, onUploadDoc }: Args) {
  const [text, setText] = React.useState("");
  const [images, setImages] = React.useState<{ id: string; url: string }[]>([]);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const docRef = React.useRef<HTMLInputElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    const maxPx = Math.min(
      typeof window !== "undefined" ? window.innerHeight * 0.38 : 400,
      14 * 16
    );
    el.style.height = `${Math.min(el.scrollHeight, maxPx)}px`;
  }, [text]);

  const hasText = text.trim().length > 0;
  const hasImages = images.length > 0;
  const canSend = !disabled && !busy && (hasText || hasImages);
  const surfaceDisabled = !!disabled || !!busy;

  function appendImageFromFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result as string;
      setImages((prev) => [...prev, { id: crypto.randomUUID(), url: r }].slice(-6));
    };
    reader.readAsDataURL(file);
  }

  function ingestFiles(files: File[]) {
    if (disabled || busy || !files.length) return;
    for (const file of files) {
      if (file.type.startsWith("image/")) appendImageFromFile(file);
      else if (isLikelyDocFile(file)) void onUploadDoc(file);
    }
  }

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
    onSend({ content: text.trim(), imageUrls: images.map((i) => i.url) });
    setText("");
    setImages([]);
  }

  return {
    text,
    setText,
    images,
    fileRef,
    docRef,
    textareaRef,
    canSend,
    surfaceDisabled,
    ingestFiles,
    addFiles,
    removeImage,
    onPaste,
    submit,
  };
}
