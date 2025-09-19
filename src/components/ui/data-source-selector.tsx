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
      className="relative inline-flex items-center rounded-lg border border-gray-700/50 bg-gradient-to-r from-[#111111] via-[#1A1A1A] to-[#111111] p-0.5 shadow-xl backdrop-blur-sm"
    >
      <span
        className={cn(
          "pointer-events-none absolute top-0.5 bottom-0.5 rounded-md bg-brandBlue-accent/30 border border-brandBlue-accent/50 shadow-md transition-all duration-300 ease-out",
          highlight.ready ? "opacity-100" : "opacity-0"
        )}
        style={{
          width: highlight.width,
          left: highlight.offset,
          transition: "left 300ms cubic-bezier(0.4, 0, 0.2, 1), width 250ms cubic-bezier(0.4, 0, 0.2, 1)",
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
              "relative z-10 flex min-w-[100px] items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brandBlue-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
              isActive 
                ? "text-white" 
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
