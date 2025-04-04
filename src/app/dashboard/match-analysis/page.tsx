"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataSourceSelector, type DataSource } from "@/components/ui/data-source-selector";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getTeamData, calculateTeamAverages, type MatchData } from "@/lib/data-service";
import { ProcessingMode, ZeroHandling } from "@/components/ui/data-processing-controls";
import { DataProcessingControls } from "@/components/ui/data-processing-controls";
import { useAppContext } from "@/lib/context/AppContext";

// Define the TBA API response types
interface TBAMatch {
  key: string;
  match_number: number;
  alliances: {
    red: {
      team_keys: string[];
      score: number;
    };
    blue: {
      team_keys: string[];
      score: number;
    };
  };
}

// Define team EPA data
interface TeamEPAData {
  teamNumber: string;
  epa: number;
}

// Define alliance EPA data
interface AllianceEPAData {
  teams: TeamEPAData[];
  totalEPA: number;
  winPercentage: number;
}

// Define EPA calculation methods
type EPACalculationMethod = "average" | "median" | "highest" | "lowest";

// Define team prediction data
interface TeamPredictionData {
  teamNumber: string;
  auton: {
    l4: number;
    l3: number;
    l2: number;
    l1: number;
    barge: number;
    processor: number;
    expectedPoints: number;
  };
  teleop: {
    l4: number;
    l3: number;
    l2: number;
    l1: number;
    barge: number;
    processor: number;
    expectedPoints: number;
  };
  endgame: {
    climbPrediction: 'p' | 'd' | 's' | 'n' | 'x';
    expectedPoints: number;
  };
  totalExpectedPoints: number;
  hasEnoughData: boolean;
  matchCount: number;
}

// Define alliance prediction data
interface AlliancePredictionData {
  teams: TeamPredictionData[];
  totalExpectedScore: number;
  winPercentage: number;
}

