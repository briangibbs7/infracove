import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Key, Users, Calendar, AlertTriangle, CheckCircle } from "lucide-react";
import { format, parseISO, isPast, differenceInDays } from "date-fns";

export default function LicenseManagementCard({ asset }) {
  if (asset.type !== "software_license") {
    return null;
  }

  const availableSeats = (asset.total_seats || 0) - (asset.seats_in_use || 0);
  const utilizationPercentage = asset.total_seats > 0 
    ? ((asset.seats_in_use / asset.total_seats) * 100).toFixed(0)
    : 0;

  const isExpired = asset.license_expiry_date && isPast(parseISO(asset.license_expiry_date));
  const daysUntilExpiry = asset.license_expiry_date 
    ? differenceInDays(parseISO(asset.license_expiry_date), new Date())
    : null;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 30;

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Key className="w-4 h-4 text-slate-400" />
          License Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {asset.license_key && (
          <div>
            <span className="text-xs text-slate-500 block mb-1">License Key</span>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono">
                {asset.license_key}
              </code>
            </div>
          </div>
        )}

        {asset.total_seats > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600 flex items-center gap-1">
                <Users className="w-3 h-3" />
                Seat Usage
              </span>
              <span className="text-sm font-semibold">
                {asset.seats_in_use || 0} / {asset.total_seats}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  utilizationPercentage >= 90 ? "bg-red-500" :
                  utilizationPercentage >= 70 ? "bg-amber-500" :
                  "bg-emerald-500"
                }`}
                style={{ width: `${utilizationPercentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-slate-500">
                {availableSeats} seats available
              </span>
              <span className="text-xs text-slate-500">{utilizationPercentage}% used</span>
            </div>
          </div>
        )}

        {asset.license_expiry_date && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Expiry Date
            </span>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${isExpired ? "text-red-600" : isExpiringSoon ? "text-amber-600" : "text-slate-900"}`}>
                {format(parseISO(asset.license_expiry_date), "MMM d, yyyy")}
              </span>
              {isExpired && <AlertTriangle className="w-4 h-4 text-red-500" />}
              {!isExpired && isExpiringSoon && <AlertTriangle className="w-4 h-4 text-amber-500" />}
              {!isExpired && !isExpiringSoon && <CheckCircle className="w-4 h-4 text-emerald-500" />}
            </div>
          </div>
        )}

        {isExpiringSoon && !isExpired && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800">
              ⚠️ License expires in {daysUntilExpiry} days
            </p>
          </div>
        )}

        {isExpired && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-xs text-red-800">
              ❌ License has expired
            </p>
          </div>
        )}

        {asset.renewal_cost && (
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm text-slate-600">Annual Renewal</span>
            <span className="text-sm font-semibold text-slate-900">
              ${asset.renewal_cost.toLocaleString()}/year
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}