'use client';

import { Layer } from 'recharts';
import { useId } from 'react';

interface FrostedBarCursorProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export function FrostedBarCursor({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
}: FrostedBarCursorProps) {
  if (!width || !height) {
    return null;
  }

  const rawId = useId();
  const sanitizedId = rawId.replace(/[:]/g, '-');
  const filterId = `frosted-bar-cursor-${sanitizedId}`;

  const paddedWidth = Math.max(width * 0.76, 4);
  const paddedX = x + (width - paddedWidth) / 2;
  const availableTop = Math.max(0, y);
  const topExtension = Math.min(12, availableTop);
  const bottomExtension = 10;
  const paddedY = y - topExtension;
  const paddedHeight = height + topExtension + bottomExtension;
  const cornerRadius = Math.min(12, paddedWidth / 2);
  const topAccentYOffset = Math.max(4, topExtension * 0.6);
  const bottomAccentYOffset = Math.max(6, bottomExtension * 0.6);

  return (
    <Layer>
      <defs>
        <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="6" result="blur" />
          <feFlood floodColor="rgba(15, 23, 42, 0.45)" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="shadow" />
          <feOffset dy="6" result="offsetBlur" />
          <feMerge>
            <feMergeNode in="offsetBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id={`${filterId}-gradient`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(226, 232, 240, 0.32)" />
          <stop offset="55%" stopColor="rgba(148, 163, 184, 0.22)" />
          <stop offset="100%" stopColor="rgba(71, 85, 105, 0.28)" />
        </linearGradient>
      </defs>
      <rect
        x={paddedX}
        y={paddedY}
        width={paddedWidth}
        height={paddedHeight}
        rx={cornerRadius}
        fill={`url(#${filterId}-gradient)`}
        stroke="rgba(226, 232, 240, 0.38)"
        strokeWidth={1.25}
        filter={`url(#${filterId})`}
      />
      <rect
        x={paddedX + 6}
        y={paddedY + topAccentYOffset}
        width={paddedWidth - 12}
        height={2}
        rx={1}
        fill="rgba(241, 245, 249, 0.4)"
      />
      <rect
        x={paddedX + 10}
        y={paddedY + paddedHeight - bottomAccentYOffset}
        width={paddedWidth - 20}
        height={3}
        rx={1.5}
        fill="rgba(148, 163, 184, 0.35)"
      />
    </Layer>
  );
}
