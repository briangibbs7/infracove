import React from "react";
import { Badge } from "@/components/ui/badge";

const statusStyles = {
  // General statuses
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  inactive: "bg-slate-100 text-slate-600 border-slate-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  cancelled: "bg-slate-100 text-slate-600 border-slate-200",
  
  // Employee statuses
  onboarding: "bg-blue-100 text-blue-700 border-blue-200",
  on_leave: "bg-purple-100 text-purple-700 border-purple-200",
  terminated: "bg-red-100 text-red-700 border-red-200",
  
  // Expense statuses
  reimbursed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  
  // Invoice statuses
  paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
  overdue: "bg-red-100 text-red-700 border-red-200",
  
  // Lead statuses
  new: "bg-blue-100 text-blue-700 border-blue-200",
  contacted: "bg-indigo-100 text-indigo-700 border-indigo-200",
  qualified: "bg-violet-100 text-violet-700 border-violet-200",
  proposal: "bg-purple-100 text-purple-700 border-purple-200",
  negotiation: "bg-amber-100 text-amber-700 border-amber-200",
  won: "bg-emerald-100 text-emerald-700 border-emerald-200",
  lost: "bg-red-100 text-red-700 border-red-200",
  
  // Contract statuses
  draft: "bg-slate-100 text-slate-600 border-slate-200",
  pending_review: "bg-amber-100 text-amber-700 border-amber-200",
  pending_signature: "bg-orange-100 text-orange-700 border-orange-200",
  expired: "bg-red-100 text-red-700 border-red-200",
  
  // Asset statuses
  available: "bg-emerald-100 text-emerald-700 border-emerald-200",
  assigned: "bg-blue-100 text-blue-700 border-blue-200",
  maintenance: "bg-amber-100 text-amber-700 border-amber-200",
  retired: "bg-slate-100 text-slate-600 border-slate-200",
  
  // Ticket statuses
  open: "bg-blue-100 text-blue-700 border-blue-200",
  in_progress: "bg-indigo-100 text-indigo-700 border-indigo-200",
  waiting: "bg-amber-100 text-amber-700 border-amber-200",
  resolved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  closed: "bg-slate-100 text-slate-600 border-slate-200",
  
  // Priority
  low: "bg-slate-100 text-slate-600 border-slate-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  critical: "bg-red-100 text-red-700 border-red-200",
};

export default function StatusBadge({ status, className = "" }) {
  const normalizedStatus = status?.toLowerCase().replace(/ /g, "_");
  const style = statusStyles[normalizedStatus] || "bg-slate-100 text-slate-600 border-slate-200";
  
  const displayText = status?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <Badge 
      variant="outline" 
      className={`${style} font-medium border ${className}`}
    >
      {displayText}
    </Badge>
  );
}