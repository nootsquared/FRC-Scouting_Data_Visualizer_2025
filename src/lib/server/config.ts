import { promises as fs } from 'fs';
import path from 'path';
import type { AppConfig } from '@/types/app-config';

const CONFIG_PATH = path.join(process.cwd(), 'src/data/app-config.json');

export const defaultAppConfig: AppConfig = {
  tbaApiKey: '',
  eventCode: '',
  matchDataDirectory: 'src/data',
  matchDataFile: 'scouting-data.json',
};

export async function loadAppConfig(): Promise<AppConfig> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      ...defaultAppConfig,
      ...parsed,
    } satisfies AppConfig;
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      await saveAppConfig(defaultAppConfig);
      return defaultAppConfig;
    }
    throw error;
  }
}

export async function saveAppConfig(config: AppConfig): Promise<void> {
  const serialized = JSON.stringify(config, null, 2);
  await fs.writeFile(CONFIG_PATH, serialized, 'utf-8');
}

export function sanitizeConfig(input: Partial<AppConfig>): AppConfig {
  return {
    tbaApiKey: input.tbaApiKey ?? defaultAppConfig.tbaApiKey,
    eventCode: input.eventCode ?? defaultAppConfig.eventCode,
    matchDataDirectory: input.matchDataDirectory ?? defaultAppConfig.matchDataDirectory,
    matchDataFile: input.matchDataFile ?? defaultAppConfig.matchDataFile,
  } satisfies AppConfig;
}
