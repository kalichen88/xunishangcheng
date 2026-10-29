import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import type { FaqItem } from '@/content/faq';

export function FaqAccordion({
  items,
  defaultOpen = 0,
}: {
  items: FaqItem[];
  defaultOpen?: number | null;
}) {
  const [open, setOpen] = useState<number | null>(defaultOpen);

  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item, index) => {
        const isOpen = open === index;
        return (
          <div key={item.q}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : index)}
              className="flex w-full items-start justify-between gap-6 py-5 text-left"
              aria-expanded={isOpen}
            >
              <span className="flex gap-4">
                <span className="num mt-0.5 text-[10px] text-muted/60">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="text-[14px] font-semibold leading-snug text-ink sm:text-[15px]">
                  {item.q}
                </span>
              </span>
              <span
                className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border transition ${
                  isOpen ? 'border-ink bg-ink text-cream' : 'border-line text-muted'
                }`}
              >
                {isOpen ? <Minus size={12} /> : <Plus size={12} />}
              </span>
            </button>
            {isOpen ? (
              <div className="animate-fade-up pb-6 pl-9 pr-10 text-[13px] leading-[1.85] text-muted">
                {item.a}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
