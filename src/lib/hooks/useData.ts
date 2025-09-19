'use client';

import { useState, useEffect } from 'react';

export interface MatchData {
  teamNumber: number;
  epa: number;
}

export const useData = () => {
  const [data, setData] = useState<MatchData[]>([]);
  const [teams, setTeams] = useState<number[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/data');
        const jsonData = await response.json() as MatchData[];
        setData(jsonData);
        const uniqueTeams = Array.from(new Set(jsonData.map(d => d.teamNumber))) as number[];
        setTeams(uniqueTeams.sort((a, b) => a - b));
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  return { data, teams };
}; 