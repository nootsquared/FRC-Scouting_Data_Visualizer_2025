"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Key, Calendar } from "lucide-react";
import { TBAMatch } from '@/types/tba';
import Link from "next/link";
import { useAppContext } from "@/lib/context/AppContext";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const { setTeamNumber: setGlobalTeamNumber } = useAppContext();
  const [teamNumber, setTeamNumber] = useState("226");
  const [eventCode, setEventCode] = useState("");
  const [tbaKey, setTbaKey] = useState("");
  const [matches, setMatches] = useState<TBAMatch[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<TBAMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<TBAMatch | null>(null);
  const [matchesToScout, setMatchesToScout] = useState<MatchesToScout[]>([]);
  const [consolidatedMatches, setConsolidatedMatches] = useState<ConsolidatedMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved values from localStorage
  useEffect(() => {
    const savedKey = localStorage.getItem('tbaKey');
    const savedEventCode = localStorage.getItem('eventCode');
    const savedMatches = localStorage.getItem('tbaMatches');
    const savedUpcomingMatches = localStorage.getItem('tbaUpcomingMatches');
    const savedSelectedMatch = localStorage.getItem('tbaSelectedMatch');
    const savedMatchesToScout = localStorage.getItem('tbaMatchesToScout');
    const savedConsolidatedMatches = localStorage.getItem('tbaConsolidatedMatches');

    if (savedKey) setTbaKey(savedKey);
    if (savedEventCode) {
      setEventCode(savedEventCode);
    } else {
      setEventCode("2024miket"); // Set default to Michigan State Championship
    }
    if (savedMatches) setMatches(JSON.parse(savedMatches));
    if (savedUpcomingMatches) setUpcomingMatches(JSON.parse(savedUpcomingMatches));
    if (savedSelectedMatch) setSelectedMatch(JSON.parse(savedSelectedMatch));
    if (savedMatchesToScout) setMatchesToScout(JSON.parse(savedMatchesToScout));
    if (savedConsolidatedMatches) setConsolidatedMatches(JSON.parse(savedConsolidatedMatches));
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    if (matches.length > 0) localStorage.setItem('tbaMatches', JSON.stringify(matches));
    if (upcomingMatches.length > 0) localStorage.setItem('tbaUpcomingMatches', JSON.stringify(upcomingMatches));
    if (selectedMatch) localStorage.setItem('tbaSelectedMatch', JSON.stringify(selectedMatch));
    if (matchesToScout.length > 0) localStorage.setItem('tbaMatchesToScout', JSON.stringify(matchesToScout));
    if (consolidatedMatches.length > 0) localStorage.setItem('tbaConsolidatedMatches', JSON.stringify(consolidatedMatches));
  }, [matches, upcomingMatches, selectedMatch, matchesToScout, consolidatedMatches]);

  const fetchMatches = async () => {
    if (!tbaKey) {
      console.log('No TBA API key provided');
      setError('Please enter your TBA API key');
      return;
    }

    if (!eventCode) {
      console.log('No event code provided');
      setError('Please enter an event code');
      return;
    }

    console.log('Fetching matches with:', {
      teamNumber,
      eventCode,
      tbaKeyLength: tbaKey.length,
      tbaKeyPrefix: tbaKey.substring(0, 5) + '...'
    });
    
    setLoading(true);
    setError(null);

    try {
      // Test the API key first with a simple request
      const testResponse = await fetch(
        `${TBA_API_BASE}/status`,
        {
          headers: {
            'X-TBA-Auth-Key': tbaKey,
          },
        }
      );

      if (!testResponse.ok) {
        console.error('API Key validation failed:', await testResponse.text());
        throw new Error('Invalid API key');
      }

      // Fetch team-specific matches
      const url = `${TBA_API_BASE}/team/frc${teamNumber}/event/${eventCode}/matches`;
      console.log('Fetching from URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'X-TBA-Auth-Key': tbaKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('TBA API Error Response:', {
          url,
          status: response.status,
          statusText: response.statusText,
          errorText: errorText,
          headers: Object.fromEntries(response.headers.entries())
        });
        throw new Error(`TBA API error: ${response.status} - ${errorText}`);
      }

      const teamMatches = await response.json();
      console.log('Received team matches:', teamMatches);

      // Also fetch all event matches for opponent lookup
      const allMatchesResponse = await fetch(
        `${TBA_API_BASE}/event/${eventCode}/matches`,
        {
          headers: {
            'X-TBA-Auth-Key': tbaKey,
          },
        }
      );

      if (!allMatchesResponse.ok) {
        throw new Error(`Failed to fetch all matches: ${allMatchesResponse.statusText}`);
      }

      const allMatches = await allMatchesResponse.json();
      setMatches(allMatches);

      // Filter and sort the team's matches
      const upcoming = teamMatches
        .filter((match: TBAMatch) => {
          // Only include qualification matches
          return match.comp_level === 'qm';
        })
        .sort((a: TBAMatch, b: TBAMatch) => {
          // Sort by match number
          return a.match_number - b.match_number;
        });
      
      console.log('Filtered and sorted matches:', upcoming.map((match: TBAMatch) => ({
        number: match.match_number,
        type: match.comp_level
      })));
      
      setUpcomingMatches(upcoming);
      
      // Save valid TBA key
      const trimmedKey = tbaKey.trim();
      setTbaKey(trimmedKey);
      localStorage.setItem('tbaKey', trimmedKey);
      console.log('Saving TBA API Key (first 5 chars):', trimmedKey.substring(0, 5));
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
    // Trim the API key before saving and using it
    const trimmedKey = tbaKey.trim();
    setTbaKey(trimmedKey);
    localStorage.setItem('tbaKey', trimmedKey);
    console.log('Saving TBA API Key (first 5 chars):', trimmedKey.substring(0, 5));
    fetchMatches();
  };

  const handleEventCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEventCode = e.target.value.trim();
    setEventCode(newEventCode);
    localStorage.setItem('eventCode', newEventCode);
    console.log('Saving Event Code:', newEventCode);
  };

  const handleTeamClick = (teamNum: string) => {
    setGlobalTeamNumber(teamNum);
    router.push(`/dashboard/team`);
  };

  const TeamLink = ({ teamNumber }: { teamNumber: string }) => (
    <button
      onClick={() => handleTeamClick(teamNumber)}
      className="text-blue-400 hover:text-blue-300 hover:underline"
    >
      {teamNumber}
    </button>
  );

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
                  onChange={handleEventCodeChange}
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
                        ? "bg-blue-600 hover:bg-blue-700 text-white hover:text-white"
                        : "bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
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
                          {teamsToScout.map((team, idx) => (
                            <>
                              <TeamLink key={team} teamNumber={team} />
                              {idx < teamsToScout.length - 1 ? ', ' : ''}
                            </>
                          ))}
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
                          <TeamLink teamNumber={team} />
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