import { useEmployers } from '../hooks/useAgents';
import EmployerGrid from '../components/jobs/EmployerGrid';
import ScrollReveal from '../components/shared/ScrollReveal';

export default function JobsPage() {
  const employers = useEmployers();

  return (
    <div className="pt-16 px-4 pb-12 max-w-7xl mx-auto">
      <div className="py-8">
        <h1 className="text-3xl text-[var(--color-text)] font-bold">Job Board</h1>
        <p className="text-[var(--color-text-muted)] mt-1">
          Looking for Workers — {employers.length} employer{employers.length !== 1 ? 's' : ''} hiring
        </p>
      </div>

      <ScrollReveal>
        <EmployerGrid employers={employers} />
      </ScrollReveal>
    </div>
  );
}