export default function MatchAnalysisPage() {
  const router = useRouter();
  const {
    processingMode,
    setProcessingMode,
    zeroHandling,
    setZeroHandling
  } = useAppContext();
  const [matchNumber, setMatchNumber] = useState<string>("");
  const [matchData, setMatchData] = useState<TBAMatch | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<DataSource>("live");
  const [tbaKey, setTbaKey] = useState<string>("");
  const [eventCode, setEventCode] = useState<string>("");
  const [redAllianceData, setRedAllianceData] = useState<AlliancePredictionData>({ teams: [], totalExpectedScore: 0, winPercentage: 0 });
  const [blueAllianceData, setBlueAllianceData] = useState<AlliancePredictionData>({ teams: [], totalExpectedScore: 0, winPercentage: 0 });

  // Load saved values from localStorage
  useEffect(() => {
    const savedKey = localStorage.getItem('tbaKey');
    const savedEventCode = localStorage.getItem('eventCode');
    const savedMatchNumber = localStorage.getItem('matchAnalysisMatchNumber');
    const savedMatchData = localStorage.getItem('matchAnalysisData');
    const savedRedAllianceData = localStorage.getItem('matchAnalysisRedAllianceData');
    const savedBlueAllianceData = localStorage.getItem('matchAnalysisBlueAllianceData');
    
    if (savedKey) setTbaKey(savedKey);
    if (savedEventCode) {
      setEventCode(savedEventCode);
    } else {
      setEventCode("2024onosh");
    }
    if (savedMatchNumber) setMatchNumber(savedMatchNumber);
    if (savedMatchData) setMatchData(JSON.parse(savedMatchData));
    if (savedRedAllianceData) setRedAllianceData(JSON.parse(savedRedAllianceData));
    if (savedBlueAllianceData) setBlueAllianceData(JSON.parse(savedBlueAllianceData));
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    if (matchNumber) localStorage.setItem('matchAnalysisMatchNumber', matchNumber);
    if (matchData) localStorage.setItem('matchAnalysisData', JSON.stringify(matchData));
    if (redAllianceData) localStorage.setItem('matchAnalysisRedAllianceData', JSON.stringify(redAllianceData));
    if (blueAllianceData) localStorage.setItem('matchAnalysisBlueAllianceData', JSON.stringify(blueAllianceData));
  }, [matchNumber, matchData, redAllianceData, blueAllianceData]);

  // Memoize the processTeamPredictions function to prevent unnecessary re-renders
  const processTeamPredictions = useCallback((matchData: TBAMatch) => {
    // Get team numbers from the match data
    const redTeamNumbers = matchData.alliances.red.team_keys.map(key => key.replace("frc", ""));
    const blueTeamNumbers = matchData.alliances.blue.team_keys.map(key => key.replace("frc", ""));
    
    // Process predictions for each team
    const redTeamPredictions = redTeamNumbers.map(teamNumber => generateTeamPrediction(teamNumber, dataSource, processingMode, zeroHandling));
    const blueTeamPredictions = blueTeamNumbers.map(teamNumber => generateTeamPrediction(teamNumber, dataSource, processingMode, zeroHandling));
    
    // Calculate total expected scores
    const redTotalScore = redTeamPredictions.reduce((sum, team) => sum + team.totalExpectedPoints, 0);
    const blueTotalScore = blueTeamPredictions.reduce((sum, team) => sum + team.totalExpectedPoints, 0);
    
    // Calculate win percentage
    const redWinPercentage = calculateWinPercentage(redTotalScore, blueTotalScore);
    const blueWinPercentage = 100 - redWinPercentage;
    
    // Update state
    setRedAllianceData({
      teams: redTeamPredictions,
      totalExpectedScore: redTotalScore,
      winPercentage: redWinPercentage
    });
    
    setBlueAllianceData({
      teams: blueTeamPredictions,
      totalExpectedScore: blueTotalScore,
      winPercentage: blueWinPercentage
    });
  }, [dataSource, processingMode, zeroHandling]);

  // Function to fetch match data from TBA API
  const fetchMatchData = async () => {
    if (!matchNumber) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Use the TBA API key from localStorage
      if (!tbaKey) {
        throw new Error("TBA API key not found. Please set it in the Targeted Planning page.");
      }
      
      if (!eventCode) {
        throw new Error("Event code not found. Please set it in the Targeted Planning page.");
      }
      
      console.log(`Fetching match data for ${eventCode}_qm${matchNumber} with key: ${tbaKey.substring(0, 5)}...`);
      
      const response = await fetch(
        `https://www.thebluealliance.com/api/v3/match/${eventCode}_qm${matchNumber}`,
        {
          headers: {
            "X-TBA-Auth-Key": tbaKey,
          },
        }
      );
      
      if (!response.ok) {
        console.error(`API error: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error(`Error response: ${errorText}`);
        throw new Error(`Failed to fetch match data: ${response.statusText} (${response.status})`);
      }
      
      const data = await response.json();
      console.log("Match data received:", data);
      setMatchData(data);
    } catch (err) {
      console.error("Error fetching match data:", err);
      setError(`Failed to fetch match data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to check if there's enough data for a team
  const hasEnoughData = (teamData: MatchData[]): boolean => {
    // Consider having at least 3 matches as enough data
    return teamData.length >= 3;
  };

  // Function to generate team predictions
  const generateTeamPrediction = (teamNumber: string, dataSource: DataSource, method: ProcessingMode, zeroHandling: ZeroHandling): TeamPredictionData => {
    // Get team data from the data service
    const teamData = getTeamData(parseInt(teamNumber), dataSource);
    const averages = calculateTeamAverages(teamData, method, zeroHandling);
    
    // Check if we have enough data
    const enoughData = hasEnoughData(teamData);
    
    // For autonomous phase - store the raw averages (number of gamepieces)
    const autonL4 = averages?.autonL4Average || 0;
    const autonL3 = averages?.autonL3Average || 0;
    const autonL2 = averages?.autonL2Average || 0;
    const autonL1 = averages?.autonL1Average || 0;
    const autonProcessor = averages?.autonAlgaeProcessor || 0;
    const autonNet = averages?.autonAlgaeNet || 0;
    
    // Calculate expected points for autonomous phase
    const autonExpectedPoints = 
      autonL4 * 5 +  // L4 coral is worth 5 points in auton
      autonL3 * 3 +  // L3 coral is worth 3 points in auton
      autonL2 * 2 +  // L2 coral is worth 2 points in auton
      autonL1 * 1 +  // L1 coral is worth 1 point in auton
      autonProcessor * 3 +  // Algae in processor is worth 3 points
      autonNet * 2;  // Algae in net is worth 2 points
    
    // For teleop phase - store the raw averages (number of gamepieces)
    const teleopL4 = averages?.teleopL4Average || 0;
    const teleopL3 = averages?.teleopL3Average || 0;
    const teleopL2 = averages?.teleopL2Average || 0;
    const teleopL1 = averages?.teleopL1Average || 0;
    const teleopProcessor = averages?.teleopAlgaeProcessor || 0;
    const teleopNet = averages?.teleopAlgaeNet || 0;
    
    // Calculate expected points for teleop phase
    const teleopExpectedPoints = 
      teleopL4 * 5 +  // L4 coral is worth 5 points in teleop
      teleopL3 * 3 +  // L3 coral is worth 3 points in teleop
      teleopL2 * 2 +  // L2 coral is worth 2 points in teleop
      teleopL1 * 1 +  // L1 coral is worth 1 point in teleop
      teleopProcessor * 3 +  // Algae in processor is worth 3 points
      teleopNet * 2;  // Algae in net is worth 2 points
    
    // Predict climb based on historical data
    const climbPrediction = predictClimb(teamData);
    const endgameExpectedPoints = climbPrediction === 'd' ? 12 :  // Deep climb is worth 12 points
                                 climbPrediction === 's' ? 8 :  // Shallow climb is worth 8 points
                                 climbPrediction === 'p' ? 4 :  // Park is worth 4 points
                                 0;  // No climb is worth 0 points
    
    // Calculate total expected points
    const totalExpectedPoints = autonExpectedPoints + teleopExpectedPoints + endgameExpectedPoints;
    
    return {
      teamNumber,
      auton: {
        l4: autonL4,
        l3: autonL3,
        l2: autonL2,
        l1: autonL1,
        barge: 0, // Not tracked in current data
        processor: autonProcessor,
        expectedPoints: autonExpectedPoints
      },
      teleop: {
        l4: teleopL4,
        l3: teleopL3,
        l2: teleopL2,
        l1: teleopL1,
        barge: 0, // Not tracked in current data
        processor: teleopProcessor,
        expectedPoints: teleopExpectedPoints
      },
      endgame: {
        climbPrediction,
        expectedPoints: endgameExpectedPoints
      },
      totalExpectedPoints,
      hasEnoughData: enoughData,
      matchCount: teamData.length
    };
  };

  // Function to predict climb based on historical data
  const predictClimb = (teamData: MatchData[]): 'p' | 'd' | 's' | 'n' | 'x' => {
    if (teamData.length === 0) return 'n';
    
    const climbCounts = {
      p: 0, // park
      d: 0, // deep climb
      s: 0, // shallow climb
      n: 0, // not climb
      x: 0  // fail climb
    };
    
    teamData.forEach(match => {
      climbCounts[match["Climb-Status"] as keyof typeof climbCounts]++;
    });
    
    // Find the most common climb status
    const maxCount = Math.max(...Object.values(climbCounts));
    const mostCommon = Object.entries(climbCounts).find(([_, count]) => count === maxCount)?.[0];
    
    return (mostCommon as 'p' | 'd' | 's' | 'n' | 'x') || 'n';
  };

  // Function to calculate win percentage based on expected scores
  const calculateWinPercentage = (redScore: number, blueScore: number): number => {
    if (redScore + blueScore === 0) return 50;
    return Math.round((redScore / (redScore + blueScore)) * 100);
  };

  // Handle data source changes
  const handleDataSourceChange = useCallback((newSource: DataSource) => {
    setDataSource(newSource);
  }, []);

  // Handle processing mode changes
  const handleProcessingModeChange = useCallback((mode: ProcessingMode) => {
    setProcessingMode(mode);
  }, [setProcessingMode]);

  // Handle zero handling changes
  const handleZeroHandlingChange = useCallback((handling: ZeroHandling) => {
    setZeroHandling(handling);
  }, [setZeroHandling]);

  // Effect to reprocess predictions when relevant state changes
  useEffect(() => {
    if (matchData) {
      processTeamPredictions(matchData);
    }
  }, [matchData, processTeamPredictions]);

  // Function to navigate to team analysis page
  const navigateToTeamAnalysis = (teamNumber: string) => {
    // Save the team number to localStorage to ensure it's available when the team page loads
    localStorage.setItem('teamNumber', teamNumber);
    // Navigate to the team analysis page with the team number in the URL
    router.push(`/dashboard/team?team=${teamNumber}`);
  };

  return (
    <div className="container mx-auto p-4 bg-[#1A1A1A] text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Match Analysis</h1>
        <DataSourceSelector
          currentSource={dataSource}
          onSourceChange={handleDataSourceChange}
        />
      </div>

      {dataSource === "live" && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-md p-4 mb-6">
          <h3 className="text-yellow-400 font-medium">Limited Live Data Available</h3>
          <p className="text-yellow-300/80 mt-1">
            The live data source currently has very limited data. For more accurate predictions, 
            consider switching to the pre-scout data source which contains more historical data.
          </p>
        </div>
      )}

      <DataProcessingControls
        onModeChange={handleProcessingModeChange}
        onZeroHandlingChange={handleZeroHandlingChange}
        currentMode={processingMode}
        currentZeroHandling={zeroHandling}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Match Input Section */}
        <div className="bg-[#2A2A2A] rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Match Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Match Number
              </label>
              <input
                type="text"
                value={matchNumber}
                onChange={(e) => setMatchNumber(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-[#1A1A1A] text-white border-gray-700"
                placeholder="Enter match number"
              />
            </div>
            <button
              onClick={fetchMatchData}
              disabled={loading || !matchNumber}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Fetch Match Data"}
            </button>
            {error && (
              <div className="text-red-400 text-sm">{error}</div>
            )}
          </div>
        </div>

        {/* Match Overview */}
        {matchData && (
          <div className="bg-[#2A2A2A] rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Match Overview</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-red-400">Red Alliance</h3>
                <div className="space-y-2">
                  {matchData.alliances.red.team_keys.map((team) => (
                    <div
                      key={team}
                      className="flex items-center justify-between p-2 bg-[#1A1A1A] rounded"
                    >
                      <span className="text-white">{team.replace("frc", "")}</span>
                      <button
                        onClick={() => navigateToTeamAnalysis(team.replace("frc", ""))}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-medium text-blue-400">Blue Alliance</h3>
                <div className="space-y-2">
                  {matchData.alliances.blue.team_keys.map((team) => (
                    <div
                      key={team}
                      className="flex items-center justify-between p-2 bg-[#1A1A1A] rounded"
                    >
                      <span className="text-white">{team.replace("frc", "")}</span>
                      <button
                        onClick={() => navigateToTeamAnalysis(team.replace("frc", ""))}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Team Predictions */}
      {matchData && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Red Alliance Predictions */}
          <div className="bg-[#2A2A2A] rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-red-400">Red Alliance Predictions</h2>
            <div className="space-y-6">
              {redAllianceData.teams.map((team) => (
                <div key={team.teamNumber} className="border border-gray-700 rounded-lg p-4 bg-[#1A1A1A]">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-white">Team {team.teamNumber}</h3>
                    <button
                      onClick={() => navigateToTeamAnalysis(team.teamNumber)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {!team.hasEnoughData && (
                    <div className="bg-yellow-900/30 border border-yellow-700 rounded-md p-3 mb-4">
                      <p className="text-yellow-300/80 text-sm">
                        Limited data available ({team.matchCount} matches). Predictions may be less accurate.
                      </p>
                    </div>
                  )}
                  
                  {/* Autonomous Section */}
                  <div className="mb-4">
                    <h4 className="font-medium mb-2 text-gray-300">Autonomous</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
                      <div>L4 Corals: {team.auton.l4.toFixed(1)}</div>
                      <div>L3 Corals: {team.auton.l3.toFixed(1)}</div>
                      <div>L2 Corals: {team.auton.l2.toFixed(1)}</div>
                      <div>L1 Corals: {team.auton.l1.toFixed(1)}</div>
                      <div>Barge: {team.auton.barge.toFixed(1)}</div>
                      <div>Processor Algae: {team.auton.processor.toFixed(1)}</div>
                      <div className="col-span-2 font-medium text-white">
                        Expected Points: {team.auton.expectedPoints.toFixed(1)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Teleop Section */}
                  <div className="mb-4">
                    <h4 className="font-medium mb-2 text-gray-300">Teleop</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
                      <div>L4 Corals: {team.teleop.l4.toFixed(1)}</div>
                      <div>L3 Corals: {team.teleop.l3.toFixed(1)}</div>
                      <div>L2 Corals: {team.teleop.l2.toFixed(1)}</div>
                      <div>L1 Corals: {team.teleop.l1.toFixed(1)}</div>
                      <div>Barge: {team.teleop.barge.toFixed(1)}</div>
                      <div>Processor Algae: {team.teleop.processor.toFixed(1)}</div>
                      <div className="col-span-2 font-medium text-white">
                        Expected Points: {team.teleop.expectedPoints.toFixed(1)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Endgame Section */}
                  <div>
                    <h4 className="font-medium mb-2 text-gray-300">Endgame</h4>
                    <div className="text-sm text-gray-300">
                      <div>Climb: {getClimbStatus(team.endgame.climbPrediction)}</div>
                      <div className="font-medium text-white">
                        Expected Points: {team.endgame.expectedPoints.toFixed(1)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="font-bold text-white">
                      Total Expected Points: {team.totalExpectedPoints.toFixed(1)}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Alliance Total */}
              <div className="border-t border-gray-700 pt-4">
                <div className="text-lg font-bold text-white">
                  Alliance Total: {redAllianceData.totalExpectedScore.toFixed(1)} points
                </div>
                <div className="text-sm text-gray-400">
                  Win Probability: {redAllianceData.winPercentage}%
                </div>
              </div>
            </div>
          </div>

          {/* Blue Alliance Predictions */}
          <div className="bg-[#2A2A2A] rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-400">Blue Alliance Predictions</h2>
            <div className="space-y-6">
              {blueAllianceData.teams.map((team) => (
                <div key={team.teamNumber} className="border border-gray-700 rounded-lg p-4 bg-[#1A1A1A]">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-white">Team {team.teamNumber}</h3>
                    <button
                      onClick={() => navigateToTeamAnalysis(team.teamNumber)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {!team.hasEnoughData && (
                    <div className="bg-yellow-900/30 border border-yellow-700 rounded-md p-3 mb-4">
                      <p className="text-yellow-300/80 text-sm">
                        Limited data available ({team.matchCount} matches). Predictions may be less accurate.
                      </p>
                    </div>
                  )}
                  
                  {/* Autonomous Section */}
                  <div className="mb-4">
                    <h4 className="font-medium mb-2 text-gray-300">Autonomous</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
                      <div>L4 Corals: {team.auton.l4.toFixed(1)}</div>
                      <div>L3 Corals: {team.auton.l3.toFixed(1)}</div>
                      <div>L2 Corals: {team.auton.l2.toFixed(1)}</div>
                      <div>L1 Corals: {team.auton.l1.toFixed(1)}</div>
                      <div>Barge: {team.auton.barge.toFixed(1)}</div>
                      <div>Processor Algae: {team.auton.processor.toFixed(1)}</div>
                      <div className="col-span-2 font-medium text-white">
                        Expected Points: {team.auton.expectedPoints.toFixed(1)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Teleop Section */}
                  <div className="mb-4">
                    <h4 className="font-medium mb-2 text-gray-300">Teleop</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
                      <div>L4 Corals: {team.teleop.l4.toFixed(1)}</div>
                      <div>L3 Corals: {team.teleop.l3.toFixed(1)}</div>
                      <div>L2 Corals: {team.teleop.l2.toFixed(1)}</div>
                      <div>L1 Corals: {team.teleop.l1.toFixed(1)}</div>
                      <div>Barge: {team.teleop.barge.toFixed(1)}</div>
                      <div>Processor Algae: {team.teleop.processor.toFixed(1)}</div>
                      <div className="col-span-2 font-medium text-white">
                        Expected Points: {team.teleop.expectedPoints.toFixed(1)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Endgame Section */}
                  <div>
                    <h4 className="font-medium mb-2 text-gray-300">Endgame</h4>
                    <div className="text-sm text-gray-300">
                      <div>Climb: {getClimbStatus(team.endgame.climbPrediction)}</div>
                      <div className="font-medium text-white">
                        Expected Points: {team.endgame.expectedPoints.toFixed(1)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="font-bold text-white">
                      Total Expected Points: {team.totalExpectedPoints.toFixed(1)}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Alliance Total */}
              <div className="border-t border-gray-700 pt-4">
                <div className="text-lg font-bold text-white">
                  Alliance Total: {blueAllianceData.totalExpectedScore.toFixed(1)} points
                </div>
                <div className="text-sm text-gray-400">
                  Win Probability: {blueAllianceData.winPercentage}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to get climb status text
const getClimbStatus = (status: string) => {
  switch (status) {
    case 'p': return '🅿️ Parked';
    case 'd': return '🟣 Deep Climb';
    case 's': return '🔵 Shallow Climb';
    case 'n': return '❌ Not Climb';
    case 'x': return '❌ Fail Climb';
    default: return '❓ Unknown';
  }
}; 