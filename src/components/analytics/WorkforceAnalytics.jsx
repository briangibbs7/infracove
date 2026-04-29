import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatCard from "@/components/ui/StatCard";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area,
} from "recharts";
import { Users, TrendingUp, TrendingDown, UserCheck, UserX, Building2 } from "lucide-react";
import { format, parseISO, subMonths, differenceInMonths } from "date-fns";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-bold">{p.value}</span></p>
      ))}
    </div>
  );
};

export default function WorkforceAnalytics({ employees = [] }) {
  // ── Headcount by Department ──
  const departmentData = useMemo(() => {
    const map = {};
    employees.forEach(e => {
      const dept = e.department || "Unknown";
      if (!map[dept]) map[dept] = { name: dept, active: 0, onLeave: 0, inactive: 0 };
      if (e.status === "active") map[dept].active++;
      else if (e.status === "on_leave") map[dept].onLeave++;
      else map[dept].inactive++;
    });
    return Object.values(map).sort((a, b) => (b.active + b.onLeave) - (a.active + a.onLeave));
  }, [employees]);

  // ── Status Breakdown ──
  const statusData = useMemo(() => {
    const active = employees.filter(e => e.status === "active").length;
    const onLeave = employees.filter(e => e.status === "on_leave").length;
    const inactive = employees.filter(e => e.status === "inactive").length;
    return [
      { name: "Active", value: active },
      { name: "On Leave", value: onLeave },
      { name: "Inactive", value: inactive },
    ].filter(d => d.value > 0);
  }, [employees]);

  // ── Hiring Trend (last 12 months) ──
  const hiringTrend = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const d = subMonths(new Date(), 11 - i);
      const monthLabel = format(d, "MMM yy");
      const count = employees.filter(e => {
        if (!e.hire_date) return false;
        try {
          const hd = parseISO(e.hire_date);
          return hd.getMonth() === d.getMonth() && hd.getFullYear() === d.getFullYear();
        } catch { return false; }
      }).length;
      return { month: monthLabel, "New Hires": count };
    });
  }, [employees]);

  // ── Tenure Distribution ──
  const tenureData = useMemo(() => {
    const buckets = { "< 1 yr": 0, "1–2 yrs": 0, "2–5 yrs": 0, "5–10 yrs": 0, "10+ yrs": 0 };
    employees.forEach(e => {
      if (!e.hire_date) return;
      try {
        const months = differenceInMonths(new Date(), parseISO(e.hire_date));
        if (months < 12) buckets["< 1 yr"]++;
        else if (months < 24) buckets["1–2 yrs"]++;
        else if (months < 60) buckets["2–5 yrs"]++;
        else if (months < 120) buckets["5–10 yrs"]++;
        else buckets["10+ yrs"]++;
      } catch { /* skip */ }
    });
    return Object.entries(buckets).map(([name, value]) => ({ name, value }));
  }, [employees]);

  // ── Location Distribution ──
  const locationData = useMemo(() => {
    const map = {};
    employees.forEach(e => {
      const loc = e.location || "Unknown";
      map[loc] = (map[loc] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [employees]);

  // ── Managers vs Individual Contributors ──
  const managerIds = new Set(employees.map(e => e.manager_id).filter(Boolean));
  const managerCount = employees.filter(e => managerIds.has(e.id)).length;
  const icCount = employees.length - managerCount;
  const spanOfControl = managerCount > 0 ? (icCount / managerCount).toFixed(1) : "–";

  // ── Top KPIs ──
  const activeCount = employees.filter(e => e.status === "active").length;
  const withoutManager = employees.filter(e => !e.manager_id && e.status === "active").length;
  const recentHires = employees.filter(e => {
    if (!e.hire_date) return false;
    try { return differenceInMonths(new Date(), parseISO(e.hire_date)) <= 3; } catch { return false; }
  }).length;

  return (
    <div className="space-y-8">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Headcount" value={employees.length} icon={Users} iconBg="bg-blue-100" iconColor="text-blue-600" change={`${activeCount} active`} />
        <StatCard title="New Hires (90 days)" value={recentHires} icon={UserCheck} iconBg="bg-green-100" iconColor="text-green-600" change="Recently joined" />
        <StatCard title="Managers" value={managerCount} icon={Building2} iconBg="bg-purple-100" iconColor="text-purple-600" change={`Avg ${spanOfControl} direct reports`} />
        <StatCard title="No Manager Assigned" value={withoutManager} icon={UserX} iconBg={withoutManager > 0 ? "bg-amber-100" : "bg-slate-100"} iconColor={withoutManager > 0 ? "text-amber-600" : "text-slate-600"} change="Active employees" />
      </div>

      {/* Headcount by Department */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-500" />
            Headcount by Department
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={departmentData} margin={{ left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" />
              <Bar dataKey="active" name="Active" fill="#6366f1" stackId="a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="onLeave" name="On Leave" fill="#f59e0b" stackId="a" />
              <Bar dataKey="inactive" name="Inactive" fill="#e2e8f0" stackId="a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Hiring Trend + Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              Hiring Trend — Last 12 Months
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={hiringTrend} margin={{ left: -10 }}>
                <defs>
                  <linearGradient id="hireGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="New Hires" stroke="#6366f1" strokeWidth={2} fill="url(#hireGrad)" dot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Employment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tenure + Location */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Tenure Distribution (Retention Insight)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={tenureData} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Employees" fill="#10b981" radius={[4, 4, 0, 0]}>
                  {tenureData.map((_, i) => <Cell key={i} fill={COLORS[(i + 1) % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Headcount by Location</CardTitle>
          </CardHeader>
          <CardContent>
            {locationData.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">No location data</div>
            ) : (
              <div className="space-y-3 pt-2">
                {locationData.map(({ name, value }, i) => (
                  <div key={name} className="flex items-center gap-3">
                    <span className="text-sm text-slate-600 w-32 truncate" title={name}>{name}</span>
                    <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full flex items-center pl-2 text-xs text-white font-medium"
                        style={{ width: `${(value / employees.length) * 100}%`, backgroundColor: COLORS[i % COLORS.length], minWidth: "2rem" }}
                      >
                        {value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Manager vs IC breakdown */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Management Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div className="p-6 bg-indigo-50 rounded-xl">
              <p className="text-3xl font-bold text-indigo-700">{managerCount}</p>
              <p className="text-sm text-indigo-600 mt-1">Managers / Team Leads</p>
            </div>
            <div className="p-6 bg-emerald-50 rounded-xl">
              <p className="text-3xl font-bold text-emerald-700">{icCount}</p>
              <p className="text-sm text-emerald-600 mt-1">Individual Contributors</p>
            </div>
            <div className="p-6 bg-amber-50 rounded-xl">
              <p className="text-3xl font-bold text-amber-700">{spanOfControl}</p>
              <p className="text-sm text-amber-600 mt-1">Avg Span of Control</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}