"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { AllTeamsDataControls, ProcessingMode, ZeroHandling, RankingMetric } from "@/components/ui/all-teams-data-controls";
import { getAllTeamsRankings } from "@/lib/all-teams-service";

export default function AllTeamsPage() {
  const [processingMode, setProcessingMode] = useState<ProcessingMode>("average");
  const [zeroHandling, setZeroHandling] = useState<ZeroHandling>("include");
  const [rankingMetric, setRankingMetric] = useState<RankingMetric>("epa");

  const rankings = getAllTeamsRankings(processingMode, zeroHandling);

  // Sort rankings based on the selected metric
  const sortedRankings = [...rankings].sort((a, b) => {
    if (rankingMetric === "epa") {
      return b.totalEPA - a.totalEPA;
    }
    return b.totalCoral - a.totalCoral;
  });

  const sortedAutonRankings = [...rankings].sort((a, b) => {
    if (rankingMetric === "epa") {
      return b.autonEPA - a.autonEPA;
    }
    const aTotal = a.autonCoral + a.autonAlgae;
    const bTotal = b.autonCoral + b.autonAlgae;
    return bTotal - aTotal;
  });

  const sortedTeleopRankings = [...rankings].sort((a, b) => {
    if (rankingMetric === "epa") {
      return b.teleopEPA - a.teleopEPA;
    }
    const aTotal = a.teleopCoral + a.teleopAlgae;
    const bTotal = b.teleopCoral + b.teleopAlgae;
    return bTotal - aTotal;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">All Teams Analysis</h1>
        <p className="text-gray-400">
          Compare and analyze performance across all teams
        </p>
      </div>

      <AllTeamsDataControls
        currentMode={processingMode}
        currentZeroHandling={zeroHandling}
        currentRankingMetric={rankingMetric}
        onModeChange={setProcessingMode}
        onZeroHandlingChange={setZeroHandling}
        onRankingMetricChange={setRankingMetric}
      />

      <div className="space-y-6">
        {/* Total Points Ranking */}
        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Total Points Ranking</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sortedRankings}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="teamNumber" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#F3F4F6', fontWeight: 600 }}
                  itemStyle={{ color: '#E5E7EB' }}
                  formatter={(value: number, name: string) => [value.toFixed(2), name]}
                />
                <Legend />
                <Bar
                  dataKey={rankingMetric === "epa" ? "totalEPA" : "totalCoral"}
                  name={rankingMetric === "epa" ? "Total EPA" : "Total Game Pieces"}
                  fill="#3B82F6"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Autonomous Performance */}
        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Autonomous Performance</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sortedAutonRankings}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="teamNumber" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#F3F4F6', fontWeight: 600 }}
                  itemStyle={{ color: '#E5E7EB' }}
                  formatter={(value: number, name: string) => [value.toFixed(2), name]}
                />
                <Legend />
                <Bar
                  dataKey="autonL4"
                  name="L4"
                  stackId="a"
                  fill="#8B5CF6"
                />
                <Bar
                  dataKey="autonL3"
                  name="L3"
                  stackId="a"
                  fill="#6366F1"
                />
                <Bar
                  dataKey="autonL2"
                  name="L2"
                  stackId="a"
                  fill="#3B82F6"
                />
                <Bar
                  dataKey="autonL1"
                  name="L1"
                  stackId="a"
                  fill="#60A5FA"
                />
                <Bar
                  dataKey="autonProcessor"
                  name="Processor"
                  stackId="a"
                  fill="#10B981"
                />
                <Bar
                  dataKey="autonBarge"
                  name="Barge"
                  stackId="a"
                  fill="#34D399"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Teleop Performance */}
        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Teleop Performance</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sortedTeleopRankings}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="teamNumber" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#F3F4F6', fontWeight: 600 }}
                  itemStyle={{ color: '#E5E7EB' }}
                  formatter={(value: number, name: string) => [value.toFixed(2), name]}
                />
                <Legend />
                <Bar
                  dataKey="teleopL4"
                  name="L4"
                  stackId="a"
                  fill="#8B5CF6"
                />
                <Bar
                  dataKey="teleopL3"
                  name="L3"
                  stackId="a"
                  fill="#6366F1"
                />
                <Bar
                  dataKey="teleopL2"
                  name="L2"
                  stackId="a"
                  fill="#3B82F6"
                />
                <Bar
                  dataKey="teleopL1"
                  name="L1"
                  stackId="a"
                  fill="#60A5FA"
                />
                <Bar
                  dataKey="teleopProcessor"
                  name="Processor"
                  stackId="a"
                  fill="#10B981"
                />
                <Bar
                  dataKey="teleopBarge"
                  name="Barge"
                  stackId="a"
                  fill="#34D399"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 