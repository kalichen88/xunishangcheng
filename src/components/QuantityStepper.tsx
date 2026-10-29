import { useEffect, useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import clsx from 'clsx';
import type { Service } from '@/lib/types';
import { clampQuantity, stepFor } from '@/lib/pricing';

export function QuantityStepper({
  service,
  value,
  onChange,
  size = 'md',
  className,
}: {
  service: Service;
  value: number;
  onChange: (value: number) => void;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement | null>(null);
  const step = stepFor(service);

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = () => {
    const parsed = Number(draft);
    const next = clampQuantity(service, Number.isFinite(parsed) ? parsed : service.min);
    setDraft(String(next));
    onChange(next);
  };

  const nudge = (delta: number) => {
    const next = clampQuantity(service, value + delta);
    setDraft(String(next));
    onChange(next);
  };

  const small = size === 'sm';

  return (
    <div
      className={clsx(
        'inline-flex items-center rounded-full border border-line bg-cream',
        small ? 'h-9' : 'h-11',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => nudge(-step)}
        disabled={value <= service.min}
        className={clsx(
          'grid place-items-center rounded-full text-muted transition hover:bg-ink/5 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30',
          small ? 'h-8 w-8' : 'h-10 w-10',
        )}
        aria-label="减少数量"
      >
        <Minus size={small ? 13 : 15} />
      </button>
      <input
        ref={inputRef}
        value={draft}
        onChange={(event) => setDraft(event.target.value.replace(/[^\d]/g, ''))}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.currentTarget.blur();
          }
          if (event.key === 'Escape') {
            setDraft(String(value));
            inputRef.current?.blur();
          }
        }}
        inputMode="numeric"
        className={clsx(
          'num bg-transparent text-center font-semibold text-ink outline-none',
          small ? 'w-14 text-[13px]' : 'w-20 text-[15px]',
        )}
        aria-label="购买数量"
      />
      <button
        type="button"
        onClick={() => nudge(step)}
        disabled={value >= service.max}
        className={clsx(
          'grid place-items-center rounded-full text-muted transition hover:bg-ink/5 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30',
          small ? 'h-8 w-8' : 'h-10 w-10',
        )}
        aria-label="增加数量"
      >
        <Plus size={small ? 13 : 15} />
      </button>
    </div>
  );
}
