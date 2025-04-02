import pitData from '@/data/pit-scouting-data.json';

export interface PitData {
  physical: {
    drivetrainType: string;
    robotWidth: string;
    robotLength: string;
    robotWeight: string;
    groundClearance: string;
  };
  mechanisms: {
    intakeType: string;
    intakeLocation: string;
    scoringMechanism: string;
    maxReach: string;
    climbingCapability: string;
  };
  electronics: {
    mainController: string;
    motorControllers: string;
    batteryConfiguration: string;
    sensorTypes: string[];
  };
  software: {
    programmingLanguage: string;
    visionSystem: string;
    autonomousCapabilities: string[];
    teleopFeatures: string[];
  };
  strategy: {
    primaryRole: string;
    secondaryRole: string;
    preferredStartingPosition: string;
    specialFeatures: string[];
  };
  maintenance: {
    batteryCount: number;
    criticalSpares: string[];
    averageRepairTime: string;
    maintenanceSchedule: string;
  };
}

export function getTeamPitData(teamNumber: number): PitData | null {
  return pitData.teams[teamNumber] || null;
} 