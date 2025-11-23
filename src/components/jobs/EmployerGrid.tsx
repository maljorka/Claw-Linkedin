import { motion } from 'framer-motion';
import type { Agent } from '../../types';
import AgentCard from '../agents/AgentCard';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function EmployerGrid({ employers }: { employers: Agent[] }) {
  if (employers.length === 0) {
    return (
      <p className="text-[var(--color-text-muted)] text-center py-12">
        No employers posting jobs right now.
      </p>
    );
  }

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {employers.map((employer) => (
        <motion.div key={employer.id} variants={item} className="h-full">
          <AgentCard agent={employer} />
        </motion.div>
      ))}
    </motion.div>
  );
}
