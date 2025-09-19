"use client";

import { useState, useEffect, useCallback, ReactNode } from "react";
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

interface AlliancePredictionData {
  teams: TeamPredictionData[];
  totalExpectedScore: number;
  winPercentage: number;
  autonExpected: number;
  teleopExpected: number;
  endgameExpected: number;
  confidence: number;
  climbPotential: number;
}

type StatusTone = "positive" | "warning" | "negative" | "info";

interface AllianceMetrics {
  autonExpected: number;
  teleopExpected: number;
  endgameExpected: number;
  totalExpected: number;
  climbPotential: number;
  confidence: number;
}

const createEmptyAlliance = (): AlliancePredictionData => ({
  teams: [],
  totalExpectedScore: 0,
  winPercentage: 0,
  autonExpected: 0,
  teleopExpected: 0,
  endgameExpected: 0,
  confidence: 0,
  climbPotential: 0,
});

const hydrateAllianceData = (raw: string | null): AlliancePredictionData => {
  if (!raw) return createEmptyAlliance();

  try {
    const parsed = JSON.parse(raw) as Partial<AlliancePredictionData>;
    return {
      ...createEmptyAlliance(),
      ...parsed,
      teams: Array.isArray(parsed?.teams) ? parsed.teams : [],
      totalExpectedScore: Number(parsed?.totalExpectedScore ?? 0),
      winPercentage: Number(parsed?.winPercentage ?? 0),
      autonExpected: Number(parsed?.autonExpected ?? 0),
      teleopExpected: Number(parsed?.teleopExpected ?? 0),
      endgameExpected: Number(parsed?.endgameExpected ?? 0),
      confidence: Number(parsed?.confidence ?? 0),
      climbPotential: Number(parsed?.climbPotential ?? 0),
    };
  } catch (error) {
    console.warn('Failed to hydrate alliance data from localStorage', error);
    return createEmptyAlliance();
  }
};

