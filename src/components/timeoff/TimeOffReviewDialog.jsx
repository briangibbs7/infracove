import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, X, ChevronRight, User, Shield, CheckCircle2, Clock, AlertCircle } from "lucide-react";

const STAGE_LABELS = {
  submitted: "Submitted",
  manager_reviewed: "Manager Reviewed",
  hr_reviewed: "HR Reviewed",
  completed: "Completed",
};

const STAGE_ORDER = ["submitted", "manager_reviewed", "hr_reviewed", "completed"];

function StageIndicator({ request }) {
  const currentIndex = STAGE_ORDER.indexOf(request.review_stage || "submitted");
  const stages = request.requires_hr_review
    ? STAGE_ORDER
    : STAGE_ORDER.filter(s => s !== "hr_reviewed");

  return (
    <div className="flex items-center gap-1 mb-4">
      {stages.map((stage, i) => {
        const stageIndex = STAGE_ORDER.indexOf(stage);
        const done = currentIndex > stageIndex;
        const active = currentIndex === stageIndex;
        return (
          <React.Fragment key={stage}>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              done ? "bg-emerald-100 text-emerald-700" :
              active ? "bg-indigo-100 text-indigo-700" :
              "bg-slate-100 text-slate-400"
            }`}>
              {done ? <CheckCircle2 className="w-3 h-3" /> : active ? <Clock className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
              {STAGE_LABELS[stage]}
            </div>
            {i < stages.length - 1 && <ChevronRight className="w-3 h-3 text-slate-300" />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function AuditTrail({ trail }) {
  if (!trail?.length) return null;
  return (
    <div className="mt-4 space-y-2">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Audit Trail</p>
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {trail.map((entry, i) => (
          <div key={i} className="flex gap-2 text-xs text-slate-600 bg-slate-50 rounded p-2">
            <span className="font-medium text-slate-800">{entry.actor_name}</span>
            <span className="text-slate-400">·</span>
            <span className="capitalize">{entry.action?.replace(/_/g, " ")}</span>
            {entry.comments && <span className="text-slate-400">— "{entry.comments}"</span>}
            <span className="ml-auto text-slate-400 shrink-0">
              {entry.timestamp && format(new Date(entry.timestamp), "MMM d, h:mm a")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TimeOffReviewDialog({ request, user, onClose, onActionComplete }) {
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);

  if (!request) return null;

  const isManager = user?.role === "admin" || request.manager_email === user?.email;
  const isHR = user?.role === "admin" || user?.department === "HR";

  const canManagerReview = request.status === "manager_review" && isManager;
  const canHRReview = request.status === "hr_review" && isHR;

  const handleAction = async (action) => {
    setLoading(true);
    await base44.functions.invoke("timeOffWorkflow", {
      action,
      request_id: request.id,
      comments,
    });
    setLoading(false);
    onActionComplete();
    onClose();
  };

  return (
    <Dialog open={!!request} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Time Off Request Review</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <StageIndicator request={request} />

          {/* Request Details */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Employee</span>
              <span className="font-medium">{request.employee_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Type</span>
              <span className="capitalize font-medium">{request.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Dates</span>
              <span className="font-medium">{request.start_date} → {request.end_date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Days</span>
              <span className="font-medium">{request.days_requested}</span>
            </div>
            {request.reason && (
              <div className="flex justify-between">
                <span className="text-slate-500">Reason</span>
                <span className="font-medium max-w-[60%] text-right">{request.reason}</span>
              </div>
            )}
            {request.requires_hr_review && (
              <div className="flex items-center gap-2 pt-1">
                <Shield className="w-4 h-4 text-amber-500" />
                <span className="text-amber-700 text-xs font-medium">Requires HR final approval</span>
              </div>
            )}
          </div>

          {/* Manager review panel */}
          {canManagerReview && (
            <div className="border border-indigo-100 rounded-lg p-4 space-y-3 bg-indigo-50">
              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
                <User className="w-4 h-4" /> Manager Review
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Comments (optional)</Label>
                <Textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Add review notes..."
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  disabled={loading}
                  onClick={() => handleAction("manager_approve")}
                >
                  <Check className="w-4 h-4 mr-1" />
                  {request.requires_hr_review ? "Approve & Send to HR" : "Approve"}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                  disabled={loading}
                  onClick={() => handleAction("manager_reject")}
                >
                  <X className="w-4 h-4 mr-1" /> Decline
                </Button>
              </div>
            </div>
          )}

          {/* HR review panel */}
          {canHRReview && (
            <div className="border border-purple-100 rounded-lg p-4 space-y-3 bg-purple-50">
              <div className="flex items-center gap-2 text-sm font-semibold text-purple-700">
                <Shield className="w-4 h-4" /> HR Final Review
              </div>
              {request.manager_comments && (
                <p className="text-xs text-slate-600 bg-white rounded p-2">
                  <span className="font-semibold">Manager notes:</span> {request.manager_comments}
                </p>
              )}
              <div className="space-y-1">
                <Label className="text-xs">HR Comments (optional)</Label>
                <Textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Add HR review notes..."
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  disabled={loading}
                  onClick={() => handleAction("hr_approve")}
                >
                  <Check className="w-4 h-4 mr-1" /> Final Approve
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                  disabled={loading}
                  onClick={() => handleAction("hr_reject")}
                >
                  <X className="w-4 h-4 mr-1" /> Decline
                </Button>
              </div>
            </div>
          )}

          {/* Read-only resolved state */}
          {(request.status === "approved" || request.status === "rejected") && (
            <div className={`rounded-lg p-3 text-sm font-medium text-center ${
              request.status === "approved" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            }`}>
              {request.status === "approved"
                ? `✓ Approved by ${request.approved_by_name}`
                : `✗ Declined${request.rejection_reason ? ` — ${request.rejection_reason}` : ""}`}
            </div>
          )}

          <AuditTrail trail={request.audit_trail} />
        </div>
      </DialogContent>
    </Dialog>
  );
}