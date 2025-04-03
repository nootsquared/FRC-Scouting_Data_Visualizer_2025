"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ProcessingMode, ZeroHandling, RankingMetric } from '@/components/ui/all-teams-data-controls';

interface AppContextType {
  // All Teams View State
  processingMode: ProcessingMode;
  setProcessingMode: (mode: ProcessingMode) => void;
  zeroHandling: ZeroHandling;
  setZeroHandling: (handling: ZeroHandling) => void;
  rankingMetric: RankingMetric;
  setRankingMetric: (metric: RankingMetric) => void;
  
  // Team Analysis State
  teamNumber: string;
  setTeamNumber: (number: string) => void;
  teamData: any;
  setTeamData: (data: any) => void;
  teamAverages: any;
  setTeamAverages: (averages: any) => void;
  pitData: any;
  setPitData: (data: any) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // All Teams View State
  const [processingMode, setProcessingMode] = useState<ProcessingMode>("average");
  const [zeroHandling, setZeroHandling] = useState<ZeroHandling>("include");
  const [rankingMetric, setRankingMetric] = useState<RankingMetric>("epa");
  
  // Team Analysis State
  const [teamNumber, setTeamNumber] = useState("");
  const [teamData, setTeamData] = useState<any>(null);
  const [teamAverages, setTeamAverages] = useState<any>(null);
  const [pitData, setPitData] = useState<any>(null);

  return (
    <AppContext.Provider
      value={{
        processingMode,
        setProcessingMode,
        zeroHandling,
        setZeroHandling,
        rankingMetric,
        setRankingMetric,
        teamNumber,
        setTeamNumber,
        teamData,
        setTeamData,
        teamAverages,
        setTeamAverages,
        pitData,
        setPitData,
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