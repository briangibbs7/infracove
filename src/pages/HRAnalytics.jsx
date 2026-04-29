import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatCard from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import {
  Users, TrendingUp, AlertCircle, Calendar, CheckCircle2,
  Award, Clock, Target, UserCheck, GraduationCap
} from "lucide-react";
import { format, parseISO, subMonths, isAfter } from "date-fns";
import { getProfileCompleteness, getMissingFields } from "@/components/employees/ProfileCompletenessIndicator";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function HRAnalytics() {
  const { data: employees = [] } = useQuery({ queryKey: ["employees"], queryFn: () => base44.entities.Employee.list() });
  const { data: timeOffRequests = [] } = useQuery({ queryKey: ["timeoff"], queryFn: () => base44.entities.TimeOffRequest.list("-created_date") });
  const { data: performanceReviews = [] } = useQuery({ queryKey: ["performanceReviews"], queryFn: () => base44.entities.PerformanceReview.list() });
  const { data: trainingAssignments = [] } = useQuery({ queryKey: ["trainingAssignments"], queryFn: () => base44.entities.TrainingAssignment.list() });
  const { data: onboardingTasks = [] } = useQuery({ queryKey: ["onboardingTasks"], queryFn: () => base44.entities.OnboardingTask.list() });
  const { data: recognitions = [] } = useQuery({ queryKey: ["recognitions"], queryFn: () => base44.entities.Recognition.list() });

  // ── Data Quality Metrics ──
  const completenessData = useMemo(() => {
    return employees.map(e => ({ name: e.full_name, pct: getProfileCompleteness(e) }))
      .sort((a, b) => a.pct - b.pct);
  }, [employees]);

  const avgCompleteness = useMemo(() => {
    if (!employees.length) return 0;
    return Math.round(completenessData.reduce((s, e) => s + e.pct, 0) / employees.length);
  }, [completenessData, employees]);

  const incompleteProfiles = completenessData.filter(e => e.pct < 80);

  // Duplicate detection: same email
  const emailMap = {};
  employees.forEach(e => {
    if (e.email) {
      emailMap[e.email] = (emailMap[e.email] || 0) + 1;
    }
  });
  const duplicateEmails = Object.entries(emailMap).filter(([, count]) => count > 1);

  // ── Headcount & Turnover ──
  const activeCount = employees.filter(e => e.status === "active").length;
  const onLeaveCount = employees.filter(e => e.status === "on_leave").length;
  const inactiveCount = employees.filter(e => e.status === "inactive").length;

  const statusData = [
    { name: "Active", value: activeCount },
    { name: "On Leave", value: onLeaveCount },
    { name: "Inactive", value: inactiveCount },
  ].filter(d => d.value > 0);

  const departmentData = useMemo(() => {
    const map = {};
    employees.forEach(e => {
      const dept = e.department || "Unknown";
      map[dept] = (map[dept] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [employees]);

  // ── Hiring Trend (new hires by month last 6 months) ──
  const hiringTrend = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), 5 - i);
      return { month: format(d, "MMM"), year: d.getFullYear(), monthNum: d.getMonth(), count: 0 };
    });
    employees.forEach(e => {
      if (!e.hire_date) return;
      const hd = parseISO(e.hire_date);
      const idx = months.findIndex(m => m.monthNum === hd.getMonth() && m.year === hd.getFullYear());
      if (idx !== -1) months[idx].count++;
    });
    return months.map(({ month, count }) => ({ month, count }));
  }, [employees]);

  // ── Time Off ──
  const timeOffByType = useMemo(() => {
    const map = {};
    timeOffRequests.forEach(r => {
      const type = r.type || "other";
      map[type] = (map[type] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));
  }, [timeOffRequests]);

  const pendingTimeOff = timeOffRequests.filter(r => r.status === "pending_approval").length;
  const approvedTimeOff = timeOffRequests.filter(r => r.status === "approved").length;

  // ── Training ──
  const trainingCompletion = useMemo(() => {
    const completed = trainingAssignments.filter(a => a.status === "completed").length;
    const total = trainingAssignments.length;
    return total ? Math.round((completed / total) * 100) : 0;
  }, [trainingAssignments]);

  const overdueTasks = onboardingTasks.filter(t =>
    t.status !== "completed" && t.due_date && !isAfter(parseISO(t.due_date), new Date())
  ).length;

  // ── Performance ──
  const reviewsByStatus = useMemo(() => {
    const map = {};
    performanceReviews.forEach(r => {
      map[r.status] = (map[r.status] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));
  }, [performanceReviews]);

  // ── Recognition ──
  const topRecognized = useMemo(() => {
    const map = {};
    recognitions.forEach(r => {
      if (r.recipient_name) map[r.recipient_name] = (map[r.recipient_name] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }));
  }, [recognitions]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">HR Analytics</h1>
        <p className="text-slate-500 mt-1">Data quality, workforce insights, and operational metrics</p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Employees" value={activeCount} icon={Users} iconBg="bg-blue-100" iconColor="text-blue-600" change={`${onLeaveCount} on leave`} />
        <StatCard title="Avg Profile Completeness" value={`${avgCompleteness}%`} icon={UserCheck} iconBg={avgCompleteness >= 80 ? "bg-green-100" : "bg-amber-100"} iconColor={avgCompleteness >= 80 ? "text-green-600" : "text-amber-600"} change={`${incompleteProfiles.length} incomplete`} />
        <StatCard title="Training Completion" value={`${trainingCompletion}%`} icon={GraduationCap} iconBg="bg-purple-100" iconColor="text-purple-600" change={`${trainingAssignments.length} total`} />
        <StatCard title="Pending Time Off" value={pendingTimeOff} icon={Clock} iconBg="bg-amber-100" iconColor="text-amber-600" change={`${approvedTimeOff} approved`} />
      </div>

      {/* Data Quality Section */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-500" /> Data Quality
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Incomplete Profiles ({incompleteProfiles.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {incompleteProfiles.length === 0 ? (
                <div className="text-center py-8 text-green-600">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2" />
                  <p className="font-medium">All profiles are 80%+ complete!</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {incompleteProfiles.map(e => (
                    <div key={e.name} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-slate-700 truncate">{e.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${e.pct >= 60 ? "bg-amber-400" : "bg-red-400"}`}
                            style={{ width: `${e.pct}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium w-8 text-right ${e.pct >= 60 ? "text-amber-600" : "text-red-500"}`}>{e.pct}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Duplicate Email Detection</CardTitle>
            </CardHeader>
            <CardContent>
              {duplicateEmails.length === 0 ? (
                <div className="text-center py-8 text-green-600">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2" />
                  <p className="font-medium">No duplicate emails detected</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {duplicateEmails.map(([email, count]) => (
                    <div key={email} className="flex items-center justify-between p-2 bg-red-50 rounded-lg border border-red-200">
                      <span className="text-sm text-red-800 truncate">{email}</span>
                      <Badge className="bg-red-100 text-red-700 shrink-0">{count} records</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Workforce Section */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-500" /> Workforce Overview
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-base">Headcount by Status</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Headcount by Department</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={departmentData} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} name="Employees" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Hiring & Time Off */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-500" />New Hires (Last 6 Months)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={hiringTrend} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="New Hires" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-500" />Time Off by Type</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={timeOffByType} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Requests" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance & Recognition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Target className="w-4 h-4 text-purple-500" />Performance Reviews by Status</CardTitle></CardHeader>
          <CardContent>
            {reviewsByStatus.length === 0 ? (
              <div className="py-8 text-center text-slate-400">No performance reviews yet</div>
            ) : (
              <div className="space-y-2">
                {reviewsByStatus.map(({ name, value }) => (
                  <div key={name} className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-700 capitalize truncate">{name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-400 rounded-full"
                          style={{ width: `${(value / performanceReviews.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-600 w-4 text-right">{value}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Award className="w-4 h-4 text-amber-500" />Top Recognized Employees</CardTitle></CardHeader>
          <CardContent>
            {topRecognized.length === 0 ? (
              <div className="py-8 text-center text-slate-400">No recognition data yet</div>
            ) : (
              <div className="space-y-2">
                {topRecognized.map(({ name, count }, i) => (
                  <div key={name} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 w-4">{i + 1}</span>
                    <span className="text-sm text-slate-700 flex-1 truncate">{name}</span>
                    <Badge className="bg-amber-100 text-amber-700">{count} 🏆</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Onboarding Health */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-500" /> Onboarding Health
            {overdueTasks > 0 && (
              <Badge className="bg-red-100 text-red-700 ml-2">{overdueTasks} overdue tasks</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Tasks", value: onboardingTasks.length, color: "text-slate-700" },
              { label: "Completed", value: onboardingTasks.filter(t => t.status === "completed").length, color: "text-green-600" },
              { label: "In Progress", value: onboardingTasks.filter(t => t.status === "in_progress").length, color: "text-blue-600" },
              { label: "Overdue", value: overdueTasks, color: "text-red-600" },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center p-4 bg-slate-50 rounded-xl">
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-slate-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}