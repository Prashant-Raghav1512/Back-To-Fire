import type { KeyboardEventHandler, MouseEventHandler, ReactNode } from 'react';
import { useTilt } from '@/lib/useTilt';

interface TiltCardProps {
  className?: string;
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLDivElement>;
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
  role?: string;
  tabIndex?: number;
}

// Wraps a `.card` div with cursor-following 3D tilt (see useTilt) plus a
// `tilt-glow` radial highlight (styled in index.css) that follows the same
// cursor position. Kept as a thin wrapper rather than inlining the hook in
// every card grid, since a hook can't be called inside a `.map()` callback.
export function TiltCard({ className = '', children, ...rest }: TiltCardProps) {
  const ref = useTilt<HTMLDivElement>();
  return (
    <div ref={ref} className={`tilt-glow ${className}`} {...rest}>
      {children}
    </div>
  );
}
