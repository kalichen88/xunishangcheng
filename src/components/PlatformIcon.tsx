import type { ReactNode } from 'react';
import { AtSign, Gamepad2, MessageCircle, Music2, Send } from 'lucide-react';
import type { PlatformKey } from '@/lib/types';

export const platformTheme: Record<
  PlatformKey,
  { gradient: string; soft: string; ink: string }
> = {
  telegram: { gradient: 'linear-gradient(135deg,#2AABEE 0%,#1E8FC4 100%)', soft: '#E8F6FD', ink: '#1677A8' },
  instagram: { gradient: 'linear-gradient(135deg,#F9CE34 0%,#EE2A7B 48%,#6228D7 100%)', soft: '#FDECF4', ink: '#B02162' },
  tiktok: { gradient: 'linear-gradient(135deg,#16181D 0%,#2C2F3A 100%)', soft: '#ECEDF0', ink: '#191B20' },
  youtube: { gradient: 'linear-gradient(135deg,#FF2E4D 0%,#D90026 100%)', soft: '#FFE9EC', ink: '#C40022' },
  twitter: { gradient: 'linear-gradient(135deg,#1B1D22 0%,#0A0B0D 100%)', soft: '#ECEDEF', ink: '#141519' },
  facebook: { gradient: 'linear-gradient(135deg,#3B8BFF 0%,#1877F2 100%)', soft: '#E8F1FE', ink: '#1464CC' },
  whatsapp: { gradient: 'linear-gradient(135deg,#3BE07B 0%,#1FB855 100%)', soft: '#E6FAEE', ink: '#128C41' },
  discord: { gradient: 'linear-gradient(135deg,#7289FF 0%,#5865F2 100%)', soft: '#EDEFFE', ink: '#4350C9' },
  linkedin: { gradient: 'linear-gradient(135deg,#2E8AE6 0%,#0A66C2 100%)', soft: '#E7F1FB', ink: '#0A5AA8' },
  threads: { gradient: 'linear-gradient(135deg,#26282D 0%,#0E0F12 100%)', soft: '#ECEDEF', ink: '#141519' },
};

function InstagramGlyph() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5.4" />
      <circle cx="12" cy="12" r="4.1" />
      <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
    </g>
  );
}

function YoutubeGlyph() {
  return (
    <g>
      <rect x="2.2" y="5.2" width="19.6" height="13.6" rx="4.2" fill="currentColor" />
      <path d="M10.2 9.1v5.8l5.1-2.9-5.1-2.9Z" fill="#10120c" />
    </g>
  );
}

function XGlyph() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round">
      <path d="M4.6 4.6 19.4 19.4" />
      <path d="M19.4 4.6 4.6 19.4" />
    </g>
  );
}

function FacebookGlyph() {
  return (
    <path
      fill="currentColor"
      d="M13.6 21v-7.4h2.5l.4-2.9h-2.9V8.9c0-.8.2-1.4 1.4-1.4h1.6V4.9c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2h-2.5v2.9h2.5V21h3.2Z"
    />
  );
}

function LinkedinGlyph() {
  return (
    <g fill="currentColor">
      <rect x="3.2" y="9.4" width="3.5" height="11.2" rx=".5" />
      <circle cx="4.95" cy="4.9" r="2.05" />
      <path d="M9.4 9.4h3.35v1.53h.05c.47-.89 1.62-1.83 3.34-1.83 3.57 0 4.23 2.35 4.23 5.4v6.2h-3.5v-5.5c0-1.31-.02-3-1.83-3-1.84 0-2.12 1.43-2.12 2.9v5.6H9.4V9.4Z" />
    </g>
  );
}

export function PlatformGlyph({
  platform,
  size = 20,
  className,
}: {
  platform: PlatformKey | string;
  size?: number;
  className?: string;
}) {
  const key = platform as PlatformKey;
  let content: ReactNode;
  switch (key) {
    case 'telegram':
      content = <Send size={size} strokeWidth={1.9} />;
      break;
    case 'instagram':
      content = (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <InstagramGlyph />
        </svg>
      );
      break;
    case 'tiktok':
      content = <Music2 size={size} strokeWidth={1.9} />;
      break;
    case 'youtube':
      content = (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <YoutubeGlyph />
        </svg>
      );
      break;
    case 'twitter':
      content = (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <XGlyph />
        </svg>
      );
      break;
    case 'facebook':
      content = (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <FacebookGlyph />
        </svg>
      );
      break;
    case 'whatsapp':
      content = <MessageCircle size={size} strokeWidth={1.9} />;
      break;
    case 'discord':
      content = <Gamepad2 size={size} strokeWidth={1.9} />;
      break;
    case 'linkedin':
      content = (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <LinkedinGlyph />
        </svg>
      );
      break;
    case 'threads':
      content = <AtSign size={size} strokeWidth={1.9} />;
      break;
    default:
      content = <span className="text-[11px] font-bold">SMM</span>;
  }
  return <span className={className}>{content}</span>;
}

export function PlatformBadge({
  platform,
  size = 40,
  className = '',
  rounded = 'rounded-[13px]',
}: {
  platform: PlatformKey | string;
  size?: number;
  className?: string;
  rounded?: string;
}) {
  const theme = platformTheme[platform as PlatformKey] ?? platformTheme.telegram;
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center text-white shadow-[inset_0_1px_0_rgba(255,255,255,.22)] ${rounded} ${className}`}
      style={{ width: size, height: size, background: theme.gradient }}
    >
      <PlatformGlyph platform={platform} size={Math.round(size * 0.48)} />
    </span>
  );
}
