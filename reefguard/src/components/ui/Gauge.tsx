import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { getHealthStatus } from '../../lib/utils';

interface GaugeProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function Gauge({ value, size = 'md', showLabel = true, className }: GaugeProps) {
  const sizes = {
    sm: { width: 80, strokeWidth: 6 },
    md: { width: 120, strokeWidth: 8 },
    lg: { width: 160, strokeWidth: 10 },
  };

  const { width, strokeWidth } = sizes[size];
  const radius = (width - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.max(0, Math.min(100, value));
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;
  
  const { label, risk } = getHealthStatus(value);
  
  const colors = {
    low: '#00c9a7',
    medium: '#fbbf24',
    high: '#f97316',
    critical: '#ff6b6b',
  };

  const color = colors[risk];

  return (
    <div className={cn('relative', className)} style={{ width, height: width }}>
      <svg width={width} height={width} className="transform -rotate-90">
        {/* Background arc */}
        <circle
          cx={width / 2}
          cy={width / 2}
          r={radius}
          fill="none"
          stroke="rgba(51, 65, 85, 0.5)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeLinecap="round"
        />
        
        {/* Progress arc */}
        <motion.circle
          cx={width / 2}
          cy={width / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{
            filter: `drop-shadow(0 0 ${strokeWidth}px ${color}40)`,
          }}
        />
      </svg>
      
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-2xl font-bold font-display"
            style={{ color }}
          >
            {value}
          </motion.span>
          <span className="text-xs text-slate-400 mt-0.5">{label}</span>
        </div>
      )}
    </div>
  );
}
