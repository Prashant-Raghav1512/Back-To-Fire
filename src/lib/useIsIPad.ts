import { useEffect, useState } from 'react';

// A pure CSS width breakpoint can't reliably target "iPad" - an iPad Pro
// 12.9" is 1024px wide in portrait (identical to Tailwind's `lg`) and
// 1366px in landscape (a width shared with plenty of real 1366x768
// laptops), so widening a breakpoint to catch one also catches the other.
// This checks the device itself instead. iPadOS 13+ makes Safari report
// itself as "Macintosh" in the user agent - indistinguishable from a real
// Mac by UA string alone - so the standard way to tell them apart is touch
// support: a real Mac reports zero touch points, an iPad reports more than
// one. Older iPadOS (or "Request Desktop Site" off) still self-reports as
// "iPad" directly, which the UA check alone catches. Combining both catches
// every iPad, including every iPad Pro size/generation.
function detectIPad(): boolean {
  if (typeof navigator === 'undefined') return false;
  const classicIPadUA = /iPad/.test(navigator.userAgent);
  const modernIPadUA = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return classicIPadUA || modernIPadUA;
}

export function useIsIPad(): boolean {
  const [isIPad, setIsIPad] = useState(false);

  useEffect(() => {
    setIsIPad(detectIPad());
  }, []);

  return isIPad;
}
