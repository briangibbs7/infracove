import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Calendar } from "lucide-react";
import { format, differenceInMonths, addMonths } from "date-fns";

function vestingProgress(grant) {
  const start = new Date(grant.vesting_start_date || grant.grant_date);
  const now = new Date();
  const totalMonths = grant.vesting_period_months || 48;
  const cliffMonths = grant.cliff_months || 12;
  const elapsed = Math.max(0, differenceInMonths(now, start));
  const cliffReached = elapsed >= cliffMonths;
  const vestedMonths = cliffReached ? Math.min(elapsed, totalMonths) : 0;
  const pct = Math.round((vestedMonths / totalMonths) * 100);
  const vestedShares = Math.round((grant.shares_granted || 0) * (vestedMonths / totalMonths));
  const fullyVestedDate = addMonths(start, totalMonths);
  return { pct, vestedShares, fullyVestedDate, cliffReached };
}

const GRANT_TYPE_LABELS = {
  stock_options: "Stock Options",
  rsu: "RSU",
  common_stock: "Common Stock",
  preferred_stock: "Preferred Stock",
  warrant: "Warrant",
  safe: "SAFE",
};

const STATUS_COLORS = {
  active: "bg-green-100 text-green-700",
  fully_vested: "bg-blue-100 text-blue-700",
  exercised: "bg-purple-100 text-purple-700",
  expired: "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-600",
};

export default function EquitySection({ grants = [] }) {
  const activeGrants = grants.filter(g => g.status !== "cancelled" && g.status !== "expired");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="w-4 h-4 text-purple-500" />
          Equity Grants
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeGrants.length === 0 ? (
          <p className="text-slate-400 italic text-sm">No equity grants found.</p>
        ) : (
          <div className="space-y-4">
            {activeGrants.map(grant => {
              const { pct, vestedShares, fullyVestedDate, cliffReached } = vestingProgress(grant);
              return (
                <div key={grant.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">{GRANT_TYPE_LABELS[grant.grant_type] || grant.grant_type}</p>
                      <p className="text-sm text-slate-500">Granted {grant.grant_date ? format(new Date(grant.grant_date), "MMM d, yyyy") : "—"}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[grant.status] || ""}`}>
                      {grant.status?.replace("_", " ")}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-400">Total Shares</p>
                      <p className="font-semibold">{(grant.shares_granted || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Vested</p>
                      <p className="font-semibold text-green-600">{vestedShares.toLocaleString()}</p>
                    </div>
                    {grant.strike_price != null && (
                      <div>
                        <p className="text-xs text-slate-400">Strike Price</p>
                        <p className="font-semibold">${grant.strike_price.toFixed(4)}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Vesting Progress</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    {!cliffReached && (
                      <p className="text-xs text-amber-600 mt-1">Cliff not yet reached ({grant.cliff_months || 12}-month cliff)</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Calendar className="w-3 h-3" />
                    Fully vests: {format(fullyVestedDate, "MMM d, yyyy")}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}