"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { getTeamData, calculateTeamAverages, type MatchData } from "@/lib/data-service";
import { DataProcessingControls, ProcessingMode, ZeroHandling } from "@/components/ui/data-processing-controls";
import { getTeamPitData, type PitData } from "@/lib/pit-data-service";
import { useAppContext } from "@/lib/context/AppContext";
import { SearchIcon } from "lucide-react";
import { DataSourceSelector, type DataSource } from "@/components/ui/data-source-selector";

// Icons
import { 
  LayoutDashboard, 
  LineChart, 
  Users, 
  FolderOpen, 
  Database, 
  FileText, 
  FileCode2, 
  Settings, 
  HelpCircle, 
  Plus
} from "lucide-react";

// Add this custom tooltip style object
const tooltipStyle = {
  backgroundColor: '#1F2937',
  border: 'none',
  borderRadius: '8px',
  padding: '12px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
};

const tooltipLabelStyle = {
  color: '#F3F4F6',
  fontWeight: 600,
  marginBottom: '4px',
};

const tooltipItemStyle = {
  color: '#E5E7EB',
  padding: '2px 0',
};

// Add this type for RP data
interface RPStats {
  coopRP: number;
  autoRP: number;
  coralRP: number;
  bargeRP: number;
  totalRP: number;
  avgRPPerMatch: number;
}

