import scoutingData from '@/data/scouting-data.json';
import preScoutingData from '@/data/scouting-data-pre.json';
import { ProcessingMode, ZeroHandling } from '@/components/ui/data-processing-controls';
import { DataSource } from '@/components/ui/data-source-selector';

export interface CoralScoring {
  l1: number;
  l2: number;
  l3: number;
  l4: number;
}

export interface AlgaeScoring {
  barge: number;
  processor: number;
}

export interface AutonomousData {
  coralScoring: CoralScoring;
  algaeScoring: AlgaeScoring;
}

export interface TeleopData {
  coralScoring: CoralScoring;
  algaeScoring: AlgaeScoring;
  coralCycles: number;
  driverSkill: number;
  defenseRating: number;
}

export interface EndgameData {
  climbAttempted: boolean;
  climbSuccessful: boolean;
  climbScore: number;
}

// Raw data from JSON file
interface RawMatchData {
  Scouter: string;
  Event: string;
  "Match-Level": string;
  "Match-Number": string;
  Robot: string;
  "Team-Number": string;
  "Auton-Position": string;
  "Auton-Leave-Start": string;
  "Auton-Coral-L4": string;
  "Auton-Coral-L3": string;
  "Auton-Coral-L2": string;
  "Auton-Coral-L1": string;
  "Algae-Removed- from-Reef": string;
  "Auton-Algae-Processor": string;
  "Auton-Algae-Net": string;
  "Teleop-Coral-L4": string;
  "Teleop-Coral-L3": string;
  "Teleop-Coral-L2": string;
  "Teleop-Coral-L1": string;
  "TeleOp-Removed- from-Reef": string;
  "Teleop-Algae-Processor": string;
  "Teleop-Algae-Net": string;
  "Defense-Played-on-Robot": string;
  "Climb Score"?: string;
  "Driver Skill"?: string;
  "Defense Rating"?: string;
  "Died"?: string;
  "Tippy"?: string;
  Comments: string;
  [key: string]: string | undefined;
}

export interface MatchData {
  Scouter: string;
  Event: string;
  Robot: string;
  "Match-Level": string;
  "Match-Number": string;
  "Team-Number": string;
  "Auton-Position": string;
  "Auton-Leave-Start": string;
  "Auton-Coral-L4": string;
  "Auton-Coral-L3": string;
  "Auton-Coral-L2": string;
  "Auton-Coral-L1": string;
  "Algae-Removed- from-Reef": string;
  "Auton-Algae-Processor": string;
  "Auton-Algae-Net": string;
  "Teleop-Coral-L4": string;
  "Teleop-Coral-L3": string;
  "Teleop-Coral-L2": string;
  "Teleop-Coral-L1": string;
  "TeleOp-Removed- from-Reef": string;
  "Teleop-Algae-Processor": string;
  "Teleop-Algae-Net": string;
  "Defense-Played-on-Robot": string;
  "Ground-Pick-Up": string;
  "Climb-Status": string;
  "No-Climb-Reason": string;
  "Driver-Skill": string;
  "Defense Rating": string;
  "Died-YN": string;
  "Tipped-YN": string;
  Comments: string;
}

export interface ScoutingData {
  matches: RawMatchData[];
}

