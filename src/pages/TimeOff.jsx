import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, CheckCircle2, XCircle, AlertCircle, Plus, User } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "react-hot-toast";

const STATUS_STYLES = {
  pending_approval: "bg-amber-100 text-amber-700 border-amber-200",
  manager_review: "bg-blue-100 text-blue-700 border-blue-200",
  hr_review: "bg-purple-100 text-purple-700 border-purple-200",
  approved: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

const STATUS_LABELS = {
  pending_approval: "Pending",
  manager_review: "Manager Review",
  hr_review: "HR Review",
  approved: "Approved",
  rejected: "Rejected",
};

export default function TimeOff() {
  const [user, setUser] = useState(null);
  const [newRequestOpen, setNewRequestOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: allRequests = [] } = useQuery({
    queryKey: ["timeOffRequests"],
    queryFn: () => base44.entities.TimeOffRequest.list("-created_date"),
  });

  const currentEmployee = employees.find(e => e.email === user?.email);
  const isAdmin = user?.role === "admin";
  const isHR = currentEmployee?.department === "HR" || isAdmin;

  const myRequests = allRequests.filter(r => r.employee_id === currentEmployee?.id);

  // Requests this user needs to review as manager
  const pendingManagerReview = allRequests.filter(
    r => r.manager_id === currentEmployee?.id && r.status === "manager_review"
  );

  // Requests needing HR review
  const pendingHRReview = allRequests.filter(r => r.status === "hr_review");

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TimeOffRequest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeOffRequests"] });
      setNewRequestOpen(false);
      toast.success("Request submitted successfully");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TimeOffRequest.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeOffRequests"] });
      toast.success("Request updated");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const start = fd.get("start_date");
    const end = fd.get("end_date");
    const days = Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1;
    const manager = employees.find(emp => emp.id === currentEmployee?.manager_id);

    createMutation.mutate({
      employee_id: currentEmployee?.id,
      employee_name: currentEmployee?.full_name,
      employee_email: currentEmployee?.email,
      manager_id: manager?.id,
      manager_name: manager?.full_name,
      manager_email: manager?.email,
      type: fd.get("type"),
      start_date: start,
      end_date: end,
      days_requested: days,
      reason: fd.get("reason"),
      status: "pending_approval",
      review_stage: "submitted",
    });
  };

  const handleManagerDecision = (request, decision) => {
    const requiresHR = request.requires_hr_review;
    updateMutation.mutate({
      id: request.id,
      data: {
        manager_decision: decision,
        manager_reviewed_at: new Date().toISOString(),
        manager_name: currentEmployee?.full_name,
        status: decision === "approved" ? (requiresHR ? "hr_review" : "approved") : "rejected",
        review_stage: decision === "approved" ? (requiresHR ? "manager_reviewed" : "completed") : "completed",
        approved_date: decision === "approved" && !requiresHR ? new Date().toISOString().split("T")[0] : undefined,
      },
    });
  };

  const handleHRDecision = (request, decision) => {
    updateMutation.mutate({
      id: request.id,
      data: {
        hr_decision: decision,
        hr_reviewed_at: new Date().toISOString(),
        hr_reviewer_name: currentEmployee?.full_name,
        status: decision === "approved" ? "approved" : "rejected",
        review_stage: "completed",
        approved_date: decision === "approved" ? new Date().toISOString().split("T")[0] : undefined,
      },
    });
  };

  const RequestCard = ({ request, showActions, actionType }) => (
    <div className="p-4 border rounded-xl bg-white hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-slate-900 text-sm">{request.employee_name || "Unknown"}</p>
              <Badge className={`text-xs border ${STATUS_STYLES[request.status] || "bg-slate-100 text-slate-600"}`}>
                {STATUS_LABELS[request.status] || request.status}
              </Badge>
              <Badge variant="outline" className="text-xs capitalize">{request.type?.replace(/_/g, " ")}</Badge>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              {request.start_date && format(parseISO(request.start_date), "MMM d")} –{" "}
              {request.end_date && format(parseISO(request.end_date), "MMM d, yyyy")}
              <span className="ml-2 text-slate-400">({request.days_requested} day{request.days_requested !== 1 ? "s" : ""})</span>
            </p>
            {request.reason && <p className="text-xs text-slate-400 mt-1 line-clamp-1">{request.reason}</p>}
          </div>
        </div>
        {showActions && (
          <div className="flex gap-2 shrink-0">
            <Button size="sm" className="bg-green-600 hover:bg-green-700 h-8 px-3"
              onClick={() => actionType === "manager" ? handleManagerDecision(request, "approved") : handleHRDecision(request, "approved")}>
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
            </Button>
            <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 h-8 px-3"
              onClick={() => actionType === "manager" ? handleManagerDecision(request, "rejected") : handleHRDecision(request, "rejected")}>
              <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const tabs = [
    { value: "my", label: "My Requests" },
    ...(pendingManagerReview.length > 0 ? [{ value: "manager", label: `Pending Review (${pendingManagerReview.length})` }] : []),
    ...(isHR ? [{ value: "hr", label: `HR Review (${pendingHRReview.length})` }] : []),
    ...(isAdmin ? [{ value: "all", label: "All Requests" }] : []),
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Time Off</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage leave requests and approvals</p>
        </div>
        <Button onClick={() => setNewRequestOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Leave Balance Summary */}
      {currentEmployee && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {[
            { label: "Vacation", value: currentEmployee.vacation_balance || 0, color: "bg-blue-50 text-blue-700 border-blue-100" },
            { label: "Sick", value: currentEmployee.sick_balance || 0, color: "bg-rose-50 text-rose-700 border-rose-100" },
            { label: "Personal", value: currentEmployee.personal_balance || 0, color: "bg-purple-50 text-purple-700 border-purple-100" },
            { label: "Bereavement", value: currentEmployee.bereavement_balance || 0, color: "bg-slate-50 text-slate-700 border-slate-200" },
            { label: "Parental", value: currentEmployee.parental_balance || 0, color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
          ].map(({ label, value, color }) => (
            <div key={label} className={`text-center p-3 rounded-xl border ${color}`}>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs mt-0.5 font-medium">{label}</p>
              <p className="text-xs opacity-60">days left</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="my">
        <TabsList>
          {tabs.map(t => (
            <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="my" className="mt-4 space-y-3">
          {myRequests.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-slate-400">
              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No time off requests yet</p>
            </CardContent></Card>
          ) : myRequests.map(r => <RequestCard key={r.id} request={r} showActions={false} />)}
        </TabsContent>

        <TabsContent value="manager" className="mt-4 space-y-3">
          {pendingManagerReview.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No requests pending your review</p>
            </CardContent></Card>
          ) : pendingManagerReview.map(r => <RequestCard key={r.id} request={r} showActions actionType="manager" />)}
        </TabsContent>

        {isHR && (
          <TabsContent value="hr" className="mt-4 space-y-3">
            {pendingHRReview.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-slate-400">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>No requests pending HR review</p>
              </CardContent></Card>
            ) : pendingHRReview.map(r => <RequestCard key={r.id} request={r} showActions actionType="hr" />)}
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="all" className="mt-4 space-y-3">
            {allRequests.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-slate-400">
                <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>No requests found</p>
              </CardContent></Card>
            ) : allRequests.map(r => <RequestCard key={r.id} request={r} showActions={false} />)}
          </TabsContent>
        )}
      </Tabs>

      {/* New Request Dialog */}
      <Dialog open={newRequestOpen} onOpenChange={setNewRequestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Time Off</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Type of Leave *</Label>
              <Select name="type" required>
                <SelectTrigger><SelectValue placeholder="Select leave type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacation">Vacation</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="bereavement">Bereavement</SelectItem>
                  <SelectItem value="parental">Parental Leave</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input name="start_date" type="date" required />
              </div>
              <div className="space-y-2">
                <Label>End Date *</Label>
                <Input name="end_date" type="date" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason (Optional)</Label>
              <Textarea name="reason" placeholder="Brief description..." rows={3} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNewRequestOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Submitting..." : "Submit Request"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}