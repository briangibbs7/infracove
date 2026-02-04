import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { format, parseISO, startOfMonth, eachMonthOfInterval, subMonths } from "date-fns";

const COLORS = ["#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899"];

export default function TimeOffAnalytics({ timeOffRequests, employees }) {
  // Status breakdown
  const statusData = timeOffRequests.reduce((acc, request) => {
    acc[request.status] = (acc[request.status] || 0) + 1;
    return acc;
  }, {});

  const statusChart = Object.entries(statusData).map(([name, value]) => ({
    name: name.replace(/_/g, " ").charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  // By type
  const typeData = timeOffRequests.reduce((acc, request) => {
    acc[request.type] = (acc[request.type] || 0) + 1;
    return acc;
  }, {});

  const typeChart = Object.entries(typeData).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    count: value
  }));

  // Trend over last 6 months
  const sixMonthsAgo = subMonths(new Date(), 6);
  const months = eachMonthOfInterval({
    start: sixMonthsAgo,
    end: new Date()
  });

  const trendData = months.map(month => {
    const monthStr = format(month, "MMM yyyy");
    const count = timeOffRequests.filter(r => {
      if (!r.start_date) return false;
      const reqDate = parseISO(r.start_date);
      return format(reqDate, "MMM yyyy") === monthStr;
    }).length;
    return { month: format(month, "MMM"), count };
  });

  // Department breakdown
  const deptData = employees.reduce((acc, emp) => {
    const empRequests = timeOffRequests.filter(r => r.employee_id === emp.id);
    if (empRequests.length > 0) {
      acc[emp.department] = (acc[emp.department] || 0) + empRequests.length;
    }
    return acc;
  }, {});

  const deptChart = Object.entries(deptData).map(([name, count]) => ({ name, count }));

  // Total days requested
  const totalDays = timeOffRequests.reduce((sum, r) => sum + (r.days_requested || 0), 0);
  const approved = timeOffRequests.filter(r => r.status === "approved").length;
  const pending = timeOffRequests.filter(r => r.status === "pending_approval").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-slate-600">Total Requests</p>
            <p className="text-3xl font-bold text-indigo-600 mt-2">{timeOffRequests.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-slate-600">Approved</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{approved}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-slate-600">Pending</p>
            <p className="text-3xl font-bold text-amber-600 mt-2">{pending}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-slate-600">Total Days</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">{totalDays}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Request Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusChart}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Time Off by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={typeChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Request Trend (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Requests by Department</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={deptChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#ec4899" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}