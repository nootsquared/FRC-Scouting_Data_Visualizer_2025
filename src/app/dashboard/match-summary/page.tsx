"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/lib/context/AppContext";
import { DataSourceSelector, type DataSource } from "@/components/ui/data-source-selector";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { getTeamData, calculateTeamAverages, type MatchData } from "@/lib/data-service";

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

type AbilityKey =
  | "coralL4"
  | "coralL3"
  | "coralL2"
  | "coralL1"
  | "algaeProcessor"
  | "algaeBarge"
  | "canClimb"
  | "avgEPA"
  | "reliability"
  | "driverSkill"
  | "doesDefense";

interface AbilityResult {
  enabled: boolean;
  detail?: string;
}

type TeamAbilityMap = Record<AbilityKey, AbilityResult>;

interface TeamSummary {
  teamNumber: string;
  matchCount: number;
  hasData: boolean;
  abilities: TeamAbilityMap;
}

const createAbilityResult = (enabled: boolean, detail?: string): AbilityResult => ({
  enabled,
  detail: detail && detail.trim() !== "" ? detail : undefined,
});

const createAbilityMap = (): TeamAbilityMap => ({
  coralL4: createAbilityResult(false),
  coralL3: createAbilityResult(false),
  coralL2: createAbilityResult(false),
  coralL1: createAbilityResult(false),
  algaeProcessor: createAbilityResult(false),
  algaeBarge: createAbilityResult(false),
  canClimb: createAbilityResult(false),
  avgEPA: createAbilityResult(false),
  reliability: createAbilityResult(false),
  driverSkill: createAbilityResult(false),
  doesDefense: createAbilityResult(false),
});

const createDefaultSummary = (teamNumber: string): TeamSummary => ({
  teamNumber,
  matchCount: 0,
  hasData: false,
  abilities: createAbilityMap(),
});

const parseNumericValue = (value?: string): number => {
  if (!value) return 0;
  const trimmed = value.trim();
  if (trimmed === "") return 0;

  const direct = Number(trimmed);
  if (!Number.isNaN(direct)) {
    return direct;
  }

  const parsedInt = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsedInt) ? 0 : parsedInt;
};

const mapDefenseRating = (value?: string): number => {
  if (!value) return 0;
  const trimmed = value.trim().toLowerCase();
  if (trimmed === "") return 0;

  const numeric = Number(trimmed);
  if (!Number.isNaN(numeric)) {
    return Math.min(3, Math.max(0, numeric));
  }

  switch (trimmed) {
    case "3":
    case "excellent":
    case "e":
      return 3;
    case "2":
    case "good":
    case "g":
      return 2;
    case "1":
    case "fair":
    case "f":
      return 1;
    case "0":
    case "poor":
    case "p":
    default:
      return 0;
  }
};

const climbStatusLabels: Record<string, string> = {
  d: "Deep",
  s: "Shallow",
  p: "Park",
  x: "Failed",
  n: "None",
};

const getMostCommonClimbStatus = (matches: MatchData[]): string => {
  const counts: Record<string, number> = { d: 0, s: 0, p: 0, n: 0, x: 0 };

  matches.forEach((match) => {
    const status = ((match as Record<string, string | undefined>)["Climb-Status"] ?? "n").trim().toLowerCase();
    if (status && counts[status] !== undefined) {
      counts[status] += 1;
    }
  });

  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .map(([status]) => status)[0] ?? "n";
};

const abilityDisplayOrder: Array<{ key: AbilityKey; label: string }> = [
  { key: "coralL4", label: "Coral L4" },
  { key: "coralL3", label: "Coral L3" },
  { key: "coralL2", label: "Coral L2" },
  { key: "coralL1", label: "Coral L1" },
  { key: "algaeProcessor", label: "Algae Processor" },
  { key: "algaeBarge", label: "Algae Barge" },
  { key: "canClimb", label: "Can Climb" },
  { key: "avgEPA", label: "EPA Output" },
  { key: "reliability", label: "Reliability" },
  { key: "driverSkill", label: "Driver Skill" },
  { key: "doesDefense", label: "Plays Defense" },
];

