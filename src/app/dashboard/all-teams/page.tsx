"use client";

import { useState, useEffect, useCallback } from "react";
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
import { useAppContext } from "@/lib/context/AppContext";
import { DataSourceSelector, type DataSource } from "@/components/ui/data-source-selector";
import { FrostedBarCursor } from "@/components/charts/FrostedBarCursor";
import {
  frostedTooltipContentStyle,
  frostedTooltipItemStyle,
  frostedTooltipLabelStyle,
} from "@/components/charts/frostedTooltipStyles";

export default function AllTeamsPage() {
  const {
    processingMode,
    setProcessingMode,
    zeroHandling,
    setZeroHandling,
    rankingMetric,
    setRankingMetric
  } = useAppContext();

  const [dataSource, setDataSource] = useState<DataSource>("live");
  const [rankings, setRankings] = useState<any[]>([]);

  const updateRankings = useCallback(() => {
    const updatedRankings = getAllTeamsRankings(processingMode, zeroHandling, dataSource);
    setRankings(updatedRankings);
    console.log("Team rankings with defense ratings:", updatedRankings.map(r => ({ 
      team: r.teamNumber, 
      defense: r.defenseRating,
      dataSource: dataSource
    })));
    
    const teamsWithDefense = updatedRankings.filter(r => r.defenseRating > 0);
    console.log(`Found ${teamsWithDefense.length} teams with non-zero defense ratings out of ${updatedRankings.length} total teams`);
    if (teamsWithDefense.length > 0) {
      console.log("Teams with defense ratings:", teamsWithDefense.map(r => ({ 
        team: r.teamNumber, 
        defense: r.defenseRating 
      })));
    }
  }, [processingMode, zeroHandling, dataSource]);

  useEffect(() => {
    updateRankings();
  }, [updateRankings]);

  const handleModeChange = (mode: ProcessingMode) => {
    setProcessingMode(mode);
  };

  const handleZeroHandlingChange = (handling: ZeroHandling) => {
    setZeroHandling(handling);
  };

  const handleRankingMetricChange = (metric: RankingMetric) => {
    setRankingMetric(metric);
  };

  const handleDataSourceChange = (newSource: DataSource) => {
    setDataSource(newSource);
  };

  const chartData = [...rankings]
    .sort((a, b) => {
      if (rankingMetric === "epa") {
        return b.totalEPA - a.totalEPA;
      }
      return b.totalCoral - a.totalCoral;
    })
    .map(team => ({
      team: team.teamNumber,
      Autonomous: team.autonEPA,
      Teleop: team.teleopEPA,
      total: team.totalEPA,
    }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) {
      return null;
    }

    const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);

    return (
      <div style={frostedTooltipContentStyle}>
        <div style={frostedTooltipLabelStyle}>Team {label}</div>
        <div style={{ display: 'grid', gap: '6px' }}>
          {payload.map((entry: any) => (
            <div key={entry.name} style={{ ...frostedTooltipItemStyle, color: entry.color }}>
              <span
                style={{
                  display: 'inline-flex',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: entry.color,
                  opacity: 0.9,
                }}
              />
              <span style={{ color: '#F8FAFC' }}>{entry.name}</span>
              <span style={{ marginLeft: 'auto', color: '#E2E8F0' }}>{entry.value.toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: '12px',
            paddingTop: '10px',
            borderTop: '1px solid rgba(148, 163, 184, 0.25)',
            fontWeight: 600,
            fontSize: '13px',
            color: '#F8FAFC',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>Total EPA</span>
          <span>{total.toFixed(2)}</span>
        </div>
      </div>
    );
  };

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
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="flex justify-between items-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white">All Teams Analysis</h1>
            <p className="text-gray-400 mt-2">Compare performance metrics across all teams</p>
          </div>
          <DataSourceSelector
            currentSource={dataSource}
            onSourceChange={handleDataSourceChange}
          />
        </div>

        <AllTeamsDataControls
          onModeChange={handleModeChange}
          onZeroHandlingChange={handleZeroHandlingChange}
          onRankingMetricChange={handleRankingMetricChange}
          currentMode={processingMode}
          currentZeroHandling={zeroHandling}
          currentRankingMetric={rankingMetric}
        />

        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">EPA Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[600px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="team" 
                    stroke="#9CA3AF"
                    label={{ value: 'Team Number', position: 'insideBottom', offset: -5, fill: '#9CA3AF' }}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    label={{ value: 'EPA Points', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={<FrostedBarCursor />} />
                  <Legend wrapperStyle={{ color: '#F3F4F6' }} />
                  <Bar dataKey="Autonomous" stackId="a" fill="#2F5AA8" />
                  <Bar dataKey="Teleop" stackId="a" fill="#34D399" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-[#1A1A1A] border-gray-800">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Total Points Ranking</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={rankings}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="teamNumber" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={frostedTooltipContentStyle}
                    labelStyle={frostedTooltipLabelStyle}
                    itemStyle={frostedTooltipItemStyle}
                    formatter={(value: number, name: string) => [value.toFixed(2), name]}
                    cursor={<FrostedBarCursor />}
                  />
                  <Legend wrapperStyle={{ color: '#F3F4F6' }} />
                  <Bar
                    dataKey={rankingMetric === "epa" ? "totalEPA" : "totalCoral"}
                    name={rankingMetric === "epa" ? "Total EPA" : "Total Game Pieces"}
                    fill="#264A8A"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

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
                    contentStyle={frostedTooltipContentStyle}
                    labelStyle={frostedTooltipLabelStyle}
                    itemStyle={frostedTooltipItemStyle}
                    formatter={(value: number, name: string) => [value.toFixed(2), name]}
                    cursor={<FrostedBarCursor />}
                  />
                  <Legend wrapperStyle={{ color: '#F3F4F6' }} />
                  <Bar
                    dataKey="autonL4"
                    name="L4"
                    stackId="a"
                    fill="#16294F"
                  />
                  <Bar
                    dataKey="autonL3"
                    name="L3"
                    stackId="a"
                    fill="#1F3B73"
                  />
                  <Bar
                    dataKey="autonL2"
                    name="L2"
                    stackId="a"
                    fill="#264A8A"
                  />
                  <Bar
                    dataKey="autonL1"
                    name="L1"
                    stackId="a"
                    fill="#2F5AA8"
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
                    contentStyle={frostedTooltipContentStyle}
                    labelStyle={frostedTooltipLabelStyle}
                    itemStyle={frostedTooltipItemStyle}
                    formatter={(value: number, name: string) => [value.toFixed(2), name]}
                    cursor={<FrostedBarCursor />}
                  />
                  <Legend wrapperStyle={{ color: '#F3F4F6' }} />
                  <Bar
                    dataKey="teleopL4"
                    name="L4"
                    stackId="a"
                    fill="#16294F"
                  />
                  <Bar
                    dataKey="teleopL3"
                    name="L3"
                    stackId="a"
                    fill="#1F3B73"
                  />
                  <Bar
                    dataKey="teleopL2"
                    name="L2"
                    stackId="a"
                    fill="#264A8A"
                  />
                  <Bar
                    dataKey="teleopL1"
                    name="L1"
                    stackId="a"
                    fill="#2F5AA8"
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

          <Card className="bg-[#1A1A1A] border-gray-800">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Defensive Rating</CardTitle>
              <p className="text-gray-400">Average defensive rating across all matches (0-3 scale)</p>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[...rankings]
                    .filter(team => team.defenseRating > 0)
                    .sort((a, b) => b.defenseRating - a.defenseRating)}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="teamNumber" stroke="#9CA3AF" />
                  <YAxis 
                    stroke="#9CA3AF" 
                    domain={[0, 3]}
                    ticks={[0, 1, 2, 3]}
                    tickFormatter={(value) => {
                      if (value === 0) return 'Poor';
                      if (value === 1) return 'Fair';
                      if (value === 2) return 'Good';
                      if (value === 3) return 'Excellent';
                      return value.toString();
                    }}
                  />
                  <Tooltip 
                    contentStyle={frostedTooltipContentStyle}
                    labelStyle={frostedTooltipLabelStyle}
                    itemStyle={frostedTooltipItemStyle}
                    formatter={(value: number) => {
                      const rating = value.toFixed(2);
                      let label = 'Poor';
                      if (value >= 2.5) label = 'Excellent';
                      else if (value >= 1.5) label = 'Good';
                      else if (value >= 0.5) label = 'Fair';
                      return [`${rating} - ${label}`, 'Defense Rating'];
                    }}
                    cursor={<FrostedBarCursor />}
                  />
                  <Legend wrapperStyle={{ color: '#F3F4F6' }} />
                  <Bar
                    dataKey="defenseRating"
                    name="Defense Rating"
                    fill="#F59E0B"
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 
