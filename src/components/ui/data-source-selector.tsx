"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DataSource = "live" | "prescout";

interface DataSourceSelectorProps {
  currentSource: DataSource;
  onSourceChange: (source: DataSource) => void;
}

export function DataSourceSelector({
  currentSource,
  onSourceChange,
}: DataSourceSelectorProps) {
  return (
    <div className="flex items-center space-x-2 bg-[#1A1A1A] p-1 rounded-lg border border-gray-800">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "px-3 py-1 text-sm font-medium rounded-md transition-colors",
          currentSource === "live"
            ? "bg-blue-600 text-white"
            : "text-gray-400 hover:text-white hover:bg-gray-800"
        )}
        onClick={() => onSourceChange("live")}
      >
        Live Data
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "px-3 py-1 text-sm font-medium rounded-md transition-colors",
          currentSource === "prescout"
            ? "bg-blue-600 text-white"
            : "text-gray-400 hover:text-white hover:bg-gray-800"
        )}
        onClick={() => onSourceChange("prescout")}
      >
        Pre-scout Data
      </Button>
    </div>
  );
} 