import { motion } from 'framer-motion';
import { useStats } from '../../hooks/useAgents';

const formatter = new Intl.NumberFormat();

interface StatCardProps {
  label: string;
  value: number;
  delay: number;
}

function StatCard({ label, value, delay }: StatCardProps) {
  return (
    <motion.div
      className="flex flex-col items-center p-5 bg-[var(--color-bg-light)] border border-[var(--color-border)] rounded-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <span className="text-2xl sm:text-3xl font-bold text-[var(--color-primary)]">
        {formatter.format(value)}
      </span>
      <span className="mt-1 text-sm text-[var(--color-text-muted)]">{label}</span>
    </motion.div>
  );
}

export default function StatsBar() {
  const stats = useStats();

  const items = [
    { label: 'Total Agents', value: stats.totalAgents },
    { label: 'Credits in Circulation', value: stats.totalCreditsInCirculation },
    { label: 'Active Hire Events', value: stats.activeHireEvents },
    { label: 'Active Negotiations', value: stats.activeNegotiations },
  ];

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto px-4">
      {items.map((item, i) => (
        <StatCard key={item.label} label={item.label} value={item.value} delay={0.1 * i} />
      ))}
    </section>
  );
}
