"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from 'react';
import { ProcessingMode, ZeroHandling, RankingMetric } from '@/components/ui/all-teams-data-controls';
import type { AppConfig } from '@/types/app-config';

interface AppContextType {
  processingMode: ProcessingMode;
  setProcessingMode: (mode: ProcessingMode) => void;
  zeroHandling: ZeroHandling;
  setZeroHandling: (handling: ZeroHandling) => void;
  rankingMetric: RankingMetric;
  setRankingMetric: (metric: RankingMetric) => void;
  teamNumber: string;
  setTeamNumber: (number: string) => void;
  teamData: any;
  setTeamData: (data: any) => void;
  teamAverages: any;
  setTeamAverages: (averages: any) => void;
  pitData: any;
  setPitData: (data: any) => void;
  config: AppConfig | null;
  setConfig: (config: AppConfig | null) => void;
  refreshConfig: () => Promise<void>;
  configLoading: boolean;
  configError: string | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [processingMode, setProcessingMode] = useState<ProcessingMode>("average");
  const [zeroHandling, setZeroHandling] = useState<ZeroHandling>("include");
  const [rankingMetric, setRankingMetric] = useState<RankingMetric>("epa");
  const [teamNumber, setTeamNumber] = useState("");
  const [teamData, setTeamData] = useState<any>(null);
  const [teamAverages, setTeamAverages] = useState<any>(null);
  const [pitData, setPitData] = useState<any>(null);
  const [configState, setConfigState] = useState<AppConfig | null>(null);
  const [configLoading, setConfigLoading] = useState<boolean>(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const handleProcessingModeChange = useCallback((mode: ProcessingMode) => {
    setProcessingMode(mode);
  }, []);

  const handleZeroHandlingChange = useCallback((handling: ZeroHandling) => {
    setZeroHandling(handling);
  }, []);

  const handleRankingMetricChange = useCallback((metric: RankingMetric) => {
    setRankingMetric(metric);
  }, []);

  const refreshConfig = useCallback(async () => {
    setConfigLoading(true);
    setConfigError(null);

    try {
      const response = await fetch('/api/config');
      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.status}`);
      }
      const config = (await response.json()) as AppConfig;
      setConfigState(config);
    } catch (error) {
      console.error('Failed to load configuration', error);
      setConfigState(null);
      setConfigError('Unable to load configuration');
    } finally {
      setConfigLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshConfig();
  }, [refreshConfig]);

  const handleSetConfig = useCallback((config: AppConfig | null) => {
    setConfigState(config);
  }, []);

  return (
    <AppContext.Provider
      value={{
        processingMode,
        setProcessingMode: handleProcessingModeChange,
        zeroHandling,
        setZeroHandling: handleZeroHandlingChange,
        rankingMetric,
        setRankingMetric: handleRankingMetricChange,
        teamNumber,
        setTeamNumber,
        teamData,
        setTeamData,
        teamAverages,
        setTeamAverages,
        pitData,
        setPitData,
        config: configState,
        setConfig: handleSetConfig,
        refreshConfig,
        configLoading,
        configError,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
} 
