import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Users, TrendingUp, PieChart, Plus, Download, Building2, Filter, Calendar } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import { format } from "date-fns";

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];

export default function CapTable() {
  const [isAddShareholderOpen, setIsAddShareholderOpen] = useState(false);
  const [filterShareClass, setFilterShareClass] = useState("all");
  const [filterDateRange, setFilterDateRange] = useState("all");
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

  const { data: fundingRounds = [] } = useQuery({
    queryKey: ["fundingRounds"],
    queryFn: () => base44.entities.FundingRound.list("-closing_date"),
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

  // Filter shareholders
  const filteredShareholders = useMemo(() => {
    let filtered = shareholders;

    if (filterShareClass !== "all") {
      filtered = filtered.filter(sh => {
        const grants = equityGrants.filter(g => g.shareholder_id === sh.id);
        return grants.some(g => g.share_class === filterShareClass);
      });
    }

    if (filterDateRange !== "all") {
      const cutoffDate = new Date();
      if (filterDateRange === "last_year") {
        cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
      } else if (filterDateRange === "last_6_months") {
        cutoffDate.setMonth(cutoffDate.getMonth() - 6);
      }
      filtered = filtered.filter(sh => {
        return sh.join_date && new Date(sh.join_date) >= cutoffDate;
      });
    }

    return filtered;
  }, [shareholders, filterShareClass, filterDateRange, equityGrants]);

  // Vested vs Unvested breakdown
  const vestingBreakdown = useMemo(() => {
    return filteredShareholders.map(sh => ({
      name: sh.name,
      vested: sh.shares_vested || 0,
      unvested: (sh.total_shares || 0) - (sh.shares_vested || 0),
      total: sh.total_shares || 0,
    }));
  }, [filteredShareholders]);

  // Dilution over time based on funding rounds
  const dilutionTimeline = useMemo(() => {
    const sortedRounds = [...fundingRounds]
      .filter(r => r.closing_date && r.status === "closed")
      .sort((a, b) => new Date(a.closing_date) - new Date(b.closing_date));

    let cumulativeShares = totalShares;
    const timeline = [
      {
        date: "Current",
        totalShares: totalShares,
        dilution: 0,
      },
    ];

    sortedRounds.forEach((round, idx) => {
      const sharesIssued = round.shares_issued || 0;
      const prevShares = cumulativeShares;
      cumulativeShares += sharesIssued;
      const dilutionPercent = prevShares > 0 ? ((sharesIssued / cumulativeShares) * 100).toFixed(2) : 0;

      timeline.unshift({
        date: format(new Date(round.closing_date), "MMM yyyy"),
        roundName: round.round_name,
        totalShares: cumulativeShares,
        dilution: parseFloat(dilutionPercent),
      });
    });

    return timeline.reverse();
  }, [fundingRounds, totalShares]);

  // Ownership changes after each funding round
  const ownershipHistory = useMemo(() => {
    if (fundingRounds.length === 0) return [];

    const sortedRounds = [...fundingRounds]
      .filter(r => r.closing_date && r.status === "closed")
      .sort((a, b) => new Date(a.closing_date) - new Date(b.closing_date));

    return sortedRounds.map(round => {
      const roundData = {
        round: round.round_name,
        date: format(new Date(round.closing_date), "MMM yyyy"),
      };

      // Calculate ownership for each shareholder type at this round
      const types = ["founder", "employee", "investor", "advisor"];
      types.forEach(type => {
        const typeShares = shareholders
          .filter(sh => sh.type === type)
          .reduce((sum, sh) => sum + (sh.total_shares || 0), 0);
        const totalAtRound = (round.shares_issued || 0) + totalShares;
        roundData[type] = totalAtRound > 0 ? ((typeShares / totalAtRound) * 100).toFixed(2) : 0;
      });

      return roundData;
    });
  }, [fundingRounds, shareholders, totalShares]);

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

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4" />
                Share Class
              </Label>
              <Select value={filterShareClass} onValueChange={setFilterShareClass}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {shareClasses.map(sc => (
                    <SelectItem key={sc.id} value={sc.class_name}>
                      {sc.class_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4" />
                Date Range
              </Label>
              <Select value={filterDateRange} onValueChange={setFilterDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="last_6_months">Last 6 Months</SelectItem>
                  <SelectItem value="last_year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(filterShareClass !== "all" || filterDateRange !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setFilterShareClass("all");
                  setFilterDateRange("all");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

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

      {/* Advanced Visualizations */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vesting">Vesting Analysis</TabsTrigger>
          <TabsTrigger value="dilution">Dilution Timeline</TabsTrigger>
          <TabsTrigger value="history">Ownership History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
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
        </TabsContent>

        <TabsContent value="vesting" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Vested vs Unvested Shares by Shareholder</CardTitle>
              </CardHeader>
              <CardContent>
                {vestingBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={vestingBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="vested" stackId="a" fill="#10b981" name="Vested" />
                      <Bar dataKey="unvested" stackId="a" fill="#f59e0b" name="Unvested" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-slate-400">
                    No vesting data yet
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vesting Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {vestingBreakdown.slice(0, 6).map((item, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-lg">
                      <p className="font-medium text-slate-900 mb-2">{item.name}</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Vested:</span>
                          <span className="font-medium text-green-600">
                            {item.vested.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Unvested:</span>
                          <span className="font-medium text-amber-600">
                            {item.unvested.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1 border-t">
                          <span className="text-slate-600">Total:</span>
                          <span className="font-semibold">
                            {item.total.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="dilution" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Share Dilution Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {dilutionTimeline.length > 1 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={dilutionTimeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" label={{ value: "Total Shares", angle: -90, position: "insideLeft" }} />
                    <YAxis yAxisId="right" orientation="right" label={{ value: "Dilution %", angle: 90, position: "insideRight" }} />
                    <Tooltip />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="totalShares"
                      stroke="#6366f1"
                      fill="#6366f1"
                      fillOpacity={0.3}
                      name="Total Shares"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="dilution"
                      stroke="#ef4444"
                      strokeWidth={2}
                      name="Dilution %"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-slate-400">
                  No funding rounds to display dilution timeline
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dilution Events</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Round</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total Shares After</TableHead>
                    <TableHead className="text-right">Dilution %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dilutionTimeline.map((event, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">
                        {event.roundName || event.date}
                      </TableCell>
                      <TableCell>{event.date}</TableCell>
                      <TableCell className="text-right">
                        {event.totalShares.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={event.dilution > 20 ? "destructive" : "secondary"}>
                          {event.dilution}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ownership Changes After Funding Rounds</CardTitle>
            </CardHeader>
            <CardContent>
              {ownershipHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={ownershipHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="round" />
                    <YAxis label={{ value: "Ownership %", angle: -90, position: "insideLeft" }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="founder" stroke="#6366f1" strokeWidth={2} name="Founders" />
                    <Line type="monotone" dataKey="employee" stroke="#10b981" strokeWidth={2} name="Employees" />
                    <Line type="monotone" dataKey="investor" stroke="#f59e0b" strokeWidth={2} name="Investors" />
                    <Line type="monotone" dataKey="advisor" stroke="#8b5cf6" strokeWidth={2} name="Advisors" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-slate-400">
                  No funding history to display
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Shareholders Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Shareholders
            {(filterShareClass !== "all" || filterDateRange !== "all") && (
              <span className="ml-2 text-sm font-normal text-slate-500">
                ({filteredShareholders.length} filtered)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredShareholders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Entity Type</TableHead>
                  <TableHead className="text-right">Total Shares</TableHead>
                  <TableHead className="text-right">Vested</TableHead>
                  <TableHead className="text-right">Unvested</TableHead>
                  <TableHead className="text-right">Ownership %</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShareholders.map((shareholder) => (
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
                    <TableCell className="text-right text-green-600 font-medium">
                      {(shareholder.shares_vested || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-amber-600 font-medium">
                      {((shareholder.total_shares || 0) - (shareholder.shares_vested || 0)).toLocaleString()}
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
              <p>
                {shareholders.length === 0
                  ? "No shareholders yet"
                  : "No shareholders match the current filters"}
              </p>
              {shareholders.length === 0 && (
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => setIsAddShareholderOpen(true)}
                >
                  Add First Shareholder
                </Button>
              )}
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