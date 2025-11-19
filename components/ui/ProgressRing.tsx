import React from 'react';

interface ProgressRingProps {
  radius?: number;
  stroke?: number;
  progress: number;
  className?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({ 
  radius = 18, 
  stroke = 3, 
  progress,
  className = ""
}) => {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        height={radius * 2}
        width={radius * 2}
        className="transform -rotate-90"
      >
        <circle
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={stroke}
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="currentColor"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-in-out' }}
          strokeLinecap="round"
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="text-accent"
        />
      </svg>
      <div className="absolute text-[10px] font-bold text-accent">
        {Math.round(progress)}%
      </div>
    </div>
  );
};
