import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, AlertCircle } from "lucide-react";
import { format, addMonths, differenceInMonths, isBefore, isAfter } from "date-fns";

export default function VestingCalculator({ grant, onUpdate }) {
  const [vestingData, setVestingData] = useState(null);

  useEffect(() => {
    if (grant) {
      calculateVesting(grant);
    }
  }, [grant]);

  const calculateVesting = (grantData) => {
    const {
      shares_granted,
      grant_date,
      vesting_start_date,
      vesting_period_months = 48,
      cliff_months = 12,
      vesting_schedule,
    } = grantData;

    const startDate = new Date(vesting_start_date || grant_date);
    const today = new Date();
    const monthsElapsed = differenceInMonths(today, startDate);

    let vestedShares = 0;
    let schedule = [];

    if (vesting_schedule === "immediate") {
      vestedShares = shares_granted;
      schedule = [{
        date: startDate,
        shares: shares_granted,
        cumulative: shares_granted,
        status: "vested"
      }];
    } else if (vesting_schedule === "4_year_1_cliff" || vesting_schedule === "4_year_monthly") {
      const isMonthly = vesting_schedule === "4_year_monthly";
      const sharesPerMonth = shares_granted / vesting_period_months;

      // Cliff
      if (monthsElapsed < cliff_months) {
        vestedShares = 0;
      } else if (monthsElapsed >= vesting_period_months) {
        vestedShares = shares_granted;
      } else {
        // After cliff, vesting continues monthly
        vestedShares = Math.floor(monthsElapsed * sharesPerMonth);
      }

      // Generate schedule
      for (let month = 0; month <= vesting_period_months; month++) {
        const scheduleDate = addMonths(startDate, month);
        let cumulativeShares = 0;

        if (month === 0) {
          cumulativeShares = 0;
        } else if (month < cliff_months) {
          cumulativeShares = 0;
        } else {
          cumulativeShares = Math.floor(month * sharesPerMonth);
        }

        const isCliffMonth = month === cliff_months;
        const status = isBefore(scheduleDate, today) ? "vested" : 
                      isAfter(scheduleDate, today) ? "unvested" : "vesting";

        schedule.push({
          date: scheduleDate,
          shares: isCliffMonth ? cumulativeShares : Math.floor(sharesPerMonth),
          cumulative: Math.min(cumulativeShares, shares_granted),
          status,
          isCliff: isCliffMonth
        });
      }
    } else {
      // Custom vesting - pro-rata monthly
      const sharesPerMonth = shares_granted / vesting_period_months;
      
      if (monthsElapsed >= vesting_period_months) {
        vestedShares = shares_granted;
      } else if (monthsElapsed > 0) {
        vestedShares = Math.floor(monthsElapsed * sharesPerMonth);
      }

      for (let month = 0; month <= vesting_period_months; month++) {
        const scheduleDate = addMonths(startDate, month);
        const cumulativeShares = Math.min(Math.floor(month * sharesPerMonth), shares_granted);
        const status = isBefore(scheduleDate, today) ? "vested" : 
                      isAfter(scheduleDate, today) ? "unvested" : "vesting";

        schedule.push({
          date: scheduleDate,
          shares: Math.floor(sharesPerMonth),
          cumulative: cumulativeShares,
          status
        });
      }
    }

    setVestingData({
      vestedShares: Math.min(vestedShares, shares_granted),
      unvestedShares: shares_granted - Math.min(vestedShares, shares_granted),
      schedule,
      nextVestingDate: schedule.find(s => s.status === "unvested")?.date,
      percentVested: ((Math.min(vestedShares, shares_granted) / shares_granted) * 100).toFixed(1)
    });
  };

  if (!vestingData) return null;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-slate-600 mb-1">Vested Shares</div>
            <div className="text-2xl font-bold text-green-600">
              {vestingData.vestedShares.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-slate-600 mb-1">Unvested Shares</div>
            <div className="text-2xl font-bold text-amber-600">
              {vestingData.unvestedShares.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-slate-600 mb-1">Progress</div>
            <div className="text-2xl font-bold text-indigo-600">
              {vestingData.percentVested}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-slate-600 mb-1">Next Vesting</div>
            <div className="text-sm font-semibold text-slate-900">
              {vestingData.nextVestingDate 
                ? format(vestingData.nextVestingDate, "MMM d, yyyy")
                : "Fully Vested"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="mb-2">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-600">Vesting Progress</span>
              <span className="font-semibold">{vestingData.percentVested}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-4">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-600 h-4 rounded-full transition-all"
                style={{ width: `${vestingData.percentVested}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vesting Schedule Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Vesting Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-white border-b">
                <tr>
                  <th className="text-left py-2 px-3 text-sm font-semibold text-slate-700">Date</th>
                  <th className="text-right py-2 px-3 text-sm font-semibold text-slate-700">Shares</th>
                  <th className="text-right py-2 px-3 text-sm font-semibold text-slate-700">Cumulative</th>
                  <th className="text-center py-2 px-3 text-sm font-semibold text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {vestingData.schedule.filter(s => s.shares > 0 || s.isCliff).map((item, idx) => (
                  <tr key={idx} className="border-b hover:bg-slate-50">
                    <td className="py-2 px-3 text-sm">
                      <div>
                        {format(item.date, "MMM d, yyyy")}
                        {item.isCliff && (
                          <Badge variant="outline" className="ml-2 text-xs">Cliff</Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-sm text-right font-medium">
                      {item.shares.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-sm text-right font-semibold">
                      {item.cumulative.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <Badge
                        variant={item.status === "vested" ? "default" : "secondary"}
                        className={
                          item.status === "vested" 
                            ? "bg-green-100 text-green-700" 
                            : item.status === "vesting"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-100 text-slate-700"
                        }
                      >
                        {item.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Manual Override */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Manual Adjustment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Override Vested Shares</Label>
                <Input
                  type="number"
                  placeholder={vestingData.vestedShares}
                  onBlur={(e) => {
                    const value = parseInt(e.target.value);
                    if (value >= 0 && value <= grant.shares_granted) {
                      onUpdate?.({ ...grant, shares_vested: value });
                    }
                  }}
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => onUpdate?.({ ...grant, shares_vested: vestingData.vestedShares })}
                  className="w-full"
                >
                  Apply Calculated Value
                </Button>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Manual adjustments will override automatic calculations. Use this for special cases like accelerated vesting or terminations.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}