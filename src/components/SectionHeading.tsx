import type { ReactNode } from 'react';
import { Reveal } from './Reveal';

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  className = '',
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <Reveal className={className}>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="mt-4 font-display text-[32px] font-semibold leading-[1.18] tracking-[-0.02em] text-ink sm:text-[42px]">
            {title}
          </h2>
          {description ? (
            <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-muted sm:text-[15px]">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </Reveal>
  );
}
