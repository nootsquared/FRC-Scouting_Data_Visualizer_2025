import { NextRequest, NextResponse } from 'next/server';

// TBA API configuration
const TBA_API_BASE_URL = 'https://www.thebluealliance.com/api/v3';
const TBA_API_KEY = process.env.TBA_API_KEY || '';

export async function GET(
  request: NextRequest,
  { params }: { params: { teamKey: string } }
) {
  try {
    const teamKey = params.teamKey;
    
    // Validate team key format
    if (!teamKey.match(/^\d+$/)) {
      return NextResponse.json(
        { error: 'Invalid team key format. Must be a number.' },
        { status: 400 }
      );
    }
    
    // Format team key for TBA API (add 'frc' prefix if not present)
    const formattedTeamKey = teamKey.startsWith('frc') ? teamKey : `frc${teamKey}`;
    
    // Fetch team matches from TBA API
    const response = await fetch(
      `${TBA_API_BASE_URL}/team/${formattedTeamKey}/matches/2024`,
      {
        headers: {
          'X-TBA-Auth-Key': TBA_API_KEY,
        },
      }
    );
    
    if (!response.ok) {
      // If TBA API returns an error, return a more user-friendly error message
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Team not found or no matches available.' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: `TBA API error: ${response.statusText}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    // Return the data
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching team matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team matches.' },
      { status: 500 }
    );
  }
} 