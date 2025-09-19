"use client";

import { cn } from "@/lib/utils";
import { useCallback, useLayoutEffect, useRef, useState } from "react";

export type DataSource = "live" | "prescout";

interface DataSourceSelectorProps {
  currentSource: DataSource;
  onSourceChange: (source: DataSource) => void;
}

export function DataSourceSelector({
  currentSource,
  onSourceChange,
}: DataSourceSelectorProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [highlight, setHighlight] = useState<{ offset: number; width: number; ready: boolean }>({
    offset: 0,
    width: 0,
    ready: false,
  });

  const updateHighlight = useCallback(() => {
    const trackEl = trackRef.current;
    if (!trackEl) return;

    const activeIndex = currentSource === "live" ? 0 : 1;
    const targetEl = optionRefs.current[activeIndex];
    if (!targetEl) return;

    const trackRect = trackEl.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();

    setHighlight({
      offset: targetRect.left - trackRect.left,
      width: targetRect.width,
      ready: true,
    });
  }, [currentSource]);

  useLayoutEffect(() => {
    updateHighlight();
  }, [updateHighlight]);

  useLayoutEffect(() => {
    window.addEventListener("resize", updateHighlight);
    return () => window.removeEventListener("resize", updateHighlight);
  }, [updateHighlight]);

  const handleSourceChange = useCallback(
    (source: DataSource) => {
      if (source !== currentSource) {
        onSourceChange(source);
      }
    },
    [currentSource, onSourceChange]
  );

  const options: Array<{ source: DataSource; label: string }> = [
    { source: "live", label: "Live" },
    { source: "prescout", label: "Pre-scout" },
  ];

  return (
    <div
      ref={trackRef}
      className="relative inline-flex items-center gap-2 rounded-lg border border-slate-900/70 bg-[#0B1424] p-1 shadow-[0_16px_32px_rgba(7,12,25,0.45)]"
    >
      <span
        className={cn(
          "pointer-events-none absolute left-0 top-1 bottom-1 rounded-md bg-sky-500/20 transition-opacity duration-200",
          highlight.ready ? "opacity-100" : "opacity-0"
        )}
        style={{
          width: highlight.width,
          transform: `translateX(${highlight.offset}px)`,
          transition: "transform 220ms ease, width 200ms ease",
        }}
      />

      {options.map(({ source, label }, index) => {
        const isActive = currentSource === source;
        return (
          <button
            key={source}
            type="button"
            ref={(el) => {
              optionRefs.current[index] = el;
            }}
            onClick={() => handleSourceChange(source)}
            aria-pressed={isActive}
            className={cn(
              "relative z-10 flex min-w-[110px] items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60",
              isActive ? "text-white" : "text-slate-300 hover:text-slate-100"
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
