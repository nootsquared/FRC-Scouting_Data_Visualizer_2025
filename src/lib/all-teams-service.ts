import scoutingData from '@/data/scouting-data.json';
import preScoutingData from '@/data/scouting-data-pre.json';
import { ProcessingMode, ZeroHandling } from '@/components/ui/data-processing-controls';
import { MatchData, getMatchData } from './data-service';
import { DataSource } from '@/components/ui/data-source-selector';

interface TeamRankingData {
  teamNumber: string;
  totalEPA: number;
  totalCoral: number;
  autonCoral: number;
  autonAlgae: number;
  teleopCoral: number;
  teleopAlgae: number;
  autonEPA: number;
  teleopEPA: number;
  autonL1: number;
  autonL2: number;
  autonL3: number;
  autonL4: number;
  autonProcessor: number;
  autonBarge: number;
  teleopL1: number;
  teleopL2: number;
  teleopL3: number;
  teleopL4: number;
  teleopProcessor: number;
  teleopBarge: number;
  defenseRating: number;
}

const processDefenseRating = (rating: string | number | undefined): number => {
  if (!isNaN(Number(rating))) {
    const numRating = Number(rating);
    return numRating >= 0 && numRating <= 3 ? numRating : 0;
  }
  if (!rating || typeof rating !== 'string') return 0;
  switch(rating.toLowerCase()) {
    case '3':
    case 'excellent':
    case 'e':
      return 3;
    case '2':
    case 'good':
    case 'g':
      return 2;
    case '1':
    case 'fair':
    case 'f':
      return 1;
    case '0':
    case 'poor':
    case 'p':
    default:
      return 0;
  }
};

const calculateTeamMetrics = (
  matches: MatchData[],
  mode: ProcessingMode,
  zeroHandling: ZeroHandling
): TeamRankingData => {
  const processData = (data: number[]) => {
    let processedData = [...data];
    
    if (zeroHandling === "exclude") {
      processedData = processedData.filter(value => value > 0);
    }
    
    if (processedData.length === 0) return 0;
    
    switch (mode) {
      case "average":
        return processedData.reduce((a, b) => a + b, 0) / processedData.length;
      case "top50":
        processedData.sort((a, b) => b - a);
        const topHalf = processedData.slice(0, Math.ceil(processedData.length / 2));
        return topHalf.reduce((a, b) => a + b, 0) / topHalf.length;
      case "best":
        return Math.max(...processedData);
      default:
        return processedData.reduce((a, b) => a + b, 0) / processedData.length;
    }
  };

  const autonL1 = processData(matches.map(m => parseInt(m["Auton-Coral-L1"]) || 0));
  const autonL2 = processData(matches.map(m => parseInt(m["Auton-Coral-L2"]) || 0));
  const autonL3 = processData(matches.map(m => parseInt(m["Auton-Coral-L3"]) || 0));
  const autonL4 = processData(matches.map(m => parseInt(m["Auton-Coral-L4"]) || 0));
  
  const teleopL1 = processData(matches.map(m => parseInt(m["Teleop-Coral-L1"]) || 0));
  const teleopL2 = processData(matches.map(m => parseInt(m["Teleop-Coral-L2"]) || 0));
  const teleopL3 = processData(matches.map(m => parseInt(m["Teleop-Coral-L3"]) || 0));
  const teleopL4 = processData(matches.map(m => parseInt(m["Teleop-Coral-L4"]) || 0));

  const autonProcessor = processData(matches.map(m => parseInt(m["Auton-Algae-Processor"]) || 0));
  const autonNet = processData(matches.map(m => parseInt(m["Auton-Algae-Net"]) || 0));
  const teleopProcessor = processData(matches.map(m => parseInt(m["Teleop-Algae-Processor"]) || 0));
  const teleopNet = processData(matches.map(m => parseInt(m["Teleop-Algae-Net"]) || 0));

  const autonCoral = autonL1 + autonL2 + autonL3 + autonL4;
  const teleopCoral = teleopL1 + teleopL2 + teleopL3 + teleopL4;
  const autonAlgae = autonProcessor + autonNet;
  const teleopAlgae = teleopProcessor + teleopNet;

  const autonEPA = (
    autonL1 * 3 +
    autonL2 * 4 +
    autonL3 * 6 +
    autonL4 * 7 +
    autonProcessor * 6 +
    autonNet * 4
  );

  const teleopEPA = (
    teleopL1 * 2 +
    teleopL2 * 3 +
    teleopL3 * 4 +
    teleopL4 * 5 +
    teleopProcessor * 6 +
    teleopNet * 4
  );

  const defenseRatings = matches.map(m => {
    const rawRating = m["Defense Rating"];
    const processedRating = processDefenseRating(rawRating);
    console.log(`Team ${m["Team-Number"]} match defense rating:`, {
      raw: rawRating,
      processed: processedRating,
      matchNumber: m["Match-Number"]
    });
    return processedRating;
  }).filter(rating => rating > 0);

  const defenseRating = defenseRatings.length > 0 
    ? defenseRatings.reduce((a, b) => a + b, 0) / defenseRatings.length 
    : 0;

  console.log(`Team ${matches[0]["Team-Number"]} final defense rating:`, {
    allRatings: defenseRatings,
    processedAverage: defenseRating,
    mode,
    zeroHandling
  });

  return {
    teamNumber: matches[0]["Team-Number"],
    totalEPA: autonEPA + teleopEPA,
    totalCoral: autonCoral + teleopCoral,
    autonCoral,
    autonAlgae,
    teleopCoral,
    teleopAlgae,
    autonEPA,
    teleopEPA,
    autonL1,
    autonL2,
    autonL3,
    autonL4,
    autonProcessor,
    autonBarge: 0,
    teleopL1,
    teleopL2,
    teleopL3,
    teleopL4,
    teleopProcessor,
    teleopBarge: 0,
    defenseRating,
  };
};

export function getAllTeamsRankings(
  mode: ProcessingMode,
  zeroHandling: ZeroHandling,
  dataSource: DataSource = "live"
): TeamRankingData[] {
  const matchData = getMatchData(dataSource);
  
  const teamMatches = new Map<string, MatchData[]>();
  
  matchData.forEach(match => {
    const teamNumber = match["Team-Number"];
    if (!teamMatches.has(teamNumber)) {
      teamMatches.set(teamNumber, []);
    }
    teamMatches.get(teamNumber)?.push(match);
  });

  const rankings: TeamRankingData[] = [];
  teamMatches.forEach((matches, teamNumber) => {
    rankings.push(calculateTeamMetrics(matches, mode, zeroHandling));
  });

  return rankings;
} 