const StatusPill = ({ children, tone }: { children: ReactNode; tone: StatusTone }) => {
  const toneClasses: Record<StatusTone, string> = {
    positive: "bg-emerald-500/20 text-emerald-200 border-emerald-500/40",
    warning: "bg-amber-500/20 text-amber-200 border-amber-500/40",
    negative: "bg-red-500/20 text-red-200 border-red-500/40",
    info: "bg-brandBlue-accent/20 text-brandBlue-soft border-brandBlue-accent/40",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
};

function aggregateAllianceMetrics(teams: TeamPredictionData[]): AllianceMetrics {
  if (teams.length === 0) {
    return {
      autonExpected: 0,
      teleopExpected: 0,
      endgameExpected: 0,
      totalExpected: 0,
      climbPotential: 0,
      confidence: 0,
    };
  }

  const MAX_CLIMB_POINTS = 12;

  const totals = teams.reduce(
    (acc, team) => {
      acc.auton += team.auton.expectedPoints;
      acc.teleop += team.teleop.expectedPoints;
      acc.endgame += team.endgame.expectedPoints;
      acc.climbReliability += Math.min(team.endgame.expectedPoints / MAX_CLIMB_POINTS, 1);

      const matchDepth = Math.min(team.matchCount, 12) / 12;
      const stability = team.hasEnoughData ? 0.4 : 0.2;
      const confidenceContribution = Math.min(1, matchDepth * 0.6 + stability);
      acc.confidence += confidenceContribution;

      return acc;
    },
    {
      auton: 0,
      teleop: 0,
      endgame: 0,
      climbReliability: 0,
      confidence: 0,
    }
  );

  const allianceCount = teams.length;

  return {
    autonExpected: totals.auton,
    teleopExpected: totals.teleop,
    endgameExpected: totals.endgame,
    totalExpected: totals.auton + totals.teleop + totals.endgame,
    climbPotential: totals.climbReliability / allianceCount,
    confidence: totals.confidence / allianceCount,
  };
}

function projectMatchOutcome(red: AllianceMetrics, blue: AllianceMetrics) {
  const totalDiff = red.totalExpected - blue.totalExpected;
  const autonDiff = red.autonExpected - blue.autonExpected;
  const teleopDiff = red.teleopExpected - blue.teleopExpected;
  const endgameDiff = red.endgameExpected - blue.endgameExpected;
  const climbDiff = red.climbPotential - blue.climbPotential;
  const confidenceDiff = red.confidence - blue.confidence;

  const momentum =
    totalDiff * 0.08 +
    autonDiff * 0.05 +
    teleopDiff * 0.04 +
    endgameDiff * 0.06 +
    climbDiff * 1.25 +
    confidenceDiff * 1.1;

  const probability = 1 / (1 + Math.exp(-momentum));
  const redWinPercentage = Math.round(probability * 1000) / 10;
  const blueWinPercentage = Math.round((1 - probability) * 1000) / 10;

  return { redWinPercentage, blueWinPercentage };
}

export default function MatchAnalysisPage() {
  const router = useRouter();
  const {
    processingMode,
    setProcessingMode,
    zeroHandling,
    setZeroHandling,
    config,
    configLoading,
    configError,
  } = useAppContext();
  const [matchNumber, setMatchNumber] = useState<string>("");
  const [matchData, setMatchData] = useState<TBAMatch | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<DataSource>("live");
  const [redAllianceData, setRedAllianceData] = useState<AlliancePredictionData>(() => createEmptyAlliance());
  const [blueAllianceData, setBlueAllianceData] = useState<AlliancePredictionData>(() => createEmptyAlliance());

  const predictionsReady =
    redAllianceData.teams.length > 0 &&
    blueAllianceData.teams.length > 0 &&
    matchData !== null;

  const projectedWinner = redAllianceData.winPercentage === blueAllianceData.winPercentage
    ? "Dead Heat"
    : redAllianceData.winPercentage > blueAllianceData.winPercentage
      ? "Red Alliance"
      : "Blue Alliance";

  const projectedWinnerTone = projectedWinner === "Red Alliance"
    ? "text-red-400"
    : projectedWinner === "Blue Alliance"
      ? "text-brandBlue-accent"
      : "text-gray-300";

  const projectedSpread = Math.abs(
    redAllianceData.totalExpectedScore - blueAllianceData.totalExpectedScore
  );

  const aggregateConfidence = Math.min(
    1,
    (redAllianceData.confidence + blueAllianceData.confidence) / 2
  );

  const climbReliabilityGap = Math.abs(
    redAllianceData.climbPotential - blueAllianceData.climbPotential
  );

  const dataSourceNotice = dataSource === "live"
    ? {
        container: "bg-yellow-900/30 border border-yellow-700 text-yellow-200",
        title: "Live Data Snapshot",
        description:
          "The live scouting feed is still filling in. Expect lighter sample sizes until your team uploads more results.",
      }
    : {
        container: "bg-yellow-900/30 border border-yellow-700 text-yellow-200",
        title: "Pre-scout Dataset",
        description:
          "Using historical pre-scout metrics. Switch back to Live to reflect in-event performance as it becomes available.",
      };

  useEffect(() => {
    const savedMatchNumber = localStorage.getItem('matchAnalysisMatchNumber');
    const savedMatchData = localStorage.getItem('matchAnalysisData');
    const savedRedAllianceData = localStorage.getItem('matchAnalysisRedAllianceData');
    const savedBlueAllianceData = localStorage.getItem('matchAnalysisBlueAllianceData');

    if (savedMatchNumber) setMatchNumber(savedMatchNumber);
    if (savedMatchData) {
      try {
        setMatchData(JSON.parse(savedMatchData));
      } catch (error) {
        console.warn('Failed to hydrate match data from localStorage', error);
      }
    }

    if (savedRedAllianceData) {
      setRedAllianceData(hydrateAllianceData(savedRedAllianceData));
    }

    if (savedBlueAllianceData) {
      setBlueAllianceData(hydrateAllianceData(savedBlueAllianceData));
    }
  }, []);

  useEffect(() => {
    if (matchNumber) localStorage.setItem('matchAnalysisMatchNumber', matchNumber);
    if (matchData) localStorage.setItem('matchAnalysisData', JSON.stringify(matchData));
    if (redAllianceData) localStorage.setItem('matchAnalysisRedAllianceData', JSON.stringify(redAllianceData));
    if (blueAllianceData) localStorage.setItem('matchAnalysisBlueAllianceData', JSON.stringify(blueAllianceData));
  }, [matchNumber, matchData, redAllianceData, blueAllianceData]);

  const processTeamPredictions = useCallback((match: TBAMatch) => {
    const redTeamNumbers = match.alliances.red.team_keys.map((key) => key.replace("frc", ""));
    const blueTeamNumbers = match.alliances.blue.team_keys.map((key) => key.replace("frc", ""));

    const redTeamPredictions = redTeamNumbers.map((teamNumber) =>
      generateTeamPrediction(teamNumber, dataSource, processingMode, zeroHandling)
    );
    const blueTeamPredictions = blueTeamNumbers.map((teamNumber) =>
      generateTeamPrediction(teamNumber, dataSource, processingMode, zeroHandling)
    );

    const redMetrics = aggregateAllianceMetrics(redTeamPredictions);
    const blueMetrics = aggregateAllianceMetrics(blueTeamPredictions);
    const { redWinPercentage, blueWinPercentage } = projectMatchOutcome(redMetrics, blueMetrics);

    setRedAllianceData({
      teams: redTeamPredictions,
      totalExpectedScore: redMetrics.totalExpected,
      winPercentage: redWinPercentage,
      autonExpected: redMetrics.autonExpected,
      teleopExpected: redMetrics.teleopExpected,
      endgameExpected: redMetrics.endgameExpected,
      confidence: redMetrics.confidence,
      climbPotential: redMetrics.climbPotential,
    });

    setBlueAllianceData({
      teams: blueTeamPredictions,
      totalExpectedScore: blueMetrics.totalExpected,
      winPercentage: blueWinPercentage,
      autonExpected: blueMetrics.autonExpected,
      teleopExpected: blueMetrics.teleopExpected,
      endgameExpected: blueMetrics.endgameExpected,
      confidence: blueMetrics.confidence,
      climbPotential: blueMetrics.climbPotential,
    });
  }, [dataSource, processingMode, zeroHandling]);

  const fetchMatchData = async () => {
    const normalizedMatchNumber = matchNumber.trim();
    if (!normalizedMatchNumber) {
      setError("Please enter a valid match number.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (configLoading) {
        throw new Error("Configuration is still loading. Please try again.");
      }

      if (configError) {
        throw new Error(configError);
      }

      if (!config?.tbaApiKey || !config?.eventCode) {
        throw new Error("TBA API key or event code not configured. Update the Settings page first.");
      }

      const response = await fetch(
        `/api/tba/match?matchNumber=${encodeURIComponent(normalizedMatchNumber)}`,
        {
          cache: "no-store",
        }
      );

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          payload?.message ?? `Failed to fetch match data (status ${response.status}).`
        );
      }

      if (!payload) {
        throw new Error('Unexpected empty response from the TBA proxy.');
      }

      setMatchData(payload as TBAMatch);
    } catch (err) {
      console.error("Error fetching match data:", err);
      setError(`Failed to fetch match data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const hasEnoughData = (teamData: MatchData[]): boolean => {
    return teamData.length >= 3;
  };

  const generateTeamPrediction = (teamNumber: string, dataSource: DataSource, method: ProcessingMode, zeroHandling: ZeroHandling): TeamPredictionData => {
    const teamData = getTeamData(parseInt(teamNumber), dataSource);
    const averages = calculateTeamAverages(teamData, method, zeroHandling);
    
    const enoughData = hasEnoughData(teamData);
    
    const autonL4 = averages?.autonL4Average || 0;
    const autonL3 = averages?.autonL3Average || 0;
    const autonL2 = averages?.autonL2Average || 0;
    const autonL1 = averages?.autonL1Average || 0;
    const autonProcessor = averages?.autonAlgaeProcessor || 0;
    const autonNet = averages?.autonAlgaeNet || 0;
    
    const autonExpectedPoints = 
      autonL4 * 5 +
      autonL3 * 3 +
      autonL2 * 2 +
      autonL1 * 1 +
      autonProcessor * 3 +
      autonNet * 2;
    
    const teleopL4 = averages?.teleopL4Average || 0;
    const teleopL3 = averages?.teleopL3Average || 0;
    const teleopL2 = averages?.teleopL2Average || 0;
    const teleopL1 = averages?.teleopL1Average || 0;
    const teleopProcessor = averages?.teleopAlgaeProcessor || 0;
    const teleopNet = averages?.teleopAlgaeNet || 0;
    
    const teleopExpectedPoints = 
      teleopL4 * 5 +
      teleopL3 * 3 +
      teleopL2 * 2 +
      teleopL1 * 1 +
      teleopProcessor * 3 +
      teleopNet * 2;
    
    const climbPrediction = predictClimb(teamData);
    const endgameExpectedPoints = climbPrediction === 'd' ? 12 :
                                 climbPrediction === 's' ? 8 :
                                 climbPrediction === 'p' ? 4 :
                                 0;
    
    const totalExpectedPoints = autonExpectedPoints + teleopExpectedPoints + endgameExpectedPoints;
    
    return {
      teamNumber,
      auton: {
        l4: autonL4,
        l3: autonL3,
        l2: autonL2,
        l1: autonL1,
        barge: 0,
        processor: autonProcessor,
        expectedPoints: autonExpectedPoints
      },
      teleop: {
        l4: teleopL4,
        l3: teleopL3,
        l2: teleopL2,
        l1: teleopL1,
        barge: 0,
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

  const predictClimb = (teamData: MatchData[]): 'p' | 'd' | 's' | 'n' | 'x' => {
    if (teamData.length === 0) return 'n';
    
    const climbCounts = {
      p: 0,
      d: 0,
      s: 0,
      n: 0,
      x: 0
    };
    
    teamData.forEach(match => {
      climbCounts[match["Climb-Status"] as keyof typeof climbCounts]++;
    });
    
    const maxCount = Math.max(...Object.values(climbCounts));
    const mostCommon = Object.entries(climbCounts).find(([_, count]) => count === maxCount)?.[0];
    
    return (mostCommon as 'p' | 'd' | 's' | 'n' | 'x') || 'n';
  };

  const handleDataSourceChange = useCallback((newSource: DataSource) => {
    setDataSource(newSource);
  }, []);

  const handleProcessingModeChange = useCallback((mode: ProcessingMode) => {
    setProcessingMode(mode);
  }, [setProcessingMode]);

  const handleZeroHandlingChange = useCallback((handling: ZeroHandling) => {
    setZeroHandling(handling);
  }, [setZeroHandling]);

  useEffect(() => {
    if (matchData) {
      processTeamPredictions(matchData);
    }
  }, [matchData, processTeamPredictions]);

  const navigateToTeamAnalysis = (teamNumber: string) => {
    localStorage.setItem('teamNumber', teamNumber);
    router.push(`/dashboard/team?team=${teamNumber}`);
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Match Analysis</h1>
        <DataSourceSelector
          currentSource={dataSource}
          onSourceChange={handleDataSourceChange}
        />
        </div>

        <div className={`${dataSourceNotice.container} rounded-md p-4 transition-colors`}>
        <h3 className="text-white font-medium mb-2">{dataSourceNotice.title}</h3>
        <p className="text-sm opacity-90">{dataSourceNotice.description}</p>
        </div>

        <DataProcessingControls
          onModeChange={handleProcessingModeChange}
          onZeroHandlingChange={handleZeroHandlingChange}
          currentMode={processingMode}
          currentZeroHandling={zeroHandling}
        />

        {predictionsReady && (
          <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-2xl">Model Projection</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-gray-400">Projected Winner</p>
              <p className={`text-2xl font-semibold mt-1 ${projectedWinnerTone}`}>
                {projectedWinner}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Red {redAllianceData.winPercentage.toFixed(1)}% • Blue {blueAllianceData.winPercentage.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-gray-400">Projected Score Split</p>
              <p className="text-2xl font-semibold text-white mt-1">
                {redAllianceData.totalExpectedScore.toFixed(1)} - {blueAllianceData.totalExpectedScore.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Expected spread of {projectedSpread.toFixed(1)} pts based on combined EPA & climb outlook.
              </p>
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-gray-400">Model Confidence</p>
              <p className="text-2xl font-semibold text-white mt-1">
                {(aggregateConfidence * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Climb reliability gap: {(climbReliabilityGap * 100).toFixed(0)}% • Data depth reflects average matches scouted.
              </p>
            </div>
          </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardContent className="p-6">
          <h2 className="text-2xl font-semibold mb-6 text-white">Match Details</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
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
              disabled={
                loading ||
                !matchNumber.trim() ||
                configLoading ||
                !config?.tbaApiKey ||
                !config?.eventCode
              }
              className="w-full bg-brandBlue-accent text-white py-2 px-4 rounded-md hover:bg-brandBlue disabled:opacity-50"
            >
              {loading ? "Loading..." : "Fetch Match Data"}
            </button>
            {error && (
              <div className="text-red-400 text-sm mt-4">{error}</div>
            )}
            {!configLoading && !config?.tbaApiKey && (
              <p className="text-yellow-500 mt-4">
                TBA API key not found. Configure it on the{' '}
                <a href="/dashboard/settings" className="underline">
                  Settings
                </a>{' '}
                page.
              </p>
            )}
            {!configLoading && !config?.eventCode && (
              <p className="text-yellow-500 mt-4">
                Event code not found. Configure it on the{' '}
                <a href="/dashboard/settings" className="underline">
                  Settings
                </a>{' '}
                page.
              </p>
            )}
          </div>
          </CardContent>
        </Card>

        {matchData && (
          <Card className="bg-[#1A1A1A] border-gray-800">
            <CardContent className="p-6">
            <h2 className="text-2xl font-semibold mb-6 text-white">Match Overview</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-red-400 mb-4">Red Alliance</h3>
                <div className="space-y-3">
                  {matchData.alliances.red.team_keys.map((team) => (
                    <div
                      key={team}
                      className="flex items-center justify-between p-3 bg-[#1A1A1A] rounded"
                    >
                      <span className="text-white">{team.replace("frc", "")}</span>
                      <button
                        onClick={() => navigateToTeamAnalysis(team.replace("frc", ""))}
                        className="text-brandBlue-accent hover:text-brandBlue-soft"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-medium text-brandBlue-accent mb-4">Blue Alliance</h3>
                <div className="space-y-3">
                  {matchData.alliances.blue.team_keys.map((team) => (
                    <div
                      key={team}
                      className="flex items-center justify-between p-3 bg-[#1A1A1A] rounded"
                    >
                      <span className="text-white">{team.replace("frc", "")}</span>
                      <button
                        onClick={() => navigateToTeamAnalysis(team.replace("frc", ""))}
                        className="text-brandBlue-accent hover:text-brandBlue-soft"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            </CardContent>
          </Card>
        )}
      </div>

        {matchData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-[#1A1A1A] border-gray-800">
              <CardContent className="p-6">
            <h2 className="text-2xl font-semibold mb-8 text-red-400">Red Alliance Predictions</h2>
            <div className="space-y-8">
              {redAllianceData.teams.map((team) => (
                <div key={team.teamNumber} className="border border-gray-700 rounded-lg p-6 bg-[#1A1A1A]">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-medium text-white">Team {team.teamNumber}</h3>
                      <button
                        onClick={() => navigateToTeamAnalysis(team.teamNumber)}
                        className="text-brandBlue-accent hover:text-brandBlue-soft"
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
                  
                  <div>
                    <h4 className="font-medium mb-2 text-gray-300">Endgame</h4>
                    <div className="text-sm text-gray-300">
                      <div className="flex items-center gap-2">
                        <span>Climb:</span>
                        {getClimbStatus(team.endgame.climbPrediction)}
                      </div>
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
              
              <div className="border-t border-gray-700 pt-4 space-y-1">
                <div className="text-lg font-bold text-white">
                  Alliance Total: {redAllianceData.totalExpectedScore.toFixed(1)} pts
                </div>
                <div className="text-sm text-gray-400">
                  Auton: {redAllianceData.autonExpected.toFixed(1)} • Teleop: {redAllianceData.teleopExpected.toFixed(1)} • Endgame: {redAllianceData.endgameExpected.toFixed(1)}
                </div>
                <div className="text-sm text-gray-400">
                  Climb Reliability: {(redAllianceData.climbPotential * 100).toFixed(0)}% • Data Confidence: {(redAllianceData.confidence * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-brandBlue-soft font-semibold">
                  Model Win Projection: {redAllianceData.winPercentage.toFixed(1)}%
                </div>
              </div>
            </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1A1A1A] border-gray-800">
              <CardContent className="p-6">
            <h2 className="text-2xl font-semibold mb-8 text-brandBlue-accent">Blue Alliance Predictions</h2>
            <div className="space-y-8">
              {blueAllianceData.teams.map((team) => (
                <div key={team.teamNumber} className="border border-gray-700 rounded-lg p-6 bg-[#1A1A1A]">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-medium text-white">Team {team.teamNumber}</h3>
                      <button
                        onClick={() => navigateToTeamAnalysis(team.teamNumber)}
                        className="text-brandBlue-accent hover:text-brandBlue-soft"
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
                  
                  <div>
                    <h4 className="font-medium mb-2 text-gray-300">Endgame</h4>
                    <div className="text-sm text-gray-300">
                      <div className="flex items-center gap-2">
                        <span>Climb:</span>
                        {getClimbStatus(team.endgame.climbPrediction)}
                      </div>
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
              
              <div className="border-t border-gray-700 pt-4 space-y-1">
                <div className="text-lg font-bold text-white">
                  Alliance Total: {blueAllianceData.totalExpectedScore.toFixed(1)} pts
                </div>
                <div className="text-sm text-gray-400">
                  Auton: {blueAllianceData.autonExpected.toFixed(1)} • Teleop: {blueAllianceData.teleopExpected.toFixed(1)} • Endgame: {blueAllianceData.endgameExpected.toFixed(1)}
                </div>
                <div className="text-sm text-gray-400">
                  Climb Reliability: {(blueAllianceData.climbPotential * 100).toFixed(0)}% • Data Confidence: {(blueAllianceData.confidence * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-brandBlue-soft font-semibold">
                  Model Win Projection: {blueAllianceData.winPercentage.toFixed(1)}%
                </div>
              </div>
            </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

const getClimbStatus = (status: string): ReactNode => {
  switch (status) {
    case 'd':
      return <StatusPill tone="positive">Deep Climb</StatusPill>;
    case 's':
      return <StatusPill tone="info">Shallow Climb</StatusPill>;
    case 'p':
      return <StatusPill tone="warning">Parked</StatusPill>;
    case 'x':
      return <StatusPill tone="negative">Failed Attempt</StatusPill>;
    case 'n':
      return <StatusPill tone="negative">No Attempt</StatusPill>;
    default:
      return <StatusPill tone="warning">Unknown</StatusPill>;
  }
};
