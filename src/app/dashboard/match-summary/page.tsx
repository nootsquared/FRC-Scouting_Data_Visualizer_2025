"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/lib/context/AppContext";
import { DataSourceSelector, type DataSource } from "@/components/ui/data-source-selector";
import { CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

// Define the TBA API response types
interface TBAMatch {
  key: string;
  match_number: number;
  alliances: {
    red: {
      team_keys: string[];
      score: number;
    };
    blue: {
      team_keys: string[];
      score: number;
    };
  };
}

interface TeamAbilities {
  coralL4: boolean;
  coralL3: boolean;
  coralL2: boolean;
  coralL1: boolean;
  algaeProcessor: boolean;
  algaeBarge: boolean;
  canClimb: boolean;
  avgEPA: boolean;
  reliability: boolean;
  driverSkill: boolean;
  doesDefense: boolean;
}

// Custom Badge component
const Badge = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${className || ''}`}>
      {children}
    </span>
  );
};

// Custom Tabs components since we don't have the shadcn/ui tabs component
const Tabs = ({ children, defaultValue, onValueChange }: { 
  children: React.ReactNode; 
  defaultValue: string; 
  onValueChange: (value: string) => void;
}) => {
  const [activeTab, setActiveTab] = useState(defaultValue);
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    onValueChange(value);
  };
  
  return (
    <div className="space-y-4">
      {children}
    </div>
  );
};

const TabsList = ({ children }: { children: React.ReactNode }) => {
  return <div className="flex space-x-2 border-b border-gray-700">{children}</div>;
};

const TabsTrigger = ({ 
  children, 
  value, 
  activeTab, 
  onTabChange,
  className
}: { 
  children: React.ReactNode; 
  value: string; 
  activeTab: string; 
  onTabChange: (value: string) => void;
  className?: string;
}) => {
  return (
    <button
      className={`px-4 py-2 font-medium ${
        activeTab === value ? "border-b-2 border-current" : "text-gray-400"
      } ${className || ''}`}
      onClick={() => onTabChange(value)}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ 
  children, 
  value, 
  activeTab 
}: { 
  children: React.ReactNode; 
  value: string; 
  activeTab: string;
}) => {
  if (value !== activeTab) return null;
  return <div>{children}</div>;
};

// Custom DetailedStatistics component
const DetailedStatistics = ({ 
  teamNumber, 
  dataSource 
}: { 
  teamNumber: number; 
  dataSource: "live" | "pre";
}) => {
  return (
    <div className="p-4 bg-gray-800 rounded-md">
      <p className="text-white">Detailed statistics for Team {teamNumber} ({dataSource} data)</p>
      <p className="text-gray-400 mt-2">This is a placeholder for detailed statistics.</p>
    </div>
  );
};

export default function MatchSummaryPage() {
  const router = useRouter();
  const [matchNumber, setMatchNumber] = useState<string>("");
  const [matchData, setMatchData] = useState<TBAMatch | null>(null);
  const [activeAlliance, setActiveAlliance] = useState<"red" | "blue">("red");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<DataSource>("live");
  const [activeTab, setActiveTab] = useState<string>("red");
  const [tbaKey, setTbaKey] = useState<string>("");
  const [eventCode, setEventCode] = useState<string>("");

  // Load saved values from localStorage
  useEffect(() => {
    const savedKey = localStorage.getItem('tbaKey');
    const savedEventCode = localStorage.getItem('eventCode');
    
    if (savedKey) setTbaKey(savedKey);
    if (savedEventCode) {
      setEventCode(savedEventCode);
    } else {
      setEventCode("2024onosh");
    }
  }, []);

  // Function to fetch match data from TBA API
  const fetchMatchData = async () => {
    if (!matchNumber) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Use the TBA API key from localStorage
      if (!tbaKey) {
        throw new Error("TBA API key not found. Please set it in the Targeted Planning page.");
      }
      
      if (!eventCode) {
        throw new Error("Event code not found. Please set it in the Targeted Planning page.");
      }
      
      console.log(`Fetching match data for ${eventCode}_qm${matchNumber} with key: ${tbaKey.substring(0, 5)}...`);
      
      const response = await fetch(
        `https://www.thebluealliance.com/api/v3/match/${eventCode}_qm${matchNumber}`,
        {
          headers: {
            "X-TBA-Auth-Key": tbaKey,
          },
        }
      );
      
      if (!response.ok) {
        console.error(`API error: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error(`Error response: ${errorText}`);
        throw new Error(`Failed to fetch match data: ${response.statusText} (${response.status})`);
      }
      
      const data = await response.json();
      console.log("Match data received:", data);
      setMatchData(data);
    } catch (err) {
      console.error("Error fetching match data:", err);
      setError(`Failed to fetch match data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to determine team abilities based on scouting data
  const getTeamAbilities = (teamNumber: string): TeamAbilities => {
    // This is a placeholder. In a real implementation, you would analyze the team's data
    // to determine these abilities based on their performance in previous matches.
    
    // For now, we'll return random values for demonstration
    return {
      coralL4: Math.random() > 0.5,
      coralL3: Math.random() > 0.3,
      coralL2: Math.random() > 0.2,
      coralL1: Math.random() > 0.1,
      algaeProcessor: Math.random() > 0.4,
      algaeBarge: Math.random() > 0.6,
      canClimb: Math.random() > 0.3,
      avgEPA: Math.random() > 0.5,
      reliability: Math.random() > 0.4,
      driverSkill: Math.random() > 0.3,
      doesDefense: Math.random() > 0.5,
    };
  };

  // Handle data source changes
  const handleDataSourceChange = (newSource: DataSource) => {
    setDataSource(newSource);
  };

  // Handle tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setActiveAlliance(value as "red" | "blue");
  };

  // Function to navigate to team analysis page
  const navigateToTeamAnalysis = (teamNumber: string) => {
    router.push(`/dashboard/team?team=${teamNumber}`);
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white">Match Summary</h1>
            <p className="text-gray-400 mt-2">View detailed information about teams in a specific match</p>
          </div>
          <DataSourceSelector
            currentSource={dataSource}
            onSourceChange={handleDataSourceChange}
          />
        </div>

        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Enter Match Number</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <Input
                type="number"
                placeholder="Enter qual match number (e.g., 1)"
                value={matchNumber}
                onChange={(e) => setMatchNumber(e.target.value)}
                className="max-w-xs text-white"
              />
              <Button onClick={fetchMatchData} disabled={loading || !matchNumber}>
                {loading ? "Loading..." : "View Match"}
              </Button>
            </div>
            {error && <p className="text-red-500 mt-2">{error}</p>}
            {!tbaKey && (
              <p className="text-yellow-500 mt-2">
                TBA API key not found. Please set it in the <a href="/dashboard/targeted-planning" className="underline">Targeted Planning</a> page.
              </p>
            )}
            {!eventCode && (
              <p className="text-yellow-500 mt-2">
                Event code not found. Please set it in the <a href="/dashboard/targeted-planning" className="underline">Targeted Planning</a> page.
              </p>
            )}
          </CardContent>
        </Card>

        {matchData && (
          <div className="space-y-6">
            <Tabs defaultValue="red" onValueChange={handleTabChange}>
              <TabsList>
                <TabsTrigger value="red" activeTab={activeTab} onTabChange={handleTabChange} className="text-red-500">
                  Red Alliance
                </TabsTrigger>
                <TabsTrigger value="blue" activeTab={activeTab} onTabChange={handleTabChange} className="text-blue-500">
                  Blue Alliance
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="red" activeTab={activeTab}>
                {matchData.alliances.red.team_keys.map((teamKey, index) => {
                  const teamNumber = teamKey.replace("frc", "");
                  const abilities = getTeamAbilities(teamNumber);
                  
                  return (
                    <div key={teamKey} className="space-y-4">
                      <h2 className="text-2xl font-bold text-white">Red {index + 1}: Team {teamNumber}</h2>
                      
                      {/* Abilities Summary */}
                      <Card className="bg-[#1A1A1A] border-gray-800">
                        <CardHeader>
                          <CardTitle className="text-white">Team Abilities</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-400">Coral L4:</span>
                              {abilities.coralL4 ? (
                                <Badge className="bg-green-500">Yes</Badge>
                              ) : (
                                <Badge className="bg-red-500">No</Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-400">Coral L3:</span>
                              {abilities.coralL3 ? (
                                <Badge className="bg-green-500">Yes</Badge>
                              ) : (
                                <Badge className="bg-red-500">No</Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-400">Coral L2:</span>
                              {abilities.coralL2 ? (
                                <Badge className="bg-green-500">Yes</Badge>
                              ) : (
                                <Badge className="bg-red-500">No</Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-400">Coral L1:</span>
                              {abilities.coralL1 ? (
                                <Badge className="bg-green-500">Yes</Badge>
                              ) : (
                                <Badge className="bg-red-500">No</Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-400">Algae Processor:</span>
                              {abilities.algaeProcessor ? (
                                <Badge className="bg-green-500">Yes</Badge>
                              ) : (
                                <Badge className="bg-red-500">No</Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-400">Algae Barge:</span>
                              {abilities.algaeBarge ? (
                                <Badge className="bg-green-500">Yes</Badge>
                              ) : (
                                <Badge className="bg-red-500">No</Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-400">Can Climb:</span>
                              {abilities.canClimb ? (
                                <Badge className="bg-green-500">Yes</Badge>
                              ) : (
                                <Badge className="bg-red-500">No</Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-400">Avg EPA:</span>
                              {abilities.avgEPA ? (
                                <Badge className="bg-green-500">Yes</Badge>
                              ) : (
                                <Badge className="bg-red-500">No</Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-400">Reliability:</span>
                              {abilities.reliability ? (
                                <Badge className="bg-green-500">Yes</Badge>
                              ) : (
                                <Badge className="bg-red-500">No</Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-400">Driver Skill {'>'}1.5:</span>
                              {abilities.driverSkill ? (
                                <Badge className="bg-green-500">Yes</Badge>
                              ) : (
                                <Badge className="bg-red-500">No</Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-400">Does Defense:</span>
                              {abilities.doesDefense ? (
                                <Badge className="bg-green-500">Yes</Badge>
                              ) : (
                                <Badge className="bg-red-500">No</Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Team Analysis Button */}
                      <Card className="bg-[#1A1A1A] border-gray-800">
                        <CardContent className="pt-6">
                          <Button 
                            onClick={() => navigateToTeamAnalysis(teamNumber)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            View Team Analysis <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </TabsContent>
              
              <TabsContent value="blue" activeTab={activeTab}>
                {matchData.alliances.blue.team_keys.map((teamKey, index) => {
                  const teamNumber = teamKey.replace("frc", "");
                  const abilities = getTeamAbilities(teamNumber);
                  
                  return (
                    <div key={teamKey} className="space-y-4">
                      <h2 className="text-2xl font-bold text-white">Blue {index + 1}: Team {teamNumber}</h2>
                      
                      {/* Abilities Summary */}
                      <Card className="bg-[#1A1A1A] border-gray-800">
                        <CardHeader>
                          <CardTitle className="text-white">Team Abilities</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-400">Coral L4:</span>
                              {abilities.coralL4 ? (
                                <Badge className="bg-green-500">Yes</Badge>
                              ) : (
                                <Badge className="bg-red-500">No</Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-400">Coral L3:</span>
                              {abilities.coralL3 ? (
                                <Badge className="bg-green-500">Yes</Badge>
                              ) : (
                                <Badge className="bg-red-500">No</Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-400">Coral L2:</span>
                              {abilities.coralL2 ? (
                                <Badge className="bg-green-500">Yes</Badge>
                              ) : (
                                <Badge className="bg-red-500">No</Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-400">Coral L1:</span>
                              {abilities.coralL1 ? (
                                <Badge className="bg-green-500">Yes</Badge>
                              ) : (
                                <Badge className="bg-red-500">No</Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-400">Algae Processor:</span>
                              {abilities.algaeProcessor ? (
                                <Badge className="bg-green-500">Yes</Badge>
                              ) : (
                                <Badge className="bg-red-500">No</Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-400">Algae Barge:</span>
                              {abilities.algaeBarge ? (
                                <Badge className="bg-green-500">Yes</Badge>
                              ) : (
                                <Badge className="bg-red-500">No</Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-400">Can Climb:</span>
                              {abilities.canClimb ? (
                                <Badge className="bg-green-500">Yes</Badge>
                              ) : (
                                <Badge className="bg-red-500">No</Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-400">Avg EPA:</span>
                              {abilities.avgEPA ? (
                                <Badge className="bg-green-500">Yes</Badge>
                              ) : (
                                <Badge className="bg-red-500">No</Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-400">Reliability:</span>
                              {abilities.reliability ? (
                                <Badge className="bg-green-500">Yes</Badge>
                              ) : (
                                <Badge className="bg-red-500">No</Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-400">Driver Skill {'>'}1.5:</span>
                              {abilities.driverSkill ? (
                                <Badge className="bg-green-500">Yes</Badge>
                              ) : (
                                <Badge className="bg-red-500">No</Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-400">Does Defense:</span>
                              {abilities.doesDefense ? (
                                <Badge className="bg-green-500">Yes</Badge>
                              ) : (
                                <Badge className="bg-red-500">No</Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Team Analysis Button */}
                      <Card className="bg-[#1A1A1A] border-gray-800">
                        <CardContent className="pt-6">
                          <Button 
                            onClick={() => navigateToTeamAnalysis(teamNumber)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            View Team Analysis <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
} 