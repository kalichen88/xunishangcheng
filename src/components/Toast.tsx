import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Check, Info, TriangleAlert, X } from 'lucide-react';

type ToastTone = 'success' | 'info' | 'error';

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  toast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      counter.current += 1;
      const id = counter.current;
      setItems((current) => [...current.slice(-2), { id, message, tone }]);
      window.setTimeout(() => {
        setItems((current) => current.filter((item) => item.id !== id));
      }, 2600);
    },
    [],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-4 bottom-5 z-[120] flex flex-col items-center gap-2 sm:inset-x-auto sm:left-6 sm:items-start"
        aria-live="polite"
        aria-atomic="false"
      >
        {items.map((item) => (
          <div
            key={item.id}
            role="status"
            className="animate-toast-in pointer-events-auto flex max-w-[92vw] items-center gap-2.5 rounded-full bg-ink py-2.5 pr-2.5 pl-4 text-[13px] font-medium text-cream shadow-lift sm:max-w-md"
          >
            <span
              className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                item.tone === 'error'
                  ? 'bg-coral/20 text-coral'
                  : item.tone === 'info'
                    ? 'bg-cream/15 text-cream'
                    : 'bg-lime text-ink'
              }`}
            >
              {item.tone === 'error' ? (
                <TriangleAlert size={12} strokeWidth={2.4} />
              ) : item.tone === 'info' ? (
                <Info size={12} strokeWidth={2.4} />
              ) : (
                <Check size={12} strokeWidth={3} />
              )}
            </span>
            <span className="leading-snug">{item.message}</span>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              className="ml-1 grid h-6 w-6 shrink-0 place-items-center rounded-full text-cream/50 transition hover:bg-cream/10 hover:text-cream"
              aria-label="关闭提示"
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
