import { useEffect, useState } from 'react';

// A pure CSS width breakpoint can't reliably target "iPad" - an iPad Pro
// 12.9" is 1024px wide in portrait (identical to Tailwind's `lg`) and
// 1366px in landscape (a width shared with plenty of real 1366x768
// laptops), so widening a breakpoint to catch one also catches the other.
// This checks the device itself instead, via three signals, since no
// single one is reliable on its own:
//
// 1. Older iPadOS (or "Request Desktop Site" off) self-reports "iPad"
//    directly in the user agent.
// 2. iPadOS 13+ makes Safari report itself as "Macintosh" instead -
//    indistinguishable from a real Mac by UA string alone - so the
//    standard way to tell them apart is touch support: a real Mac
//    reports zero touch points, an iPad reports more than one.
// 3. Neither of the above fires when this is being previewed through a
//    resized desktop browser window or Chrome DevTools' plain
//    "Responsive" device mode (as opposed to picking an actual "iPad
//    Pro" preset) - `navigator.platform` stays the real desktop
//    platform in that case. But DevTools' device toolbar (in *any* mode,
//    including manual Responsive) flips the CSS pointer/hover media
//    features to `coarse`/`none` to accurately preview touch layouts,
//    same as a real touch device does natively - a mouse-driven desktop
//    browser never reports that, even resized narrow. Combined with a
//    width ceiling matching the widest iPad Pro (1366px landscape),
//    this catches both real hardware and its DevTools emulation without
//    misclassifying an actual small desktop window.
function detectIPad(): boolean {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false;
  const classicIPadUA = /iPad/.test(navigator.userAgent);
  const modernIPadUA = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  const coarsePointerInTabletRange =
    window.matchMedia('(pointer: coarse) and (hover: none)').matches && window.innerWidth <= 1366;
  return classicIPadUA || modernIPadUA || coarsePointerInTabletRange;
}

export function useIsIPad(): boolean {
  const [isIPad, setIsIPad] = useState(false);

  useEffect(() => {
    const update = () => setIsIPad(detectIPad());
    update();
    // Re-checks on resize/orientation change - the pointer/width signal
    // above can change live (rotating a real iPad, or resizing the
    // DevTools device panel) even though the UA-based signals can't.
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  return isIPad;
}
