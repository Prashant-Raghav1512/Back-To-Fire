import { useEffect, useState } from 'react';
import QRCodeLib from 'qrcode';

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

// Generated entirely client-side (the `qrcode` npm package draws to an
// offscreen canvas and hands back a data URI) — no third-party QR-image
// API call, consistent with this being a backend-less static site.
export function QRCode({ value, size = 96, className = '' }: QRCodeProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCodeLib.toDataURL(value, {
      width: size * 2, // 2x for crisp rendering on high-DPI screens
      margin: 1,
      color: { dark: '#111827', light: '#ffffff' },
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div
        className={`animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <img
      src={dataUrl}
      alt="QR code linking to the Born to Fire app page"
      width={size}
      height={size}
      className={className}
    />
  );
}
