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
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { format } from "date-fns";
import { Receipt, Check, X, Upload, Eye, DollarSign, Clock, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CATEGORIES = ["travel", "office_supplies", "software", "meals", "equipment", "marketing", "professional_services", "utilities", "other"];
const DEPARTMENTS = ["HR", "Finance", "Sales", "Legal", "IT", "Marketing", "Operations", "Executive"];

export default function Expenses() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => base44.entities.Expense.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Expense.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setIsDialogOpen(false);
      setReceiptUrl("");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Expense.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setReceiptUrl(file_url);
    setUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    createMutation.mutate({
      title: formData.get("title"),
      description: formData.get("description"),
      amount: parseFloat(formData.get("amount")),
      category: formData.get("category"),
      department: formData.get("department"),
      date: formData.get("date"),
      receipt_url: receiptUrl,
      submitted_by: user?.email,
      submitted_by_name: user?.full_name,
      status: "pending",
    });
  };

  const handleApprove = (expense) => {
    updateMutation.mutate({
      id: expense.id,
      data: {
        status: "approved",
        approved_by: user?.email,
        approved_date: new Date().toISOString().split("T")[0],
      },
    });
  };

  const handleReject = (expense) => {
    updateMutation.mutate({
      id: expense.id,
      data: { status: "rejected" },
    });
  };

  const columns = [
    {
      header: "Title",
      accessor: "title",
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.title}</p>
          <p className="text-sm text-slate-500">{row.submitted_by_name}</p>
        </div>
      ),
    },
    {
      header: "Amount",
      accessor: "amount",
      cell: (row) => (
        <span className="font-semibold text-slate-900">
          ${row.amount?.toLocaleString()}
        </span>
      ),
    },
    {
      header: "Category",
      accessor: "category",
      cell: (row) => (
        <span className="text-sm capitalize">{row.category?.replace(/_/g, " ")}</span>
      ),
    },
    {
      header: "Date",
      accessor: "date",
      cell: (row) => (
        <span className="text-sm text-slate-600">
          {row.date && format(new Date(row.date), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: "Actions",
      cell: (row) => (
        <div className="flex gap-2">
          {row.receipt_url && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => window.open(row.receipt_url, "_blank")}
            >
              <Eye className="w-4 h-4" />
            </Button>
          )}
          {row.status === "pending" && user?.role === "admin" && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="text-emerald-600 hover:bg-emerald-50"
                onClick={() => handleApprove(row)}
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 hover:bg-red-50"
                onClick={() => handleReject(row)}
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  const pendingTotal = expenses.filter((e) => e.status === "pending").reduce((sum, e) => sum + (e.amount || 0), 0);
  const approvedTotal = expenses.filter((e) => e.status === "approved").reduce((sum, e) => sum + (e.amount || 0), 0);
  const rejectedCount = expenses.filter((e) => e.status === "rejected").length;
  const totalAll = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div>
      <PageHeader
        title="Expenses"
        subtitle={`${expenses.filter((e) => e.status === "pending").length} pending • $${pendingTotal.toLocaleString()} total`}
        action={() => setIsDialogOpen(true)}
        actionLabel="Submit Expense"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Total Submitted</CardTitle></CardHeader>
          <CardContent><div className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-slate-500" /><span className="text-2xl font-bold">${totalAll.toLocaleString()}</span></div></CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Pending</CardTitle></CardHeader>
          <CardContent><div className="flex items-center gap-2"><Clock className="w-5 h-5 text-amber-500" /><span className="text-2xl font-bold text-amber-600">${pendingTotal.toLocaleString()}</span></div></CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Approved</CardTitle></CardHeader>
          <CardContent><div className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-500" /><span className="text-2xl font-bold text-emerald-600">${approvedTotal.toLocaleString()}</span></div></CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Rejected</CardTitle></CardHeader>
          <CardContent><div className="flex items-center gap-2"><XCircle className="w-5 h-5 text-red-500" /><span className="text-2xl font-bold text-red-600">{rejectedCount}</span></div></CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        {expenses.length === 0 && !isLoading ? (
          <EmptyState
            icon={Receipt}
            title="No expenses yet"
            description="Submit your first expense report"
            action={() => setIsDialogOpen(true)}
            actionLabel="Submit Expense"
          />
        ) : (
          <DataTable columns={columns} data={expenses} isLoading={isLoading} />
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Submit Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" name="title" required placeholder="e.g., Client lunch meeting" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input id="amount" name="amount" type="number" step="0.01" required placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input id="date" name="date" type="date" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select name="category" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select name="department">
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="Additional details..." />
            </div>
            <div className="space-y-2">
              <Label>Receipt</Label>
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center">
                {receiptUrl ? (
                  <div className="flex items-center justify-center gap-2 text-emerald-600">
                    <Check className="w-5 h-5" />
                    <span>Receipt uploaded</span>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <Upload className="w-8 h-8" />
                      <span>{uploading ? "Uploading..." : "Click to upload receipt"}</span>
                    </div>
                  </label>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={createMutation.isPending}>
                Submit Expense
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}