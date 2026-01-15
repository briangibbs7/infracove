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
import { format, differenceInDays } from "date-fns";
import { Calendar, Check, X } from "lucide-react";

const TIME_OFF_TYPES = ["vacation", "sick", "personal", "bereavement", "parental", "other"];

export default function TimeOff() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["timeoff"],
    queryFn: () => base44.entities.TimeOffRequest.list("-created_date"),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TimeOffRequest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeoff"] });
      setIsDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TimeOffRequest.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["timeoff"] }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const startDate = formData.get("start_date");
    const endDate = formData.get("end_date");
    const days = differenceInDays(new Date(endDate), new Date(startDate)) + 1;

    const employee = employees.find((emp) => emp.id === formData.get("employee_id"));

    createMutation.mutate({
      employee_id: formData.get("employee_id"),
      employee_name: employee?.full_name || user?.full_name,
      type: formData.get("type"),
      start_date: startDate,
      end_date: endDate,
      days_requested: days,
      reason: formData.get("reason"),
      status: "pending_approval",
    });
  };

  const handleApprove = (request) => {
    updateMutation.mutate({
      id: request.id,
      data: {
        status: "approved",
        approved_by: user?.email,
        approved_by_name: user?.full_name,
        approved_date: new Date().toISOString().split("T")[0],
      },
    });
  };

  const handleReject = (request) => {
    updateMutation.mutate({
      id: request.id,
      data: { status: "rejected" },
    });
  };

  const columns = [
    {
      header: "Employee",
      accessor: "employee_name",
      cell: (row) => (
        <span className="font-medium text-slate-900">{row.employee_name || "N/A"}</span>
      ),
    },
    {
      header: "Type",
      accessor: "type",
      cell: (row) => (
        <span className="capitalize">{row.type?.replace(/_/g, " ")}</span>
      ),
    },
    {
      header: "Dates",
      cell: (row) => (
        <div className="text-sm">
          <p>{row.start_date && format(new Date(row.start_date), "MMM d, yyyy")}</p>
          <p className="text-slate-400">to {row.end_date && format(new Date(row.end_date), "MMM d, yyyy")}</p>
        </div>
      ),
    },
    {
      header: "Days",
      accessor: "days_requested",
      cell: (row) => <span>{row.days_requested || 1} days</span>,
    },
    {
      header: "Manager",
      accessor: "manager_name",
      cell: (row) => (
        <span className="text-sm text-slate-600">{row.manager_name || "Assigning..."}</span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: "Actions",
      cell: (row) =>
        row.status === "pending_approval" && (user?.role === "admin" || row.manager_id === user?.email) ? (
          <div className="flex gap-2">
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
          </div>
        ) : null,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Time Off Requests"
        subtitle="Manage vacation and leave requests"
        action={() => setIsDialogOpen(true)}
        actionLabel="Request Time Off"
      />

      <Card className="border-0 shadow-sm">
        {requests.length === 0 && !isLoading ? (
          <EmptyState
            icon={Calendar}
            title="No time off requests"
            description="Submit a request for time off"
            action={() => setIsDialogOpen(true)}
            actionLabel="Request Time Off"
          />
        ) : (
          <DataTable columns={columns} data={requests} isLoading={isLoading} />
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Time Off</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {user?.role === "admin" && employees.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="employee_id">Employee</Label>
                <Select name="employee_id">
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
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
              <Label htmlFor="type">Type *</Label>
              <Select name="type" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OFF_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date *</Label>
                <Input id="start_date" name="start_date" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date *</Label>
                <Input id="end_date" name="end_date" type="date" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea id="reason" name="reason" placeholder="Optional notes..." />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                Submit Request
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}