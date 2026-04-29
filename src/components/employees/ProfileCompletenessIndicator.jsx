import React from "react";

const REQUIRED_FIELDS = [
  { key: "full_name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "job_title", label: "Job Title" },
  { key: "department", label: "Department" },
  { key: "phone", label: "Phone" },
  { key: "location", label: "Location" },
  { key: "manager_id", label: "Manager" },
  { key: "hire_date", label: "Hire Date" },
];

export function getProfileCompleteness(employee) {
  const filled = REQUIRED_FIELDS.filter(f => employee[f.key] && employee[f.key] !== "").length;
  return Math.round((filled / REQUIRED_FIELDS.length) * 100);
}

export function getMissingFields(employee) {
  return REQUIRED_FIELDS.filter(f => !employee[f.key] || employee[f.key] === "").map(f => f.label);
}

export default function ProfileCompletenessIndicator({ employee, showLabel = true }) {
  const pct = getProfileCompleteness(employee);
  const missing = getMissingFields(employee);

  const color = pct === 100 ? "bg-green-500" : pct >= 70 ? "bg-amber-400" : "bg-red-400";
  const textColor = pct === 100 ? "text-green-600" : pct >= 70 ? "text-amber-600" : "text-red-500";

  return (
    <div className="mt-3 pt-3 border-t border-slate-100">
      <div className="flex items-center justify-between mb-1">
        {showLabel && (
          <span className={`text-xs font-medium ${textColor}`}>
            Profile {pct}% complete
          </span>
        )}
        {missing.length > 0 && (
          <span className="text-xs text-slate-400 truncate ml-1" title={`Missing: ${missing.join(", ")}`}>
            Missing: {missing.slice(0, 2).join(", ")}{missing.length > 2 ? ` +${missing.length - 2}` : ""}
          </span>
        )}
      </div>
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}