"use client";

import { useState } from "react";

type CopyLinkButtonProps = {
  link: string;
  className?: string;
  title?: string;
};

export function CopyLinkButton({
  link,
  className,
  title = "Copy link to clipboard",
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void onCopy()}
      className={className}
      title={title}
    >
      {copied ? "Copied" : "Copy Link"}
    </button>
  );
}

type RefreshPageButtonProps = {
  className?: string;
};

export function RefreshPageButton({ className }: RefreshPageButtonProps) {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className={className}
    >
      Refresh Page
    </button>
  );
}