import { TBAMatch, TBATeamMatch, TBAMockData } from '@/types/tba';

import mockData from '@/data/tba-mock-data.json';

const TBA_API_BASE = 'https://www.thebluealliance.com/api/v3';
const TBA_API_KEY = process.env.NEXT_PUBLIC_TBA_API_KEY || '';

export async function getTeamMatches(teamKey: string): Promise<TBAMatch[]> {
  console.log('getTeamMatches called with teamKey:', teamKey);
  
  if (!TBA_API_KEY) {
    console.log('No API key found, using mock data');
    const mockDataTyped = mockData as TBAMockData;
    const teamMatches = mockDataTyped.team_matches[`frc${teamKey}`] || [];
    console.log('Mock data for team:', teamMatches.length, 'matches found');
    return teamMatches;
  }

  try {
    console.log('Fetching from TBA API...');
    const response = await fetch(
      `${TBA_API_BASE}/team/frc${teamKey}/matches/2024`,
      {
        headers: {
          'X-TBA-Auth-Key': TBA_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`TBA API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('TBA API response:', data);
    return data;
  } catch (error) {
    console.error('Error fetching team matches:', error);
    return [];
  }
}

export function getUpcomingMatches(matches: TBAMatch[]): TBAMatch[] {
  console.log('Checking matches for upcoming:', matches);
  return matches.sort((a, b) => {
    const timeA = a.predicted_time || a.time;
    const timeB = b.predicted_time || b.time;
    return timeA - timeB;
  });
}

export function getOpponentMatches(
  selectedMatch: TBAMatch,
  allMatches: TBAMatch[]
): TBAMatch[] {
  const teams = [
    ...selectedMatch.alliances.red.team_keys,
    ...selectedMatch.alliances.blue.team_keys,
  ];
  const opponentMatches = allMatches.filter(match => {
    const matchTeams = [
      ...match.alliances.red.team_keys,
      ...match.alliances.blue.team_keys,
    ];
    return (
      match.key !== selectedMatch.key &&
      teams.some(team => matchTeams.includes(team))
    );
  });

  return opponentMatches.sort((a, b) => a.predicted_time - b.predicted_time);
}

export function formatMatchTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
}

export function getMatchAlliance(match: TBAMatch, teamKey: string): 'red' | 'blue' | null {
  if (match.alliances.red.team_keys.includes(`frc${teamKey}`)) {
    return 'red';
  }
  if (match.alliances.blue.team_keys.includes(`frc${teamKey}`)) {
    return 'blue';
  }
  return null;
}

export function getMatchPartners(match: TBAMatch, teamKey: string): string[] {
  const alliance = getMatchAlliance(match, teamKey);
  if (!alliance) return [];
  
  return match.alliances[alliance].team_keys
    .map((key: string) => key.replace('frc', ''))
    .filter((key: string) => key !== teamKey);
}

export function getMatchOpponents(match: TBAMatch, teamKey: string): string[] {
  const alliance = getMatchAlliance(match, teamKey);
  if (!alliance) return [];
  
  const oppositeAlliance = alliance === 'red' ? 'blue' : 'red';
  return match.alliances[oppositeAlliance].team_keys
    .map((key: string) => key.replace('frc', ''));
} 