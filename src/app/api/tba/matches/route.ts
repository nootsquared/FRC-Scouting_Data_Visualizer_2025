import { NextRequest, NextResponse } from 'next/server';
import { loadAppConfig } from '@/lib/server/config';

const TBA_API_BASE = 'https://www.thebluealliance.com/api/v3';

async function fetchFromTBA(endpoint: string, apiKey: string) {
  const response = await fetch(`${TBA_API_BASE}${endpoint}`, {
    headers: {
      'X-TBA-Auth-Key': apiKey,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`TBA request failed (${response.status}): ${errorBody}`);
  }

  return response.json();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const teamParam = searchParams.get('teamNumber');

  if (!teamParam) {
    return NextResponse.json({ message: 'Missing required query parameter: teamNumber' }, { status: 400 });
  }

  try {
    const teamNumber = parseInt(teamParam, 10);
    if (Number.isNaN(teamNumber)) {
      return NextResponse.json({ message: 'Invalid teamNumber provided' }, { status: 400 });
    }

    const config = await loadAppConfig();

    if (!config.tbaApiKey || !config.eventCode) {
      return NextResponse.json(
        { message: 'TBA API key or event code is not configured' },
        { status: 400 }
      );
    }

    const teamMatchesEndpoint = `/team/frc${teamNumber}/event/${config.eventCode}/matches`;
    const eventMatchesEndpoint = `/event/${config.eventCode}/matches`;

    const [teamMatches, eventMatches] = await Promise.all([
      fetchFromTBA(teamMatchesEndpoint, config.tbaApiKey),
      fetchFromTBA(eventMatchesEndpoint, config.tbaApiKey),
    ]);

    return NextResponse.json({
      teamMatches,
      eventMatches,
    });
  } catch (error) {
    console.error('Failed to fetch matches from TBA', error);
    return NextResponse.json({ message: 'Failed to fetch matches from TBA' }, { status: 502 });
  }
}
