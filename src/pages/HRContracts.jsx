import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { format, differenceInDays, parseISO } from "date-fns";
import { Users, MoreVertical, Pencil, Trash2, Eye, Upload, Check, AlertTriangle, Download, Send, PlayCircle } from "lucide-react";

const STATUSES = ["draft", "pending_review", "pending_signature", "active", "expired", "terminated"];
const DEPARTMENTS = ["HR", "Finance", "Sales", "Legal", "IT", "Marketing", "Operations", "Executive"];

export default function HRContracts() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: allContracts = [], isLoading } = useQuery({
    queryKey: ["contracts"],
    queryFn: () => base44.entities.Contract.list("-created_date"),
  });

  // Filter only employment contracts
  const contracts = allContracts.filter(c => c.type === "employment");

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Contract.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      setIsDialogOpen(false);
      setEditingContract(null);
      setFileUrl("");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Contract.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      setIsDialogOpen(false);
      setEditingContract(null);
      setFileUrl("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Contract.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contracts"] }),
  });

  const handleDownloadPdf = async (contractId) => {
    try {
      const response = await base44.functions.invoke('generateContractPdf', { contractId });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contract-${contractId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  const handleSendForSignature = async (contract) => {
    try {
      await base44.integrations.Core.SendEmail({
        to: contract.party_name.includes('@') ? contract.party_name : 'recipient@example.com',
        subject: `Employment Contract Signature Required: ${contract.title}`,
        body: `
Hello ${contract.party_name},

Please review and sign your employment contract: ${contract.title}

Contract Details:
- Start Date: ${contract.start_date}
- End Date: ${contract.end_date || 'N/A'}
${contract.value ? `- Compensation: $${contract.value.toLocaleString()}` : ''}
- Department: ${contract.department || 'N/A'}

${contract.notes ? `\nAdditional Information:\n${contract.notes}` : ''}

Please contact HR if you have any questions.

Best regards,
${user?.full_name}
HR Team
        `
      });

      await updateMutation.mutateAsync({ 
        id: contract.id, 
        data: { ...contract, status: 'pending_signature' } 
      });

      alert('Contract sent for signature!');
    } catch (error) {
      console.error('Error sending contract:', error);
      alert('Failed to send contract. Please try again.');
    }
  };

  const handleTriggerOnboarding = async (contract) => {
    const confirmed = confirm(
      `Trigger onboarding workflow for ${contract.party_name}? This will create tasks for profile creation, equipment assignment, orientation, and more.`
    );

    if (!confirmed) return;

    try {
      const response = await base44.functions.invoke('triggerOnboarding', { 
        contractId: contract.id 
      });

      alert(`Onboarding workflow started! ${response.data.tasksCreated} tasks created.`);
    } catch (error) {
      console.error('Error triggering onboarding:', error);
      alert('Failed to trigger onboarding. Please try again.');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFileUrl(file_url);
    setUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const data = {
      title: formData.get("title"),
      contract_number: formData.get("contract_number"),
      type: "employment", // Always employment for HR
      party_name: formData.get("party_name"),
      value: formData.get("value") ? parseFloat(formData.get("value")) : undefined,
      start_date: formData.get("start_date"),
      end_date: formData.get("end_date"),
      auto_renew: formData.get("auto_renew") === "on",
      status: formData.get("status") || "draft",
      department: formData.get("department"),
      file_url: fileUrl || editingContract?.file_url,
      renewal_reminder_days: formData.get("renewal_reminder_days") ? parseInt(formData.get("renewal_reminder_days")) : 30,
      notes: formData.get("notes"),
      owner: user?.email,
      owner_name: user?.full_name,
    };

    if (editingContract) {
      updateMutation.mutate({ id: editingContract.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getDaysUntilExpiry = (endDate) => {
    if (!endDate) return null;
    return differenceInDays(parseISO(endDate), new Date());
  };

  const columns = [
    {
      header: "Employee",
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.party_name}</p>
          <p className="text-sm text-slate-500">{row.contract_number}</p>
        </div>
      ),
    },
    {
      header: "Title",
      accessor: "title",
    },
    {
      header: "Department",
      accessor: "department",
    },
    {
      header: "Start Date",
      accessor: "start_date",
      cell: (row) => row.start_date && format(new Date(row.start_date), "MMM d, yyyy"),
    },
    {
      header: "End Date",
      accessor: "end_date",
      cell: (row) => {
        const daysLeft = getDaysUntilExpiry(row.end_date);
        const isExpiringSoon = daysLeft !== null && daysLeft <= 30 && daysLeft > 0;
        const isExpired = daysLeft !== null && daysLeft <= 0;
        
        return (
          <div className="flex items-center gap-2">
            <span className={isExpired ? "text-red-600" : isExpiringSoon ? "text-amber-600" : ""}>
              {row.end_date ? format(new Date(row.end_date), "MMM d, yyyy") : "N/A"}
            </span>
            {isExpiringSoon && <AlertTriangle className="w-4 h-4 text-amber-500" />}
          </div>
        );
      },
    },
    {
      header: "Status",
      accessor: "status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: "",
      cell: (row) => (
        <div className="flex gap-1">
          {row.file_url && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => window.open(row.file_url, "_blank")}
            >
              <Eye className="w-4 h-4" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDownloadPdf(row.id)}
            title="Download PDF"
          >
            <Download className="w-4 h-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleSendForSignature(row)}>
                <Send className="w-4 h-4 mr-2" />
                Send for Signature
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleTriggerOnboarding(row)}
                className="text-indigo-600"
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                Trigger Onboarding
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setEditingContract(row);
                  setFileUrl(row.file_url || "");
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
        </div>
      ),
    },
  ];

  const activeContracts = contracts.filter((c) => c.status === "active").length;
  const expiringSoon = contracts.filter((c) => {
    const days = getDaysUntilExpiry(c.end_date);
    return days !== null && days <= 30 && days > 0 && c.status === "active";
  }).length;

  return (
    <div>
      <PageHeader
        title="Employee Contracts"
        subtitle={`${activeContracts} active • ${expiringSoon} expiring soon`}
        action={() => {
          setEditingContract(null);
          setFileUrl("");
          setIsDialogOpen(true);
        }}
        actionLabel="Add Contract"
      />

      <Card className="border-0 shadow-sm">
        {contracts.length === 0 && !isLoading ? (
          <EmptyState
            icon={Users}
            title="No employment contracts yet"
            description="Add employee contracts to track employment agreements"
            action={() => setIsDialogOpen(true)}
            actionLabel="Add Contract"
          />
        ) : (
          <DataTable columns={columns} data={contracts} isLoading={isLoading} />
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingContract ? "Edit" : "Add"} Employment Contract</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Position/Title *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g., Senior Software Engineer"
                  defaultValue={editingContract?.title}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contract_number">Contract Number</Label>
                <Input
                  id="contract_number"
                  name="contract_number"
                  placeholder="EMP-2026-001"
                  defaultValue={editingContract?.contract_number}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="party_name">Employee Name *</Label>
                <Input
                  id="party_name"
                  name="party_name"
                  placeholder="Full name or email"
                  defaultValue={editingContract?.party_name}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Annual Salary ($)</Label>
                <Input
                  id="value"
                  name="value"
                  type="number"
                  placeholder="e.g., 120000"
                  defaultValue={editingContract?.value}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Select name="department" defaultValue={editingContract?.department}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  defaultValue={editingContract?.start_date}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date (if fixed term)</Label>
                <Input
                  id="end_date"
                  name="end_date"
                  type="date"
                  defaultValue={editingContract?.end_date}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={editingContract?.status || "draft"}>
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
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto_renew"
                name="auto_renew"
                defaultChecked={editingContract?.auto_renew}
              />
              <Label htmlFor="auto_renew" className="font-normal">Auto-renew contract</Label>
            </div>
            <div className="space-y-2">
              <Label>Contract Document</Label>
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center">
                {fileUrl ? (
                  <div className="flex items-center justify-center gap-2 text-emerald-600">
                    <Check className="w-5 h-5" />
                    <span>Document uploaded</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFileUrl("")}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <Upload className="w-8 h-8" />
                      <span>{uploading ? "Uploading..." : "Click to upload document"}</span>
                    </div>
                  </label>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Additional contract details..."
                defaultValue={editingContract?.notes}
              />
            </div>
            <input type="hidden" name="renewal_reminder_days" value="30" />
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                {editingContract ? "Update" : "Create"} Contract
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}