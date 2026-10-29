import { Link } from 'react-router-dom';

export function WaveMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="18" fill="#11130d" />
      <path
        d="M13 38.5c6.4 0 6.4-9 12.8-9s6.4 9 12.8 9 6.4-9 12.4-9"
        fill="none"
        stroke="#ddfc6d"
        strokeWidth="4.6"
        strokeLinecap="round"
      />
      <path
        d="M13 48c6.4 0 6.4-5.2 12.8-5.2S32.2 48 38.6 48s6.4-5.2 12.4-5.2"
        fill="none"
        stroke="#ddfc6d"
        strokeWidth="3.2"
        strokeLinecap="round"
        opacity=".55"
      />
    </svg>
  );
}

export function Logo({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  return (
    <Link to="/" className="group flex items-center gap-2.5" aria-label="TideSMM 首页">
      <WaveMark className="h-9 w-9 transition-transform duration-300 group-hover:-rotate-6" />
      <span className="flex flex-col leading-none">
        <span
          className={`font-grotesk text-[19px] font-bold tracking-[-0.035em] ${
            tone === 'light' ? 'text-cream' : 'text-ink'
          }`}
        >
          TideSMM
        </span>
        <span
          className={`mt-1 text-[9px] font-medium tracking-[0.26em] ${
            tone === 'light' ? 'text-cream/45' : 'text-muted'
          }`}
        >
          潮汐增长
        </span>
      </span>
    </Link>
  );
}
