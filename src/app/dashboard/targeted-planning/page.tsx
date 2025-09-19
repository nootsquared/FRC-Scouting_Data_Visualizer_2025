"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Settings as SettingsIcon } from "lucide-react";
import type { TBAMatch } from "@/types/tba";
import Link from "next/link";
import { useAppContext } from "@/lib/context/AppContext";
import { useRouter } from "next/navigation";

interface MatchesToScout {
  targetMatch: TBAMatch;
  matchesToScout: {
    match: TBAMatch;
    teamsToScout: string[];
  }[];
}

interface ConsolidatedMatch {
  matchNumber: number;
  teams: string[];
}

export default function TargetedPlanningPage() {
  const router = useRouter();
  const {
    setTeamNumber: setGlobalTeamNumber,
    config,
    configLoading,
    configError,
  } = useAppContext();

  const [teamNumber, setTeamNumber] = useState("226");
  const [matches, setMatches] = useState<TBAMatch[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<TBAMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<TBAMatch | null>(null);
  const [matchesToScout, setMatchesToScout] = useState<MatchesToScout[]>([]);
  const [consolidatedMatches, setConsolidatedMatches] = useState<ConsolidatedMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const configuredEventCode = config?.eventCode ?? "";
  const hasConfiguredCredentials = useMemo(
    () => Boolean(config?.tbaApiKey && config?.eventCode),
    [config?.eventCode, config?.tbaApiKey]
  );

  useEffect(() => {
    const savedTeam = localStorage.getItem("targetedPlanningTeamNumber");
    const savedMatches = localStorage.getItem("tbaMatches");
    const savedUpcomingMatches = localStorage.getItem("tbaUpcomingMatches");
    const savedSelectedMatch = localStorage.getItem("tbaSelectedMatch");
    const savedMatchesToScout = localStorage.getItem("tbaMatchesToScout");
    const savedConsolidatedMatches = localStorage.getItem("tbaConsolidatedMatches");

    if (savedTeam) setTeamNumber(savedTeam);
    if (savedMatches) setMatches(JSON.parse(savedMatches));
    if (savedUpcomingMatches) setUpcomingMatches(JSON.parse(savedUpcomingMatches));
    if (savedSelectedMatch) setSelectedMatch(JSON.parse(savedSelectedMatch));
    if (savedMatchesToScout) setMatchesToScout(JSON.parse(savedMatchesToScout));
    if (savedConsolidatedMatches) setConsolidatedMatches(JSON.parse(savedConsolidatedMatches));
  }, []);

  useEffect(() => {
    if (teamNumber) {
      localStorage.setItem("targetedPlanningTeamNumber", teamNumber);
    }
  }, [teamNumber]);

  useEffect(() => {
    if (matches.length > 0) localStorage.setItem("tbaMatches", JSON.stringify(matches));
    if (upcomingMatches.length > 0)
      localStorage.setItem("tbaUpcomingMatches", JSON.stringify(upcomingMatches));
    if (selectedMatch) localStorage.setItem("tbaSelectedMatch", JSON.stringify(selectedMatch));
    if (matchesToScout.length > 0)
      localStorage.setItem("tbaMatchesToScout", JSON.stringify(matchesToScout));
    if (consolidatedMatches.length > 0)
      localStorage.setItem("tbaConsolidatedMatches", JSON.stringify(consolidatedMatches));
  }, [matches, upcomingMatches, selectedMatch, matchesToScout, consolidatedMatches]);

  const fetchMatches = useCallback(async () => {
    if (!teamNumber) {
      setError("Please enter a team number.");
      return;
    }

    if (!hasConfiguredCredentials) {
      setError("TBA API key or event code not configured. Update settings before fetching matches.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/tba/matches?teamNumber=${encodeURIComponent(teamNumber)}`, {
        cache: "no-store",
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message ?? `Failed to fetch matches (status ${response.status}).`);
      }

      if (
        !payload ||
        !Array.isArray((payload as any).teamMatches) ||
        !Array.isArray((payload as any).eventMatches)
      ) {
        throw new Error('Unexpected response format from the TBA proxy.');
      }

      const { teamMatches, eventMatches } = payload as {
        teamMatches: TBAMatch[];
        eventMatches: TBAMatch[];
      };

      setMatches(eventMatches ?? []);

      const upcoming = (teamMatches ?? [])
        .filter((match) => match.comp_level === "qm")
        .sort((a, b) => a.match_number - b.match_number);

      setUpcomingMatches(upcoming);

      if (upcoming.length === 0) {
        setError("No qualification matches found for this team at the configured event.");
      }
    } catch (err) {
      console.error("Error fetching matches:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch matches. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  }, [hasConfiguredCredentials, teamNumber]);

  useEffect(() => {
    if (configLoading) return;

    if (configError) {
      setError(configError);
      return;
    }

    if (!hasConfiguredCredentials) {
      setError("Add a TBA API key and event code in Settings to load targeted planning data.");
      return;
    }

    setError(null);
    fetchMatches();
  }, [configLoading, configError, hasConfiguredCredentials, fetchMatches]);

  const handleMatchSelect = (match: TBAMatch) => {
    setSelectedMatch(match);

    const selectedIndex = upcomingMatches.findIndex((m) => m.key === match.key);
    if (selectedIndex === -1) return;

    const nextTwoMatches = upcomingMatches.slice(selectedIndex + 1, selectedIndex + 3);
    if (nextTwoMatches.length === 0) return;

    const assignments = nextTwoMatches.map((targetMatch) => {
      const targetTeams = [
        ...targetMatch.alliances.red.team_keys,
        ...targetMatch.alliances.blue.team_keys,
      ].filter((team) => team !== `frc${teamNumber}`);

      const targetMatchTime = targetMatch.predicted_time || targetMatch.time;
      const selectedMatchTime = match.predicted_time || match.time;
      const relevantMatches = matches
        .filter((m) => {
          const matchTime = m.predicted_time || m.time;
          return matchTime > selectedMatchTime && matchTime < targetMatchTime;
        })
        .sort((a, b) => (a.predicted_time || a.time) - (b.predicted_time || b.time));

      const matchesWithTeams = relevantMatches
        .map((candidateMatch) => {
          const matchTeams = [
            ...candidateMatch.alliances.red.team_keys,
            ...candidateMatch.alliances.blue.team_keys,
          ];
          const teamsToScout = targetTeams
            .filter((team) => matchTeams.includes(team))
            .map((team) => team.replace("frc", ""));

          return {
            match: candidateMatch,
            teamsToScout,
          };
        })
        .filter((item) => item.teamsToScout.length > 0);

      return {
        targetMatch,
        matchesToScout: matchesWithTeams,
      };
    });

    setMatchesToScout(assignments);

    const allMatches = new Map<number, Set<string>>();

    assignments.forEach(({ matchesToScout }) => {
      matchesToScout.forEach(({ match, teamsToScout }) => {
        if (!allMatches.has(match.match_number)) {
          allMatches.set(match.match_number, new Set());
        }
        teamsToScout.forEach((team) => {
          allMatches.get(match.match_number)?.add(team);
        });
      });
    });

    const consolidated = Array.from(allMatches.entries())
      .map(([matchNumber, teams]) => ({
        matchNumber,
        teams: Array.from(teams),
      }))
      .sort((a, b) => a.matchNumber - b.matchNumber);

    setConsolidatedMatches(consolidated);
  };

  const formatMatchTime = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const getMatchPartners = (match: TBAMatch): string[] => {
    const alliance = match.alliances.red.team_keys.includes(`frc${teamNumber}`) ? "red" : "blue";
    return match.alliances[alliance].team_keys
      .map((key) => key.replace("frc", ""))
      .filter((key) => key !== teamNumber);
  };

  const getMatchOpponents = (match: TBAMatch): string[] => {
    const alliance = match.alliances.red.team_keys.includes(`frc${teamNumber}`) ? "red" : "blue";
    const oppositeAlliance = alliance === "red" ? "blue" : "red";
    return match.alliances[oppositeAlliance].team_keys.map((key) => key.replace("frc", ""));
  };

  const getTeamsInMatch = (match: TBAMatch): string => {
    const teams = [
      ...match.alliances.red.team_keys,
      ...match.alliances.blue.team_keys,
    ].map((key) => key.replace("frc", ""));
    return teams.join(", ");
  };

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSelectedMatch(null);
    setMatchesToScout([]);
    setConsolidatedMatches([]);
    await fetchMatches();
  };

  const handleTeamClick = (teamNum: string) => {
    setGlobalTeamNumber(teamNum);
    router.push(`/dashboard/team`);
  };

  const TeamLink = ({ teamNumber }: { teamNumber: string }) => (
    <button
      onClick={() => handleTeamClick(teamNumber)}
      className="text-brandBlue-accent hover:text-brandBlue-soft hover:underline"
    >
      {teamNumber}
    </button>
  );

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Targeted Planning</h1>
            <p className="text-gray-400 mt-2">
              Use configuration values to plan which teams to scout before your upcoming matches.
            </p>
          </div>
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-2 text-sm text-brandBlue-accent hover:text-brandBlue-soft"
          >
            <SettingsIcon className="h-4 w-4" />
            Manage Settings
          </Link>
        </div>

        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader>
            <CardTitle className="text-xl text-white">Team & Event Context</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSearch}
              className="flex flex-col gap-4 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-start"
            >
              <div className="md:pr-4">
                <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="team-number">
                  Team Number
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    id="team-number"
                    placeholder="Enter Team Number"
                    value={teamNumber}
                    onChange={(e) => setTeamNumber(e.target.value)}
                    className="w-full pl-10 bg-[#1A1A1A] border-gray-800 text-white placeholder-gray-400"
                  />
                </div>
              </div>
              <div className="md:pr-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Event Code
                </label>
                <Input
                  value={configuredEventCode || ""}
                  placeholder="Not configured"
                  readOnly
                  className="w-full bg-[#111111] border-gray-800 text-gray-100 placeholder-gray-500"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Update the event code in Settings if this is not the event you expect.
                </p>
              </div>
              <Button
                type="submit"
                className="bg-brandBlue-accent hover:bg-brandBlue text-white"
                disabled={loading || configLoading}
              >
                {loading ? "Loading..." : "Refresh"}
              </Button>
            </form>
            {!hasConfiguredCredentials && !configLoading && (
              <div className="mt-4 rounded-md border border-yellow-600/70 bg-yellow-900/30 px-4 py-3 text-sm text-yellow-200">
                Add your TBA API key and event code on the Settings page to enable targeted planning.
              </div>
            )}
            {error && (
              <div className="mt-4 rounded-md border border-red-600/70 bg-red-900/30 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {upcomingMatches.length > 0 && (
          <Card className="bg-[#1A1A1A] border-gray-800">
            <CardHeader>
              <CardTitle className="text-xl text-white">Upcoming/Current Matches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingMatches.map((match) => (
                  <Button
                    key={match.key}
                    variant={selectedMatch?.key === match.key ? "default" : "outline"}
                    className={`h-auto rounded-xl border text-left transition-all duration-200 ${
                      selectedMatch?.key === match.key
                        ? "bg-brandBlue-accent text-white border-brandBlue-accent hover:bg-brandBlue-soft hover:text-white"
                        : "bg-[#111111] text-white border-gray-800 hover:bg-gray-800/50 hover:border-gray-500 hover:backdrop-blur-sm hover:shadow-lg hover:text-white"
                    }`}
                    onClick={() => handleMatchSelect(match)}
                  >
                    <div className="space-y-2">
                      <div className="text-sm uppercase tracking-[0.2em] text-gray-400">Qualifier</div>
                      <div className="text-2xl font-semibold">Match {match.match_number}</div>
                      <div className="text-sm text-gray-300">
                        Partners: {getMatchPartners(match).join(", ") || "TBD"}
                      </div>
                      <div className="text-sm text-gray-300">
                        Opponents: {getMatchOpponents(match).join(", ") || "TBD"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {match.predicted_time || match.time
                          ? `Scheduled: ${formatMatchTime(match.predicted_time || match.time)}`
                          : "Time TBD"}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {matchesToScout.length > 0 && (
          <Card className="bg-[#1A1A1A] border-gray-800">
            <CardHeader>
              <CardTitle className="text-xl text-white">Matches to Scout Before Selected Match</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {matchesToScout.map(({ targetMatch, matchesToScout }) => (
                <div key={targetMatch.key} className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Target Match {targetMatch.match_number} ({getTeamsInMatch(targetMatch)})
                    </h3>
                    <p className="text-sm text-gray-400">
                      Scout these teams in matches happening before the target match.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {matchesToScout.length === 0 ? (
                      <p className="text-sm text-gray-400">
                        No relevant matches found before this target match.
                      </p>
                    ) : (
                      matchesToScout.map(({ match, teamsToScout }) => (
                        <div
                          key={match.key}
                          className="rounded-lg border border-gray-800 bg-[#111111] p-4"
                        >
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
                            <span className="font-semibold text-white">
                              Match {match.match_number}
                            </span>
                            <span className="text-gray-500">
                              {match.predicted_time || match.time
                                ? formatMatchTime(match.predicted_time || match.time)
                                : "Time TBD"}
                            </span>
                            <span className="text-gray-500">
                              Teams: {getTeamsInMatch(match)}
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-brandBlue-accent">
                            Focus Teams: {teamsToScout.join(", ")}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {consolidatedMatches.length > 0 && (
          <Card className="bg-[#1A1A1A] border-gray-800">
            <CardHeader>
              <CardTitle className="text-xl text-white">Consolidated Scouting Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-800">
                    <TableHead className="text-gray-400">Match</TableHead>
                    <TableHead className="text-gray-400">Teams to Scout</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consolidatedMatches.map((match) => (
                    <TableRow key={match.matchNumber} className="border-gray-800">
                      <TableCell className="text-white">Match {match.matchNumber}</TableCell>
                      <TableCell className="text-gray-300">
                        {match.teams.length > 0 ? match.teams.join(", ") : "None"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
