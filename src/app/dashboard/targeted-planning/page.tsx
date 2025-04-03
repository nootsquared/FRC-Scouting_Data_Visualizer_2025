"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Key, Calendar } from "lucide-react";
import { TBAMatch } from '@/types/tba';

const TBA_API_BASE = 'https://www.thebluealliance.com/api/v3';

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
  const [teamNumber, setTeamNumber] = useState("226");
  const [eventCode, setEventCode] = useState("2024onosh"); // Default to Oshawa event
  const [tbaKey, setTbaKey] = useState("");
  const [matches, setMatches] = useState<TBAMatch[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<TBAMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<TBAMatch | null>(null);
  const [matchesToScout, setMatchesToScout] = useState<MatchesToScout[]>([]);
  const [consolidatedMatches, setConsolidatedMatches] = useState<ConsolidatedMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store TBA key in localStorage
  useEffect(() => {
    const savedKey = localStorage.getItem('tbaKey');
    if (savedKey) {
      setTbaKey(savedKey);
    }
  }, []);

  const fetchMatches = async () => {
    if (!tbaKey) {
      setError('Please enter your TBA API key');
      return;
    }

    if (!eventCode) {
      setError('Please enter an event code');
      return;
    }

    console.log('Fetching matches for team:', teamNumber, 'at event:', eventCode);
    setLoading(true);
    setError(null);

    try {
      // First, fetch all event matches
      const response = await fetch(
        `${TBA_API_BASE}/event/${eventCode}/matches`,
        {
          headers: {
            'X-TBA-Auth-Key': tbaKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`TBA API error: ${response.status}`);
      }

      const allMatches = await response.json();
      console.log('Received all matches:', allMatches);

      // Filter matches for our team
      const teamMatches = allMatches.filter((match: TBAMatch) => {
        const allTeams = [
          ...match.alliances.red.team_keys,
          ...match.alliances.blue.team_keys,
        ];
        return allTeams.includes(`frc${teamNumber}`);
      });
      
      setMatches(allMatches); // Store all matches for opponent lookup
      
      // Sort matches by time and filter for upcoming
      const now = Date.now() / 1000;
      const upcoming = teamMatches
        .filter((match: TBAMatch) => (match.predicted_time || match.time) >= now)
        .sort((a: TBAMatch, b: TBAMatch) => {
          const timeA = a.predicted_time || a.time;
          const timeB = b.predicted_time || b.time;
          return timeA - timeB;
        });
      
      setUpcomingMatches(upcoming);
      
      // Save valid TBA key
      localStorage.setItem('tbaKey', tbaKey);
    } catch (err) {
      console.error('Error fetching matches:', err);
      setError('Failed to fetch matches. Please check your API key and event code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMatchSelect = (match: TBAMatch) => {
    setSelectedMatch(match);
    
    // Find index of selected match in upcoming matches
    const selectedIndex = upcomingMatches.findIndex(m => m.key === match.key);
    if (selectedIndex === -1) return;

    // Get the next two matches after the selected match
    const nextTwoMatches = upcomingMatches.slice(selectedIndex + 1, selectedIndex + 3);
    if (nextTwoMatches.length === 0) return;

    // For each of the next two matches, find all matches to scout
    const matchesToScout = nextTwoMatches.map(targetMatch => {
      // Get all teams in the target match
      const targetTeams = [
        ...targetMatch.alliances.red.team_keys,
        ...targetMatch.alliances.blue.team_keys,
      ].filter(team => team !== `frc${teamNumber}`);

      // Find all matches between selected match and target match
      const targetMatchTime = targetMatch.predicted_time || targetMatch.time;
      const selectedMatchTime = match.predicted_time || match.time;
      const relevantMatches = matches
        .filter(m => {
          const matchTime = m.predicted_time || m.time;
          return matchTime > selectedMatchTime && matchTime < targetMatchTime;
        })
        .sort((a, b) => (a.predicted_time || a.time) - (b.predicted_time || b.time));

      // For each match, identify which teams from our target match are playing
      const matchesWithTeams = relevantMatches.map(match => {
        const matchTeams = [
          ...match.alliances.red.team_keys,
          ...match.alliances.blue.team_keys,
        ];
        const teamsToScout = targetTeams
          .filter(team => matchTeams.includes(team))
          .map(team => team.replace('frc', ''));

        return {
          match,
          teamsToScout,
        };
      }).filter(item => item.teamsToScout.length > 0);

      return {
        targetMatch,
        matchesToScout: matchesWithTeams,
      };
    });

    setMatchesToScout(matchesToScout);

    // Create consolidated view
    const allMatches = new Map<number, Set<string>>();
    
    matchesToScout.forEach(({ matchesToScout }) => {
      matchesToScout.forEach(({ match, teamsToScout }) => {
        if (!allMatches.has(match.match_number)) {
          allMatches.set(match.match_number, new Set());
        }
        teamsToScout.forEach(team => {
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
    const alliance = match.alliances.red.team_keys.includes(`frc${teamNumber}`) ? 'red' : 'blue';
    return match.alliances[alliance].team_keys
      .map(key => key.replace('frc', ''))
      .filter(key => key !== teamNumber);
  };

  const getMatchOpponents = (match: TBAMatch): string[] => {
    const alliance = match.alliances.red.team_keys.includes(`frc${teamNumber}`) ? 'red' : 'blue';
    const oppositeAlliance = alliance === 'red' ? 'blue' : 'red';
    return match.alliances[oppositeAlliance].team_keys.map(key => key.replace('frc', ''));
  };

  const getTeamsInMatch = (match: TBAMatch): string => {
    const teams = [
      ...match.alliances.red.team_keys,
      ...match.alliances.blue.team_keys
    ].map(key => key.replace('frc', ''));
    return teams.join(', ');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMatches();
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">Targeted Planning</h1>

        {/* API Key Input */}
        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader>
            <CardTitle className="text-xl text-white">TBA API Key</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="password"
                placeholder="Enter your TBA API key"
                value={tbaKey}
                onChange={(e) => setTbaKey(e.target.value)}
                className="w-full pl-10 bg-[#1A1A1A] border-gray-800 text-white placeholder-gray-400"
              />
            </div>
          </CardContent>
        </Card>

        {/* Team and Event Search */}
        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader>
            <CardTitle className="text-xl text-white">Team and Event Selection</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-4 items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  placeholder="Enter Team Number"
                  value={teamNumber}
                  onChange={(e) => setTeamNumber(e.target.value)}
                  className="w-[200px] pl-10 bg-[#1A1A1A] border-gray-800 text-white placeholder-gray-400"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  placeholder="Enter Event Code (e.g., 2024onosh)"
                  value={eventCode}
                  onChange={(e) => setEventCode(e.target.value)}
                  className="w-[300px] pl-10 bg-[#1A1A1A] border-gray-800 text-white placeholder-gray-400"
                />
              </div>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading || !tbaKey}
              >
                {loading ? "Loading..." : "Search"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Upcoming Matches */}
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
                    className={`h-auto py-4 px-6 text-left ${
                      selectedMatch?.key === match.key
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800"
                    }`}
                    onClick={() => handleMatchSelect(match)}
                  >
                    <div>
                      <div className="font-medium">
                        Match {match.match_number}
                      </div>
                      <div className="text-sm mt-1">
                        {formatMatchTime(match.predicted_time || match.time)}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Matches to Scout Tables */}
        {selectedMatch && matchesToScout.map((matchData, index) => (
          <Card key={matchData.targetMatch.key} className="bg-[#1A1A1A] border-gray-800">
            <CardHeader>
              <CardTitle className="text-xl text-white">
                Matches to Scout for {index === 0 ? 'Next' : 'Following'} Match ({matchData.targetMatch.match_number})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800">
                      <TableHead className="text-gray-300">Match</TableHead>
                      <TableHead className="text-gray-300">Time</TableHead>
                      <TableHead className="text-gray-300">Teams to Scout</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matchData.matchesToScout.map(({ match, teamsToScout }) => (
                      <TableRow key={match.key} className="border-gray-800">
                        <TableCell className="text-gray-300 font-medium">
                          Match {match.match_number}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {formatMatchTime(match.predicted_time || match.time)}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {teamsToScout.join(', ')}
                        </TableCell>
                      </TableRow>
                    ))}
                    {matchData.matchesToScout.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-gray-400">
                          No matches to scout before Match {matchData.targetMatch.match_number}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Consolidated View */}
        {selectedMatch && consolidatedMatches.length > 0 && (
          <Card className="bg-[#1A1A1A] border-gray-800">
            <CardHeader>
              <CardTitle className="text-xl text-white">
                All Teams to Scout by Match
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {consolidatedMatches.map(({ matchNumber, teams }) => (
                  <div 
                    key={matchNumber}
                    className="bg-gray-800/50 rounded-lg p-4"
                  >
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Match {matchNumber}
                    </h3>
                    <div className="text-gray-300 space-y-1">
                      {teams.map(team => (
                        <div key={team} className="text-sm">
                          {team}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 