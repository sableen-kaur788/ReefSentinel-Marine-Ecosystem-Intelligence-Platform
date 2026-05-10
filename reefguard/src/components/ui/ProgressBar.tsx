import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface ProgressBarProps {
  progress: number;
  className?: string;
  barClassName?: string;
  height?: number;
  animated?: boolean;
  color?: string;
}

export function ProgressBar({
  progress,
  className,
  barClassName,
  height = 8,
  animated = true,
  color,
}: ProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div
      className={cn('w-full bg-slate-800 rounded-full overflow-hidden', className)}
      style={{ height }}
    >
      <motion.div
        className={cn('h-full rounded-full', barClassName)}
        style={{
          background: color || 'linear-gradient(90deg, #00d4ff, #00c9a7)',
        }}
        initial={{ width: 0 }}
        animate={{ width: `${clampedProgress}%` }}
        transition={animated ? { duration: 1, ease: 'easeOut' } : { duration: 0 }}
      />
    </div>
  );
}
