export interface TBAMatch {
  key: string;
  comp_level: string;
  match_number: number;
  set_number: number;
  alliances: {
    red: {
      team_keys: string[];
    };
    blue: {
      team_keys: string[];
    };
  };
  time: number;
  predicted_time: number;
  actual_time: number | null;
}

export interface TBATeamMatch extends TBAMatch {
}

export interface TBAMockData {
  matches: TBAMatch[];
  team_matches: {
    [key: string]: TBAMatch[];
  };
} 