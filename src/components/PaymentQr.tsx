import { QRCodeSVG } from 'qrcode.react';
import { payment } from '@/config';

export function PaymentQr({
  size = 128,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-[#fbf9f4] p-2.5 shadow-[0_12px_30px_-18px_rgba(0,0,0,.55)] ${className}`}
      role="img"
      aria-label="USDT-TRC20 收款地址二维码"
    >
      <QRCodeSVG
        value={payment.address}
        size={size}
        bgColor="#fbf9f4"
        fgColor="#10120c"
        level="M"
        includeMargin
      />
      <p className="mt-1 text-center text-[8px] font-semibold tracking-[0.14em] text-ink/40 uppercase">
        Scan · TRC20
      </p>
    </div>
  );
}
