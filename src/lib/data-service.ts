import scoutingData from '@/data/scouting-data.json';

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

export interface MatchData {
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
  "Ground-Pick-Up": string;
  "Climb-Status": string;
  "No-Climb-Reason": string;
  "Driver-Skill": string;
  "Defense-Rating": string;
  "Died-YN": string;
  "Tipped-YN": string;
  Comments: string;
}

export interface ScoutingData {
  matches: MatchData[];
}

export function getTeamData(teamNumber: number): MatchData[] {
  return scoutingData.matches.filter(
    (match) => parseInt(match["Team-Number"]) === teamNumber
  );
}

export function calculateTeamAverages(teamData: MatchData[]) {
  if (teamData.length === 0) return null;

  const totalMatches = teamData.length;
  const autonL4Average = average(teamData.map((m) => parseInt(m["Auton-Coral-L4"]) || 0));
  const autonL3Average = average(teamData.map((m) => parseInt(m["Auton-Coral-L3"]) || 0));
  const autonL2Average = average(teamData.map((m) => parseInt(m["Auton-Coral-L2"]) || 0));
  const autonL1Average = average(teamData.map((m) => parseInt(m["Auton-Coral-L1"]) || 0));
  const teleopL4Average = average(teamData.map((m) => parseInt(m["Teleop-Coral-L4"]) || 0));
  const teleopL3Average = average(teamData.map((m) => parseInt(m["Teleop-Coral-L3"]) || 0));
  const teleopL2Average = average(teamData.map((m) => parseInt(m["Teleop-Coral-L2"]) || 0));
  const teleopL1Average = average(teamData.map((m) => parseInt(m["Teleop-Coral-L1"]) || 0));
  
  const autonAlgaeProcessor = average(teamData.map((m) => parseInt(m["Auton-Algae-Processor"]) || 0));
  const autonAlgaeNet = average(teamData.map((m) => parseInt(m["Auton-Algae-Net"]) || 0));
  const teleopAlgaeProcessor = average(teamData.map((m) => parseInt(m["Teleop-Algae-Processor"]) || 0));
  const teleopAlgaeNet = average(teamData.map((m) => parseInt(m["Teleop-Algae-Net"]) || 0));
  
  const successfulClimbs = teamData.filter((m) => m["Climb-Status"] === 's' || m["Climb-Status"] === 'd').length;
  const climbAttempts = teamData.filter((m) => m["Climb-Status"] !== 'n').length;
  const diedMatches = teamData.filter((m) => m["Died-YN"] === 'y').length;
  const tippedMatches = teamData.filter((m) => m["Tipped-YN"] === '1').length;
  const driverSkillAverage = average(teamData.map((m) => m["Driver-Skill"] === 'e' ? 3 : m["Driver-Skill"] === 'g' ? 2 : m["Driver-Skill"] === 'f' ? 1 : 0));
  const defenseRatingAverage = average(teamData.map((m) => m["Defense-Rating"] === 'e' ? 3 : m["Defense-Rating"] === 'g' ? 2 : m["Defense-Rating"] === 'f' ? 1 : 0));

  return {
    totalMatches,
    autonL4Average,
    autonL3Average,
    autonL2Average,
    autonL1Average,
    teleopL4Average,
    teleopL3Average,
    teleopL2Average,
    teleopL1Average,
    autonAlgaeProcessor,
    autonAlgaeNet,
    teleopAlgaeProcessor,
    teleopAlgaeNet,
    successfulClimbs,
    climbAttempts,
    diedMatches,
    tippedMatches,
    driverSkillAverage,
    defenseRatingAverage,
    totalAutonScore: (
      autonL4Average * 5 +
      autonL3Average * 3 +
      autonL2Average * 2 +
      autonL1Average
    ),
    totalTeleopScore: (
      teleopL4Average * 5 +
      teleopL3Average * 3 +
      teleopL2Average * 2 +
      teleopL1Average
    ),
    totalAlgaeScore: (
      (autonAlgaeProcessor + teleopAlgaeProcessor) * 3 +
      (autonAlgaeNet + teleopAlgaeNet) * 2
    ),
  };
}

function average(numbers: number[]): number {
  return numbers.length > 0
    ? Math.round((numbers.reduce((a, b) => a + b, 0) / numbers.length) * 100) / 100
    : 0;
} 