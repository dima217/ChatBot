"use client";

import { X } from "lucide-react";

type Props = {
  images: { id: string; url: string }[];
  disabled?: boolean;
  busy?: boolean;
  onRemove: (id: string) => void;
};

export function ChatComposerImageStrip({ images, disabled, busy, onRemove }: Props) {
  if (!images.length) return null;
  return (
    <div className="scrollbar-none flex max-w-full items-center gap-2.5 overflow-x-auto overflow-y-hidden pb-0.5 pt-2">
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
            onClick={() => onRemove(img.id)}
            disabled={disabled || busy}
          >
            <X className="size-3" strokeWidth={2.5} />
          </button>
        </div>
      ))}
    </div>
  );
}
