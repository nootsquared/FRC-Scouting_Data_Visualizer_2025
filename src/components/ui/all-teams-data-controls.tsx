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
  // Use local state to track changes
  const [localMode, setLocalMode] = useState<ProcessingMode>(currentMode);
  const [localZeroHandling, setLocalZeroHandling] = useState<ZeroHandling>(currentZeroHandling);
  const [localRankingMetric, setLocalRankingMetric] = useState<RankingMetric>(currentRankingMetric);

  // Update local state when props change
  useEffect(() => {
    setLocalMode(currentMode);
  }, [currentMode]);

  useEffect(() => {
    setLocalZeroHandling(currentZeroHandling);
  }, [currentZeroHandling]);

  useEffect(() => {
    setLocalRankingMetric(currentRankingMetric);
  }, [currentRankingMetric]);

  // Handle mode changes with immediate updates
  const handleModeChange = (mode: ProcessingMode) => {
    setLocalMode(mode);
    onModeChange(mode);
  };

  // Handle zero handling changes with immediate updates
  const handleZeroHandlingChange = (checked: boolean) => {
    const newHandling: ZeroHandling = checked ? "exclude" : "include";
    setLocalZeroHandling(newHandling);
    onZeroHandlingChange(newHandling);
  };

  // Handle ranking metric changes with immediate updates
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
              variant={localMode === "average" ? "default" : "outline"}
              className={`rounded-full px-6 py-2 transition-all duration-200 ${
                localMode === "average"
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800"
              }`}
              onClick={() => handleModeChange("average")}
            >
              Averages
            </Button>
            <Button
              variant={localMode === "top50" ? "default" : "outline"}
              className={`rounded-full px-6 py-2 transition-all duration-200 ${
                localMode === "top50"
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800"
              }`}
              onClick={() => handleModeChange("top50")}
            >
              Top 50%
            </Button>
            <Button
              variant={localMode === "best" ? "default" : "outline"}
              className={`rounded-full px-6 py-2 transition-all duration-200 ${
                localMode === "best"
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800"
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
              variant={localRankingMetric === "epa" ? "default" : "outline"}
              className={`rounded-full px-6 py-2 transition-all duration-200 ${
                localRankingMetric === "epa"
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800"
              }`}
              onClick={() => handleRankingMetricChange("epa")}
            >
              EPA
            </Button>
            <Button
              variant={localRankingMetric === "count" ? "default" : "outline"}
              className={`rounded-full px-6 py-2 transition-all duration-200 ${
                localRankingMetric === "count"
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800"
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