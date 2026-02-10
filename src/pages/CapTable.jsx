import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Users, TrendingUp, PieChart, Plus, Download, Building2 } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];

export default function CapTable() {
  const [isAddShareholderOpen, setIsAddShareholderOpen] = useState(false);
  const [newShareholder, setNewShareholder] = useState({
    name: "",
    email: "",
    type: "employee",
    total_shares: 0,
    ownership_percentage: 0,
  });

  const queryClient = useQueryClient();

  const { data: shareholders = [] } = useQuery({
    queryKey: ["shareholders"],
    queryFn: () => base44.entities.Shareholder.list(),
  });

  const { data: shareClasses = [] } = useQuery({
    queryKey: ["shareClasses"],
    queryFn: () => base44.entities.ShareClass.list(),
  });

  const { data: equityGrants = [] } = useQuery({
    queryKey: ["equityGrants"],
    queryFn: () => base44.entities.EquityGrant.list(),
  });

  const { data: valuations = [] } = useQuery({
    queryKey: ["valuations"],
    queryFn: () => base44.entities.Valuation.list("-valuation_date"),
  });

  const createShareholderMutation = useMutation({
    mutationFn: (data) => base44.entities.Shareholder.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shareholders"] });
      setIsAddShareholderOpen(false);
      setNewShareholder({
        name: "",
        email: "",
        type: "employee",
        total_shares: 0,
        ownership_percentage: 0,
      });
    },
  });

  // Calculate totals
  const totalShares = useMemo(() => {
    return shareClasses.reduce((sum, sc) => sum + (sc.issued_shares || 0), 0);
  }, [shareClasses]);

  const totalAuthorizedShares = useMemo(() => {
    return shareClasses.reduce((sum, sc) => sum + (sc.authorized_shares || 0), 0);
  }, [shareClasses]);

  const activeValuation = valuations.find(v => v.status === "active");

  // Ownership breakdown by type
  const ownershipByType = useMemo(() => {
    const breakdown = shareholders.reduce((acc, sh) => {
      const type = sh.type || "other";
      if (!acc[type]) {
        acc[type] = { type, shares: 0, percentage: 0 };
      }
      acc[type].shares += sh.total_shares || 0;
      return acc;
    }, {});

    // Calculate percentages
    Object.keys(breakdown).forEach(key => {
      breakdown[key].percentage = totalShares > 0 
        ? ((breakdown[key].shares / totalShares) * 100).toFixed(2)
        : 0;
    });

    return Object.values(breakdown);
  }, [shareholders, totalShares]);

  const chartData = ownershipByType.map(item => ({
    name: item.type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
    value: parseFloat(item.percentage),
  }));

  const handleAddShareholder = () => {
    createShareholderMutation.mutate(newShareholder);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Cap Table</h1>
          <p className="text-slate-600 mt-1">
            Equity ownership and share distribution
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button onClick={() => setIsAddShareholderOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Shareholder
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Shareholders"
          value={shareholders.length}
          icon={Users}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          change={`${shareholders.filter(s => s.status === "active").length} active`}
        />
        <StatCard
          title="Issued Shares"
          value={totalShares.toLocaleString()}
          icon={PieChart}
          iconBg="bg-indigo-100"
          iconColor="text-indigo-600"
          change={`of ${totalAuthorizedShares.toLocaleString()} authorized`}
        />
        <StatCard
          title="Current Valuation"
          value={activeValuation ? `$${(activeValuation.total_valuation / 1000000).toFixed(1)}M` : "N/A"}
          icon={TrendingUp}
          iconBg="bg-green-100"
          iconColor="text-green-600"
          change={activeValuation ? activeValuation.valuation_type.toUpperCase() : "No active valuation"}
        />
        <StatCard
          title="Share Classes"
          value={shareClasses.length}
          icon={Building2}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
          change={`${shareClasses.filter(sc => sc.class_type === "preferred").length} preferred`}
        />
      </div>

      {/* Charts and Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ownership by Type</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPie>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-400">
                No ownership data yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ownership Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ownershipByType.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900 capitalize">
                      {item.type.replace(/_/g, " ")}
                    </p>
                    <p className="text-sm text-slate-500">
                      {item.shares.toLocaleString()} shares
                    </p>
                  </div>
                  <Badge className="text-lg font-semibold">
                    {item.percentage}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shareholders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Shareholders</CardTitle>
        </CardHeader>
        <CardContent>
          {shareholders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Entity Type</TableHead>
                  <TableHead className="text-right">Total Shares</TableHead>
                  <TableHead className="text-right">Vested</TableHead>
                  <TableHead className="text-right">Ownership %</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shareholders.map((shareholder) => (
                  <TableRow key={shareholder.id}>
                    <TableCell className="font-medium">
                      <div>
                        <p>{shareholder.name}</p>
                        <p className="text-xs text-slate-500">{shareholder.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {shareholder.type?.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">
                      {shareholder.entity_type?.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell className="text-right">
                      {(shareholder.total_shares || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {(shareholder.shares_vested || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {shareholder.ownership_percentage?.toFixed(2) || 0}%
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={shareholder.status === "active" ? "default" : "secondary"}
                        className="capitalize"
                      >
                        {shareholder.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No shareholders yet</p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => setIsAddShareholderOpen(true)}
              >
                Add First Shareholder
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Shareholder Dialog */}
      <Dialog open={isAddShareholderOpen} onOpenChange={setIsAddShareholderOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Shareholder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={newShareholder.name}
                onChange={(e) =>
                  setNewShareholder({ ...newShareholder, name: e.target.value })
                }
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={newShareholder.email}
                onChange={(e) =>
                  setNewShareholder({ ...newShareholder, email: e.target.value })
                }
                placeholder="john@example.com"
              />
            </div>
            <div>
              <Label>Type *</Label>
              <Select
                value={newShareholder.type}
                onValueChange={(value) =>
                  setNewShareholder({ ...newShareholder, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="founder">Founder</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="investor">Investor</SelectItem>
                  <SelectItem value="advisor">Advisor</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Total Shares</Label>
              <Input
                type="number"
                value={newShareholder.total_shares}
                onChange={(e) =>
                  setNewShareholder({
                    ...newShareholder,
                    total_shares: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddShareholderOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddShareholder}
              disabled={!newShareholder.name}
            >
              Add Shareholder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}