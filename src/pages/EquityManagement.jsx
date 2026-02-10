import React, { useState } from "react";
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
import { Award, TrendingUp, Calendar, Plus, DollarSign, RefreshCw, FileText, Eye, Upload, History } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import { format } from "date-fns";
import VestingCalculator from "@/components/equity/VestingCalculator";
import BulkGrantImport from "@/components/equity/BulkGrantImport";
import EquityAuditLog from "@/components/equity/EquityAuditLog";
import { toast } from "react-hot-toast";

export default function EquityManagement() {
  const [isAddGrantOpen, setIsAddGrantOpen] = useState(false);
  const [isAddRoundOpen, setIsAddRoundOpen] = useState(false);
  const [selectedGrant, setSelectedGrant] = useState(null);
  const [isVestingDialogOpen, setIsVestingDialogOpen] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isAuditLogOpen, setIsAuditLogOpen] = useState(false);
  const [newGrant, setNewGrant] = useState({
    shareholder_id: "",
    grant_type: "stock_options",
    shares_granted: 0,
    strike_price: 0,
    grant_date: new Date().toISOString().split("T")[0],
    vesting_schedule: "4_year_1_cliff",
  });
  const [newRound, setNewRound] = useState({
    round_name: "",
    round_type: "seed",
    amount_raised: 0,
    closing_date: new Date().toISOString().split("T")[0],
  });
  const [isCalculatingVesting, setIsCalculatingVesting] = useState(false);

  const queryClient = useQueryClient();

  const { data: shareholders = [] } = useQuery({
    queryKey: ["shareholders"],
    queryFn: () => base44.entities.Shareholder.list(),
  });

  const { data: equityGrants = [] } = useQuery({
    queryKey: ["equityGrants"],
    queryFn: () => base44.entities.EquityGrant.list("-grant_date"),
  });

  const { data: fundingRounds = [] } = useQuery({
    queryKey: ["fundingRounds"],
    queryFn: () => base44.entities.FundingRound.list("-closing_date"),
  });

  const { data: valuations = [] } = useQuery({
    queryKey: ["valuations"],
    queryFn: () => base44.entities.Valuation.list("-valuation_date"),
  });

  const createGrantMutation = useMutation({
    mutationFn: (data) => base44.entities.EquityGrant.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equityGrants"] });
      setIsAddGrantOpen(false);
      setNewGrant({
        shareholder_id: "",
        grant_type: "stock_options",
        shares_granted: 0,
        strike_price: 0,
        grant_date: new Date().toISOString().split("T")[0],
        vesting_schedule: "4_year_1_cliff",
      });
    },
  });

  const createRoundMutation = useMutation({
    mutationFn: (data) => base44.entities.FundingRound.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fundingRounds"] });
      setIsAddRoundOpen(false);
      setNewRound({
        round_name: "",
        round_type: "seed",
        amount_raised: 0,
        closing_date: new Date().toISOString().split("T")[0],
      });
    },
  });

  const totalGrantedShares = equityGrants.reduce(
    (sum, g) => sum + (g.shares_granted || 0),
    0
  );
  const totalVestedShares = equityGrants.reduce(
    (sum, g) => sum + (g.shares_vested || 0),
    0
  );
  const totalRaised = fundingRounds.reduce(
    (sum, r) => sum + (r.amount_raised || 0),
    0
  );

  const handleAddGrant = () => {
    const shareholder = shareholders.find(s => s.id === newGrant.shareholder_id);
    createGrantMutation.mutate({
      ...newGrant,
      shareholder_name: shareholder?.name,
    });
  };

  const updateGrantMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EquityGrant.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equityGrants"] });
      queryClient.invalidateQueries({ queryKey: ["shareholders"] });
      toast.success("Grant updated successfully");
    },
  });

  const handleCalculateVesting = async () => {
    setIsCalculatingVesting(true);
    try {
      await base44.functions.invoke('calculateVesting', {});
      queryClient.invalidateQueries({ queryKey: ["equityGrants"] });
      queryClient.invalidateQueries({ queryKey: ["shareholders"] });
      toast.success('Vesting calculations completed successfully');
    } catch (error) {
      toast.error('Failed to calculate vesting: ' + error.message);
    } finally {
      setIsCalculatingVesting(false);
    }
  };

  const handleGenerateReport = async (reportType, shareholderId = null) => {
    setIsGeneratingReport(true);
    try {
      const { data } = await base44.functions.invoke('generateVestingReport', {
        report_type: reportType,
        shareholder_id: shareholderId,
      });
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vesting-report-${reportType}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success('Report generated successfully');
    } catch (error) {
      toast.error('Failed to generate report: ' + error.message);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleUpdateGrant = (updatedGrant) => {
    updateGrantMutation.mutate({
      id: updatedGrant.id,
      data: updatedGrant
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Equity Management</h1>
          <p className="text-slate-600 mt-1">
            Grants, options, and funding rounds
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsAuditLogOpen(true)}
          >
            <History className="w-4 h-4 mr-2" />
            Audit Log
          </Button>
          <Button
            variant="outline"
            onClick={() => handleGenerateReport('company')}
            disabled={isGeneratingReport}
          >
            <FileText className="w-4 h-4 mr-2" />
            Company Report
          </Button>
          <Button
            variant="outline"
            onClick={handleCalculateVesting}
            disabled={isCalculatingVesting}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isCalculatingVesting ? 'animate-spin' : ''}`} />
            {isCalculatingVesting ? 'Calculating...' : 'Update Vesting'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Grants"
          value={equityGrants.length}
          icon={Award}
          iconBg="bg-indigo-100"
          iconColor="text-indigo-600"
          change={`${totalGrantedShares.toLocaleString()} shares`}
        />
        <StatCard
          title="Vested Shares"
          value={totalVestedShares.toLocaleString()}
          icon={TrendingUp}
          iconBg="bg-green-100"
          iconColor="text-green-600"
          change={`${((totalVestedShares / totalGrantedShares) * 100 || 0).toFixed(1)}% of total`}
        />
        <StatCard
          title="Funding Rounds"
          value={fundingRounds.length}
          icon={Calendar}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          change={`${fundingRounds.filter(r => r.status === "closed").length} closed`}
        />
        <StatCard
          title="Total Raised"
          value={`$${(totalRaised / 1000000).toFixed(1)}M`}
          icon={DollarSign}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          change="All-time"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="grants" className="space-y-6">
        <TabsList>
          <TabsTrigger value="grants">Equity Grants</TabsTrigger>
          <TabsTrigger value="rounds">Funding Rounds</TabsTrigger>
          <TabsTrigger value="valuations">Valuations</TabsTrigger>
        </TabsList>

        <TabsContent value="grants" className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsBulkImportOpen(true)} 
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              Bulk Import
            </Button>
            <Button onClick={() => setIsAddGrantOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              New Grant
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Equity Grants</CardTitle>
            </CardHeader>
            <CardContent>
              {equityGrants.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Shareholder</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Shares</TableHead>
                      <TableHead className="text-right">Strike Price</TableHead>
                      <TableHead>Grant Date</TableHead>
                      <TableHead>Vesting</TableHead>
                      <TableHead>Status & Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equityGrants.map((grant) => (
                      <TableRow key={grant.id}>
                        <TableCell className="font-medium">
                          {grant.shareholder_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {grant.grant_type?.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {grant.shares_granted?.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {grant.strike_price ? `$${grant.strike_price.toFixed(2)}` : "N/A"}
                        </TableCell>
                        <TableCell>
                          {grant.grant_date && format(new Date(grant.grant_date), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="text-xs">
                              <span className="font-medium text-green-600">{grant.shares_vested || 0}</span>
                              <span className="text-slate-500"> / {grant.shares_granted}</span>
                            </div>
                            <div className="w-20 bg-slate-200 rounded-full h-1.5">
                              <div
                                className="bg-green-600 h-1.5 rounded-full"
                                style={{ 
                                  width: `${grant.shares_granted > 0 
                                    ? ((grant.shares_vested || 0) / grant.shares_granted) * 100
                                    : 0}%` 
                                }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge className="capitalize">
                              {grant.status?.replace(/_/g, " ")}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedGrant(grant);
                                setIsVestingDialogOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleGenerateReport('individual', grant.shareholder_id)}
                              disabled={isGeneratingReport}
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                          </div>
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

        <TabsContent value="rounds" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsAddRoundOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              New Round
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Funding Rounds</CardTitle>
            </CardHeader>
            <CardContent>
              {fundingRounds.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Round</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount Raised</TableHead>
                      <TableHead className="text-right">Valuation</TableHead>
                      <TableHead>Lead Investor</TableHead>
                      <TableHead>Closing Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fundingRounds.map((round) => (
                      <TableRow key={round.id}>
                        <TableCell className="font-medium">
                          {round.round_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {round.round_type?.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${(round.amount_raised || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {round.post_money_valuation
                            ? `$${(round.post_money_valuation / 1000000).toFixed(1)}M`
                            : "N/A"}
                        </TableCell>
                        <TableCell>{round.lead_investor || "N/A"}</TableCell>
                        <TableCell>
                          {round.closing_date
                            ? format(new Date(round.closing_date), "MMM d, yyyy")
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={round.status === "closed" ? "default" : "secondary"}
                            className="capitalize"
                          >
                            {round.status?.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-12 text-center text-slate-400">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No funding rounds yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="valuations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Valuations</CardTitle>
            </CardHeader>
            <CardContent>
              {valuations.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Valuation</TableHead>
                      <TableHead className="text-right">Common Price</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {valuations.map((valuation) => (
                      <TableRow key={valuation.id}>
                        <TableCell>
                          {format(new Date(valuation.valuation_date), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="uppercase">
                            {valuation.valuation_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${(valuation.total_valuation / 1000000).toFixed(1)}M
                        </TableCell>
                        <TableCell className="text-right">
                          ${valuation.common_stock_price?.toFixed(2) || "N/A"}
                        </TableCell>
                        <TableCell>{valuation.valuation_provider || "N/A"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={valuation.status === "active" ? "default" : "secondary"}
                            className="capitalize"
                          >
                            {valuation.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-12 text-center text-slate-400">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No valuations yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Grant Dialog */}
      <Dialog open={isAddGrantOpen} onOpenChange={setIsAddGrantOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Equity Grant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Shareholder *</Label>
              <Select
                value={newGrant.shareholder_id}
                onValueChange={(value) =>
                  setNewGrant({ ...newGrant, shareholder_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select shareholder" />
                </SelectTrigger>
                <SelectContent>
                  {shareholders.map((sh) => (
                    <SelectItem key={sh.id} value={sh.id}>
                      {sh.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Grant Type *</Label>
              <Select
                value={newGrant.grant_type}
                onValueChange={(value) =>
                  setNewGrant({ ...newGrant, grant_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stock_options">Stock Options</SelectItem>
                  <SelectItem value="rsu">RSU</SelectItem>
                  <SelectItem value="common_stock">Common Stock</SelectItem>
                  <SelectItem value="preferred_stock">Preferred Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Shares Granted *</Label>
              <Input
                type="number"
                value={newGrant.shares_granted}
                onChange={(e) =>
                  setNewGrant({
                    ...newGrant,
                    shares_granted: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div>
              <Label>Strike Price</Label>
              <Input
                type="number"
                step="0.01"
                value={newGrant.strike_price}
                onChange={(e) =>
                  setNewGrant({
                    ...newGrant,
                    strike_price: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div>
              <Label>Grant Date *</Label>
              <Input
                type="date"
                value={newGrant.grant_date}
                onChange={(e) =>
                  setNewGrant({ ...newGrant, grant_date: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddGrantOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddGrant}
              disabled={!newGrant.shareholder_id || !newGrant.shares_granted}
            >
              Create Grant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vesting Calculator Dialog */}
      <Dialog open={isVestingDialogOpen} onOpenChange={setIsVestingDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Vesting Schedule - {selectedGrant?.shareholder_name}
            </DialogTitle>
          </DialogHeader>
          {selectedGrant && (
            <VestingCalculator 
              grant={selectedGrant}
              onUpdate={handleUpdateGrant}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog */}
      <BulkGrantImport
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["equityGrants"] });
          queryClient.invalidateQueries({ queryKey: ["shareholders"] });
        }}
        shareholders={shareholders}
      />

      {/* Audit Log Dialog */}
      <Dialog open={isAuditLogOpen} onOpenChange={setIsAuditLogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Equity Audit Log</DialogTitle>
          </DialogHeader>
          <EquityAuditLog entityType="EquityGrant" limit={100} />
        </DialogContent>
      </Dialog>

      {/* Add Round Dialog */}
      <Dialog open={isAddRoundOpen} onOpenChange={setIsAddRoundOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Funding Round</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Round Name *</Label>
              <Input
                value={newRound.round_name}
                onChange={(e) =>
                  setNewRound({ ...newRound, round_name: e.target.value })
                }
                placeholder="e.g., Series A"
              />
            </div>
            <div>
              <Label>Round Type *</Label>
              <Select
                value={newRound.round_type}
                onValueChange={(value) =>
                  setNewRound({ ...newRound, round_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pre_seed">Pre-Seed</SelectItem>
                  <SelectItem value="seed">Seed</SelectItem>
                  <SelectItem value="series_a">Series A</SelectItem>
                  <SelectItem value="series_b">Series B</SelectItem>
                  <SelectItem value="series_c">Series C</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount Raised</Label>
              <Input
                type="number"
                value={newRound.amount_raised}
                onChange={(e) =>
                  setNewRound({
                    ...newRound,
                    amount_raised: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="1000000"
              />
            </div>
            <div>
              <Label>Closing Date</Label>
              <Input
                type="date"
                value={newRound.closing_date}
                onChange={(e) =>
                  setNewRound({ ...newRound, closing_date: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddRoundOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createRoundMutation.mutate(newRound)}
              disabled={!newRound.round_name}
            >
              Create Round
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}