export function getMatchData(dataSource: DataSource = "live"): MatchData[] {
  const rawData = dataSource === "live" ? scoutingData : preScoutingData;
  const data = rawData.matches;
  
  return data.map((match: any): MatchData => ({
    Scouter: match.Scouter || '',
    Event: match.Event || '',
    Robot: match.Robot || '',
    "Match-Level": match["Match-Level"] || '',
    "Match-Number": match["Match-Number"] || '',
    "Team-Number": match["Team-Number"] || '',
    "Auton-Position": match["Auton-Position"] || '',
    "Auton-Leave-Start": match["Auton-Leave-Start"] || '',
    "Auton-Coral-L4": match["Auton-Coral-L4"] || '',
    "Auton-Coral-L3": match["Auton-Coral-L3"] || '',
    "Auton-Coral-L2": match["Auton-Coral-L2"] || '',
    "Auton-Coral-L1": match["Auton-Coral-L1"] || '',
    "Algae-Removed- from-Reef": match["Algae-Removed- from-Reef"] || '',
    "Auton-Algae-Processor": match["Auton-Algae-Processor"] || '',
    "Auton-Algae-Net": match["Auton-Algae-Net"] || '',
    "Teleop-Coral-L4": match["Teleop-Coral-L4"] || '',
    "Teleop-Coral-L3": match["Teleop-Coral-L3"] || '',
    "Teleop-Coral-L2": match["Teleop-Coral-L2"] || '',
    "Teleop-Coral-L1": match["Teleop-Coral-L1"] || '',
    "TeleOp-Removed- from-Reef": match["TeleOp-Removed- from-Reef"] || '',
    "Teleop-Algae-Processor": match["Teleop-Algae-Processor"] || '',
    "Teleop-Algae-Net": match["Teleop-Algae-Net"] || '',
    "Defense-Played-on-Robot": match["Defense-Played-on-Robot"] || '',
    "Ground-Pick-Up": match["Ground-Pick-Up"] || '',
    "Climb-Status": match["Climb-Status"] || '',
    "No-Climb-Reason": match["No-Climb-Reason"] || '',
    "Driver-Skill": match["Driver-Skill"] || '',
    "Defense Rating": match["Defense Rating"] || '0',
    "Died-YN": match["Died-YN"] || '',
    "Tipped-YN": match["Tipped-YN"] || '',
    Comments: match.Comments || ''
  }));
}

export function getTeamData(teamNumber: number, dataSource: DataSource = "live"): MatchData[] {
  const data = dataSource === "live" ? scoutingData : preScoutingData;
  return data.matches.filter(
    (match) => match["Team-Number"] && parseInt(match["Team-Number"]) === teamNumber
  ).map(match => {
    // Create a new object with all required fields
    const converted: MatchData = {
      Scouter: match.Scouter || '',
      Event: match.Event || '',
      Robot: match.Robot || '',
      "Match-Level": match["Match-Level"] || '',
      "Match-Number": match["Match-Number"] || '',
      "Team-Number": match["Team-Number"] || '',
      "Auton-Position": match["Auton-Position"] || '',
      "Auton-Leave-Start": match["Auton-Leave-Start"] || '',
      "Auton-Coral-L4": match["Auton-Coral-L4"] || '',
      "Auton-Coral-L3": match["Auton-Coral-L3"] || '',
      "Auton-Coral-L2": match["Auton-Coral-L2"] || '',
      "Auton-Coral-L1": match["Auton-Coral-L1"] || '',
      "Algae-Removed- from-Reef": match["Algae-Removed- from-Reef"] || '',
      "Auton-Algae-Processor": match["Auton-Algae-Processor"] || '',
      "Auton-Algae-Net": match["Auton-Algae-Net"] || '',
      "Teleop-Coral-L4": match["Teleop-Coral-L4"] || '',
      "Teleop-Coral-L3": match["Teleop-Coral-L3"] || '',
      "Teleop-Coral-L2": match["Teleop-Coral-L2"] || '',
      "Teleop-Coral-L1": match["Teleop-Coral-L1"] || '',
      "TeleOp-Removed- from-Reef": match["TeleOp-Removed- from-Reef"] || '',
      "Teleop-Algae-Processor": match["Teleop-Algae-Processor"] || '',
      "Teleop-Algae-Net": match["Teleop-Algae-Net"] || '',
      "Defense-Played-on-Robot": match["Defense-Played-on-Robot"] || '',
      "Ground-Pick-Up": 'n',
      "Climb-Status": match["Climb Score"] ? 
        (parseInt(match["Climb Score"]) >= 12 ? 'd' : 
         parseInt(match["Climb Score"]) >= 8 ? 's' : 
         parseInt(match["Climb Score"]) > 0 ? 'p' : 'n') : 
        'n',
      "No-Climb-Reason": '',
      "Driver-Skill": match["Driver Skill"] ? 
        (match["Driver Skill"] === '2' ? '2' :
         match["Driver Skill"] === '3' ? '3' :
         match["Driver Skill"] === '1' ? '1' : '0') :
        '0',
      "Defense Rating": match["Defense Rating"] || '0',
      "Died-YN": match["Died"] || 'n',
      "Tipped-YN": match["Tippy"] || '0',
      Comments: match.Comments || ''
    };
    return converted;
  });
}

