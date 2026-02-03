import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, DollarSign } from "lucide-react";
import { differenceInMonths, parseISO } from "date-fns";

export default function AssetDepreciationCard({ asset }) {
  const calculateDepreciation = () => {
    if (!asset.purchase_cost || !asset.purchase_date || asset.depreciation_method === "none") {
      return { currentValue: asset.purchase_cost || 0, depreciation: 0, percentage: 0 };
    }

    const monthsOwned = differenceInMonths(new Date(), parseISO(asset.purchase_date));
    const totalMonths = (asset.useful_life_years || 3) * 12;
    const depreciableAmount = asset.purchase_cost - (asset.salvage_value || 0);

    let currentValue = asset.purchase_cost;
    let depreciation = 0;

    if (asset.depreciation_method === "straight_line") {
      const monthlyDepreciation = depreciableAmount / totalMonths;
      depreciation = Math.min(monthlyDepreciation * monthsOwned, depreciableAmount);
      currentValue = asset.purchase_cost - depreciation;
    } else if (asset.depreciation_method === "declining_balance") {
      const rate = 2 / (asset.useful_life_years || 3);
      currentValue = asset.purchase_cost * Math.pow(1 - rate, monthsOwned / 12);
      depreciation = asset.purchase_cost - currentValue;
    }

    const percentage = ((depreciation / asset.purchase_cost) * 100).toFixed(1);

    return {
      currentValue: Math.max(currentValue, asset.salvage_value || 0),
      depreciation,
      percentage
    };
  };

  const { currentValue, depreciation, percentage } = calculateDepreciation();

  if (!asset.purchase_cost || !asset.purchase_date || asset.depreciation_method === "none") {
    return null;
  }

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-slate-400" />
          Asset Depreciation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Original Cost:</span>
          <span className="font-semibold text-slate-900">${asset.purchase_cost.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Current Value:</span>
          <span className="font-semibold text-emerald-700">${currentValue.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Depreciation:</span>
          <span className="font-semibold text-red-600">-${depreciation.toLocaleString()} ({percentage}%)</span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t">
          <span>Method: {asset.depreciation_method?.replace(/_/g, " ")}</span>
          <span>Life: {asset.useful_life_years || 3} years</span>
        </div>
      </CardContent>
    </Card>
  );
}