import React from 'react';

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}

export function CircularProgress({ 
  value, 
  size = 120, 
  strokeWidth = 10, 
  color = "hsl(var(--primary))",
  label 
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  // Determine color based on value if standard
  const getStatusColor = (val: number) => {
    if (val >= 75) return "hsl(var(--success))";
    if (val >= 60) return "hsl(var(--warning))";
    return "hsl(var(--destructive))";
  };

  const actualColor = color === "hsl(var(--primary))" ? getStatusColor(value) : color;

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90 transition-all duration-500"
      >
        <circle
          className="text-muted"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="transition-all duration-1000 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke={actualColor}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-3xl font-display font-bold text-foreground">
          {Math.round(value)}%
        </span>
        {label && <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>}
      </div>
    </div>
  );
}