export function processMatches(
  matches: MatchData[],
  mode: ProcessingMode = "average",
  zeroHandling: ZeroHandling = "include"
): MatchData[] {
  return matches;
}

export function calculateEPA(
  match: MatchData,
  isAutonomous: boolean = false
): number {
  if (isAutonomous) {
    const l1 = parseInt(match["Auton-Coral-L1"]) || 0;
    const l2 = parseInt(match["Auton-Coral-L2"]) || 0;
    const l3 = parseInt(match["Auton-Coral-L3"]) || 0;
    const l4 = parseInt(match["Auton-Coral-L4"]) || 0;
    const processor = parseInt(match["Auton-Algae-Processor"]) || 0;
    const net = parseInt(match["Auton-Algae-Net"]) || 0;
    
    return (
      l1 * 3 +
      l2 * 4 +
      l3 * 6 +
      l4 * 7 +
      processor * 6 +
      net * 4
    );
  } else {
    const l1 = parseInt(match["Teleop-Coral-L1"]) || 0;
    const l2 = parseInt(match["Teleop-Coral-L2"]) || 0;
    const l3 = parseInt(match["Teleop-Coral-L3"]) || 0;
    const l4 = parseInt(match["Teleop-Coral-L4"]) || 0;
    const processor = parseInt(match["Teleop-Algae-Processor"]) || 0;
    const net = parseInt(match["Teleop-Algae-Net"]) || 0;
    
    return (
      l1 * 2 +
      l2 * 3 +
      l3 * 4 +
      l4 * 5 +
      processor * 6 +
      net * 4
    );
  }
}

export function calculateCoral(
  match: MatchData,
  isAutonomous: boolean = false
): number {
  if (isAutonomous) {
    const l1 = parseInt(match["Auton-Coral-L1"]) || 0;
    const l2 = parseInt(match["Auton-Coral-L2"]) || 0;
    const l3 = parseInt(match["Auton-Coral-L3"]) || 0;
    const l4 = parseInt(match["Auton-Coral-L4"]) || 0;
    
    return l1 + l2 + l3 + l4;
  } else {
    const l1 = parseInt(match["Teleop-Coral-L1"]) || 0;
    const l2 = parseInt(match["Teleop-Coral-L2"]) || 0;
    const l3 = parseInt(match["Teleop-Coral-L3"]) || 0;
    const l4 = parseInt(match["Teleop-Coral-L4"]) || 0;
    
    return l1 + l2 + l3 + l4;
  }
}

export function calculateAlgae(
  match: MatchData,
  isAutonomous: boolean = false
): number {
  if (isAutonomous) {
    const processor = parseInt(match["Auton-Algae-Processor"]) || 0;
    const net = parseInt(match["Auton-Algae-Net"]) || 0;
    
    return processor + net;
  } else {
    const processor = parseInt(match["Teleop-Algae-Processor"]) || 0;
    const net = parseInt(match["Teleop-Algae-Net"]) || 0;
    
    return processor + net;
  }
}

