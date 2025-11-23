import { useCallback, useRef, useState } from 'react';

export default function WalletAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);
  const textRef = useRef<HTMLSpanElement>(null);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      if (textRef.current) {
        const range = document.createRange();
        range.selectNodeContents(textRef.current);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  }, [address]);

  return (
    <div className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
      <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
        Wallet Address
      </p>
      <div className="flex items-center gap-3">
        <span
          ref={textRef}
          className="font-mono text-sm text-[var(--color-text)] break-all flex-1 select-all"
        >
          {address}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded bg-[var(--color-primary-dark)] text-white/90 hover:bg-[var(--color-primary)] transition-colors duration-150 cursor-pointer"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
