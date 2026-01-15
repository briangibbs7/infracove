import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { format } from "date-fns";
import { TrendingUp, MoreVertical, Pencil, Trash2, Mail, Phone, Building2, Search, Filter } from "lucide-react";

const SOURCES = ["website", "referral", "linkedin", "cold_outreach", "trade_show", "advertising", "other"];
const STATUSES = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"];
const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "500+"];

export default function Leads() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: () => base44.entities.Lead.list("-created_date"),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.filter({ department: "Sales" }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Lead.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setIsDialogOpen(false);
      setEditingLead(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lead.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setIsDialogOpen(false);
      setEditingLead(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Lead.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const assignee = employees.find((emp) => emp.id === formData.get("assigned_to"));
    
    const data = {
      company_name: formData.get("company_name"),
      contact_name: formData.get("contact_name"),
      contact_email: formData.get("contact_email"),
      contact_phone: formData.get("contact_phone"),
      source: formData.get("source"),
      status: formData.get("status") || "new",
      value: formData.get("value") ? parseFloat(formData.get("value")) : undefined,
      probability: formData.get("probability") ? parseInt(formData.get("probability")) : undefined,
      assigned_to: formData.get("assigned_to"),
      assigned_to_name: assignee?.full_name,
      industry: formData.get("industry"),
      company_size: formData.get("company_size"),
      notes: formData.get("notes"),
      next_follow_up: formData.get("next_follow_up"),
    };

    if (editingLead) {
      updateMutation.mutate({ id: editingLead.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contact_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || lead.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      header: "Company",
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.company_name}</p>
          <p className="text-sm text-slate-500">{row.contact_name}</p>
        </div>
      ),
    },
    {
      header: "Contact",
      cell: (row) => (
        <div className="space-y-1">
          {row.contact_email && (
            <div className="flex items-center gap-1 text-sm text-slate-600">
              <Mail className="w-3 h-3" />
              <span className="truncate max-w-[150px]">{row.contact_email}</span>
            </div>
          )}
          {row.contact_phone && (
            <div className="flex items-center gap-1 text-sm text-slate-500">
              <Phone className="w-3 h-3" />
              <span>{row.contact_phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Value",
      accessor: "value",
      cell: (row) => (
        <div>
          <p className="font-semibold text-slate-900">
            {row.value ? `$${row.value.toLocaleString()}` : "-"}
          </p>
          {row.probability && (
            <p className="text-xs text-slate-500">{row.probability}% probability</p>
          )}
        </div>
      ),
    },
    {
      header: "Source",
      accessor: "source",
      cell: (row) => (
        <span className="text-sm capitalize">{row.source?.replace(/_/g, " ")}</span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: "Assigned",
      accessor: "assigned_to_name",
      cell: (row) => (
        <span className="text-sm text-slate-600">{row.assigned_to_name || "-"}</span>
      ),
    },
    {
      header: "",
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setEditingLead(row);
                setIsDialogOpen(true);
              }}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => deleteMutation.mutate(row.id)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const pipelineValue = leads
    .filter((l) => !["won", "lost"].includes(l.status))
    .reduce((sum, l) => sum + (l.value || 0), 0);

  return (
    <div>
      <PageHeader
        title="Leads"
        subtitle={`${leads.length} leads • $${pipelineValue.toLocaleString()} pipeline`}
        action={() => {
          setEditingLead(null);
          setIsDialogOpen(true);
        }}
        actionLabel="Add Lead"
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-0 shadow-sm">
        {filteredLeads.length === 0 && !isLoading ? (
          <EmptyState
            icon={TrendingUp}
            title="No leads found"
            description="Start adding leads to grow your sales pipeline"
            action={() => setIsDialogOpen(true)}
            actionLabel="Add Lead"
          />
        ) : (
          <DataTable columns={columns} data={filteredLeads} isLoading={isLoading} />
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLead ? "Edit Lead" : "Add New Lead"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  name="company_name"
                  defaultValue={editingLead?.company_name}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_name">Contact Name *</Label>
                <Input
                  id="contact_name"
                  name="contact_name"
                  defaultValue={editingLead?.contact_name}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_email">Email *</Label>
                <Input
                  id="contact_email"
                  name="contact_email"
                  type="email"
                  defaultValue={editingLead?.contact_email}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Phone</Label>
                <Input
                  id="contact_phone"
                  name="contact_phone"
                  defaultValue={editingLead?.contact_phone}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Select name="source" defaultValue={editingLead?.source}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCES.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={editingLead?.status || "new"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Deal Value ($)</Label>
                <Input
                  id="value"
                  name="value"
                  type="number"
                  defaultValue={editingLead?.value}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="probability">Win Probability (%)</Label>
                <Input
                  id="probability"
                  name="probability"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={editingLead?.probability}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  name="industry"
                  defaultValue={editingLead?.industry}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_size">Company Size</Label>
                <Select name="company_size" defaultValue={editingLead?.company_size}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPANY_SIZES.map((size) => (
                      <SelectItem key={size} value={size}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {employees.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="assigned_to">Assigned To</Label>
                  <Select name="assigned_to" defaultValue={editingLead?.assigned_to}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="next_follow_up">Next Follow-up</Label>
                <Input
                  id="next_follow_up"
                  name="next_follow_up"
                  type="date"
                  defaultValue={editingLead?.next_follow_up}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={editingLead?.notes}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                {editingLead ? "Update" : "Create"} Lead
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}