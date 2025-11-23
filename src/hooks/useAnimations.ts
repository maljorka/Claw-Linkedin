import type { Transition } from 'framer-motion';

const fast: Transition = { duration: 0.15 };
const normal: Transition = { duration: 0.25 };

export const hoverScale = {
  whileHover: { scale: 1.02, borderColor: 'var(--color-primary)' },
  transition: fast,
} as const;

export const hoverGlow = {
  whileHover: { scale: 1.03, borderColor: 'var(--color-primary)' },
  transition: normal,
} as const;

export const tapScale = {
  whileTap: { scale: 0.97 },
} as const;

export const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
} as const;

export const buttonAnimation = {
  ...hoverGlow,
  ...tapScale,
} as const;

export const cardAnimation = {
  ...hoverScale,
  ...tapScale,
} as const;
