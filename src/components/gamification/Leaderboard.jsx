import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Award, Star, TrendingUp } from "lucide-react";

const MEDAL_COLORS = {
  1: "text-amber-500",
  2: "text-slate-400",
  3: "text-amber-700",
};

export default function Leaderboard({ data, title, metric = "points" }) {
  const sortedData = [...data].sort((a, b) => b[metric] - a[metric]).slice(0, 10);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedData.map((item, index) => {
            const rank = index + 1;
            const isMedal = rank <= 3;
            
            return (
              <div
                key={item.id || index}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  isMedal ? "bg-gradient-to-r from-amber-50 to-transparent" : "bg-slate-50"
                }`}
              >
                <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full ${
                  isMedal ? "bg-white" : "bg-slate-200"
                } font-bold ${MEDAL_COLORS[rank] || "text-slate-600"}`}>
                  {isMedal ? <Trophy className="w-5 h-5" /> : rank}
                </div>
                
                <Avatar className="h-10 w-10">
                  <AvatarImage src={item.avatar_url} />
                  <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm font-medium">
                    {item.employee_name?.charAt(0) || item.full_name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">
                    {item.employee_name || item.full_name}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {item.department || item.job_title || ""}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-lg text-indigo-600">{item[metric]}</p>
                  <p className="text-xs text-slate-500 capitalize">{metric}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}