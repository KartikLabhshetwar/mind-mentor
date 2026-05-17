"use client";

interface MindMentorLogoProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

export function MindMentorLogo({ size = 32, className = "", animate = true }: MindMentorLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="mm-grad-bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#c1ff72" />
          <stop offset="100%" stopColor="#7dd956" />
        </linearGradient>
        <linearGradient id="mm-grad-brain" x1="18" y1="14" x2="46" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1a1a2e" />
          <stop offset="100%" stopColor="#2d2d44" />
        </linearGradient>
        <linearGradient id="mm-grad-spark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffd700" />
          <stop offset="100%" stopColor="#ffaa00" />
        </linearGradient>
      </defs>

      {/* Rounded square background */}
      <rect x="2" y="2" width="60" height="60" rx="14" fill="url(#mm-grad-bg)" stroke="#1a1a2e" strokeWidth="2.5" />

      {/* Brain shape - left hemisphere */}
      <path
        d="M22 36c-3-1-5-4-5-7 0-2 1-4 2.5-5.5C21 22 23 21 25 21c1.5 0 3 .5 4 1.5 1-2 3-3.5 5.5-3.5"
        stroke="url(#mm-grad-brain)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      >
        {animate && (
          <animate
            attributeName="stroke-dasharray"
            from="0 100"
            to="100 0"
            dur="1.5s"
            fill="freeze"
          />
        )}
      </path>

      {/* Brain shape - right hemisphere */}
      <path
        d="M42 36c3-1 5-4 5-7 0-2-1-4-2.5-5.5C43 22 41 21 39 21c-1.5 0-3 .5-4 1.5-1-2-3-3.5-5.5-3.5"
        stroke="url(#mm-grad-brain)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      >
        {animate && (
          <animate
            attributeName="stroke-dasharray"
            from="0 100"
            to="100 0"
            dur="1.5s"
            begin="0.3s"
            fill="freeze"
          />
        )}
      </path>

      {/* Center neural connection line */}
      <path
        d="M32 18v20"
        stroke="url(#mm-grad-brain)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="2 3"
      >
        {animate && (
          <animate
            attributeName="stroke-dashoffset"
            from="20"
            to="0"
            dur="2s"
            repeatCount="indefinite"
          />
        )}
      </path>

      {/* Neural nodes */}
      <circle cx="27" cy="26" r="1.8" fill="#1a1a2e">
        {animate && (
          <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
        )}
      </circle>
      <circle cx="37" cy="26" r="1.8" fill="#1a1a2e">
        {animate && (
          <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" begin="0.5s" repeatCount="indefinite" />
        )}
      </circle>
      <circle cx="32" cy="32" r="1.8" fill="#1a1a2e">
        {animate && (
          <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" begin="1s" repeatCount="indefinite" />
        )}
      </circle>

      {/* Spark / lightbulb accent top-right */}
      <path
        d="M44 12l2-3M48 14l3-1M46 18l2 2"
        stroke="url(#mm-grad-spark)"
        strokeWidth="2"
        strokeLinecap="round"
      >
        {animate && (
          <animate attributeName="opacity" values="0;1;0" dur="3s" repeatCount="indefinite" />
        )}
      </path>

      {/* Graduation cap hint at bottom */}
      <path
        d="M22 44l10-4 10 4-10 4z"
        fill="#1a1a2e"
        opacity="0.9"
      />
      <line x1="42" y1="44" x2="42" y2="50" stroke="#1a1a2e" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="42" cy="51" r="1.2" fill="#ffd700" />
    </svg>
  );
}
