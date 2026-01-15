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
import { format, isPast, parseISO } from "date-fns";
import { FileText, Upload, Eye, Check, AlertCircle } from "lucide-react";

const CATEGORIES = ["services", "software", "equipment", "supplies", "rent", "utilities", "other"];
const STATUSES = ["pending", "approved", "paid", "overdue", "cancelled"];

export default function Invoices() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => base44.entities.Invoice.list("-created_date"),
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ["vendors"],
    queryFn: () => base44.entities.Vendor.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Invoice.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setIsDialogOpen(false);
      setFileUrl("");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Invoice.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices"] }),
  });

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
    const vendor = vendors.find((v) => v.id === formData.get("vendor_id"));
    
    createMutation.mutate({
      invoice_number: formData.get("invoice_number"),
      vendor_id: formData.get("vendor_id"),
      vendor_name: vendor?.name || formData.get("vendor_name"),
      amount: parseFloat(formData.get("amount")),
      issue_date: formData.get("issue_date"),
      due_date: formData.get("due_date"),
      category: formData.get("category"),
      file_url: fileUrl,
      notes: formData.get("notes"),
      status: "pending",
    });
  };

  const columns = [
    {
      header: "Invoice",
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.invoice_number}</p>
          <p className="text-sm text-slate-500">{row.vendor_name}</p>
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
      header: "Due Date",
      accessor: "due_date",
      cell: (row) => {
        const isOverdue = row.due_date && isPast(parseISO(row.due_date)) && row.status !== "paid";
        return (
          <div className="flex items-center gap-2">
            <span className={isOverdue ? "text-red-600 font-medium" : "text-slate-600"}>
              {row.due_date && format(new Date(row.due_date), "MMM d, yyyy")}
            </span>
            {isOverdue && <AlertCircle className="w-4 h-4 text-red-500" />}
          </div>
        );
      },
    },
    {
      header: "Category",
      accessor: "category",
      cell: (row) => (
        <span className="text-sm capitalize">{row.category?.replace(/_/g, " ")}</span>
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
          {row.file_url && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => window.open(row.file_url, "_blank")}
            >
              <Eye className="w-4 h-4" />
            </Button>
          )}
          {row.status === "pending" && (
            <Button
              size="sm"
              variant="outline"
              className="text-emerald-600 hover:bg-emerald-50"
              onClick={() => updateMutation.mutate({ id: row.id, data: { status: "approved" } })}
            >
              Approve
            </Button>
          )}
          {row.status === "approved" && (
            <Button
              size="sm"
              variant="outline"
              className="text-blue-600 hover:bg-blue-50"
              onClick={() => updateMutation.mutate({ id: row.id, data: { status: "paid" } })}
            >
              Mark Paid
            </Button>
          )}
        </div>
      ),
    },
  ];

  const totalPending = invoices
    .filter((inv) => inv.status === "pending" || inv.status === "approved")
    .reduce((sum, inv) => sum + (inv.amount || 0), 0);

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle={`$${totalPending.toLocaleString()} pending payment`}
        action={() => setIsDialogOpen(true)}
        actionLabel="Add Invoice"
      />

      <Card className="border-0 shadow-sm">
        {invoices.length === 0 && !isLoading ? (
          <EmptyState
            icon={FileText}
            title="No invoices yet"
            description="Add your first invoice to track"
            action={() => setIsDialogOpen(true)}
            actionLabel="Add Invoice"
          />
        ) : (
          <DataTable columns={columns} data={invoices} isLoading={isLoading} />
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Invoice</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoice_number">Invoice Number *</Label>
                <Input id="invoice_number" name="invoice_number" required placeholder="INV-001" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input id="amount" name="amount" type="number" step="0.01" required placeholder="0.00" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor_id">Vendor</Label>
              {vendors.length > 0 ? (
                <Select name="vendor_id">
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input name="vendor_name" placeholder="Enter vendor name" />
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issue_date">Issue Date</Label>
                <Input id="issue_date" name="issue_date" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date *</Label>
                <Input id="due_date" name="due_date" type="date" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select name="category">
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
              <Label>Invoice File</Label>
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center">
                {fileUrl ? (
                  <div className="flex items-center justify-center gap-2 text-emerald-600">
                    <Check className="w-5 h-5" />
                    <span>File uploaded</span>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <Upload className="w-8 h-8" />
                      <span>{uploading ? "Uploading..." : "Click to upload"}</span>
                    </div>
                  </label>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" placeholder="Additional details..." />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                Add Invoice
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}