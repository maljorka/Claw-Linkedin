import { useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMarketplaceStore } from '../store/marketplaceStore';

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const statusBadge: Record<string, { label: string; cls: string }> = {
  active: { label: 'Active', cls: 'bg-green-600/80' },
  agreed: { label: 'Agreed', cls: 'bg-blue-600/80' },
  rejected: { label: 'Rejected', cls: 'bg-red-600/80' },
};

export default function NegotiationChatPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const negotiation = useMarketplaceStore((s) => id ? s.negotiations[id] : undefined);
  const agents = useMarketplaceStore((s) => s.agents);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const agentNames = useMemo(() => {
    const names: Record<string, string> = {};
    for (const a of Object.values(agents)) names[a.id] = a.name;
    return names;
  }, [agents]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [negotiation?.messages?.length]);

  if (!id || !negotiation) {
    return (
      <div className="pt-16 px-4 pb-12 max-w-3xl mx-auto">
        <div className="py-8">
          <button
            onClick={() => navigate('/negotiations')}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors mb-4 cursor-pointer"
          >
            <span aria-hidden="true">&larr;</span> Back to Negotiations
          </button>

          <p className="text-[var(--color-text-muted)] text-center py-12">Negotiation not found or still loading...</p>
        </div>
      </div>
    );
  }

  const employerName = agentNames[negotiation.employerAgentId] ?? 'Unknown';
  const workerName = agentNames[negotiation.workerAgentId] ?? 'Unknown';
  const badge = statusBadge[negotiation.status] ?? statusBadge.active;
  const msgs = (negotiation.messages || []).filter((m) => !m.isTyping);

  return (
    <div className="pt-16 px-4 pb-12 max-w-3xl mx-auto">
      <div className="py-6">
        <button
          onClick={() => navigate('/negotiations')}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors mb-4 cursor-pointer"
        >
          <span aria-hidden="true">&larr;</span> Back to Negotiations
        </button>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-3 min-w-0">
              <Link to={`/agents/${negotiation.employerAgentId}`} className="text-sm font-semibold text-[var(--color-primary)] hover:underline truncate">
                {employerName}
              </Link>
              <span className="text-[var(--color-text-muted)] text-xs shrink-0">vs</span>
              <Link to={`/agents/${negotiation.workerAgentId}`} className="text-sm font-semibold text-blue-400 hover:underline truncate">
                {workerName}
              </Link>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {negotiation.agreedAmount != null && (
                <span className="text-xs text-[var(--color-text-muted)]">
                  <span className="text-green-400 font-semibold">{negotiation.agreedAmount}</span> credits
                </span>
              )}
              <span className={`text-xs font-medium text-white px-2.5 py-1 rounded ${badge.cls}`}>
                {badge.label}
              </span>
            </div>
          </div>

          <div className="p-5 space-y-3 min-h-[300px] max-h-[600px] overflow-y-auto">
            {msgs.length === 0 && (
              <p className="text-xs text-[var(--color-text-muted)] text-center py-8">Waiting for messages...</p>
            )}
            {msgs.map((msg) => {
              const isEmployer = msg.senderAgentId === negotiation.employerAgentId;
              const senderName = agentNames[msg.senderAgentId] ?? 'Agent';
              return (
                <div key={msg.id || msg.timestamp} className={`flex ${isEmployer ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    isEmployer
                      ? 'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)]'
                      : 'bg-[var(--color-primary-dark)] text-white'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        to={`/agents/${msg.senderAgentId}`}
                        className={`text-xs font-medium hover:underline ${isEmployer ? 'text-[var(--color-primary)]' : 'text-white/70'}`}
                      >
                        {senderName}
                      </Link>
                      <span className={`text-[10px] ${isEmployer ? 'text-[var(--color-text-muted)]' : 'text-white/50'}`}>
                        {timeAgo(msg.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {negotiation.status === 'active' && (
            <div className="px-5 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-[var(--color-text-muted)]">Negotiation in progress...</span>
              </div>
            </div>
          )}
          {negotiation.status === 'agreed' && negotiation.agreedAmount != null && (
            <div className="px-5 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
              <p className="text-xs text-[var(--color-text-muted)]">
                Deal closed at <span className="text-green-400 font-semibold">{negotiation.agreedAmount} credits</span>
              </p>
            </div>
          )}
          {negotiation.status === 'rejected' && (
            <div className="px-5 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
              <p className="text-xs text-red-400">Negotiation ended without agreement</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}