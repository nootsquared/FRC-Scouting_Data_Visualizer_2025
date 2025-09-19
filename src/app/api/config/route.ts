import { NextRequest, NextResponse } from 'next/server';
import { loadAppConfig, saveAppConfig, sanitizeConfig } from '@/lib/server/config';
import type { AppConfig } from '@/types/app-config';

export async function GET() {
  try {
    const config = await loadAppConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error('Failed to read app-config.json', error);
    return NextResponse.json({ message: 'Failed to read configuration' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (typeof body !== 'object' || body === null) {
      return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
    }

    const config = sanitizeConfig(body as Partial<AppConfig>);
    await saveAppConfig(config);

    return NextResponse.json(config);
  } catch (error) {
    console.error('Failed to update app-config.json', error);
    return NextResponse.json({ message: 'Failed to update configuration' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return PUT(request);
}