export default function TeamPage() {
  const {
    teamNumber,
    setTeamNumber,
    teamData,
    setTeamData,
    teamAverages,
    setTeamAverages,
    pitData,
    setPitData,
    processingMode,
    setProcessingMode,
    zeroHandling,
    setZeroHandling
  } = useAppContext();

  const [dataSource, setDataSource] = useState<DataSource>("live");
  const [isLoading, setIsLoading] = useState(false);

  // Effect to update data when data source, processing mode, or zero handling changes
  useEffect(() => {
    if (teamNumber && teamNumber.trim() !== '') {
      updateTeamData();
    }
  }, [dataSource, processingMode, zeroHandling]);

  const updateTeamData = () => {
    setIsLoading(true);
    try {
      const data = getTeamData(parseInt(teamNumber), dataSource);
      const pit = getTeamPitData(parseInt(teamNumber));
      setTeamData(data);
      setPitData(pit);
      setTeamAverages(calculateTeamAverages(data, processingMode, zeroHandling));
    } catch (error) {
      console.error('Error updating team data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateTeamData();
  };

  const handleDataSourceChange = (newSource: DataSource) => {
    setDataSource(newSource);
  };

  const handleModeChange = (mode: ProcessingMode) => {
    setProcessingMode(mode);
  };

  const handleZeroHandlingChange = (handling: ZeroHandling) => {
    setZeroHandling(handling);
  };

  const prepareCoralData = (matches: MatchData[], phase: 'Auton' | 'Teleop') => {
    return matches.map((match) => ({
      match: `Match ${match["Match-Number"]}`,
      L4: parseInt(match[`${phase}-Coral-L4`]) || 0,
      L3: parseInt(match[`${phase}-Coral-L3`]) || 0,
      L2: parseInt(match[`${phase}-Coral-L2`]) || 0,
      L1: parseInt(match[`${phase}-Coral-L1`]) || 0,
    }));
  };

  const prepareAlgaeData = (matches: MatchData[], phase: 'Auton' | 'Teleop') => {
    return matches.map((match) => ({
      match: `Match ${match["Match-Number"]}`,
      Processor: parseInt(match[`${phase}-Algae-Processor`]) || 0,
      Net: parseInt(match[`${phase === 'Auton' ? 'Auton-Algae-Net' : 'Teleop-Algae-Net'}`]) || 0,
    }));
  };

  const emptyData = Array(5).fill({
    match: "No Data",
    L1: 0,
    L2: 0,
    L3: 0,
    L4: 0,
    Processor: 0,
    Net: 0,
  });

  const getClimbStatus = (status: string) => {
    switch (status) {
      case 'p': return '🅿️ Parked';
      case 'n': return '❌ Not Attempted';
      case 's': return '🔵 Shallow';
      case 'd': return '🟣 Deep';
      case 'x': return '❌ Failed';
      default: return '❓ Unknown';
    }
  };

  // Add RP calculation function
  const calculateRPStats = (matches: MatchData[]): RPStats => {
    if (!matches || matches.length === 0) return {
      coopRP: 0,
      autoRP: 0,
      coralRP: 0,
      bargeRP: 0,
      totalRP: 0,
      avgRPPerMatch: 0
    };

    const coopRP = matches.filter(m => {
      // At least 2 Algae scored in each Processor
      const autonProcessor = parseInt(m["Auton-Algae-Processor"]) || 0;
      const teleopProcessor = parseInt(m["Teleop-Algae-Processor"]) || 0;
      return autonProcessor >= 2 && teleopProcessor >= 2;
    }).length;

    const autoRP = matches.filter(m => {
      // At least 1 Coral scored in Auto
      const autoCorals = (parseInt(m["Auton-Coral-L1"]) || 0) +
                        (parseInt(m["Auton-Coral-L2"]) || 0) +
                        (parseInt(m["Auton-Coral-L3"]) || 0) +
                        (parseInt(m["Auton-Coral-L4"]) || 0);
      return autoCorals > 0;
    }).length;

    const coralRP = matches.filter(m => {
      // At least 3 Coral scored per level
      const l1Total = (parseInt(m["Auton-Coral-L1"]) || 0) + (parseInt(m["Teleop-Coral-L1"]) || 0);
      const l2Total = (parseInt(m["Auton-Coral-L2"]) || 0) + (parseInt(m["Teleop-Coral-L2"]) || 0);
      const l3Total = (parseInt(m["Auton-Coral-L3"]) || 0) + (parseInt(m["Teleop-Coral-L3"]) || 0);
      const l4Total = (parseInt(m["Auton-Coral-L4"]) || 0) + (parseInt(m["Teleop-Coral-L4"]) || 0);
      return l1Total >= 3 && l2Total >= 3 && l3Total >= 3 && l4Total >= 3;
    }).length;

    const bargeRP = matches.filter(m => {
      // At least 14 Barge points
      const bargePoints = ((parseInt(m["Auton-Algae-Net"]) || 0) + 
                          (parseInt(m["Teleop-Algae-Net"]) || 0)) * 4;
      return bargePoints >= 14;
    }).length;

    const totalRP = coopRP + autoRP + coralRP + bargeRP;
    const avgRPPerMatch = totalRP / matches.length;

    return {
      coopRP,
      autoRP,
      coralRP,
      bargeRP,
      totalRP,
      avgRPPerMatch
    };
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="flex items-center justify-between relative">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white">Team Analysis</h1>
            <p className="text-gray-400 mt-2">Analyze performance metrics for a specific team</p>
          </div>
          {/* Absolute positioning for centered data source selector */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <DataSourceSelector
              currentSource={dataSource}
              onSourceChange={handleDataSourceChange}
            />
          </div>
          <form onSubmit={handleSubmit} className="flex gap-4 items-center">
            <Input
              type="number"
              placeholder="Enter team number..."
              value={teamNumber}
              onChange={(e) => setTeamNumber(e.target.value)}
              className="max-w-[200px] bg-[#1A1A1A] border-gray-800 text-white"
            />
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Loading...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <SearchIcon className="w-4 h-4" />
                  Search
                </span>
              )}
            </Button>
          </form>
        </div>

        <DataProcessingControls
          onModeChange={handleModeChange}
          onZeroHandlingChange={handleZeroHandlingChange}
          currentMode={processingMode}
          currentZeroHandling={zeroHandling}
        />

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="bg-[#1A1A1A] border-gray-800">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-white">Total Matches</CardTitle>
              <CardDescription className="text-gray-400">Matches scouted</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{teamAverages?.totalMatches || 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-[#1A1A1A] border-gray-800">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-white">Successful Climbs</CardTitle>
              <CardDescription className="text-gray-400">Total successful climbs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{teamAverages?.successfulClimbs || 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-[#1A1A1A] border-gray-800">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-white">L4 Scoring</CardTitle>
              <CardDescription className="text-gray-400">Average L4 corals per match</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {((teamAverages?.autonL4Average || 0) + (teamAverages?.teleopL4Average || 0)).toFixed(1)}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#1A1A1A] border-gray-800">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-white">Reliability</CardTitle>
              <CardDescription className="text-gray-400">Matches without issues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {teamAverages ? 
                  `${(((teamAverages.totalMatches - teamAverages.diedMatches - teamAverages.tippedMatches) / teamAverages.totalMatches) * 100).toFixed(0)}%` 
                  : '0%'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Statistics */}
        <Card className="bg-[#1A1A1A] border-gray-800 mt-12">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl text-white">Detailed Statistics</CardTitle>
            <CardDescription className="text-gray-400">Comprehensive performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {/* Autonomous Stats */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Autonomous</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">L4 Average:</span>
                    <span className="text-white">{teamAverages?.autonL4Average.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">L3 Average:</span>
                    <span className="text-white">{teamAverages?.autonL3Average.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">L2 Average:</span>
                    <span className="text-white">{teamAverages?.autonL2Average.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">L1 Average:</span>
                    <span className="text-white">{teamAverages?.autonL1Average.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Algae Processor:</span>
                    <span className="text-white">{teamAverages?.autonAlgaeProcessor.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Algae Net:</span>
                    <span className="text-white">{teamAverages?.autonAlgaeNet.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Score:</span>
                    <span className="text-white font-bold">{teamAverages?.totalAutonScore.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>

              {/* Teleop Stats */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Teleop</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">L4 Average:</span>
                    <span className="text-white">{teamAverages?.teleopL4Average.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">L3 Average:</span>
                    <span className="text-white">{teamAverages?.teleopL3Average.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">L2 Average:</span>
                    <span className="text-white">{teamAverages?.teleopL2Average.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">L1 Average:</span>
                    <span className="text-white">{teamAverages?.teleopL1Average.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Algae Processor:</span>
                    <span className="text-white">{teamAverages?.teleopAlgaeProcessor.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Algae Net:</span>
                    <span className="text-white">{teamAverages?.teleopAlgaeNet.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Score:</span>
                    <span className="text-white font-bold">{teamAverages?.totalTeleopScore.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>

              {/* Performance Stats */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Performance</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Climb Attempts:</span>
                    <span className="text-white">{teamAverages?.climbAttempts || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Successful Climbs:</span>
                    <span className="text-white">{teamAverages?.successfulClimbs || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Driver Skill:</span>
                    <span className="text-white">{teamAverages?.driverSkillAverage.toFixed(2) || '0.00'}/3.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Defense Rating:</span>
                    <span className="text-white">{teamAverages?.defenseRatingAverage.toFixed(2) || '0.00'}/3.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Times Died:</span>
                    <span className="text-white">{teamAverages?.diedMatches || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Times Tipped:</span>
                    <span className="text-white">{teamAverages?.tippedMatches || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Algae Score:</span>
                    <span className="text-white font-bold">{teamAverages?.totalAlgaeScore.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          <Card className="bg-[#1A1A1A] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Autonomous Coral Scoring</CardTitle>
              <CardDescription className="text-gray-400">L1-L4 scoring by match</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamData ? prepareCoralData(teamData, 'Auton') : emptyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="match" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={tooltipStyle}
                    labelStyle={tooltipLabelStyle}
                    itemStyle={tooltipItemStyle}
                  />
                  <Legend />
                  <Bar dataKey="L4" stackId="a" fill="#8B5CF6" />
                  <Bar dataKey="L3" stackId="a" fill="#6366F1" />
                  <Bar dataKey="L2" stackId="a" fill="#3B82F6" />
                  <Bar dataKey="L1" stackId="a" fill="#60A5FA" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1A1A] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Teleop Coral Scoring</CardTitle>
              <CardDescription className="text-gray-400">L1-L4 scoring by match</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamData ? prepareCoralData(teamData, 'Teleop') : emptyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="match" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={tooltipStyle}
                    labelStyle={tooltipLabelStyle}
                    itemStyle={tooltipItemStyle}
                  />
                  <Legend />
                  <Bar dataKey="L4" stackId="a" fill="#8B5CF6" />
                  <Bar dataKey="L3" stackId="a" fill="#6366F1" />
                  <Bar dataKey="L2" stackId="a" fill="#3B82F6" />
                  <Bar dataKey="L1" stackId="a" fill="#60A5FA" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1A1A] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Autonomous Algae Processing</CardTitle>
              <CardDescription className="text-gray-400">Processor vs Net scoring</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamData ? prepareAlgaeData(teamData, 'Auton') : emptyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="match" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={tooltipStyle}
                    labelStyle={tooltipLabelStyle}
                    itemStyle={tooltipItemStyle}
                  />
                  <Legend />
                  <Bar dataKey="Processor" stackId="a" fill="#10B981" />
                  <Bar dataKey="Net" stackId="a" fill="#34D399" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1A1A] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Teleop Algae Processing</CardTitle>
              <CardDescription className="text-gray-400">Processor vs Net scoring</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamData ? prepareAlgaeData(teamData, 'Teleop') : emptyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="match" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={tooltipStyle}
                    labelStyle={tooltipLabelStyle}
                    itemStyle={tooltipItemStyle}
                  />
                  <Legend />
                  <Bar dataKey="Processor" stackId="a" fill="#10B981" />
                  <Bar dataKey="Net" stackId="a" fill="#34D399" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* RP Statistics */}
        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Ranking Point Analysis</CardTitle>
            <CardDescription className="text-gray-400">Performance in achieving ranking points</CardDescription>
          </CardHeader>
          <CardContent>
            {teamData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">RP Achievement</h3>
                  <div className="bg-gray-900 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Coopertition RP</span>
                      <span className="text-white font-medium">{calculateRPStats(teamData).coopRP}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Auto RP</span>
                      <span className="text-white font-medium">{calculateRPStats(teamData).autoRP}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Coral RP</span>
                      <span className="text-white font-medium">{calculateRPStats(teamData).coralRP}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Barge RP</span>
                      <span className="text-white font-medium">{calculateRPStats(teamData).bargeRP}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">RP Statistics</h3>
                  <div className="bg-gray-900 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total RPs</span>
                      <span className="text-white font-medium">{calculateRPStats(teamData).totalRP}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Average RP/Match</span>
                      <span className="text-white font-medium">
                        {calculateRPStats(teamData).avgRPPerMatch.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                Enter a team number to view RP statistics
              </div>
            )}
          </CardContent>
        </Card>

        {/* Match History Table - Modified to remove extra scrollbar */}
        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Match History</CardTitle>
            <CardDescription className="text-gray-400">Detailed match data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="table-scroll-container">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-800">
                    <TableHead className="text-gray-300">Scouter</TableHead>
                    <TableHead className="text-gray-300">Event</TableHead>
                    <TableHead className="text-gray-300">Match Level</TableHead>
                    <TableHead className="text-gray-300">Match Number</TableHead>
                    <TableHead className="text-gray-300">Robot</TableHead>
                    <TableHead className="text-gray-300">Team Number</TableHead>
                    <TableHead className="text-gray-300">Auton Position</TableHead>
                    <TableHead className="text-gray-300">Auton Leave Start</TableHead>
                    <TableHead className="text-gray-300">Auton L4</TableHead>
                    <TableHead className="text-gray-300">Auton L3</TableHead>
                    <TableHead className="text-gray-300">Auton L2</TableHead>
                    <TableHead className="text-gray-300">Auton L1</TableHead>
                    <TableHead className="text-gray-300">Algae Removed from Reef</TableHead>
                    <TableHead className="text-gray-300">Auton Algae Processor</TableHead>
                    <TableHead className="text-gray-300">Auton Algae Net</TableHead>
                    <TableHead className="text-gray-300">Teleop L4</TableHead>
                    <TableHead className="text-gray-300">Teleop L3</TableHead>
                    <TableHead className="text-gray-300">Teleop L2</TableHead>
                    <TableHead className="text-gray-300">Teleop L1</TableHead>
                    <TableHead className="text-gray-300">Teleop Removed from Reef</TableHead>
                    <TableHead className="text-gray-300">Teleop Algae Processor</TableHead>
                    <TableHead className="text-gray-300">Teleop Algae Net</TableHead>
                    <TableHead className="text-gray-300">Defense Played</TableHead>
                    <TableHead className="text-gray-300">Ground Pickup</TableHead>
                    <TableHead className="text-gray-300">Climb Status</TableHead>
                    <TableHead className="text-gray-300">No Climb Reason</TableHead>
                    <TableHead className="text-gray-300">Driver Skill</TableHead>
                    <TableHead className="text-gray-300">Defense Rating</TableHead>
                    <TableHead className="text-gray-300">Died</TableHead>
                    <TableHead className="text-gray-300">Tipped</TableHead>
                    <TableHead className="text-gray-300 min-w-[200px]">Comments</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamData ? (
                    teamData.map((match: MatchData, index: number) => (
                      <TableRow key={index} className="border-gray-800">
                        <TableCell className="text-gray-300">{match.Scouter}</TableCell>
                        <TableCell className="text-gray-300">{match.Event}</TableCell>
                        <TableCell className="text-gray-300">{match["Match-Level"]}</TableCell>
                        <TableCell className="text-gray-300">{match["Match-Number"]}</TableCell>
                        <TableCell className="text-gray-300">{match.Robot.startsWith('r') ? '🔴 Red' : '🔵 Blue'} {match.Robot}</TableCell>
                        <TableCell className="text-gray-300">{match["Team-Number"]}</TableCell>
                        <TableCell className="text-gray-300">{match["Auton-Position"]}</TableCell>
                        <TableCell className="text-gray-300">{match["Auton-Leave-Start"]}</TableCell>
                        <TableCell className="text-gray-300">{match["Auton-Coral-L4"]}</TableCell>
                        <TableCell className="text-gray-300">{match["Auton-Coral-L3"]}</TableCell>
                        <TableCell className="text-gray-300">{match["Auton-Coral-L2"]}</TableCell>
                        <TableCell className="text-gray-300">{match["Auton-Coral-L1"]}</TableCell>
                        <TableCell className="text-gray-300">{match["Algae-Removed- from-Reef"]}</TableCell>
                        <TableCell className="text-gray-300">{match["Auton-Algae-Processor"]}</TableCell>
                        <TableCell className="text-gray-300">{match["Auton-Algae-Net"]}</TableCell>
                        <TableCell className="text-gray-300">{match["Teleop-Coral-L4"]}</TableCell>
                        <TableCell className="text-gray-300">{match["Teleop-Coral-L3"]}</TableCell>
                        <TableCell className="text-gray-300">{match["Teleop-Coral-L2"]}</TableCell>
                        <TableCell className="text-gray-300">{match["Teleop-Coral-L1"]}</TableCell>
                        <TableCell className="text-gray-300">{match["TeleOp-Removed- from-Reef"]}</TableCell>
                        <TableCell className="text-gray-300">{match["Teleop-Algae-Processor"]}</TableCell>
                        <TableCell className="text-gray-300">{match["Teleop-Algae-Net"]}</TableCell>
                        <TableCell className="text-gray-300">{match["Defense-Played-on-Robot"]}</TableCell>
                        <TableCell className="text-gray-300">{match["Ground-Pick-Up"]}</TableCell>
                        <TableCell className="text-gray-300">{getClimbStatus(match["Climb-Status"])}</TableCell>
                        <TableCell className="text-gray-300">{match["No-Climb-Reason"]}</TableCell>
                        <TableCell className="text-gray-300">{match["Driver-Skill"]}</TableCell>
                        <TableCell className="text-gray-300">{match["Defense-Rating"]}</TableCell>
                        <TableCell className="text-gray-300">{match["Died-YN"]}</TableCell>
                        <TableCell className="text-gray-300">{match["Tipped-YN"]}</TableCell>
                        <TableCell className="text-gray-300 min-w-[200px]">{match.Comments}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow className="border-gray-800">
                      <TableCell colSpan={31} className="text-center py-4 text-gray-400">
                        Enter a team number to view match data
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pit Scouting Data */}
        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Pit Scouting Data</CardTitle>
            <CardDescription className="text-gray-400">Technical specifications and capabilities</CardDescription>
          </CardHeader>
          <CardContent>
            {pitData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Physical Specifications */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <span className="w-3 h-3 rounded-full bg-purple-500 mr-2"></span>
                      Physical Specifications
                    </h3>
                    <div className="bg-gray-900 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Drivetrain</span>
                        <span className="text-white font-medium">{pitData.physical.drivetrainType}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Dimensions</span>
                        <span className="text-white font-medium">{pitData.physical.robotWidth} × {pitData.physical.robotLength}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Weight</span>
                        <span className="text-white font-medium">{pitData.physical.robotWeight}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Ground Clearance</span>
                        <span className="text-white font-medium">{pitData.physical.groundClearance}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mechanisms */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                      Mechanisms
                    </h3>
                    <div className="bg-gray-900 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Intake Type</span>
                        <span className="text-white font-medium">{pitData.mechanisms.intakeType}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Intake Location</span>
                        <span className="text-white font-medium">{pitData.mechanisms.intakeLocation}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Scoring Mechanism</span>
                        <span className="text-white font-medium">{pitData.mechanisms.scoringMechanism}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Max Reach</span>
                        <span className="text-white font-medium">{pitData.mechanisms.maxReach}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Climbing</span>
                        <span className="text-white font-medium">{pitData.mechanisms.climbingCapability}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Electronics & Software */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                      Electronics & Software
                    </h3>
                    <div className="bg-gray-900 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Controller</span>
                        <span className="text-white font-medium">{pitData.electronics.mainController}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Motor Controllers</span>
                        <span className="text-white font-medium">{pitData.electronics.motorControllers}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Vision</span>
                        <span className="text-white font-medium">{pitData.software.visionSystem}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Language</span>
                        <span className="text-white font-medium">{pitData.software.programmingLanguage}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Strategy */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
                      Strategy
                    </h3>
                    <div className="bg-gray-900 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Primary Role</span>
                        <span className="text-white font-medium">{pitData.strategy.primaryRole}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Secondary Role</span>
                        <span className="text-white font-medium">{pitData.strategy.secondaryRole}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Preferred Start</span>
                        <span className="text-white font-medium">{pitData.strategy.preferredStartingPosition}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Special Features */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                      Special Features
                    </h3>
                    <div className="bg-gray-900 rounded-lg p-4">
                      <div className="flex flex-wrap gap-2">
                        {pitData.strategy.specialFeatures.map((feature: string, index: number) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gray-800 text-white rounded-full text-sm"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Maintenance */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <span className="w-3 h-3 rounded-full bg-orange-500 mr-2"></span>
                      Maintenance
                    </h3>
                    <div className="bg-gray-900 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Battery Count</span>
                        <span className="text-white font-medium">{pitData.maintenance.batteryCount}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Repair Time</span>
                        <span className="text-white font-medium">{pitData.maintenance.averageRepairTime}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Schedule</span>
                        <span className="text-white font-medium">{pitData.maintenance.maintenanceSchedule}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                Enter a team number to view pit scouting data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Version display */}
      <div className="fixed bottom-4 right-4">
        <span className="text-gray-400 text-sm">SC1</span>
      </div>
    </div>
  );
} 