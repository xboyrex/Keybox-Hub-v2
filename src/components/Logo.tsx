import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      role="img"
      aria-label="Keybox Hub logo"
      className={cn('h-8 w-8', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="kh-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#22C55E" />
        </linearGradient>
      </defs>
      <rect
        x="1"
        y="1"
        width="38"
        height="38"
        rx="10"
        fill="#05070A"
        stroke="url(#kh-grad)"
        strokeWidth="2"
      />
      {/* key */}
      <circle
        cx="15"
        cy="16"
        r="4.4"
        fill="none"
        stroke="url(#kh-grad)"
        strokeWidth="2.2"
      />
      <path
        d="M18.2 19.2 L26.5 27.5"
        stroke="url(#kh-grad)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M23.2 24.2 L25.4 22"
        stroke="#0EA5E9"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M25.8 26.8 L28 24.6"
        stroke="#22C55E"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
