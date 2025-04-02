import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";

export type ProcessingMode = "average" | "top50" | "best";
export type ZeroHandling = "include" | "exclude";

interface DataProcessingControlsProps {
  onModeChange: (mode: ProcessingMode) => void;
  onZeroHandlingChange: (handling: ZeroHandling) => void;
  currentMode: ProcessingMode;
  currentZeroHandling: ZeroHandling;
}

export function DataProcessingControls({
  onModeChange,
  onZeroHandlingChange,
  currentMode,
  currentZeroHandling,
}: DataProcessingControlsProps) {
  return (
    <Card className="p-6 bg-[#1A1A1A] border-gray-800 rounded-xl shadow-lg">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Data Processing</h2>
          <p className="text-gray-400">Select how to process and display team data</p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-center space-x-4">
            <Button
              variant={currentMode === "average" ? "default" : "outline"}
              className={`rounded-full px-6 py-2 transition-all duration-200 ${
                currentMode === "average"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800"
              }`}
              onClick={() => onModeChange("average")}
            >
              Averages
            </Button>
            <Button
              variant={currentMode === "top50" ? "default" : "outline"}
              className={`rounded-full px-6 py-2 transition-all duration-200 ${
                currentMode === "top50"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800"
              }`}
              onClick={() => onModeChange("top50")}
            >
              Top 50%
            </Button>
            <Button
              variant={currentMode === "best" ? "default" : "outline"}
              className={`rounded-full px-6 py-2 transition-all duration-200 ${
                currentMode === "best"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800"
              }`}
              onClick={() => onModeChange("best")}
            >
              Best Performance
            </Button>
          </div>

          <div className="flex items-center justify-center space-x-4 pt-4">
            <Switch
              checked={currentZeroHandling === "exclude"}
              onCheckedChange={(checked) =>
                onZeroHandlingChange(checked ? "exclude" : "include")
              }
              className="data-[state=checked]:bg-blue-600"
            />
            <span className="text-gray-300">
              Exclude Zero Values
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
} 