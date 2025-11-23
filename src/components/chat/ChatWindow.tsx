import { useEffect, useRef } from 'react';
import type { Negotiation } from '../../types';
import TypingIndicator from './TypingIndicator';

const statusBadge: Record<string, { label: string; cls: string }> = {
  active: { label: 'Active', cls: 'bg-green-600/80' },
  agreed: { label: 'Agreed', cls: 'bg-blue-600/80' },
  rejected: { label: 'Rejected', cls: 'bg-red-600/80' },
};

function NegotiationThread({
  negotiation,
  agentId,
  agentNames,
}: {
  negotiation: Negotiation;
  agentId: string;
  agentNames: Record<string, string>;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const visibleMessages = negotiation.messages.filter((m) => !m.isTyping);
  const lastMsg = negotiation.messages[negotiation.messages.length - 1];
  const showTyping = lastMsg?.isTyping === true;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [negotiation.messages.length]);

  const otherAgentId =
    negotiation.employerAgentId === agentId
      ? negotiation.workerAgentId
      : negotiation.employerAgentId;
  const otherName = agentNames[otherAgentId] ?? 'Unknown Agent';
  const badge = statusBadge[negotiation.status] ?? statusBadge.active;

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)] bg-[var(--color-bg-card)]">
        <span className="text-sm font-medium text-[var(--color-text)] truncate">
          Chat with {otherName}
        </span>
        <span className={`text-[10px] font-medium text-white px-2 py-0.5 rounded ${badge.cls}`}>
          {badge.label}
        </span>
      </div>

      <div className="max-h-60 overflow-y-auto p-3 space-y-2">
        {visibleMessages.length === 0 && !showTyping && (
          <p className="text-xs text-[var(--color-text-muted)] text-center py-4">
            No messages yet
          </p>
        )}
        {visibleMessages.map((msg) => {
          const isSelf = msg.senderAgentId === agentId;
          return (
            <div key={msg.id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                  isSelf
                    ? 'bg-[var(--color-primary-dark)] text-white'
                    : 'bg-[var(--color-bg-card)] text-[var(--color-text)] border border-[var(--color-border)]'
                }`}
              >
                <p className="text-[10px] font-medium mb-0.5 opacity-70">
                  {agentNames[msg.senderAgentId] ?? 'Agent'}
                </p>
                <p className="leading-relaxed">{msg.content}</p>
              </div>
            </div>
          );
        })}
        {showTyping && (
          <div className="flex justify-start">
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg px-2 py-1">
              <TypingIndicator />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

export default function ChatWindow({
  negotiations,
  agentId,
  agentNames,
}: {
  negotiations: Negotiation[];
  agentId: string;
  agentNames: Record<string, string>;
}) {
  if (negotiations.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">
        Negotiations
      </p>
      {negotiations.map((neg) => (
        <NegotiationThread
          key={neg.id}
          negotiation={neg}
          agentId={agentId}
          agentNames={agentNames}
        />
      ))}
    </div>
  );
}