export function calculateTeamAverages(
  teamData: MatchData[],
  mode: ProcessingMode = "average",
  zeroHandling: ZeroHandling = "include"
) {
  if (teamData.length === 0) return null;

  const totalMatches = teamData.length;

  const processData = (data: number[], mode: ProcessingMode, zeroHandling: ZeroHandling) => {
    let processedData = [...data];
    
    // Handle zero values
    if (zeroHandling === "exclude") {
      processedData = processedData.filter(value => value > 0);
    }
    
    if (processedData.length === 0) return 0;
    
    // Apply processing mode
    switch (mode) {
      case "average":
        return average(processedData);
      case "top50":
        // Sort data in descending order
        processedData.sort((a, b) => b - a);
        // Calculate the number of elements to include (top 50%)
        const count = Math.ceil(processedData.length / 2);
        // Take the top 50% of values
        const topHalf = processedData.slice(0, count);
        // Calculate the average of these values
        return average(topHalf);
      case "best":
        return Math.max(...processedData);
      default:
        return average(processedData);
    }
  };

  // Calculate whole match EPA for each match
  const matchEPAs = teamData.map(match => {
    // Calculate total corals and algae for each match
    const totalCorals = 
      (parseInt(match["Auton-Coral-L1"]) || 0) +
      (parseInt(match["Auton-Coral-L2"]) || 0) +
      (parseInt(match["Auton-Coral-L3"]) || 0) +
      (parseInt(match["Auton-Coral-L4"]) || 0) +
      (parseInt(match["Teleop-Coral-L1"]) || 0) +
      (parseInt(match["Teleop-Coral-L2"]) || 0) +
      (parseInt(match["Teleop-Coral-L3"]) || 0) +
      (parseInt(match["Teleop-Coral-L4"]) || 0);

    const totalAlgae = 
      (parseInt(match["Auton-Algae-Processor"]) || 0) +
      (parseInt(match["Auton-Algae-Net"]) || 0) +
      (parseInt(match["Teleop-Algae-Processor"]) || 0) +
      (parseInt(match["Teleop-Algae-Net"]) || 0);

    return {
      matchNumber: match["Match-Number"],
      totalCorals,
      totalAlgae,
      epa: calculateEPA(match, false) + calculateEPA(match, true) // Total EPA for the match
    };
  });

  // Calculate tele cycles (barge + reef cycles)
  const teleCycles = processData(
    teamData.map(match => {
      const bargeCycles = (parseInt(match["Teleop-Algae-Net"]) || 0);
      const reefCycles = (parseInt(match["Teleop-Coral-L1"]) || 0) +
                        (parseInt(match["Teleop-Coral-L2"]) || 0) +
                        (parseInt(match["Teleop-Coral-L3"]) || 0) +
                        (parseInt(match["Teleop-Coral-L4"]) || 0);
      return bargeCycles + reefCycles;
    }),
    mode,
    zeroHandling
  );

  // Calculate deep climb percentage
  const deepClimbs = teamData.filter(match => match["Climb-Status"] === 'd').length;
  const deepClimbPercentage = (deepClimbs / totalMatches) * 100;

  // Calculate auto and tele corals
  const autoCorals = processData(
    teamData.map(match => 
      (parseInt(match["Auton-Coral-L1"]) || 0) +
      (parseInt(match["Auton-Coral-L2"]) || 0) +
      (parseInt(match["Auton-Coral-L3"]) || 0) +
      (parseInt(match["Auton-Coral-L4"]) || 0)
    ),
    mode,
    zeroHandling
  );

  const teleCorals = processData(
    teamData.map(match => 
      (parseInt(match["Teleop-Coral-L1"]) || 0) +
      (parseInt(match["Teleop-Coral-L2"]) || 0) +
      (parseInt(match["Teleop-Coral-L3"]) || 0) +
      (parseInt(match["Teleop-Coral-L4"]) || 0)
    ),
    mode,
    zeroHandling
  );

  // Calculate barge and processor algae
  const bargeAlgae = processData(
    teamData.map(match => 
      (parseInt(match["Auton-Algae-Net"]) || 0) +
      (parseInt(match["Teleop-Algae-Net"]) || 0)
    ),
    mode,
    zeroHandling
  );

  const processorAlgae = processData(
    teamData.map(match => 
      (parseInt(match["Auton-Algae-Processor"]) || 0) +
      (parseInt(match["Teleop-Algae-Processor"]) || 0)
    ),
    mode,
    zeroHandling
  );

  // Calculate average cycle time (2:15 = 135 seconds)
  const averageCycleTime = teleCycles > 0 ? 135 / teleCycles : 0;

  return {
    totalMatches,
    teleCycles,
    deepClimbPercentage,
    autoCorals,
    teleCorals,
    bargeAlgae,
    processorAlgae,
    averageCycleTime,
    matchEPAs,
    successfulClimbs: teamData.filter((m) => m["Climb-Status"] === 's' || m["Climb-Status"] === 'd').length,
    climbAttempts: teamData.filter((m) => m["Climb-Status"] !== 'n').length,
    diedMatches: teamData.filter((m) => m["Died-YN"] === 'y').length,
    tippedMatches: teamData.filter((m) => m["Tipped-YN"] === '1').length,
    driverSkillAverage: average(
      teamData.map((m) => {
        const skill = m["Driver-Skill"];
        if (!skill || skill === '') return 0;
        return parseInt(skill) || 0;
      }).filter(skill => skill > 0)
    ),
    defenseRatingAverage: average(
      teamData.map((m) => {
        const rating = m["Defense Rating"];
        if (!rating || rating === '') return 0;
        const numRating = Number(rating);
        if (!isNaN(numRating)) {
          return numRating >= 0 && numRating <= 3 ? numRating : 0;
        }
        switch(rating.toLowerCase()) {
          case 'e':
          case 'excellent':
          case '3':
            return 3;
          case 'g':
          case 'good':
          case '2':
            return 2;
          case 'f':
          case 'fair':
          case '1':
            return 1;
          default:
            return 0;
        }
      }).filter(rating => rating > 0)
    ),
    // Autonomous detailed stats
    autonL4Average: processData(
      teamData.map(match => parseInt(match["Auton-Coral-L4"]) || 0),
      mode,
      zeroHandling
    ),
    autonL3Average: processData(
      teamData.map(match => parseInt(match["Auton-Coral-L3"]) || 0),
      mode,
      zeroHandling
    ),
    autonL2Average: processData(
      teamData.map(match => parseInt(match["Auton-Coral-L2"]) || 0),
      mode,
      zeroHandling
    ),
    autonL1Average: processData(
      teamData.map(match => parseInt(match["Auton-Coral-L1"]) || 0),
      mode,
      zeroHandling
    ),
    autonAlgaeProcessor: processData(
      teamData.map(match => parseInt(match["Auton-Algae-Processor"]) || 0),
      mode,
      zeroHandling
    ),
    autonAlgaeNet: processData(
      teamData.map(match => parseInt(match["Auton-Algae-Net"]) || 0),
      mode,
      zeroHandling
    ),
    totalAutonScore: processData(
      teamData.map(match => calculateEPA(match, true)),
      mode,
      zeroHandling
    ),
    // Teleop detailed stats
    teleopL4Average: processData(
      teamData.map(match => parseInt(match["Teleop-Coral-L4"]) || 0),
      mode,
      zeroHandling
    ),
    teleopL3Average: processData(
      teamData.map(match => parseInt(match["Teleop-Coral-L3"]) || 0),
      mode,
      zeroHandling
    ),
    teleopL2Average: processData(
      teamData.map(match => parseInt(match["Teleop-Coral-L2"]) || 0),
      mode,
      zeroHandling
    ),
    teleopL1Average: processData(
      teamData.map(match => parseInt(match["Teleop-Coral-L1"]) || 0),
      mode,
      zeroHandling
    ),
    teleopAlgaeProcessor: processData(
      teamData.map(match => parseInt(match["Teleop-Algae-Processor"]) || 0),
      mode,
      zeroHandling
    ),
    teleopAlgaeNet: processData(
      teamData.map(match => parseInt(match["Teleop-Algae-Net"]) || 0),
      mode,
      zeroHandling
    ),
    totalTeleopScore: processData(
      teamData.map(match => calculateEPA(match, false)),
      mode,
      zeroHandling
    ),
    // Climb score
    climbScore: processData(
      teamData.map(match => {
        const status = match["Climb-Status"];
        if (status === 'd') return 12;
        if (status === 's') return 8;
        if (status === 'p') return 4;
        return 0;
      }),
      mode,
      zeroHandling
    ),
    // Total EPA
    totalEPA: processData(
      teamData.map(match => 
        calculateEPA(match, true) + 
        calculateEPA(match, false) + 
        (match["Climb-Status"] === 'd' ? 12 : 
         match["Climb-Status"] === 's' ? 8 : 
         match["Climb-Status"] === 'p' ? 4 : 0)
      ),
      mode,
      zeroHandling
    ),
  };
}

function average(numbers: number[]): number {
  return numbers.length > 0
    ? Math.round((numbers.reduce((a, b) => a + b, 0) / numbers.length) * 100) / 100
    : 0;
} 