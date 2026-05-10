import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'elevated';
  hover?: boolean;
  glow?: 'none' | 'cyan' | 'coral' | 'teal';
}

export function Card({
  children,
  className,
  variant = 'default',
  hover = true,
  glow = 'none',
  ...props
}: CardProps) {
  const baseStyles = 'rounded-2xl overflow-hidden';
  
  const variants = {
    default: 'glass-card',
    glass: 'glass-panel',
    elevated: 'glass-panel shadow-glass',
  };

  const glowStyles = {
    none: '',
    cyan: 'hover:shadow-glow-cyan',
    coral: 'hover:shadow-[0_0_30px_rgba(255,107,107,0.3)]',
    teal: 'hover:shadow-[0_0_30px_rgba(0,201,167,0.3)]',
  };

  return (
    <motion.div
      whileHover={hover ? { y: -4 } : undefined}
      transition={{ duration: 0.3 }}
      className={cn(
        baseStyles,
        variants[variant],
        glowStyles[glow],
        hover && 'transition-all duration-300',
        className
      )}
      {...props as any}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-6 pb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-6 pt-0', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-6 pt-4 border-t border-slate-800/50', className)} {...props}>
      {children}
    </div>
  );
}
