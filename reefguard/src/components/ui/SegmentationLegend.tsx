import { motion } from 'framer-motion';
import type { SegmentationClass } from '../../types';

interface SegmentationLegendProps {
  classes: SegmentationClass[];
  layout?: 'horizontal' | 'vertical' | 'grid';
  showArea?: boolean;
  className?: string;
}

function formatPixels(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M px`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K px`;
  return `${Math.round(value)} px`;
}

export function SegmentationLegend({
  classes,
  layout = 'grid',
  showArea = true,
  className = '',
}: SegmentationLegendProps) {
  // Sort by percentage descending
  const sortedClasses = [...classes].sort((a, b) => b.percentage - a.percentage);

  const containerClasses = {
    horizontal: 'flex flex-wrap gap-3',
    vertical: 'flex flex-col gap-3',
    grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
  };

  return (
    <div className={`${containerClasses[layout]} ${className}`}>
      {sortedClasses.map((cls, idx) => (
        <motion.div
          key={cls.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="group"
        >
          <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/40 hover:bg-slate-800/70 hover:border-slate-600/50 transition-all duration-200">
            {/* Color indicator with glow */}
            <div
              className="w-6 h-6 rounded-lg flex-shrink-0 shadow-lg"
              style={{
                backgroundColor: cls.color,
                boxShadow: `0 0 12px ${cls.color}40, 0 0 4px ${cls.color}60`,
              }}
            />

            {/* Label info */}
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-200">
                {cls.name}
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-bold text-white">
                  {Number(cls.percentage).toFixed(1)}%
                </span>
                {showArea && (
                  <span className="text-xs text-slate-500">
                    ({formatPixels(cls.area)})
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Compact version for smaller spaces
export function SegmentationLegendCompact({
  classes,
  className = '',
}: {
  classes: SegmentationClass[];
  className?: string;
}) {
  const sortedClasses = [...classes].sort((a, b) => b.percentage - a.percentage);

  return (
    <div className={`space-y-2 ${className}`}>
      {sortedClasses.map((cls, idx) => (
        <motion.div
          key={cls.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.08 }}
          className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50"
        >
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: cls.color }}
            />
            <span className="text-sm text-slate-300">{cls.name}</span>
          </div>
          <div className="text-right">
            <span className="text-sm font-semibold text-white">
              {Number(cls.percentage).toFixed(1)}%
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Detailed version with progress bars
export function SegmentationLegendDetailed({
  classes,
  className = '',
}: {
  classes: SegmentationClass[];
  className?: string;
}) {
  const sortedClasses = [...classes].sort((a, b) => b.percentage - a.percentage);

  return (
    <div className={`space-y-3 ${className}`}>
      {sortedClasses.map((cls, idx) => (
        <motion.div
          key={cls.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: cls.color }}
              />
              <span className="text-sm font-medium text-slate-300">{cls.name}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-white">
                {Number(cls.percentage).toFixed(1)}%
              </span>
              <span className="text-xs text-slate-500">
                {formatPixels(cls.area)}
              </span>
            </div>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: cls.color }}
              initial={{ width: 0 }}
              animate={{ width: `${cls.percentage}%` }}
              transition={{ duration: 0.8, delay: idx * 0.1 + 0.2 }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
