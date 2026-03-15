import React from 'react';

export function Logo({ className = "h-8 w-auto", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" /> {/* Violet */}
          <stop offset="100%" stopColor="#06B6D4" /> {/* Cyan */}
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Outer Circle/Ring */}
      <circle 
        cx="50" 
        cy="50" 
        r="45" 
        stroke="url(#logo-gradient)" 
        strokeWidth="2" 
        strokeDasharray="15 5"
        strokeLinecap="round"
        className="animate-spin-slow"
        style={{ transformOrigin: 'center' }}
      />
      
      {/* The "S" Shape */}
      <path
        d="M65 30C65 30 55 20 40 25C25 30 30 45 50 50C70 55 75 70 60 75C45 80 35 70 35 70"
        stroke="url(#logo-gradient)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#glow)"
      />
      
      {/* Stellar Dot/Star */}
      <circle cx="65" cy="30" r="4" fill="#fff">
        <animate
          attributeName="opacity"
          values="1;0.4;1"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}
