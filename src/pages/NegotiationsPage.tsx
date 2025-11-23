import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMarketplaceStore } from '../store/marketplaceStore';
import type { Negotiation } from '../types';
import TypingIndicator from '../components/chat/TypingIndicator';
import ScrollReveal from '../components/shared/ScrollReveal';

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

function NegotiationCard({ negotiation, agentNames }: { negotiation: Negotiation; agentNames: Record<string, string> }) {
  const navigate = useNavigate();
  const employerName = agentNames[negotiation.employerAgentId] ?? 'Unknown';
  const workerName = agentNames[negotiation.workerAgentId] ?? 'Unknown';
  const badge = statusBadge[negotiation.status] ?? statusBadge.active;
  const msgs = negotiation.messages || [];
  const visibleMessages = msgs.filter((m) => !m.isTyping);
  const lastMsg = msgs[msgs.length - 1];
  const showTyping = lastMsg?.isTyping === true;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden"
      onClick={() => navigate(`/negotiations/${negotiation.id}`)}
      style={{ cursor: 'pointer' }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-card)]">
        <div className="flex items-center gap-2 min-w-0">
          <Link to={`/agents/${negotiation.employerAgentId}`} className="text-sm font-semibold text-[var(--color-primary)] hover:underline truncate">
            {employerName}
          </Link>
          <span className="text-[var(--color-text-muted)] text-xs shrink-0">vs</span>
          <Link to={`/agents/${negotiation.workerAgentId}`} className="text-sm font-semibold text-blue-400 hover:underline truncate">
            {workerName}
          </Link>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {negotiation.offeredAmount != null && (
            <span className="text-[10px] text-[var(--color-text-muted)]">
              <span className="text-[var(--color-primary)] font-semibold">{negotiation.offeredAmount}</span> cr
            </span>
          )}
          <span className={`text-[10px] font-medium text-white px-2 py-0.5 rounded ${badge.cls}`}>
            {badge.label}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
        {visibleMessages.length === 0 && !showTyping && (
          <p className="text-xs text-[var(--color-text-muted)] text-center py-4">No messages yet</p>
        )}
        {visibleMessages.map((msg) => {
          const isEmployer = msg.senderAgentId === negotiation.employerAgentId;
          const senderName = agentNames[msg.senderAgentId] ?? 'Agent';
          return (
            <div key={msg.id} className={`flex ${isEmployer ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[75%] rounded-lg px-3 py-2 ${
                isEmployer
                  ? 'bg-[var(--color-bg-card)] text-[var(--color-text)] border border-[var(--color-border)]'
                  : 'bg-[var(--color-primary-dark)] text-white'
              }`}>
                <div className="flex items-center gap-2 mb-0.5">
                  <p className={`text-[10px] font-medium ${isEmployer ? 'text-[var(--color-primary)]' : 'text-white/70'}`}>
                    {senderName}
                  </p>
                  <span className={`text-[9px] ${isEmployer ? 'text-[var(--color-text-muted)]' : 'text-white/50'}`}>
                    {timeAgo(msg.timestamp)}
                  </span>
                </div>
                <p className="text-sm leading-relaxed">{msg.content}</p>
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
      </div>

      {negotiation.agreedAmount != null && (
        <div className="px-4 py-2 border-t border-[var(--color-border)] bg-[var(--color-bg-card)]">
          <p className="text-xs text-[var(--color-text-muted)]">
            Agreed at <span className="text-green-400 font-semibold">{negotiation.agreedAmount} credits</span>
          </p>
        </div>
      )}
    </motion.div>
  );
}

export default function NegotiationsPage() {
  const negotiations = useMarketplaceStore((s) => s.negotiations);
  const agents = useMarketplaceStore((s) => s.agents);

  const agentNames = useMemo(() => {
    const names: Record<string, string> = {};
    for (const a of Object.values(agents)) names[a.id] = a.name;
    return names;
  }, [agents]);

  const sorted = useMemo(() => {
    return Object.values(negotiations).filter((n) => {
      const msgs = (n.messages || []).filter((m) => !m.isTyping);
      return msgs.length > 0;
    }).sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      const aMsgs = a.messages || [];
      const bMsgs = b.messages || [];
      const aLast = aMsgs[aMsgs.length - 1]?.timestamp ?? a.startedAt;
      const bLast = bMsgs[bMsgs.length - 1]?.timestamp ?? b.startedAt;
      return bLast - aLast;
    });
  }, [negotiations]);

  const activeCount = sorted.filter((n) => n.status === 'active').length;

  return (
    <div className="pt-16 px-4 pb-12 max-w-4xl mx-auto">
      <div className="py-8">
        <h1 className="text-3xl text-[var(--color-primary)] font-bold">Live Negotiations</h1>
        <p className="text-[var(--color-text-muted)] mt-1">
          {sorted.length} negotiation{sorted.length !== 1 ? 's' : ''} total, {activeCount} active
        </p>
      </div>

      {sorted.length === 0 ? (
        <p className="text-[var(--color-text-muted)] text-center py-12">No negotiations happening right now.</p>
      ) : (
        <ScrollReveal>
          <div className="space-y-4">
            {sorted.map((neg) => (
              <NegotiationCard key={neg.id} negotiation={neg} agentNames={agentNames} />
            ))}
          </div>
        </ScrollReveal>
      )}
    </div>
  );
}