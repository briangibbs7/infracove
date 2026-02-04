import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

export default function TrainingAnalytics({ trainingCourses, trainingAssignments, employees }) {
  // Completion rate
  const completed = trainingAssignments.filter(t => t.status === "completed").length;
  const total = trainingAssignments.length;
  const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;

  // Status distribution
  const statusData = trainingAssignments.reduce((acc, assignment) => {
    acc[assignment.status] = (acc[assignment.status] || 0) + 1;
    return acc;
  }, {});

  const statusChart = Object.entries(statusData).map(([name, value]) => ({
    name: name.replace(/_/g, " ").charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  // Training by category
  const categoryData = trainingCourses.reduce((acc, course) => {
    acc[course.category] = (acc[course.category] || 0) + 1;
    return acc;
  }, {});

  const categoryChart = Object.entries(categoryData).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    count: value
  }));

  // Top courses by enrollment
  const courseEnrollments = trainingAssignments.reduce((acc, assignment) => {
    acc[assignment.course_title] = (acc[assignment.course_title] || 0) + 1;
    return acc;
  }, {});

  const topCourses = Object.entries(courseEnrollments)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Employee completion stats
  const employeeStats = employees.map(emp => {
    const empAssignments = trainingAssignments.filter(t => t.employee_id === emp.id);
    const empCompleted = empAssignments.filter(t => t.status === "completed").length;
    return {
      name: emp.full_name,
      completed: empCompleted,
      total: empAssignments.length
    };
  }).filter(e => e.total > 0).sort((a, b) => b.completed - a.completed).slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-slate-600">Total Courses</p>
            <p className="text-3xl font-bold text-indigo-600 mt-2">{trainingCourses.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-slate-600">Total Assignments</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">{total}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-slate-600">Completed</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{completed}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-slate-600">Completion Rate</p>
            <p className="text-3xl font-bold text-emerald-600 mt-2">{completionRate}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Training Status Distribution</CardTitle>
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
            <CardTitle>Courses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryChart}>
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
          <CardTitle>Most Popular Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topCourses} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={200} />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Top Performers (Training Completion)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {employeeStats.map((emp, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-indigo-600">#{idx + 1}</span>
                  </div>
                  <span className="font-medium text-slate-900">{emp.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-600">{emp.completed} / {emp.total} courses</span>
                  <div className="w-32 bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${(emp.completed / emp.total) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}