import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { DollarSign, TrendingUp, Users, Target } from "lucide-react";

export default function DepartmentAnalytics({ myTeam, performanceReviews, payslips }) {
  const teamIds = useMemo(() => myTeam.map(e => e.id), [myTeam]);

  // Compensation metrics
  const teamPayslips = useMemo(() => 
    payslips.filter(p => teamIds.includes(p.employee_id)),
    [payslips, teamIds]
  );

  const compensationMetrics = useMemo(() => {
    if (teamPayslips.length === 0) {
      return {
        totalPayroll: 0,
        avgSalary: 0,
        minSalary: 0,
        maxSalary: 0,
      };
    }

    const grossPays = teamPayslips.map(p => p.gross_pay);
    const total = grossPays.reduce((sum, val) => sum + val, 0);
    const avg = total / grossPays.length;

    return {
      totalPayroll: total,
      avgSalary: avg,
      minSalary: Math.min(...grossPays),
      maxSalary: Math.max(...grossPays),
    };
  }, [teamPayslips]);

  // Compensation by employee (last pay period)
  const compensationByEmployee = useMemo(() => {
    const latestPayslips = {};
    teamPayslips.forEach(p => {
      if (!latestPayslips[p.employee_id] || new Date(p.pay_date) > new Date(latestPayslips[p.employee_id].pay_date)) {
        latestPayslips[p.employee_id] = p;
      }
    });

    return myTeam.map(emp => ({
      name: emp.full_name,
      gross_pay: latestPayslips[emp.id]?.gross_pay || 0,
      employee_id: emp.id,
    })).sort((a, b) => b.gross_pay - a.gross_pay);
  }, [teamPayslips, myTeam]);

  // Performance review metrics
  const teamReviews = useMemo(() =>
    performanceReviews.filter(r => teamIds.includes(r.employee_id)),
    [performanceReviews, teamIds]
  );

  const performanceStats = useMemo(() => {
    if (teamReviews.length === 0) {
      return {
        avgRating: 0,
        completedReviews: 0,
        pendingReviews: 0,
        ratingDistribution: [],
      };
    }

    const completed = teamReviews.filter(r => r.status === "completed");
    const pending = teamReviews.filter(r => r.status !== "completed");
    
    const ratings = completed
      .map(r => r.overall_rating)
      .filter(Boolean);
    
    const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : 0;

    // Rating distribution
    const distribution = [1, 2, 3, 4, 5].map(rating => ({
      rating: `${rating}⭐`,
      count: ratings.filter(r => Math.floor(r) === rating).length,
    }));

    return {
      avgRating,
      completedReviews: completed.length,
      pendingReviews: pending.length,
      ratingDistribution: distribution,
    };
  }, [teamReviews]);

  // Performance trend (by review type)
  const performanceTrend = useMemo(() => {
    const byType = {};
    teamReviews.forEach(r => {
      if (!byType[r.review_type]) {
        byType[r.review_type] = { total: 0, completed: 0 };
      }
      byType[r.review_type].total += 1;
      if (r.status === "completed") {
        byType[r.review_type].completed += 1;
      }
    });

    return Object.entries(byType).map(([type, data]) => ({
      name: type?.replace(/_/g, " ") || "Other",
      total: data.total,
      completed: data.completed,
    }));
  }, [teamReviews]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Department Analytics</h2>
        <p className="text-sm text-muted-foreground mt-1">
          View your team's compensation and performance data
        </p>
      </div>

      {/* Compensation KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Total Team Payroll</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-indigo-600" />
              <span className="text-2xl font-bold">
                ${(compensationMetrics.totalPayroll / 1000).toLocaleString('en-US', { maximumFractionDigits: 0 })}K
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {myTeam.length} team members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Avg Compensation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-bold">
                ${(compensationMetrics.avgSalary || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Per employee
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Avg Performance Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-2xl font-bold">{performanceStats.avgRating}</span>
              <span className="text-lg text-amber-500">/5</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {performanceStats.completedReviews} reviews completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Pending Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-amber-600" />
              <span className="text-2xl font-bold">{performanceStats.pendingReviews}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Awaiting completion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Compensation by Employee */}
      <Card>
        <CardHeader>
          <CardTitle>Team Compensation (Latest)</CardTitle>
        </CardHeader>
        <CardContent>
          {compensationByEmployee.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={compensationByEmployee}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  stroke="#94a3b8"
                  angle={myTeam.length > 5 ? -45 : 0}
                  textAnchor={myTeam.length > 5 ? "end" : "middle"}
                  height={myTeam.length > 5 ? 80 : 40}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="#94a3b8"
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  formatter={(value) => `$${value.toLocaleString()}`}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="gross_pay" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-400">
              No payroll data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {performanceStats.ratingDistribution.some(d => d.count > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={performanceStats.ratingDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="rating" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-400">
                No performance data yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Review Status by Type</CardTitle>
          </CardHeader>
          <CardContent>
            {performanceTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={performanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="completed" fill="#6366f1" name="Completed" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="total" fill="#cbd5e1" name="Total" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-400">
                No review data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Team Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {myTeam.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Title</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myTeam.map((emp) => (
                    <tr key={emp.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-900">{emp.full_name}</td>
                      <td className="py-3 px-4 text-slate-600">{emp.job_title || "N/A"}</td>
                      <td className="py-3 px-4 text-right">
                        <Badge
                          className={
                            emp.status === "active" || !emp.status
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {emp.status || "active"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No team members yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}