'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TrendIndicatorProps {
  value: number;
  label?: string;
  className?: string;
}

export function TrendIndicator({ value, label, className }: TrendIndicatorProps) {
  if (value > 0) {
    return (
      <div className={`flex items-center gap-1 text-green-600 ${className || ''}`}>
        <TrendingUp className="h-4 w-4" />
        <span className="text-sm font-medium">+{value.toFixed(1)}%</span>
        {label && <span className="text-xs text-muted-foreground">{label}</span>}
      </div>
    );
  } else if (value < 0) {
    return (
      <div className={`flex items-center gap-1 text-red-600 ${className || ''}`}>
        <TrendingDown className="h-4 w-4" />
        <span className="text-sm font-medium">{value.toFixed(1)}%</span>
        {label && <span className="text-xs text-muted-foreground">{label}</span>}
      </div>
    );
  } else {
    return (
      <div className={`flex items-center gap-1 text-gray-600 ${className || ''}`}>
        <Minus className="h-4 w-4" />
        <span className="text-sm font-medium">0%</span>
        {label && <span className="text-xs text-muted-foreground">{label}</span>}
      </div>
    );
  }
}

