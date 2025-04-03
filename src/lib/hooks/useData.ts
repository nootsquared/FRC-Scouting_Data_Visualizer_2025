import { useState, useEffect } from 'react';

export interface MatchData {
  teamNumber: number;
  epa: number;
  // Add other fields as needed
}

export const useData = () => {
  const [data, setData] = useState<MatchData[]>([]);
  const [teams, setTeams] = useState<number[]>([]);

  useEffect(() => {
    // Load data from your data service
    const loadData = async () => {
      try {
        const response = await fetch('/api/data');
        const jsonData = await response.json() as MatchData[];
        setData(jsonData);
        
        // Extract unique team numbers
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