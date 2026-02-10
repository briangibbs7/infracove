import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Download,
  TrendingUp,
  Award,
  FileText,
  DollarSign,
  Calendar,
  PieChart,
  Bell,
} from "lucide-react";
import { format } from "date-fns";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import StatCard from "@/components/ui/StatCard";

const COLORS = ["#10b981", "#f59e0b", "#6366f1", "#ef4444"];

export default function ShareholderPortal() {
  const [user, setUser] = useState(null);
  const [generatingDoc, setGeneratingDoc] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: shareholders = [] } = useQuery({
    queryKey: ["shareholders"],
    queryFn: () => base44.entities.Shareholder.list(),
  });

  const { data: equityGrants = [] } = useQuery({
    queryKey: ["equityGrants"],
    queryFn: () => base44.entities.EquityGrant.list("-grant_date"),
  });

  const { data: valuations = [] } = useQuery({
    queryKey: ["valuations"],
    queryFn: () => base44.entities.Valuation.list("-valuation_date"),
  });

  const { data: fundingRounds = [] } = useQuery({
    queryKey: ["fundingRounds"],
    queryFn: () => base44.entities.FundingRound.list("-closing_date"),
  });

  const { data: shareClasses = [] } = useQuery({
    queryKey: ["shareClasses"],
    queryFn: () => base44.entities.ShareClass.list(),
  });

  // Find current shareholder by email
  const currentShareholder = useMemo(() => {
    if (!user) return null;
    return shareholders.find(s => s.email === user.email);
  }, [user, shareholders]);

  // Get grants for current shareholder
  const myGrants = useMemo(() => {
    if (!currentShareholder) return [];
    return equityGrants.filter(g => g.shareholder_id === currentShareholder.id);
  }, [currentShareholder, equityGrants]);

  // Calculate vesting progress for each grant
  const grantsWithProgress = useMemo(() => {
    return myGrants.map(grant => {
      const total = grant.shares_granted || 0;
      const vested = grant.shares_vested || 0;
      const progress = total > 0 ? (vested / total) * 100 : 0;
      
      return {
        ...grant,
        progress,
        unvested: total - vested,
      };
    });
  }, [myGrants]);

  // Portfolio value
  const portfolioValue = useMemo(() => {
    if (!currentShareholder) return 0;
    const activeValuation = valuations.find(v => v.status === "active");
    if (!activeValuation) return 0;
    
    const pricePerShare = activeValuation.common_stock_price || 0;
    return (currentShareholder.total_shares || 0) * pricePerShare;
  }, [currentShareholder, valuations]);

  // Vested value
  const vestedValue = useMemo(() => {
    if (!currentShareholder) return 0;
    const activeValuation = valuations.find(v => v.status === "active");
    if (!activeValuation) return 0;
    
    const pricePerShare = activeValuation.common_stock_price || 0;
    return (currentShareholder.shares_vested || 0) * pricePerShare;
  }, [currentShareholder, valuations]);

  // Vesting timeline
  const vestingTimeline = useMemo(() => {
    const timeline = [];
    const today = new Date();
    
    grantsWithProgress.forEach(grant => {
      if (grant.vesting_start_date && grant.vesting_period_months) {
        const startDate = new Date(grant.vesting_start_date);
        const monthsElapsed = Math.max(0, Math.floor((today - startDate) / (1000 * 60 * 60 * 24 * 30)));
        
        for (let month = 0; month <= Math.min(monthsElapsed, grant.vesting_period_months); month += 6) {
          const date = new Date(startDate);
          date.setMonth(date.getMonth() + month);
          
          const vestedShares = Math.floor((grant.shares_granted * month) / grant.vesting_period_months);
          
          timeline.push({
            date: format(date, "MMM yyyy"),
            shares: vestedShares,
            grant: grant.grant_type,
          });
        }
      }
    });
    
    return timeline.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [grantsWithProgress]);

  // Grant breakdown
  const grantBreakdown = useMemo(() => {
    const breakdown = {};
    myGrants.forEach(grant => {
      const type = grant.grant_type || "unknown";
      if (!breakdown[type]) {
        breakdown[type] = { type, shares: 0, value: 0 };
      }
      breakdown[type].shares += grant.shares_granted || 0;
    });
    
    const activeValuation = valuations.find(v => v.status === "active");
    const pricePerShare = activeValuation?.common_stock_price || 0;
    
    return Object.values(breakdown).map(item => ({
      ...item,
      value: item.shares * pricePerShare,
      percentage: currentShareholder?.total_shares 
        ? ((item.shares / currentShareholder.total_shares) * 100).toFixed(1)
        : 0,
    }));
  }, [myGrants, valuations, currentShareholder]);

  const handleGenerateStockCertificate = async (shareholderId) => {
    setGeneratingDoc("certificate");
    try {
      const { data } = await base44.functions.invoke("generateStockCertificate", {
        shareholder_id: shareholderId,
      });
      
      const blob = new Blob([data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `stock-certificate-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error("Error generating certificate:", error);
      alert("Failed to generate stock certificate");
    } finally {
      setGeneratingDoc(null);
    }
  };

  const handleGenerateGrantAgreement = async (grantId) => {
    setGeneratingDoc(`grant-${grantId}`);
    try {
      const { data } = await base44.functions.invoke("generateGrantAgreement", {
        grant_id: grantId,
      });
      
      const blob = new Blob([data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `grant-agreement-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error("Error generating agreement:", error);
      alert("Failed to generate grant agreement");
    } finally {
      setGeneratingDoc(null);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentShareholder) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Award className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">No Shareholder Profile</h2>
          <p className="text-slate-600">
            You don't have a shareholder profile yet. Contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Equity</h1>
          <p className="text-slate-600 mt-1">
            View your equity holdings and vesting schedule
          </p>
          <p className="text-xs text-slate-500 mt-1">
            <Bell className="w-3 h-3 inline mr-1" />
            Vesting calculations updated daily at midnight
          </p>
        </div>
        <Button
          onClick={() => handleGenerateStockCertificate(currentShareholder.id)}
          disabled={generatingDoc === "certificate"}
        >
          <Download className="w-4 h-4 mr-2" />
          {generatingDoc === "certificate" ? "Generating..." : "Download Certificate"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Shares"
          value={(currentShareholder.total_shares || 0).toLocaleString()}
          icon={Award}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Vested Shares"
          value={(currentShareholder.shares_vested || 0).toLocaleString()}
          icon={TrendingUp}
          iconBg="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          title="Portfolio Value"
          value={`$${portfolioValue.toLocaleString()}`}
          icon={DollarSign}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Vested Value"
          value={`$${vestedValue.toLocaleString()}`}
          icon={DollarSign}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="grants">My Grants</TabsTrigger>
          <TabsTrigger value="vesting">Vesting Schedule</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Grant Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {grantBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPie>
                      <Pie
                        data={grantBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ type, percentage }) => `${type}: ${percentage}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="shares"
                      >
                        {grantBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPie>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-slate-400">
                    No grants yet
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shareholder Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                  <span className="text-slate-600">Type</span>
                  <Badge className="capitalize">{currentShareholder.type}</Badge>
                </div>
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                  <span className="text-slate-600">Entity Type</span>
                  <span className="font-medium capitalize">
                    {currentShareholder.entity_type?.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                  <span className="text-slate-600">Ownership</span>
                  <span className="font-semibold text-lg">
                    {currentShareholder.ownership_percentage?.toFixed(2) || 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                  <span className="text-slate-600">Status</span>
                  <Badge variant={currentShareholder.status === "active" ? "default" : "secondary"}>
                    {currentShareholder.status}
                  </Badge>
                </div>
                {currentShareholder.join_date && (
                  <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                    <span className="text-slate-600">Member Since</span>
                    <span className="font-medium">
                      {format(new Date(currentShareholder.join_date), "MMM dd, yyyy")}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="grants" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Equity Grants</CardTitle>
            </CardHeader>
            <CardContent>
              {grantsWithProgress.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Grant Type</TableHead>
                      <TableHead>Grant Date</TableHead>
                      <TableHead className="text-right">Total Shares</TableHead>
                      <TableHead className="text-right">Vested</TableHead>
                      <TableHead className="text-right">Progress</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grantsWithProgress.map((grant) => (
                      <TableRow key={grant.id}>
                        <TableCell className="font-medium capitalize">
                          {grant.grant_type?.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell>
                          {format(new Date(grant.grant_date), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          {grant.shares_granted?.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-green-600 font-medium">
                          {grant.shares_vested?.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={grant.progress === 100 ? "default" : "secondary"}>
                            {grant.progress.toFixed(0)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              grant.status === "active"
                                ? "default"
                                : grant.status === "fully_vested"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {grant.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleGenerateGrantAgreement(grant.id)}
                            disabled={generatingDoc === `grant-${grant.id}`}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            {generatingDoc === `grant-${grant.id}` ? "..." : "Download"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-12 text-center text-slate-400">
                  <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No equity grants yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vesting" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vesting Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {vestingTimeline.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={vestingTimeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="shares"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Vested Shares"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-slate-400">
                  No vesting data available
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {grantsWithProgress.map((grant) => (
              <Card key={grant.id}>
                <CardHeader>
                  <CardTitle className="text-lg capitalize">
                    {grant.grant_type?.replace(/_/g, " ")} Grant
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Vesting Start</span>
                    <span className="font-medium">
                      {grant.vesting_start_date
                        ? format(new Date(grant.vesting_start_date), "MMM dd, yyyy")
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Vesting Period</span>
                    <span className="font-medium">
                      {grant.vesting_period_months} months
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Cliff Period</span>
                    <span className="font-medium">{grant.cliff_months} months</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Schedule</span>
                    <span className="font-medium capitalize">
                      {grant.vesting_schedule?.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-600">Progress</span>
                      <span className="font-semibold">{grant.progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${grant.progress}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="font-medium">Stock Certificate</p>
                      <p className="text-sm text-slate-600">
                        Official certificate of ownership
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleGenerateStockCertificate(currentShareholder.id)}
                    disabled={generatingDoc === "certificate"}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>

                {myGrants.map((grant) => (
                  <div
                    key={grant.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="font-medium capitalize">
                          {grant.grant_type?.replace(/_/g, " ")} Agreement
                        </p>
                        <p className="text-sm text-slate-600">
                          Granted on {format(new Date(grant.grant_date), "MMM dd, yyyy")}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleGenerateGrantAgreement(grant.id)}
                      disabled={generatingDoc === `grant-${grant.id}`}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                ))}

                {myGrants.length === 0 && (
                  <div className="py-12 text-center text-slate-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No grant documents available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}