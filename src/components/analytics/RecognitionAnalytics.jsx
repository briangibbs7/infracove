import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { format, parseISO, startOfMonth, eachMonthOfInterval, subMonths } from "date-fns";

export default function RecognitionAnalytics({ recognitions, employeePoints }) {
  // Recognition trend over last 6 months
  const sixMonthsAgo = subMonths(new Date(), 6);
  const months = eachMonthOfInterval({
    start: sixMonthsAgo,
    end: new Date()
  });

  const trendData = months.map(month => {
    const monthStr = format(month, "MMM yyyy");
    const count = recognitions.filter(r => {
      const recDate = parseISO(r.created_date);
      return format(recDate, "MMM yyyy") === monthStr;
    }).length;
    return { month: format(month, "MMM"), count };
  });

  // Recognition by type
  const typeData = recognitions.reduce((acc, rec) => {
    const type = rec.type.replace(/_/g, " ");
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const typeChart = Object.entries(typeData)
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      count: value
    }))
    .sort((a, b) => b.count - a.count);

  // Top recognized employees
  const employeeRecognitions = recognitions.reduce((acc, rec) => {
    acc[rec.recipient_name] = (acc[rec.recipient_name] || 0) + 1;
    return acc;
  }, {});

  const topRecognized = Object.entries(employeeRecognitions)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Average points per recognition
  const totalPoints = recognitions.reduce((sum, r) => sum + (r.points_awarded || 0), 0);
  const avgPoints = recognitions.length > 0 ? (totalPoints / recognitions.length).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-slate-600">Total Recognitions</p>
            <p className="text-3xl font-bold text-indigo-600 mt-2">{recognitions.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-slate-600">Total Points Awarded</p>
            <p className="text-3xl font-bold text-amber-600 mt-2">{totalPoints.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-slate-600">Avg Points/Recognition</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">{avgPoints}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Recognition Trend (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Recognition by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={typeChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Top Recognized Employees</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topRecognized} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={150} />
              <Tooltip />
              <Bar dataKey="count" fill="#ec4899" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}