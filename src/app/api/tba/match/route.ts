import { NextRequest, NextResponse } from 'next/server';
import { loadAppConfig } from '@/lib/server/config';

const TBA_API_BASE = 'https://www.thebluealliance.com/api/v3';

async function fetchMatch(endpoint: string, apiKey: string) {
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
  const matchParam = searchParams.get('matchNumber');
  const level = searchParams.get('level') ?? 'qm';

  if (!matchParam) {
    return NextResponse.json({ message: 'Missing required query parameter: matchNumber' }, { status: 400 });
  }

  try {
    const matchNumber = parseInt(matchParam, 10);
    if (Number.isNaN(matchNumber)) {
      return NextResponse.json({ message: 'Invalid matchNumber provided' }, { status: 400 });
    }

    const config = await loadAppConfig();

    if (!config.tbaApiKey || !config.eventCode) {
      return NextResponse.json(
        { message: 'TBA API key or event code is not configured' },
        { status: 400 }
      );
    }

    const matchKey = `${config.eventCode}_${level}${matchNumber}`;
    const matchData = await fetchMatch(`/match/${matchKey}`, config.tbaApiKey);

    return NextResponse.json(matchData);
  } catch (error) {
    console.error('Failed to fetch match from TBA', error);
    return NextResponse.json({ message: 'Failed to fetch match from TBA' }, { status: 502 });
  }
}
