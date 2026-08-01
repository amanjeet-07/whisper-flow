"use client";

import { useEffect, useRef, type RefObject } from "react";

interface MicLevelMeterProps {
  active: boolean;
  audioLevelRef: RefObject<number>;
}

// Relative sensitivity per bar so they don't all move in lockstep — gives
// the classic "equalizer" look instead of a single flat block pulsing.
// Symmetric curve so the tallest bars sit in the middle of the row.
const BAR_WEIGHTS = [0.35, 0.55, 0.75, 0.9, 1, 1, 0.9, 0.75, 0.55, 0.35];
const MIN_PX = 6;
const MAX_PX = 28;

export function MicLevelMeter({ active, audioLevelRef }: MicLevelMeterProps) {
  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (!active) {
      for (const bar of barRefs.current) {
        if (bar) bar.style.height = `${MIN_PX}px`;
      }
      return;
    }

    let frameId: number;
    const tick = () => {
      const level = audioLevelRef.current;
      barRefs.current.forEach((bar, i) => {
        if (!bar) return;
        const scaled = Math.min(1, level * BAR_WEIGHTS[i]);
        bar.style.height = `${MIN_PX + scaled * (MAX_PX - MIN_PX)}px`;
      });
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [active, audioLevelRef]);

  return (
    <div className="flex items-end gap-1" style={{ height: MAX_PX }} aria-hidden="true">
      {BAR_WEIGHTS.map((_, i) => (
        <span
          key={i}
          ref={(el) => {
            barRefs.current[i] = el;
          }}
          className="w-1.5 rounded-full bg-[var(--color-accent)] transition-[height] duration-75 ease-out"
          style={{ height: MIN_PX }}
        />
      ))}
    </div>
  );
}
