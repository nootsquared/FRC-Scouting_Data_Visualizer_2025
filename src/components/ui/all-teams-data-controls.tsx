import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";

export type ProcessingMode = "average" | "top50" | "best";
export type ZeroHandling = "include" | "exclude";
export type RankingMetric = "epa" | "count";

interface AllTeamsDataControlsProps {
  onModeChange: (mode: ProcessingMode) => void;
  onZeroHandlingChange: (handling: ZeroHandling) => void;
  onRankingMetricChange: (metric: RankingMetric) => void;
  currentMode: ProcessingMode;
  currentZeroHandling: ZeroHandling;
  currentRankingMetric: RankingMetric;
}

export function AllTeamsDataControls({
  onModeChange,
  onZeroHandlingChange,
  onRankingMetricChange,
  currentMode,
  currentZeroHandling,
  currentRankingMetric,
}: AllTeamsDataControlsProps) {
  const [localMode, setLocalMode] = useState<ProcessingMode>(currentMode);
  const [localZeroHandling, setLocalZeroHandling] = useState<ZeroHandling>(currentZeroHandling);
  const [localRankingMetric, setLocalRankingMetric] = useState<RankingMetric>(currentRankingMetric);
  useEffect(() => {
    setLocalMode(currentMode);
  }, [currentMode]);

  useEffect(() => {
    setLocalZeroHandling(currentZeroHandling);
  }, [currentZeroHandling]);

  useEffect(() => {
    setLocalRankingMetric(currentRankingMetric);
  }, [currentRankingMetric]);
  const handleModeChange = (mode: ProcessingMode) => {
    setLocalMode(mode);
    onModeChange(mode);
  };
  const handleZeroHandlingChange = (checked: boolean) => {
    const newHandling: ZeroHandling = checked ? "exclude" : "include";
    setLocalZeroHandling(newHandling);
    onZeroHandlingChange(newHandling);
  };
  const handleRankingMetricChange = (metric: RankingMetric) => {
    setLocalRankingMetric(metric);
    onRankingMetricChange(metric);
  };

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
              variant="ghost"
              className={`rounded-full px-6 py-2 transition-all duration-200 text-white hover:text-white [&:hover]:text-white ${
                localMode === "average"
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-transparent border border-gray-700 hover:bg-gray-800"
              }`}
              onClick={() => handleModeChange("average")}
            >
              Averages
            </Button>
            <Button
              variant="ghost"
              className={`rounded-full px-6 py-2 transition-all duration-200 text-white hover:text-white [&:hover]:text-white ${
                localMode === "top50"
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-transparent border border-gray-700 hover:bg-gray-800"
              }`}
              onClick={() => handleModeChange("top50")}
            >
              Top 50%
            </Button>
            <Button
              variant="ghost"
              className={`rounded-full px-6 py-2 transition-all duration-200 text-white hover:text-white [&:hover]:text-white ${
                localMode === "best"
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-transparent border border-gray-700 hover:bg-gray-800"
              }`}
              onClick={() => handleModeChange("best")}
            >
              Best Performance
            </Button>
          </div>

          <div className="flex items-center justify-center space-x-4 pt-4">
            <Switch
              checked={localZeroHandling === "exclude"}
              onCheckedChange={handleZeroHandlingChange}
              className="data-[state=checked]:bg-gray-700"
            />
            <span className="text-gray-300">
              Exclude Zero Values
            </span>
          </div>

          <div className="flex justify-center space-x-4 pt-4">
            <Button
              variant="ghost"
              className={`rounded-full px-6 py-2 transition-all duration-200 text-white hover:text-white [&:hover]:text-white ${
                localRankingMetric === "epa"
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-transparent border border-gray-700 hover:bg-gray-800"
              }`}
              onClick={() => handleRankingMetricChange("epa")}
            >
              EPA
            </Button>
            <Button
              variant="ghost"
              className={`rounded-full px-6 py-2 transition-all duration-200 text-white hover:text-white [&:hover]:text-white ${
                localRankingMetric === "count"
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-transparent border border-gray-700 hover:bg-gray-800"
              }`}
              onClick={() => handleRankingMetricChange("count")}
            >
              Count
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
} 