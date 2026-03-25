"use client";

import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

const components: Components = {
  p: ({ className, ...props }) => (
    <p className={cn("mb-3 text-[0.9375rem] leading-relaxed last:mb-0", className)} {...props} />
  ),
  h1: ({ className, ...props }) => (
    <h1
      className={cn("mt-4 mb-2 text-lg font-bold text-zinc-900 first:mt-0 dark:text-zinc-50", className)}
      {...props}
    />
  ),
  h2: ({ className, ...props }) => (
    <h2
      className={cn("mt-4 mb-2 text-base font-bold text-zinc-900 first:mt-0 dark:text-zinc-50", className)}
      {...props}
    />
  ),
  h3: ({ className, ...props }) => (
    <h3
      className={cn("mt-3 mb-1.5 text-sm font-semibold text-zinc-900 first:mt-0 dark:text-zinc-100", className)}
      {...props}
    />
  ),
  h4: ({ className, ...props }) => (
    <h4
      className={cn("mt-3 mb-1 text-sm font-semibold text-zinc-800 dark:text-zinc-200", className)}
      {...props}
    />
  ),
  ul: ({ className, ...props }) => (
    <ul
      className={cn("mb-3 list-disc space-y-1 pl-5 text-[0.9375rem] last:mb-0", className)}
      {...props}
    />
  ),
  ol: ({ className, ...props }) => (
    <ol
      className={cn("mb-3 list-decimal space-y-1 pl-5 text-[0.9375rem] last:mb-0", className)}
      {...props}
    />
  ),
  li: ({ className, ...props }) => (
    <li className={cn("leading-relaxed", className)} {...props} />
  ),
  strong: ({ className, ...props }) => (
    <strong
      className={cn("font-semibold text-zinc-900 dark:text-zinc-100", className)}
      {...props}
    />
  ),
  em: ({ className, ...props }) => (
    <em className={cn("italic text-zinc-800 dark:text-zinc-200", className)} {...props} />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn(
        "mb-3 border-l-4 border-violet-300 pl-4 text-zinc-600 italic dark:border-violet-600 dark:text-zinc-400",
        className
      )}
      {...props}
    />
  ),
  hr: ({ className, ...props }) => (
    <hr className={cn("my-4 border-zinc-200 dark:border-zinc-700", className)} {...props} />
  ),
  a: ({ className, href, ...props }) => (
    <a
      href={href}
      className={cn(
        "font-medium text-violet-600 underline decoration-violet-400/70 underline-offset-2 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300",
        className
      )}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = /language-/.test(String(className ?? ""));
    if (isBlock) {
      return (
        <code className={cn("font-mono text-[0.8125rem] text-zinc-900 dark:text-zinc-100", className)} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code
        className={cn(
          "rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[0.8125em] text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100",
          className
        )}
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ className, ...props }) => (
    <pre
      className={cn(
        "mb-3 overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 text-sm last:mb-0 dark:border-zinc-700 dark:bg-zinc-900/90",
        className
      )}
      {...props}
    />
  ),
  table: ({ className, ...props }) => (
    <div className="mb-3 overflow-x-auto last:mb-0">
      <table className={cn("w-full min-w-[16rem] border-collapse text-left text-sm", className)} {...props} />
    </div>
  ),
  thead: ({ className, ...props }) => (
    <thead className={cn("border-b border-zinc-200 dark:border-zinc-600", className)} {...props} />
  ),
  th: ({ className, ...props }) => (
    <th className={cn("border border-zinc-200 bg-zinc-100 px-2.5 py-2 font-semibold dark:border-zinc-700 dark:bg-zinc-800", className)} {...props} />
  ),
  td: ({ className, ...props }) => (
    <td className={cn("border border-zinc-200 px-2.5 py-1.5 dark:border-zinc-700", className)} {...props} />
  ),
};

type Props = {
  children: string;
  className?: string;
};

export function MarkdownContent({ children, className }: Props) {
  if (!children.trim()) {
    return null;
  }
  return (
    <div
      className={cn(
        "min-w-0 text-zinc-800 dark:text-zinc-200 [&>*:first-child]:mt-0",
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
