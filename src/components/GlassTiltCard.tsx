import React, { useCallback, useRef } from 'react';

interface GlassTiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxTiltDeg?: number;
}

export const GlassTiltCard: React.FC<GlassTiltCardProps> = ({
  children,
  className = '',
  maxTiltDeg = 4.5
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType !== 'mouse') return;
      const el = cardRef.current;
      if (!el) return;
      if (
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        return;
      }

      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const ry = (x - 0.5) * (maxTiltDeg * 2);
      const rx = (0.5 - y) * (maxTiltDeg * 2);

      el.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
      el.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
      el.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
      el.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
      el.style.setProperty('--glare-opacity', '1');
    },
    [maxTiltDeg]
  );

  const handlePointerLeave = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
    el.style.setProperty('--glare-opacity', '0');
  }, []);

  return (
    <div className="tilt-3d-perspective h-full">
      <div
        ref={cardRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className={`tilt-3d-surface relative overflow-hidden ${className}`}
      >
        <div className="tilt-3d-glare absolute inset-0 z-10 rounded-[inherit]" />
        {children}
      </div>
    </div>
  );
};
