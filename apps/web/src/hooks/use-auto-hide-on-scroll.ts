'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * True while a fixed bar should stay visible: at/near the top of the page,
 * or the user just scrolled up. False while actively scrolling down past a
 * small threshold. Mirrors the auto-hide-bottom-nav-on-scroll behavior real
 * native apps use, so the nav doesn't sit fighting for space with content
 * mid-scroll — only reappears once the user pauses to scroll back up.
 */
export function useAutoHideOnScroll(threshold = 8): boolean {
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;

    function handleScroll(): void {
      const y = window.scrollY;
      const diff = y - lastY.current;
      if (y < 24) {
        setVisible(true);
      } else if (diff > threshold) {
        setVisible(false);
      } else if (diff < -threshold) {
        setVisible(true);
      }
      lastY.current = y;
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return visible;
}
