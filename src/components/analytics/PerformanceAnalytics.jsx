import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

export default function PerformanceAnalytics({ performanceReviews, performanceGoals, employees }) {
  // Average ratings
  const completedReviews = performanceReviews.filter(r => r.status === "completed" && r.overall_rating);
  const avgRating = completedReviews.length > 0
    ? (completedReviews.reduce((sum, r) => sum + r.overall_rating, 0) / completedReviews.length).toFixed(2)
    : 0;

  // Rating distribution
  const ratingDist = completedReviews.reduce((acc, review) => {
    const rating = Math.floor(review.overall_rating);
    acc[rating] = (acc[rating] || 0) + 1;
    return acc;
  }, {});

  const ratingChart = [1, 2, 3, 4, 5].map(rating => ({
    rating: `${rating} Star${rating > 1 ? 's' : ''}`,
    count: ratingDist[rating] || 0
  }));

  // Goal status
  const goalStatusData = performanceGoals.reduce((acc, goal) => {
    acc[goal.status] = (acc[goal.status] || 0) + 1;
    return acc;
  }, {});

  const goalStatusChart = Object.entries(goalStatusData).map(([name, value]) => ({
    name: name.replace(/_/g, " ").charAt(0).toUpperCase() + name.slice(1),
    count: value
  }));

  // Average goal progress
  const avgProgress = performanceGoals.length > 0
    ? (performanceGoals.reduce((sum, g) => sum + (g.progress || 0), 0) / performanceGoals.length).toFixed(1)
    : 0;

  // Department performance (average ratings)
  const deptPerformance = employees.reduce((acc, emp) => {
    const empReviews = completedReviews.filter(r => r.employee_id === emp.id);
    if (empReviews.length > 0) {
      const avgRating = empReviews.reduce((sum, r) => sum + r.overall_rating, 0) / empReviews.length;
      if (!acc[emp.department]) {
        acc[emp.department] = { total: 0, count: 0 };
      }
      acc[emp.department].total += avgRating;
      acc[emp.department].count += 1;
    }
    return acc;
  }, {});

  const deptChart = Object.entries(deptPerformance).map(([name, data]) => ({
    department: name,
    avgRating: (data.total / data.count).toFixed(2)
  }));

  // Review types
  const reviewTypes = performanceReviews.reduce((acc, review) => {
    acc[review.review_type] = (acc[review.review_type] || 0) + 1;
    return acc;
  }, {});

  const reviewTypeChart = Object.entries(reviewTypes).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    count: value
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-slate-600">Total Reviews</p>
            <p className="text-3xl font-bold text-indigo-600 mt-2">{performanceReviews.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-slate-600">Avg Rating</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{avgRating}/5</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-slate-600">Total Goals</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">{performanceGoals.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-slate-600">Avg Goal Progress</p>
            <p className="text-3xl font-bold text-amber-600 mt-2">{avgProgress}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Performance Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={ratingChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="rating" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Goal Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={goalStatusChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" />
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
          <CardTitle>Average Performance by Department</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={deptChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="department" />
              <YAxis domain={[0, 5]} />
              <Tooltip />
              <Bar dataKey="avgRating" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Review Types Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={reviewTypeChart}>
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