const Badge = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${className || ''}`}>
      {children}
    </span>
  );
};

const Tabs = ({ children, defaultValue, onValueChange }: { 
  children: React.ReactNode; 
  defaultValue: string; 
  onValueChange: (value: string) => void;
}) => {
  const [activeTab, setActiveTab] = useState(defaultValue);
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    onValueChange(value);
  };
  
  return (
    <div className="space-y-4">
      {children}
    </div>
  );
};

const TabsList = ({ children }: { children: React.ReactNode }) => {
  return <div className="flex space-x-2 border-b border-gray-700">{children}</div>;
};

const TabsTrigger = ({ 
  children, 
  value, 
  activeTab, 
  onTabChange,
  className
}: { 
  children: React.ReactNode; 
  value: string; 
  activeTab: string; 
  onTabChange: (value: string) => void;
  className?: string;
}) => {
  return (
    <button
      className={`px-4 py-2 font-medium ${
        activeTab === value ? "border-b-2 border-current" : "text-gray-400"
      } ${className || ''}`}
      onClick={() => onTabChange(value)}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ 
  children, 
  value, 
  activeTab 
}: { 
  children: React.ReactNode; 
  value: string; 
  activeTab: string;
}) => {
  if (value !== activeTab) return null;
  return <div>{children}</div>;
};

export default function MatchSummaryPage() {
  const router = useRouter();
  const {
    config,
    configLoading,
    configError,
  } = useAppContext();
  const [matchNumber, setMatchNumber] = useState<string>("");
  const [matchData, setMatchData] = useState<TBAMatch | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<DataSource>("live");
  const [activeTab, setActiveTab] = useState<string>("red");
  const [teamSummaries, setTeamSummaries] = useState<Record<string, TeamSummary>>({});

  const buildTeamSummary = useCallback((teamNumber: string): TeamSummary => {
    const numericTeam = Number.parseInt(teamNumber, 10);
    if (Number.isNaN(numericTeam)) {
      return createDefaultSummary(teamNumber);
    }

    const matches = getTeamData(numericTeam, dataSource) ?? [];
    if (!matches || matches.length === 0) {
      return createDefaultSummary(teamNumber);
    }

    const abilityMap = createAbilityMap();

    const sumField = (field: string) =>
      matches.reduce((total, match) => {
        const raw = (match as Record<string, string | undefined>)[field];
        return total + parseNumericValue(raw);
      }, 0);

    const coralTotals = {
      l4: sumField("Auton-Coral-L4") + sumField("Teleop-Coral-L4"),
      l3: sumField("Auton-Coral-L3") + sumField("Teleop-Coral-L3"),
      l2: sumField("Auton-Coral-L2") + sumField("Teleop-Coral-L2"),
      l1: sumField("Auton-Coral-L1") + sumField("Teleop-Coral-L1"),
    };

    const algaeProcessorTotal = sumField("Auton-Algae-Processor") + sumField("Teleop-Algae-Processor");
    const algaeNetTotal = sumField("Auton-Algae-Net") + sumField("Teleop-Algae-Net");

    const climbCounts = matches.reduce(
      (acc, match) => {
        const status = ((match as Record<string, string | undefined>)["Climb-Status"] ?? "n").trim().toLowerCase();
        if (status !== "" && status !== "n") {
          acc.attempts += 1;
        }
        if (status === "d" || status === "s") {
          acc.successes += 1;
        }
        return acc;
      },
      { attempts: 0, successes: 0 }
    );

    const mostCommonClimb = getMostCommonClimbStatus(matches);
    const climbSuccessRate = climbCounts.attempts > 0 ? climbCounts.successes / climbCounts.attempts : 0;

    const averages = calculateTeamAverages(matches) ?? null;
    const totalEPA = averages
      ? (averages.totalAutonScore ?? 0) + (averages.totalTeleopScore ?? 0) + (averages.totalAlgaeScore ?? 0)
      : 0;
    const driverSkillAverage = averages?.driverSkillAverage ?? 0;
    const defenseRatingAverage = averages?.defenseRatingAverage ?? 0;

    const diedMatches = matches.filter((match) => {
      const raw =
        (match as Record<string, string | undefined>)["Died-YN"] ??
        (match as Record<string, string | undefined>)["Died"];
      return raw?.trim().toLowerCase() === "y";
    }).length;
    const tippedMatches = matches.filter((match) => {
      const tippedRaw =
        (match as Record<string, string | undefined>)["Tipped-YN"] ??
        (match as Record<string, string | undefined>)["Tippy"] ??
        (match as Record<string, string | undefined>)["Tipped"];
      const tippedVal = tippedRaw?.trim().toLowerCase();
      return tippedVal === "y" || tippedVal === "1";
    }).length;
    const reliableMatches = matches.length - diedMatches - tippedMatches;
    const reliabilityRate = matches.length > 0 ? reliableMatches / matches.length : 0;

    const defenseValues = matches
      .map((match) => mapDefenseRating((match as Record<string, string | undefined>)["Defense Rating"]))
      .filter((value) => value > 0);
    const defenseAverage = defenseValues.length > 0
      ? defenseValues.reduce((sum, value) => sum + value, 0) / defenseValues.length
      : defenseRatingAverage;

    abilityMap.coralL4 = createAbilityResult(coralTotals.l4 > 0, coralTotals.l4 > 0 ? `${coralTotals.l4} scored` : "");
    abilityMap.coralL3 = createAbilityResult(coralTotals.l3 > 0, coralTotals.l3 > 0 ? `${coralTotals.l3} scored` : "");
    abilityMap.coralL2 = createAbilityResult(coralTotals.l2 > 0, coralTotals.l2 > 0 ? `${coralTotals.l2} scored` : "");
    abilityMap.coralL1 = createAbilityResult(coralTotals.l1 > 0, coralTotals.l1 > 0 ? `${coralTotals.l1} scored` : "");

    abilityMap.algaeProcessor = createAbilityResult(
      algaeProcessorTotal > 0,
      algaeProcessorTotal > 0 ? `${algaeProcessorTotal} scored` : ""
    );
    abilityMap.algaeBarge = createAbilityResult(
      algaeNetTotal > 0,
      algaeNetTotal > 0 ? `${algaeNetTotal} scored` : ""
    );

    const climbDetail = climbCounts.attempts > 0
      ? `${(climbSuccessRate * 100).toFixed(0)}% success (${climbStatusLabels[mostCommonClimb] ?? "Unknown"})`
      : "No attempts recorded";
    abilityMap.canClimb = createAbilityResult(climbSuccessRate >= 0.4, climbDetail);

    abilityMap.avgEPA = createAbilityResult(totalEPA >= 12, `${totalEPA.toFixed(1)} pts`);

    abilityMap.reliability = createAbilityResult(
      reliabilityRate >= 0.85,
      matches.length > 0
        ? `${reliableMatches}/${matches.length} matches (${(reliabilityRate * 100).toFixed(0)}% uptime)`
        : "No data"
    );

    const driverDetail = driverSkillAverage > 0 ? `avg ${driverSkillAverage.toFixed(1)}` : "No ratings";
    abilityMap.driverSkill = createAbilityResult(driverSkillAverage >= 2, driverDetail);

    const defenseDetail = defenseAverage > 0 ? `rating ${defenseAverage.toFixed(1)}` : "Not recorded";
    abilityMap.doesDefense = createAbilityResult(defenseAverage >= 1.5, defenseDetail);

    return {
      teamNumber,
      matchCount: matches.length,
      hasData: true,
      abilities: abilityMap,
    };
  }, [dataSource]);

  useEffect(() => {
    const savedMatchNumber = localStorage.getItem('matchSummaryMatchNumber');
    const savedMatchData = localStorage.getItem('matchSummaryData');
    const savedActiveTab = localStorage.getItem('matchSummaryActiveTab');
    if (savedMatchNumber) setMatchNumber(savedMatchNumber);
    if (savedMatchData) setMatchData(JSON.parse(savedMatchData));
    if (savedActiveTab) {
      setActiveTab(savedActiveTab);
    }
  }, []);

  useEffect(() => {
    if (matchNumber) localStorage.setItem('matchSummaryMatchNumber', matchNumber);
    if (matchData) localStorage.setItem('matchSummaryData', JSON.stringify(matchData));
    if (activeTab) localStorage.setItem('matchSummaryActiveTab', activeTab);
  }, [matchNumber, matchData, activeTab]);

  useEffect(() => {
    if (!matchData) {
      setTeamSummaries({});
      return;
    }

    const teamNumbers = Array.from(
      new Set(
        [
          ...matchData.alliances.red.team_keys,
          ...matchData.alliances.blue.team_keys,
        ].map((key) => key.replace("frc", ""))
      )
    );

    const summaries: Record<string, TeamSummary> = {};
    teamNumbers.forEach((teamNumber) => {
      summaries[teamNumber] = buildTeamSummary(teamNumber);
    });
    setTeamSummaries(summaries);
  }, [matchData, buildTeamSummary]);

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
        throw new Error("TBA API key or event code not configured. Update the Settings page.");
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
          payload?.message ?? `Failed to fetch match data: status ${response.status}.`
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

  const handleDataSourceChange = (newSource: DataSource) => {
    setDataSource(newSource);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const navigateToTeamAnalysis = (teamNumber: string) => {
    router.push(`/dashboard/team?team=${teamNumber}`);
  };

  const renderAbilityRow = (label: string, ability: AbilityResult) => (
    <div key={label} className="flex flex-col gap-1 rounded-md border border-gray-800 bg-[#111111] px-3 py-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-300">{label}</span>
        <Badge className={ability.enabled ? "bg-emerald-500/80 text-white" : "bg-red-500/80 text-white"}>
          {ability.enabled ? "Yes" : "No"}
        </Badge>
      </div>
      {ability.detail && (
        <span className="text-xs text-gray-500">{ability.detail}</span>
      )}
    </div>
  );

  const renderTeamPanel = (teamKey: string, index: number, alliance: "red" | "blue") => {
    const teamNumber = teamKey.replace("frc", "");
    const summary = teamSummaries[teamNumber] ?? createDefaultSummary(teamNumber);
    const allianceLabel = alliance === "red" ? "Red" : "Blue";
    const allianceColor = alliance === "red" ? "text-red-400" : "text-brandBlue-accent";

    return (
      <div key={teamKey} className="space-y-10 mb-12">
        <h2 className={`text-2xl font-bold text-white mt-8`}>
          <span className={allianceColor}>{allianceLabel} {index + 1}</span>: Team {teamNumber}
        </h2>

        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-xl mb-1">Team Abilities</CardTitle>
            {summary.hasData ? (
              <p className="text-sm text-gray-500">Matches analyzed: {summary.matchCount}</p>
            ) : (
              <p className="text-sm text-yellow-500">No scouting data available for this team in the selected data source.</p>
            )}
          </CardHeader>
          <CardContent>
            {summary.hasData ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {abilityDisplayOrder.map(({ key, label }) =>
                  renderAbilityRow(label, summary.abilities[key] ?? createAbilityResult(false))
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">
                Switch to a different data source or add scouting entries to see ability metrics for this team.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-gray-800 mt-10">
          <CardContent className="pt-6">
            <Button
              onClick={() => navigateToTeamAnalysis(teamNumber)}
              className="w-full bg-brandBlue-accent hover:bg-brandBlue text-white"
            >
              View Team Analysis <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="flex justify-between items-center mb-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white mb-3">Match Summary</h1>
            <p className="text-gray-400">View detailed information about teams in a specific match</p>
          </div>
          <DataSourceSelector
            currentSource={dataSource}
            onSourceChange={handleDataSourceChange}
          />
        </div>

        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-2xl">Enter Match Number</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <Input
                type="number"
                placeholder="Enter qual match number (e.g., 1)"
                value={matchNumber}
                onChange={(e) => setMatchNumber(e.target.value)}
                className="max-w-xs text-white"
              />
              <Button
                onClick={fetchMatchData}
                disabled={
                  loading ||
                  !matchNumber.trim() ||
                  configLoading ||
                  !config?.tbaApiKey ||
                  !config?.eventCode
                }
              >
                {loading ? "Loading..." : "View Match"}
              </Button>
            </div>
            {error && <p className="text-red-500 mt-4">{error}</p>}
            {!configLoading && configError && (
              <p className="text-red-500 mt-4">{configError}</p>
            )}
            {!configLoading && !config?.tbaApiKey && (
              <p className="text-yellow-500 mt-4">
                TBA API key not found. Configure it on the{' '}
                <a href="/dashboard/settings" className="underline">Settings</a> page.
              </p>
            )}
            {!configLoading && !config?.eventCode && (
              <p className="text-yellow-500 mt-4">
                Event code not found. Configure it on the{' '}
                <a href="/dashboard/settings" className="underline">Settings</a> page.
              </p>
            )}
          </CardContent>
        </Card>

        {matchData && (
          <div className="space-y-10">
            <Tabs defaultValue="red" onValueChange={handleTabChange}>
              <TabsList>
                <TabsTrigger value="red" activeTab={activeTab} onTabChange={handleTabChange} className="text-red-500">
                  Red Alliance
                </TabsTrigger>
                <TabsTrigger value="blue" activeTab={activeTab} onTabChange={handleTabChange} className="text-brandBlue-accent">
                  Blue Alliance
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="red" activeTab={activeTab}>
                {matchData.alliances.red.team_keys.map((teamKey, index) =>
                  renderTeamPanel(teamKey, index, "red")
                )}
              </TabsContent>
              
              <TabsContent value="blue" activeTab={activeTab}>
                {matchData.alliances.blue.team_keys.map((teamKey, index) =>
                  renderTeamPanel(teamKey, index, "blue")
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
} 
