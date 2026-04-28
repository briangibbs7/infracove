import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis,
  ReferenceLine, Legend,
} from "recharts";
import {
  DollarSign, TrendingUp, TrendingDown, Users, AlertTriangle,
  BarChart2, ArrowUpRight, ArrowDownRight,
} from "lucide-react";

const DEPT_COLORS = [
  "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899",
  "#f43f5e", "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#06b6d4", "#3b82f6",
];

const fmt = (n) => n >= 1_000_000
  ? `$${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000
    ? `$${(n / 1_000).toFixed(0)}K`
    : `$${n.toLocaleString()}`;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-slate-800 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {typeof p.value === "number" && p.name?.toLowerCase().includes("count") ? p.value : fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function CompensationDashboard() {
  const [deptFilter, setDeptFilter] = useState("all");

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });

  // Only employees with salary data
  const withSalary = useMemo(
    () => employees.filter(e => e.salary && e.salary > 0 && e.status !== "terminated"),
    [employees]
  );

  const departments = useMemo(
    () => [...new Set(withSalary.map(e => e.department).filter(Boolean))].sort(),
    [withSalary]
  );

  const filtered = useMemo(
    () => deptFilter === "all" ? withSalary : withSalary.filter(e => e.department === deptFilter),
    [withSalary, deptFilter]
  );

  // ── Total payroll by department ──────────────────────────────────────────
  const payrollByDept = useMemo(() => {
    const map = {};
    withSalary.forEach(e => {
      const d = e.department || "Unknown";
      if (!map[d]) map[d] = { dept: d, total: 0, count: 0 };
      map[d].total += e.salary;
      map[d].count += 1;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [withSalary]);

  // ── Average salary by job title (top 15) ────────────────────────────────
  const avgByTitle = useMemo(() => {
    const map = {};
    filtered.forEach(e => {
      const t = e.job_title || "Unknown";
      if (!map[t]) map[t] = { title: t, total: 0, count: 0 };
      map[t].total += e.salary;
      map[t].count += 1;
    });
    return Object.values(map)
      .map(v => ({ title: v.title, avg: Math.round(v.total / v.count), count: v.count }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 15);
  }, [filtered]);

  // ── Salary distribution histogram ───────────────────────────────────────
  const histogram = useMemo(() => {
    if (!filtered.length) return [];
    const salaries = filtered.map(e => e.salary);
    const min = Math.floor(Math.min(...salaries) / 10000) * 10000;
    const max = Math.ceil(Math.max(...salaries) / 10000) * 10000;
    const bucketSize = Math.max(10000, Math.ceil((max - min) / 12 / 10000) * 10000);
    const buckets = {};
    for (let s = min; s <= max; s += bucketSize) {
      buckets[s] = { range: `${fmt(s)}–${fmt(s + bucketSize)}`, count: 0, min: s, max: s + bucketSize };
    }
    salaries.forEach(sal => {
      const key = Math.floor((sal - min) / bucketSize) * bucketSize + min;
      if (buckets[key]) buckets[key].count += 1;
    });
    return Object.values(buckets).filter(b => b.count > 0 || b.min <= Math.max(...salaries));
  }, [filtered]);

  // ── Dept vs avg salary scatter ───────────────────────────────────────────
  const deptScatter = useMemo(() =>
    payrollByDept.map(d => ({ dept: d.dept, avg: Math.round(d.total / d.count), count: d.count })),
    [payrollByDept]
  );

  // ── Summary stats ────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!filtered.length) return null;
    const salaries = filtered.map(e => e.salary).sort((a, b) => a - b);
    const total = salaries.reduce((s, v) => s + v, 0);
    const avg = total / salaries.length;
    const median = salaries.length % 2 === 0
      ? (salaries[salaries.length / 2 - 1] + salaries[salaries.length / 2]) / 2
      : salaries[Math.floor(salaries.length / 2)];
    const p25 = salaries[Math.floor(salaries.length * 0.25)];
    const p75 = salaries[Math.floor(salaries.length * 0.75)];
    const outlierHigh = filtered.filter(e => e.salary > avg + 2 * stdDev(salaries, avg));
    const outlierLow = filtered.filter(e => e.salary < avg - 2 * stdDev(salaries, avg));
    return { total, avg, median, p25, p75, count: salaries.length, outlierHigh, outlierLow };
  }, [filtered]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4 text-center">
        <AlertTriangle className="w-14 h-14 text-amber-400" />
        <h2 className="text-2xl font-bold text-slate-800">Admin Access Required</h2>
        <p className="text-slate-500">This page is restricted to administrators only.</p>
      </div>
    );
  }

  if (withSalary.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4 text-center">
        <DollarSign className="w-14 h-14 text-slate-300" />
        <h2 className="text-2xl font-bold text-slate-800">No Salary Data</h2>
        <p className="text-slate-500">Add salary information to employees to see compensation analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold text-slate-900">Compensation Dashboard</h1>
            <Badge className="bg-red-100 text-red-700 border-red-200">Admin Only</Badge>
          </div>
          <p className="text-slate-500">Pay analysis · {withSalary.length} employees with salary data</p>
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Filter by Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Summary KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Total Payroll</p>
              <p className="text-2xl font-bold text-slate-900">{fmt(stats.total)}</p>
              <p className="text-xs text-slate-400 mt-1">{stats.count} employees</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Average Salary</p>
              <p className="text-2xl font-bold text-slate-900">{fmt(Math.round(stats.avg))}</p>
              <p className="text-xs text-slate-400 mt-1">Median: {fmt(Math.round(stats.median))}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Pay Range (P25–P75)</p>
              <p className="text-2xl font-bold text-slate-900">{fmt(stats.p25)}</p>
              <p className="text-xs text-slate-400 mt-1">to {fmt(stats.p75)}</p>
            </CardContent>
          </Card>
          <Card className={`border-0 shadow-sm ${stats.outlierHigh.length + stats.outlierLow.length > 0 ? "bg-amber-50 border-amber-200" : ""}`}>
            <CardContent className="p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Pay Outliers</p>
              <p className="text-2xl font-bold text-slate-900">{stats.outlierHigh.length + stats.outlierLow.length}</p>
              <div className="flex gap-2 mt-1">
                {stats.outlierHigh.length > 0 && (
                  <span className="text-xs text-green-600 flex items-center gap-0.5">
                    <ArrowUpRight className="w-3 h-3" />{stats.outlierHigh.length} high
                  </span>
                )}
                {stats.outlierLow.length > 0 && (
                  <span className="text-xs text-red-600 flex items-center gap-0.5">
                    <ArrowDownRight className="w-3 h-3" />{stats.outlierLow.length} low
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Total Payroll by Department */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-500" />
            Total Payroll by Department
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={payrollByDept} margin={{ left: 20, right: 10, top: 5, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="dept" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} stroke="#94a3b8" />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" name="Total Payroll" radius={[4, 4, 0, 0]}>
                {payrollByDept.map((_, i) => (
                  <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Department table below chart */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="pb-2 font-medium">Department</th>
                  <th className="pb-2 font-medium text-right">Employees</th>
                  <th className="pb-2 font-medium text-right">Total Payroll</th>
                  <th className="pb-2 font-medium text-right">Avg Salary</th>
                </tr>
              </thead>
              <tbody>
                {payrollByDept.map((d, i) => (
                  <tr key={d.dept} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2 flex items-center gap-2">
                      <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: DEPT_COLORS[i % DEPT_COLORS.length] }} />
                      {d.dept}
                    </td>
                    <td className="py-2 text-right text-slate-600">{d.count}</td>
                    <td className="py-2 text-right font-semibold text-slate-800">{fmt(d.total)}</td>
                    <td className="py-2 text-right text-slate-600">{fmt(Math.round(d.total / d.count))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Average Salary by Job Title */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              Average Salary by Job Title
              {deptFilter !== "all" && <Badge variant="outline" className="ml-2 text-xs">{deptFilter}</Badge>}
            </CardTitle>
            <p className="text-xs text-slate-400">Top 15 by salary</p>
          </div>
        </CardHeader>
        <CardContent>
          {avgByTitle.length === 0 ? (
            <div className="text-center py-12 text-slate-400">No salary data for selected filter</div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(300, avgByTitle.length * 36)}>
              <BarChart data={avgByTitle} layout="vertical" margin={{ left: 10, right: 60, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tickFormatter={fmt} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis dataKey="title" type="category" tick={{ fontSize: 11 }} width={160} stroke="#94a3b8" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="avg" name="Avg Salary" radius={[0, 4, 4, 0]}>
                  {avgByTitle.map((entry, i) => {
                    const isHigh = stats && entry.avg > stats.avg * 1.3;
                    const isLow = stats && entry.avg < stats.avg * 0.7;
                    return (
                      <Cell
                        key={i}
                        fill={isHigh ? "#22c55e" : isLow ? "#f43f5e" : "#6366f1"}
                        fillOpacity={0.85}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          {stats && (
            <div className="flex gap-4 mt-3 text-xs text-slate-500 flex-wrap">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-indigo-500 inline-block" /> Normal range</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> &gt;130% of avg</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500 inline-block" /> &lt;70% of avg</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Salary Distribution Histogram */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-500" />
            Salary Distribution
            {deptFilter !== "all" && <Badge variant="outline" className="ml-2 text-xs">{deptFilter}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {histogram.length === 0 ? (
            <div className="text-center py-12 text-slate-400">No data</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={histogram} margin={{ left: 10, right: 10, top: 10, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="range" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} stroke="#94a3b8" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" label={{ value: "# Employees", angle: -90, position: "insideLeft", style: { fontSize: 11 } }} />
                  <Tooltip content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <div className="bg-white border border-slate-200 rounded-lg shadow p-3 text-sm">
                        <p className="font-semibold text-slate-800">{label}</p>
                        <p className="text-indigo-600">{payload[0].value} employees</p>
                      </div>
                    ) : null
                  } />
                  {stats && (
                    <ReferenceLine
                      x={histogram.find(b => stats.avg >= b.min && stats.avg < b.max)?.range}
                      stroke="#f59e0b"
                      strokeDasharray="4 4"
                      label={{ value: "Avg", position: "top", fontSize: 11, fill: "#f59e0b" }}
                    />
                  )}
                  <Bar dataKey="count" name="Employees" fill="#6366f1" radius={[4, 4, 0, 0]} fillOpacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
        </CardContent>
      </Card>

      {/* Outlier Detail Table */}
      {stats && (stats.outlierHigh.length > 0 || stats.outlierLow.length > 0) && (
        <Card className="border-0 shadow-sm border-l-4 border-l-amber-400">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Pay Outliers (±2 Std Dev from Mean)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {stats.outlierHigh.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-1">
                    <ArrowUpRight className="w-4 h-4" /> High Outliers ({stats.outlierHigh.length})
                  </p>
                  <div className="space-y-2">
                    {stats.outlierHigh.sort((a, b) => b.salary - a.salary).map(e => (
                      <div key={e.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{e.full_name}</p>
                          <p className="text-xs text-slate-500">{e.job_title} · {e.department}</p>
                        </div>
                        <span className="font-bold text-green-700 text-sm">{fmt(e.salary)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {stats.outlierLow.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1">
                    <ArrowDownRight className="w-4 h-4" /> Low Outliers ({stats.outlierLow.length})
                  </p>
                  <div className="space-y-2">
                    {stats.outlierLow.sort((a, b) => a.salary - b.salary).map(e => (
                      <div key={e.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{e.full_name}</p>
                          <p className="text-xs text-slate-500">{e.job_title} · {e.department}</p>
                        </div>
                        <span className="font-bold text-red-700 text-sm">{fmt(e.salary)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function stdDev(arr, mean) {
  const variance = arr.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / arr.length;
  return Math.sqrt(variance);
}