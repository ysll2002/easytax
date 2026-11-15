'use client';
import { useEffect } from 'react';

// Browsers change a focused number field when the mouse wheel moves over it,
// so scrolling the page can silently change an amount. When the wheel is used
// over a focused number field, take the focus off it: the page scrolls and
// the value stays as typed.
export default function NoWheelNumberInputs() {
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      const el = document.activeElement;
      if (el instanceof HTMLInputElement && el.type === 'number' && e.target === el) el.blur();
    };
    document.addEventListener('wheel', onWheel, { passive: true, capture: true });
    return () => document.removeEventListener('wheel', onWheel, { capture: true });
  }, []);
  return null;
}
