import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ThumbsUp, MessageSquare, TrendingUp, Tag } from "lucide-react";

export default function FeedbackDashboard({ feedback = [], employeeId }) {
  const stats = useMemo(() => {
    const employeeFeedback = feedback.filter(f => f.recipient_id === employeeId && f.status === "provided");
    
    const positive = employeeFeedback.filter(f => f.type === "positive").length;
    const constructive = employeeFeedback.filter(f => f.type === "constructive").length;
    
    // Feedback by month
    const monthlyData = {};
    employeeFeedback.forEach(f => {
      const month = new Date(f.provided_date || f.created_date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (!monthlyData[month]) {
        monthlyData[month] = { month, positive: 0, constructive: 0 };
      }
      if (f.type === "positive") monthlyData[month].positive++;
      if (f.type === "constructive") monthlyData[month].constructive++;
    });
    
    const monthlyTrend = Object.values(monthlyData).sort((a, b) => 
      new Date(a.month) - new Date(b.month)
    );
    
    // Skills mentioned
    const skillCounts = {};
    employeeFeedback.forEach(f => {
      if (f.related_skill_name) {
        skillCounts[f.related_skill_name] = (skillCounts[f.related_skill_name] || 0) + 1;
      }
    });
    
    const topSkills = Object.entries(skillCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Tag frequency
    const tagCounts = {};
    employeeFeedback.forEach(f => {
      f.tags?.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    const topTags = Object.entries(tagCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
    
    return {
      total: employeeFeedback.length,
      positive,
      constructive,
      monthlyTrend,
      topSkills,
      topTags,
      pieData: [
        { name: "Positive", value: positive, color: "#10b981" },
        { name: "Constructive", value: constructive, color: "#f59e0b" },
      ],
    };
  }, [feedback, employeeId]);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positive Feedback</CardTitle>
            <ThumbsUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.positive}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.positive / stats.total) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Constructive Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.constructive}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.constructive / stats.total) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feedback Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Feedback Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={stats.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="positive" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="constructive" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Feedback Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Feedback Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stats.pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Skills Mentioned */}
        <Card>
          <CardHeader>
            <CardTitle>Most Mentioned Skills</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topSkills.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.topSkills}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No skills tagged yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Tags</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {stats.topTags.map((tag) => (
                  <Badge key={tag.name} variant="secondary" className="text-sm">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag.name} ({tag.value})
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No tags added yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}