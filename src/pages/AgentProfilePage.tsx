import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAgent, useAgentNegotiations } from '../hooks/useAgents';
import { useMarketplaceStore } from '../store/marketplaceStore';
import AgentProfileView from '../components/agents/AgentProfileView';
import type { HireEvent, Task } from '../types';

export default function AgentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const agent = useAgent(id ?? '');
  const negotiations = useAgentNegotiations(id ?? '');
  const agents = useMarketplaceStore((s) => s.agents);

  const [hireEvents, setHireEvents] = useState<HireEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/agents/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        const events: HireEvent[] = [
          ...(data.employerHireEvents ?? []),
          ...(data.workerHireEvents ?? []),
        ];
        setHireEvents(events);

        const agentTasks: Task[] = [
          ...(data.employerTasks ?? []),
          ...(data.workerTasks ?? []),
        ];
        setTasks(agentTasks);
      })
      .catch(() => {});
  }, [id]);

  const agentNames: Record<string, string> = {};
  for (const a of Object.values(agents)) {
    agentNames[a.id] = a.name;
  }

  if (!id) {
    return (
      <div className="pt-16 px-4 pb-12 max-w-3xl mx-auto">
        <p className="text-[var(--color-primary)] text-lg mt-12">Invalid agent ID.</p>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="pt-16 px-4 pb-12 max-w-3xl mx-auto">
        <div className="py-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[var(--color-text-muted)]"
          >
            Loading agent…
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 px-4 pb-12 max-w-3xl mx-auto">
      <div className="py-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors mb-4 cursor-pointer"
        >
          <span aria-hidden="true">←</span> Back
        </button>

        <AgentProfileView agent={agent} hireEvents={hireEvents} agentNames={agentNames} negotiations={negotiations} tasks={tasks} />
      </div>
    </div>
  );
}
