import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function WaterfallModeler({ shareholders, shareClasses, equityGrants }) {
  const [exitValue, setExitValue] = useState(50000000);
  const [scenario, setScenario] = useState("exit");

  const calculateWaterfall = useMemo(() => {
    if (!shareholders || !shareClasses) return [];

    // Calculate total shares
    const totalShares = shareholders.reduce((sum, sh) => sum + (sh.total_shares || 0), 0);

    // Get preferred shares with liquidation preferences
    const preferredClasses = shareClasses.filter(sc => sc.class_type === "preferred");
    
    let remainingProceeds = exitValue;
    const distribution = [];

    // Step 1: Pay liquidation preferences to preferred shareholders
    preferredClasses.forEach(prefClass => {
      const prefHolders = shareholders.filter(sh => 
        sh.share_class === prefClass.class_name || 
        equityGrants?.some(g => g.shareholder_id === sh.id && g.share_class === prefClass.class_name)
      );

      prefHolders.forEach(holder => {
        const shares = holder.total_shares || 0;
        const liquidationPref = (prefClass.liquidation_preference || 1) * shares * (prefClass.price_per_share || 0);
        const payment = Math.min(liquidationPref, remainingProceeds);
        
        if (payment > 0) {
          distribution.push({
            name: holder.name,
            type: holder.type,
            shareClass: prefClass.class_name,
            stage: "Liquidation Preference",
            amount: payment,
            shares: shares,
          });
          remainingProceeds -= payment;
        }
      });
    });

    // Step 2: Distribute remaining proceeds pro-rata to all shareholders
    if (remainingProceeds > 0 && totalShares > 0) {
      shareholders.forEach(sh => {
        const shares = sh.total_shares || 0;
        const proRataAmount = (shares / totalShares) * remainingProceeds;
        
        const existing = distribution.find(d => d.name === sh.name);
        if (existing) {
          existing.amount += proRataAmount;
          existing.totalPayout = existing.amount;
        } else {
          distribution.push({
            name: sh.name,
            type: sh.type,
            shareClass: "Common",
            stage: "Pro-Rata Distribution",
            amount: proRataAmount,
            shares: shares,
            totalPayout: proRataAmount,
          });
        }
      });
    }

    // Calculate totals and ROI
    return distribution.map(d => ({
      ...d,
      totalPayout: d.amount,
      ownership: ((d.shares / totalShares) * 100).toFixed(2),
      distributionPct: ((d.amount / exitValue) * 100).toFixed(2),
    }));
  }, [exitValue, shareholders, shareClasses, equityGrants, scenario]);

  const chartData = calculateWaterfall.slice(0, 10).map(d => ({
    name: d.name,
    payout: d.totalPayout,
  }));

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Exit Waterfall Model
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Exit Valuation</Label>
              <Input
                type="number"
                value={exitValue}
                onChange={(e) => setExitValue(Number(e.target.value))}
                placeholder="50000000"
              />
            </div>
            <div>
              <Label>Scenario</Label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
              >
                <option value="exit">Exit/Acquisition</option>
                <option value="ipo">IPO</option>
                <option value="liquidation">Liquidation</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Export Model
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="text-sm text-slate-600">Exit Value</div>
                <div className="text-2xl font-bold text-blue-700">{formatCurrency(exitValue)}</div>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="text-sm text-slate-600">Total Distributed</div>
                <div className="text-2xl font-bold text-green-700">
                  {formatCurrency(calculateWaterfall.reduce((sum, d) => sum + d.totalPayout, 0))}
                </div>
              </CardContent>
            </Card>
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="pt-6">
                <div className="text-sm text-slate-600">Recipients</div>
                <div className="text-2xl font-bold text-purple-700">{calculateWaterfall.length}</div>
              </CardContent>
            </Card>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Distribution Chart (Top 10)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="payout" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stakeholder</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Share Class</TableHead>
                <TableHead className="text-right">Shares</TableHead>
                <TableHead className="text-right">Ownership %</TableHead>
                <TableHead className="text-right">Payout</TableHead>
                <TableHead className="text-right">Distribution %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calculateWaterfall.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.type}</Badge>
                  </TableCell>
                  <TableCell>{item.shareClass}</TableCell>
                  <TableCell className="text-right">{item.shares?.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{item.ownership}%</TableCell>
                  <TableCell className="text-right font-semibold text-green-700">
                    {formatCurrency(item.totalPayout)}
                  </TableCell>
                  <TableCell className="text-right">{item.distributionPct}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}