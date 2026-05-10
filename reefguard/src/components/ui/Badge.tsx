import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  size?: 'sm' | 'md';
  icon?: LucideIcon;
  pulse?: boolean;
}

export function Badge({
  children,
  className,
  variant = 'default',
  size = 'sm',
  icon: Icon,
  pulse = false,
  ...props
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center gap-1.5 font-medium rounded-full';
  
  const variants = {
    default: 'bg-slate-800/60 text-slate-300 border border-slate-700/40',
    success: 'bg-reef-teal/10 text-reef-teal border border-reef-teal/30',
    warning: 'bg-amber-400/10 text-amber-400 border border-amber-400/30',
    danger: 'bg-reef-coral/10 text-reef-coral border border-reef-coral/30',
    info: 'bg-reef-cyan/10 text-reef-cyan border border-reef-cyan/30',
    outline: 'bg-transparent border border-slate-600 text-slate-400',
  };
  
  const sizes = {
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      {...props as any}
    >
      {Icon && (
        <span className={cn(pulse && 'relative')}>
          <Icon className="w-3.5 h-3.5" />
          {pulse && (
            <span className="absolute inset-0 animate-ping rounded-full bg-current opacity-30" />
          )}
        </span>
      )}
      {children}
    </motion.span>
  );
}
