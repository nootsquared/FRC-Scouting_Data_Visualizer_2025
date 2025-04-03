"use client";

import { useState, useEffect } from "react";
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
import { AllTeamsDataControls } from "@/components/ui/all-teams-data-controls";
import { getAllTeamsRankings } from "@/lib/all-teams-service";
import { useAppContext } from "@/lib/context/AppContext";
import { DataSourceSelector, type DataSource } from "@/components/ui/data-source-selector";

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

  // Update rankings when data source, processing mode, or zero handling changes
  useEffect(() => {
    const updatedRankings = getAllTeamsRankings(processingMode, zeroHandling, dataSource);
    setRankings(updatedRankings);
    console.log("Team rankings with defense ratings:", updatedRankings.map(r => ({ 
      team: r.teamNumber, 
      defense: r.defenseRating,
      dataSource: dataSource
    })));
    
    // Check if any teams have non-zero defense ratings
    const teamsWithDefense = updatedRankings.filter(r => r.defenseRating > 0);
    console.log(`Found ${teamsWithDefense.length} teams with non-zero defense ratings out of ${updatedRankings.length} total teams`);
    if (teamsWithDefense.length > 0) {
      console.log("Teams with defense ratings:", teamsWithDefense.map(r => ({ 
        team: r.teamNumber, 
        defense: r.defenseRating 
      })));
    }
  }, [dataSource, processingMode, zeroHandling]);

  // Sort rankings based on the selected metric and prepare data for stacked bar chart
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

  // Custom tooltip for the stacked bar chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1A1A1A] border border-gray-800 rounded-lg p-3">
          <p className="text-white font-medium">Team {label}</p>
          {payload.map((entry: any) => (
            <p key={entry.name} style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(2)}
            </p>
          ))}
          <p className="text-white mt-1 border-t border-gray-800 pt-1">
            Total EPA: {payload.reduce((sum: number, entry: any) => sum + entry.value, 0).toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
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

  // Handle data source changes
  const handleDataSourceChange = (newSource: DataSource) => {
    setDataSource(newSource);
  };

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
          onModeChange={setProcessingMode}
          onZeroHandlingChange={setZeroHandling}
          onRankingMetricChange={setRankingMetric}
          currentMode={processingMode}
          currentZeroHandling={zeroHandling}
          currentRankingMetric={rankingMetric}
        />

        {/* EPA Rankings Chart */}
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
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="Autonomous" stackId="a" fill="#60A5FA" />
                  <Bar dataKey="Teleop" stackId="a" fill="#34D399" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Total Points Ranking */}
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

          {/* Defensive Rating */}
          <Card className="bg-[#1A1A1A] border-gray-800">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Defensive Rating</CardTitle>
              <p className="text-gray-400">Average defensive rating across all matches (0-3 scale)</p>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[...rankings]
                    .filter(team => team.defenseRating > 0 || dataSource === "live")
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
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                    labelStyle={{ color: '#F3F4F6', fontWeight: 600 }}
                    itemStyle={{ color: '#E5E7EB' }}
                    formatter={(value: number) => {
                      if (value === 0) return ['Poor', 'Defense Rating'];
                      if (value === 1) return ['Fair', 'Defense Rating'];
                      if (value === 2) return ['Good', 'Defense Rating'];
                      if (value === 3) return ['Excellent', 'Defense Rating'];
                      return [value.toFixed(2), 'Defense Rating'];
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="defenseRating"
                    name="Defense Rating"
                    fill="#F59E0B"
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