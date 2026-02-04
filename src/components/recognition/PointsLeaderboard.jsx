import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, TrendingUp, Medal } from "lucide-react";

const RANK_CONFIG = {
  bronze: { color: "bg-orange-700 text-white", icon: "🥉" },
  silver: { color: "bg-slate-400 text-white", icon: "🥈" },
  gold: { color: "bg-amber-500 text-white", icon: "🥇" },
  platinum: { color: "bg-indigo-600 text-white", icon: "💎" },
  diamond: { color: "bg-purple-600 text-white", icon: "💠" }
};

export default function PointsLeaderboard({ employeePoints, employees }) {
  const enrichedPoints = employeePoints
    .map(ep => ({
      ...ep,
      employee: employees.find(e => e.id === ep.employee_id)
    }))
    .filter(ep => ep.employee);

  const sortedByTotal = [...enrichedPoints].sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
  const sortedByMonth = [...enrichedPoints].sort((a, b) => (b.points_this_month || 0) - (a.points_this_month || 0));
  const sortedByQuarter = [...enrichedPoints].sort((a, b) => (b.points_this_quarter || 0) - (a.points_this_quarter || 0));

  const LeaderboardList = ({ data, showPoints = "total" }) => (
    <div className="space-y-3">
      {data.slice(0, 10).map((item, index) => {
        const rankConfig = RANK_CONFIG[item.rank || "bronze"];
        const points = showPoints === "total" 
          ? item.total_points 
          : showPoints === "month"
          ? item.points_this_month
          : item.points_this_quarter;

        return (
          <div
            key={item.id}
            className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
              index < 3
                ? "bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200"
                : "bg-slate-50 border border-slate-200"
            }`}
          >
            <div className="flex-shrink-0 w-8 text-center">
              {index === 0 && <span className="text-2xl">🥇</span>}
              {index === 1 && <span className="text-2xl">🥈</span>}
              {index === 2 && <span className="text-2xl">🥉</span>}
              {index > 2 && (
                <span className="text-lg font-bold text-slate-400">#{index + 1}</span>
              )}
            </div>

            <Avatar className="h-12 w-12">
              <AvatarImage src={item.employee?.avatar_url} />
              <AvatarFallback className="bg-indigo-100 text-indigo-700">
                {item.employee?.full_name?.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <p className="font-semibold text-slate-900">{item.employee_name}</p>
              <p className="text-sm text-slate-600">{item.employee?.job_title}</p>
            </div>

            <div className="text-right">
              <div className="flex items-center gap-2 justify-end mb-1">
                <Badge className={rankConfig.color}>
                  {rankConfig.icon} {item.rank || "bronze"}
                </Badge>
              </div>
              <p className="text-lg font-bold text-indigo-600">
                {points || 0} pts
              </p>
              <p className="text-xs text-slate-500">
                Level {item.level || 1}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="total" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="total">All Time</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
            <TabsTrigger value="quarter">This Quarter</TabsTrigger>
          </TabsList>

          <TabsContent value="total" className="mt-4">
            <LeaderboardList data={sortedByTotal} showPoints="total" />
          </TabsContent>

          <TabsContent value="month" className="mt-4">
            <LeaderboardList data={sortedByMonth} showPoints="month" />
          </TabsContent>

          <TabsContent value="quarter" className="mt-4">
            <LeaderboardList data={sortedByQuarter} showPoints="quarter" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}