"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DataSource = "live" | "pre";

interface DataSourceSelectorProps {
  currentSource: DataSource;
  onSourceChange: (source: DataSource) => void;
}

export function DataSourceSelector({
  currentSource,
  onSourceChange,
}: DataSourceSelectorProps) {
  return (
    <div className="flex justify-center space-x-4 mb-6">
      <Button
        variant={currentSource === "live" ? "default" : "outline"}
        className={cn(
          "rounded-full px-6 py-2 transition-all duration-200",
          currentSource === "live"
            ? "bg-gray-700 hover:bg-gray-600 text-white"
            : "bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800"
        )}
        onClick={() => onSourceChange("live")}
      >
        Live Data
      </Button>
      <Button
        variant={currentSource === "pre" ? "default" : "outline"}
        className={cn(
          "rounded-full px-6 py-2 transition-all duration-200",
          currentSource === "pre"
            ? "bg-gray-700 hover:bg-gray-600 text-white"
            : "bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800"
        )}
        onClick={() => onSourceChange("pre")}
      >
        Pre-Scout Data
      </Button>
    </div>
  );
} 