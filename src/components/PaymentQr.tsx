import { QRCodeSVG } from 'qrcode.react';
import { payment } from '@/config';

export function PaymentQr({
  size = 156,
  className = '',
  onCopy,
}: {
  size?: number;
  className?: string;
  onCopy?: () => void;
}) {
  return (
    <div
      className={`rounded-[22px] border border-ink/10 bg-[#fbf9f4] p-3 text-center shadow-[0_16px_36px_-22px_rgba(0,0,0,.65)] ${className}`}
      role="group"
      aria-label={`USDT-TRC20 收款地址二维码：${payment.address}`}
    >
      <p className="text-[10px] font-bold tracking-[0.16em] text-ink">USDT-TRC20</p>
      <div className="mt-2 flex justify-center">
        <QRCodeSVG
          value={payment.address}
          size={size}
          bgColor="#fbf9f4"
          fgColor="#10120c"
          level="M"
          includeMargin
        />
      </div>
      <p className="mx-auto mt-2 max-w-[250px] break-all font-mono text-[10px] leading-relaxed text-ink/60">
        {payment.address}
      </p>
      {onCopy ? (
        <button
          type="button"
          onClick={onCopy}
          className="mt-1.5 text-[9px] font-medium text-violet underline underline-offset-2"
        >
          复制收款地址
        </button>
      ) : null}
    </div>
  );
}
