import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number, decimals = 1): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(decimals) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(decimals) + 'K';
  }
  return num.toFixed(decimals);
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}


export function getRiskColor(risk: 'low' | 'medium' | 'high' | 'critical'): string {
  const colors = {
    low: 'text-reef-teal bg-reef-teal/10 border-reef-teal/30',
    medium: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    high: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
    critical: 'text-reef-coral bg-reef-coral/10 border-reef-coral/30',
  };
  return colors[risk];
}

export function getHealthStatus(score: number): { label: string; risk: 'low' | 'medium' | 'high' | 'critical' } {
  if (score >= 80) return { label: 'Excellent', risk: 'low' };
  if (score >= 60) return { label: 'Good', risk: 'low' };
  if (score >= 40) return { label: 'Fair', risk: 'medium' };
  if (score >= 20) return { label: 'Poor', risk: 'high' };
  return { label: 'Critical', risk: 'critical' };
}
