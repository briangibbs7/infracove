import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Award, Calendar, DollarSign, ArrowRight } from "lucide-react";
import { format, differenceInDays, addMonths } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function EquityDashboardWidget({ user }) {
  const { data: shareholders = [] } = useQuery({
    queryKey: ["shareholders"],
    queryFn: () => base44.entities.Shareholder.list(),
  });

  const { data: equityGrants = [] } = useQuery({
    queryKey: ["equityGrants"],
    queryFn: () => base44.entities.EquityGrant.list(),
  });

  const { data: valuations = [] } = useQuery({
    queryKey: ["valuations"],
    queryFn: () => base44.entities.Valuation.list("-valuation_date"),
  });

  const currentShareholder = shareholders.find(s => s.email === user?.email);
  const myGrants = equityGrants.filter(g => g.shareholder_id === currentShareholder?.id);
  const activeValuation = valuations.find(v => v.status === "active");
  const pricePerShare = activeValuation?.common_stock_price || 0;

  // Calculate upcoming vesting events
  const upcomingEvents = myGrants.flatMap(grant => {
    if (!grant.vesting_start_date || grant.status === "fully_vested") return [];
    
    const startDate = new Date(grant.vesting_start_date || grant.grant_date);
    const cliffDate = addMonths(startDate, grant.cliff_months || 12);
    const fullVestingDate = addMonths(startDate, grant.vesting_period_months || 48);
    const today = new Date();
    
    const events = [];
    
    // Cliff event
    if (cliffDate > today) {
      events.push({
        type: "cliff",
        date: cliffDate,
        daysUntil: differenceInDays(cliffDate, today),
        shares: Math.floor((grant.cliff_months / (grant.vesting_period_months || 48)) * grant.shares_granted)
      });
    }
    
    // Full vesting
    if (fullVestingDate > today) {
      events.push({
        type: "full_vesting",
        date: fullVestingDate,
        daysUntil: differenceInDays(fullVestingDate, today),
        shares: grant.shares_granted
      });
    }
    
    return events;
  }).sort((a, b) => a.daysUntil - b.daysUntil);

  const nextEvent = upcomingEvents[0];
  const portfolioValue = (currentShareholder?.total_shares || 0) * pricePerShare;
  const vestedValue = (currentShareholder?.shares_vested || 0) * pricePerShare;

  if (!currentShareholder) return null;

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            My Equity
          </CardTitle>
          <Link to={createPageUrl("EmployeePortal")}>
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-blue-600 font-medium">Total Shares</span>
            </div>
            <p className="text-xl font-bold text-blue-900">
              {(currentShareholder.total_shares || 0).toLocaleString()}
            </p>
          </div>

          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-600 font-medium">Vested</span>
            </div>
            <p className="text-xl font-bold text-green-900">
              {(currentShareholder.shares_vested || 0).toLocaleString()}
            </p>
          </div>

          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span className="text-xs text-emerald-600 font-medium">Portfolio Value</span>
            </div>
            <p className="text-xl font-bold text-emerald-900">
              ${portfolioValue.toLocaleString()}
            </p>
          </div>

          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-4 h-4 text-purple-600" />
              <span className="text-xs text-purple-600 font-medium">Ownership</span>
            </div>
            <p className="text-xl font-bold text-purple-900">
              {currentShareholder.ownership_percentage?.toFixed(2) || 0}%
            </p>
          </div>
        </div>

        {/* Vesting Progress */}
        <div className="p-4 bg-slate-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-700">Vesting Progress</span>
            <span className="text-sm font-semibold text-slate-900">
              {currentShareholder.total_shares > 0 
                ? ((currentShareholder.shares_vested / currentShareholder.total_shares) * 100).toFixed(0)
                : 0}%
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all"
              style={{ 
                width: `${currentShareholder.total_shares > 0 
                  ? ((currentShareholder.shares_vested / currentShareholder.total_shares) * 100)
                  : 0}%` 
              }}
            />
          </div>
        </div>

        {/* Next Vesting Event */}
        {nextEvent && (
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-semibold text-indigo-900">
                Next Vesting Event
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-indigo-600 capitalize">
                  {nextEvent.type.replace("_", " ")}
                </p>
                <p className="text-sm font-medium text-indigo-900">
                  {format(nextEvent.date, "MMM d, yyyy")}
                </p>
              </div>
              <div className="text-right">
                <Badge className="bg-indigo-600 mb-1">
                  {nextEvent.daysUntil} days
                </Badge>
                <p className="text-xs text-indigo-600">
                  {nextEvent.shares.toLocaleString()} shares
                </p>
              </div>
            </div>
          </div>
        )}

        {/* My Grants Summary */}
        {myGrants.length > 0 && (
          <div className="pt-3 border-t">
            <p className="text-xs text-slate-600 mb-2 font-medium">Active Grants</p>
            <div className="space-y-2">
              {myGrants.slice(0, 2).map((grant, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700 capitalize">
                    {grant.grant_type?.replace(/_/g, " ")}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-900 font-medium">
                      {grant.shares_granted?.toLocaleString()}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {grant.shares_granted > 0 
                        ? ((grant.shares_vested / grant.shares_granted) * 100).toFixed(0)
                        : 0}%
                    </Badge>
                  </div>
                </div>
              ))}
              {myGrants.length > 2 && (
                <p className="text-xs text-slate-500 text-center pt-1">
                  +{myGrants.length - 2} more grant{myGrants.length - 2 > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}