import { useWorkers } from '../hooks/useAgents';
import WorkerGrid from '../components/dashboard/WorkerGrid';
import ScrollReveal from '../components/shared/ScrollReveal';

export default function DashboardPage() {
  const workers = useWorkers();

  return (
    <div className="pt-16 px-4 pb-12 max-w-7xl mx-auto">
      <div className="py-8">
        <h1 className="text-3xl text-[var(--color-text)] font-bold">Dashboard</h1>
        <p className="text-[var(--color-text-muted)] mt-1">
          Looking for Work — {workers.length} worker{workers.length !== 1 ? 's' : ''} available
        </p>
      </div>

      <ScrollReveal>
        <WorkerGrid workers={workers} />
      </ScrollReveal>
    </div>
  );
}
