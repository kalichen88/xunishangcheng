import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getService } from '@/lib/catalog';
import { clampQuantity, itemSubtotalCents } from '@/lib/pricing';
import { readStorage, writeStorage } from '@/lib/storage';
import type { Service } from '@/lib/types';

export interface CartLine {
  serviceId: number;
  quantity: number;
  target: string;
}

export interface DetailedCartLine {
  line: CartLine;
  service: Service;
  subtotalCents: number;
}

interface CartContextValue {
  items: CartLine[];
  detailed: DetailedCartLine[];
  itemCount: number;
  subtotalCents: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  add: (service: Service, quantity?: number, target?: string) => void;
  setQuantity: (serviceId: number, quantity: number) => void;
  setTarget: (serviceId: number, target: string) => void;
  remove: (serviceId: number) => void;
  clear: () => void;
}

const CART_KEY = 'cart.v1';
const CartContext = createContext<CartContextValue | null>(null);

function sanitizeLines(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];
  const lines: CartLine[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;
    const record = entry as Record<string, unknown>;
    const service = getService(record.serviceId as number);
    if (!service) continue;
    if (lines.some((line) => line.serviceId === service.id)) continue;
    lines.push({
      serviceId: service.id,
      quantity: clampQuantity(service, Number(record.quantity) || service.min),
      target: typeof record.target === 'string' ? record.target.slice(0, 500) : '',
    });
    if (lines.length >= 30) break;
  }
  return lines;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>(() => sanitizeLines(readStorage(CART_KEY, [])));
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    writeStorage(CART_KEY, items);
  }, [items]);

  const add = useCallback((service: Service, quantity?: number, target?: string) => {
    const requested = clampQuantity(service, quantity ?? service.min);
    setItems((current) => {
      const existing = current.find((line) => line.serviceId === service.id);
      if (existing) {
        return current.map((line) =>
          line.serviceId === service.id
            ? {
                ...line,
                quantity: clampQuantity(service, line.quantity + requested),
                target: target?.trim() ? target.trim().slice(0, 500) : line.target,
              }
            : line,
        );
      }
      if (current.length >= 30) return current;
      return [
        ...current,
        {
          serviceId: service.id,
          quantity: requested,
          target: target?.trim().slice(0, 500) ?? '',
        },
      ];
    });
  }, []);

  const setQuantity = useCallback((serviceId: number, quantity: number) => {
    const service = getService(serviceId);
    if (!service) return;
    setItems((current) =>
      current.map((line) =>
        line.serviceId === serviceId
          ? { ...line, quantity: clampQuantity(service, quantity) }
          : line,
      ),
    );
  }, []);

  const setTarget = useCallback((serviceId: number, target: string) => {
    setItems((current) =>
      current.map((line) =>
        line.serviceId === serviceId ? { ...line, target: target.slice(0, 500) } : line,
      ),
    );
  }, []);

  const remove = useCallback((serviceId: number) => {
    setItems((current) => current.filter((line) => line.serviceId !== serviceId));
  }, []);

  const clear = useCallback(() => setItems([]), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const detailed = useMemo<DetailedCartLine[]>(() => {
    return items.flatMap((line) => {
      const service = getService(line.serviceId);
      if (!service) return [];
      return [
        {
          line,
          service,
          subtotalCents: itemSubtotalCents(service, line.quantity),
        },
      ];
    });
  }, [items]);

  const subtotalCents = detailed.reduce((sum, item) => sum + item.subtotalCents, 0);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      detailed,
      itemCount: detailed.length,
      subtotalCents,
      isOpen,
      openCart,
      closeCart,
      add,
      setQuantity,
      setTarget,
      remove,
      clear,
    }),
    [
      items,
      detailed,
      subtotalCents,
      isOpen,
      openCart,
      closeCart,
      add,
      setQuantity,
      setTarget,
      remove,
      clear,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
}
