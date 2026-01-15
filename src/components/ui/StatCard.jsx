import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({ 
  title, 
  value, 
  change, 
  changeType = "neutral", 
  icon: Icon,
  iconBg = "bg-indigo-100",
  iconColor = "text-indigo-600",
  subtitle
}) {
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-3xl font-bold text-slate-900">{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1.5">
                {changeType === "positive" ? (
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                ) : changeType === "negative" ? (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                ) : null}
                <span
                  className={`text-sm font-medium ${
                    changeType === "positive"
                      ? "text-emerald-600"
                      : changeType === "negative"
                      ? "text-red-600"
                      : "text-slate-500"
                  }`}
                >
                  {change}
                </span>
                {subtitle && (
                  <span className="text-sm text-slate-400">{subtitle}</span>
                )}
              </div>
            )}
          </div>
          {Icon && (
            <div className={`p-3 rounded-xl ${iconBg}`}>
              <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}