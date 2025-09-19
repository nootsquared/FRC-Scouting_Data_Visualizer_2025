'use client';

import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableCell, TableRow, TableHead } from '@/components/ui/table';
import { ResponsiveContainer } from 'recharts';
import { BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts';
import { useData, MatchData } from '@/lib/hooks/useData';
import { FrostedBarCursor } from '@/components/charts/FrostedBarCursor';
import {
  frostedTooltipContentStyle,
  frostedTooltipItemStyle,
  frostedTooltipLabelStyle,
} from '@/components/charts/frostedTooltipStyles';

interface TeamRanking {
  team: number;
  avgEPA: number;
  maxEPA: number;
  top50EPA: number;
  matchCount: number;
}

const TeamsPage = () => {
  const { data, teams } = useData();

  const epaRankings = useMemo(() => {
    const rankings = teams.map((team: number) => {
      const teamData = data.filter((d: MatchData) => d.teamNumber === team);
      const epaValues = teamData.map((d: MatchData) => d.epa);
      const avgEPA = epaValues.reduce((a: number, b: number) => a + b, 0) / epaValues.length;
      const maxEPA = Math.max(...epaValues);
      const top50EPA = epaValues
        .sort((a: number, b: number) => b - a)
        .slice(0, Math.ceil(epaValues.length * 0.5))
        .reduce((a: number, b: number) => a + b, 0) / Math.ceil(epaValues.length * 0.5);

      return {
        team,
        avgEPA,
        maxEPA,
        top50EPA,
        matchCount: teamData.length
      };
    });

    return rankings.sort((a: TeamRanking, b: TeamRanking) => b.top50EPA - a.top50EPA);
  }, [teams, data]);
  const epaDistribution = useMemo(() => {
    const ranges = [
      { min: 0, max: 10, label: '0-10' },
      { min: 10, max: 20, label: '10-20' },
      { min: 20, max: 30, label: '20-30' },
      { min: 30, max: 40, label: '30-40' },
      { min: 40, max: 50, label: '40-50' },
      { min: 50, max: Infinity, label: '50+' }
    ];

    return ranges.map(range => ({
      range: range.label,
      count: data.filter((d: MatchData) => d.epa >= range.min && d.epa < range.max).length
    }));
  }, [data]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">All Teams Analysis</h1>
        <p className="text-gray-400">Compare team performance across all matches</p>
      </div>

      <Card className="bg-[#1A1A1A] border-gray-800 mb-8">
        <CardHeader>
          <CardTitle className="text-white">EPA Rankings</CardTitle>
          <CardDescription className="text-gray-400">Teams ranked by EPA performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-gray-800">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800 hover:bg-gray-800/50">
                  <TableHead className="text-gray-400">Rank</TableHead>
                  <TableHead className="text-gray-400">Team</TableHead>
                  <TableHead className="text-gray-400">Top 50% EPA</TableHead>
                  <TableHead className="text-gray-400">Max EPA</TableHead>
                  <TableHead className="text-gray-400">Avg EPA</TableHead>
                  <TableHead className="text-gray-400">Matches</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {epaRankings.map((rank: TeamRanking, index: number) => (
                  <TableRow key={rank.team} className="border-gray-800 hover:bg-gray-800/50">
                    <TableCell className="text-gray-400">{index + 1}</TableCell>
                    <TableCell className="text-white font-medium">{rank.team}</TableCell>
                    <TableCell className="text-white">{rank.top50EPA.toFixed(2)}</TableCell>
                    <TableCell className="text-white">{rank.maxEPA.toFixed(2)}</TableCell>
                    <TableCell className="text-white">{rank.avgEPA.toFixed(2)}</TableCell>
                    <TableCell className="text-white">{rank.matchCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1A1A1A] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">EPA Distribution</CardTitle>
          <CardDescription className="text-gray-400">Distribution of EPA scores across all matches</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={epaDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="range" 
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                />
                <Tooltip
                  contentStyle={frostedTooltipContentStyle}
                  labelStyle={frostedTooltipLabelStyle}
                  itemStyle={frostedTooltipItemStyle}
                  cursor={<FrostedBarCursor />}
                />
                <Bar 
                  dataKey="count" 
                  fill="#264A8A"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamsPage; 
