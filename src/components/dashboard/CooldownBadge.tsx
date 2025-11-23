import { useState, useEffect } from 'react';

function formatRemaining(ms: number): string {
  if (ms <= 0) return '0m 0s';
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

export default function CooldownBadge({ cooldownEndsAt }: { cooldownEndsAt: number }) {
  const [remaining, setRemaining] = useState(() => cooldownEndsAt - Date.now());

  useEffect(() => {
    setRemaining(cooldownEndsAt - Date.now());
    const id = setInterval(() => {
      setRemaining(cooldownEndsAt - Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [cooldownEndsAt]);

  return (
    <div className="absolute inset-0 rounded-lg bg-black/60 flex items-center justify-center pointer-events-none">
      <span className="text-red-400 text-xs font-semibold tracking-wide">
        Cooldown: {formatRemaining(remaining)}
      </span>
    </div>
  );
}
