import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import toast from "react-hot-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const CATEGORY_LABELS = {
  health_insurance: "Health Insurance",
  dental_insurance: "Dental",
  vision_insurance: "Vision",
  life_insurance: "Life Insurance",
  disability_insurance: "Disability",
  retirement_401k: "401(k)",
  pto: "PTO",
  wellness: "Wellness",
  education: "Education",
  commuter: "Commuter",
  other: "Other",
};

const CATEGORY_COLORS = {
  health_insurance: "bg-red-50 text-red-600",
  dental_insurance: "bg-blue-50 text-blue-600",
  vision_insurance: "bg-purple-50 text-purple-600",
  life_insurance: "bg-green-50 text-green-600",
  disability_insurance: "bg-orange-50 text-orange-600",
  retirement_401k: "bg-indigo-50 text-indigo-600",
  pto: "bg-teal-50 text-teal-600",
  wellness: "bg-pink-50 text-pink-600",
  education: "bg-yellow-50 text-yellow-600",
  commuter: "bg-slate-50 text-slate-600",
  other: "bg-slate-50 text-slate-600",
};

const STATUS_COLORS = {
  active: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  cancelled: "bg-red-100 text-red-700",
  expired: "bg-slate-100 text-slate-600",
};

export default function BenefitsSection({ employee, enrollments = [], availableBenefits = [], onRefresh }) {
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollForm, setEnrollForm] = useState({ benefit_id: "", coverage_type: "employee_only" });
  const [saving, setSaving] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  const enrolledBenefitIds = new Set(enrollments.filter(e => e.status === "active").map(e => e.benefit_id));
  const unenrolled = availableBenefits.filter(b => b.is_active && !enrolledBenefitIds.has(b.id));

  const handleEnroll = async () => {
    if (!enrollForm.benefit_id) return toast.error("Please select a benefit");
    setSaving(true);
    const benefit = availableBenefits.find(b => b.id === enrollForm.benefit_id);
    await base44.entities.BenefitEnrollment.create({
      employee_id: employee.id,
      employee_name: employee.full_name,
      employee_email: employee.email,
      benefit_id: enrollForm.benefit_id,
      benefit_name: benefit?.name,
      benefit_category: benefit?.category,
      coverage_type: enrollForm.coverage_type,
      enrollment_date: new Date().toISOString().split("T")[0],
      effective_date: new Date().toISOString().split("T")[0],
      status: "pending",
      employee_contribution: benefit?.employee_cost_monthly || 0,
      employer_contribution: benefit?.employer_cost_monthly || 0,
    });
    toast.success("Enrollment submitted — pending approval.");
    setSaving(false);
    setShowEnrollModal(false);
    setEnrollForm({ benefit_id: "", coverage_type: "employee_only" });
    onRefresh?.();
  };

  const handleCancel = async (enrollmentId) => {
    setCancellingId(enrollmentId);
    await base44.entities.BenefitEnrollment.update(enrollmentId, { status: "cancelled" });
    toast.success("Enrollment cancelled.");
    setCancellingId(null);
    onRefresh?.();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" />
              Benefits Enrollment
            </div>
            {unenrolled.length > 0 && (
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setShowEnrollModal(true)}>
                <Plus className="w-3 h-3 mr-1" /> Enroll
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {enrollments.length === 0 ? (
            <p className="text-slate-400 italic text-sm">You are not enrolled in any benefits yet.</p>
          ) : (
            <div className="space-y-3">
              {enrollments.map(enrollment => {
                const benefit = availableBenefits.find(b => b.id === enrollment.benefit_id);
                return (
                  <div key={enrollment.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${CATEGORY_COLORS[enrollment.benefit_category] || ""}`}>
                          {CATEGORY_LABELS[enrollment.benefit_category] || enrollment.benefit_category}
                        </span>
                        <p className="font-medium text-sm text-slate-800">{enrollment.benefit_name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[enrollment.status] || ""}`}>
                          {enrollment.status}
                        </span>
                        {enrollment.status === "active" && (
                          <button
                            className="text-xs text-red-500 hover:underline"
                            disabled={cancellingId === enrollment.id}
                            onClick={() => handleCancel(enrollment.id)}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                      <span>Coverage: <span className="font-medium capitalize">{enrollment.coverage_type?.replace(/_/g, " ")}</span></span>
                      {enrollment.employee_contribution != null && (
                        <span>Your cost: <span className="font-medium">${enrollment.employee_contribution}/mo</span></span>
                      )}
                      {enrollment.employer_contribution != null && (
                        <span>Employer covers: <span className="font-medium">${enrollment.employer_contribution}/mo</span></span>
                      )}
                      {enrollment.effective_date && (
                        <span>Effective: <span className="font-medium">{format(new Date(enrollment.effective_date), "MMM d, yyyy")}</span></span>
                      )}
                    </div>
                    {benefit?.plan_details?.deductible && (
                      <div className="text-xs text-slate-500">
                        Deductible: ${benefit.plan_details.deductible} · Copay: ${benefit.plan_details.copay}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showEnrollModal} onOpenChange={setShowEnrollModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enroll in a Benefit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label>Select Benefit</Label>
              <Select value={enrollForm.benefit_id} onValueChange={v => setEnrollForm(f => ({ ...f, benefit_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a benefit..." />
                </SelectTrigger>
                <SelectContent>
                  {unenrolled.map(b => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name} — {CATEGORY_LABELS[b.category] || b.category}
                      {b.employee_cost_monthly != null ? ` ($${b.employee_cost_monthly}/mo)` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Coverage Type</Label>
              <Select value={enrollForm.coverage_type} onValueChange={v => setEnrollForm(f => ({ ...f, coverage_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee_only">Employee Only</SelectItem>
                  <SelectItem value="employee_spouse">Employee + Spouse</SelectItem>
                  <SelectItem value="employee_children">Employee + Children</SelectItem>
                  <SelectItem value="family">Family</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {enrollForm.benefit_id && (() => {
              const b = availableBenefits.find(x => x.id === enrollForm.benefit_id);
              return b ? (
                <div className="text-sm bg-slate-50 p-3 rounded-lg space-y-1">
                  {b.description && <p className="text-slate-600">{b.description}</p>}
                  <p className="text-slate-500">Provider: <span className="font-medium">{b.provider || "—"}</span></p>
                  {b.plan_details?.deductible && <p className="text-slate-500">Deductible: <span className="font-medium">${b.plan_details.deductible}</span></p>}
                </div>
              ) : null;
            })()}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleEnroll} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 flex-1">
                {saving ? "Submitting..." : "Submit Enrollment"}
              </Button>
              <Button variant="outline" onClick={() => setShowEnrollModal(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}