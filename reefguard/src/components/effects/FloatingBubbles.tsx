import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface Bubble {
  id: number;
  size: number;
  x: number;
  duration: number;
  delay: number;
}

interface FloatingBubblesProps {
  count?: number;
  className?: string;
}

export function FloatingBubbles({ count = 15, className }: FloatingBubblesProps) {
  const bubbles = useMemo<Bubble[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      size: 4 + Math.random() * 12,
      x: Math.random() * 100,
      duration: 8 + Math.random() * 12,
      delay: Math.random() * 10,
    }));
  }, [count]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {bubbles.map((bubble) => (
        <motion.div
          key={bubble.id}
          className="absolute rounded-full"
          style={{
            width: bubble.size,
            height: bubble.size,
            left: `${bubble.x}%`,
            bottom: -20,
            background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3), rgba(0, 212, 255, 0.1))',
            boxShadow: '0 0 10px rgba(0, 212, 255, 0.2), inset 0 0 10px rgba(255, 255, 255, 0.2)',
          }}
          animate={{
            y: [0, -window.innerHeight - 100],
            x: [0, Math.sin(bubble.id) * 30, 0],
            opacity: [0, 0.6, 0.6, 0],
          }}
          transition={{
            duration: bubble.duration,
            delay: bubble.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}
