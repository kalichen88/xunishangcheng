import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { PlatformBadge } from './PlatformIcon';
import { useCart } from './CartProvider';
import { useToast } from './Toast';
import { shortTypeName } from '@/lib/catalog';
import { deliveryLabel, formatQuantity, formatServiceRate, rateUnit } from '@/lib/pricing';
import type { Service } from '@/lib/types';

export function ServiceCard({ service }: { service: Service }) {
  const { add } = useCart();
  const { toast } = useToast();

  return (
    <Link
      to={`/service/${service.id}`}
      className="group relative flex h-full flex-col rounded-[22px] border border-line bg-cream p-5 transition duration-300 hover:-translate-y-1 hover:border-line-strong hover:shadow-soft"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <PlatformBadge platform={service.platform} size={38} />
          <div className="min-w-0">
            <p className="truncate text-[11px] font-medium text-muted">{service.platformName}</p>
            <p className="truncate text-[11px] text-muted/75">{shortTypeName(service.type)}</p>
          </div>
        </div>
        {service.hot ? (
          <span className="shrink-0 rounded-full bg-lime px-2 py-1 text-[10px] font-semibold text-ink">
            热门
          </span>
        ) : null}
      </div>

      <h3 className="mt-4 line-clamp-2 min-h-[44px] text-[15px] font-semibold leading-[1.48] tracking-[-0.01em] text-ink">
        {service.name}
      </h3>

      <div className="mt-auto flex items-end justify-between gap-3 pt-5">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="num text-[22px] font-semibold tracking-[-0.03em] text-ink">
              ${formatServiceRate(service)}
            </span>
            <span className="text-[11px] text-muted">/ {rateUnit(service)}</span>
          </div>
          <p className="mt-1.5 truncate text-[11px] text-muted">
            起订 {formatQuantity(service.min)} · {deliveryLabel(service)}
          </p>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            add(service);
            toast('已加入购物车，可在购物车补充目标链接');
          }}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-cream transition duration-200 hover:bg-lime hover:text-ink"
          aria-label={`将 ${service.name} 加入购物车`}
        >
          <Plus size={16} strokeWidth={2.2} />
        </button>
      </div>
    </Link>
  );
}
