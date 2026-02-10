import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { FileCheck, Plus, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "react-hot-toast";
import StatusBadge from "@/components/ui/StatusBadge";

export default function BoardConsentManager() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedConsent, setSelectedConsent] = useState(null);
  const queryClient = useQueryClient();

  const { data: consents = [] } = useQuery({
    queryKey: ["boardConsents"],
    queryFn: () => base44.entities.BoardConsent.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.BoardConsent.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boardConsents"] });
      setIsCreateOpen(false);
      toast.success("Board consent created");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BoardConsent.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boardConsents"] });
      toast.success("Consent updated");
    },
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved": return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "rejected": return <XCircle className="w-4 h-4 text-red-600" />;
      case "pending": return <Clock className="w-4 h-4 text-yellow-600" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Board Consents</h2>
          <p className="text-slate-600">Manage board approvals and resolutions</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Consent
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-slate-600">Total Consents</div>
            <div className="text-2xl font-bold">{consents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-slate-600">Pending</div>
            <div className="text-2xl font-bold text-yellow-600">
              {consents.filter(c => c.status === "pending").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-slate-600">Approved</div>
            <div className="text-2xl font-bold text-green-600">
              {consents.filter(c => c.status === "approved").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-slate-600">Rejected</div>
            <div className="text-2xl font-bold text-red-600">
              {consents.filter(c => c.status === "rejected").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Consents</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Voting Deadline</TableHead>
                <TableHead>Votes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consents.map((consent) => (
                <TableRow key={consent.id}>
                  <TableCell className="font-medium">{consent.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{consent.consent_type?.replace(/_/g, " ")}</Badge>
                  </TableCell>
                  <TableCell>
                    {consent.created_date_custom ? 
                      new Date(consent.created_date_custom).toLocaleDateString() : 
                      new Date(consent.created_date).toLocaleDateString()
                    }
                  </TableCell>
                  <TableCell>
                    {consent.voting_deadline ? new Date(consent.voting_deadline).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(consent.status)}
                      <span>{consent.votes_approved || 0} / {consent.board_members?.length || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={consent.status} />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedConsent(consent)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CreateConsentDialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={(data) => createMutation.mutate(data)}
      />
    </div>
  );
}

function CreateConsentDialog({ open, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    title: "",
    consent_type: "equity_issuance",
    description: "",
    voting_deadline: "",
    board_members: [],
  });

  const handleSubmit = () => {
    if (!formData.title) {
      toast.error("Please enter a title");
      return;
    }
    onSubmit(formData);
    setFormData({
      title: "",
      consent_type: "equity_issuance",
      description: "",
      voting_deadline: "",
      board_members: [],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Board Consent</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Approval of 2024 Stock Option Plan"
            />
          </div>
          <div>
            <Label>Consent Type</Label>
            <select
              className="w-full px-3 py-2 border rounded-md"
              value={formData.consent_type}
              onChange={(e) => setFormData({ ...formData, consent_type: e.target.value })}
            >
              <option value="equity_issuance">Equity Issuance</option>
              <option value="409a_approval">409A Approval</option>
              <option value="financing_round">Financing Round</option>
              <option value="option_pool">Option Pool</option>
              <option value="bylaw_amendment">Bylaw Amendment</option>
              <option value="contract_approval">Contract Approval</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>
          <div>
            <Label>Voting Deadline</Label>
            <Input
              type="date"
              value={formData.voting_deadline}
              onChange={(e) => setFormData({ ...formData, voting_deadline: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Create Consent</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}