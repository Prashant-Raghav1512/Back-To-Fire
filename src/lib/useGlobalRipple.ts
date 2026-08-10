import { useEffect } from 'react';

const RIPPLE_SELECTOR = '.btn-primary, .btn-secondary, .btn-outline';

// One document-level pointerdown listener drives ripple feedback for every
// .btn-primary/.btn-secondary/.btn-outline button site-wide — including
// ones that don't exist yet — instead of wiring a handler into each button
// usage individually. Mounted once in App.tsx. See .btn-ripple in
// index.css for the expanding-circle animation this triggers.
export function useGlobalRipple() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const onPointerDown = (e: PointerEvent) => {
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>(RIPPLE_SELECTOR);
      if (!target || target.hasAttribute('disabled')) return;

      const rect = target.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.6;
      const span = document.createElement('span');
      span.className = 'btn-ripple';
      span.style.width = `${size}px`;
      span.style.height = `${size}px`;
      span.style.left = `${e.clientX - rect.left - size / 2}px`;
      span.style.top = `${e.clientY - rect.top - size / 2}px`;
      target.appendChild(span);
      span.addEventListener('animationend', () => span.remove());
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);
}
