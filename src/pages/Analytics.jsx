import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from "@/components/ui/PageHeader";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  TrendingUp,
  Users,
  Award,
  GraduationCap,
  Download,
  Filter,
  BarChart3
} from "lucide-react";
import { format, differenceInMonths } from "date-fns";

const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"];

export default function Analytics() {
  const [user, setUser] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [dateRange, setDateRange] = useState("all");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: skills = [] } = useQuery({
    queryKey: ["skills"],
    queryFn: () => base44.entities.SkillEndorsement.list(),
  });

  const { data: trainingAssignments = [] } = useQuery({
    queryKey: ["trainingAssignments"],
    queryFn: () => base44.entities.TrainingAssignment.list(),
  });

  const { data: performanceReviews = [] } = useQuery({
    queryKey: ["performanceReviews"],
    queryFn: () => base44.entities.PerformanceReview.list(),
  });

  const { data: developmentRequests = [] } = useQuery({
    queryKey: ["developmentRequests"],
    queryFn: () => base44.entities.SkillDevelopmentRequest.list(),
  });

  const { data: timeOffRequests = [] } = useQuery({
    queryKey: ["timeOffRequests"],
    queryFn: () => base44.entities.TimeOffRequest.list(),
  });

  // Filter employees by department
  const filteredEmployees = selectedDepartment === "all" 
    ? employees 
    : employees.filter(e => e.department === selectedDepartment);

  // Department Distribution
  const departmentData = Object.entries(
    employees.reduce((acc, emp) => {
      acc[emp.department] = (acc[emp.department] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  // Employee Status Distribution
  const statusData = Object.entries(
    employees.reduce((acc, emp) => {
      acc[emp.status] = (acc[emp.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ 
    name: name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()), 
    value 
  }));

  // Tenure Distribution
  const tenureData = employees.map(emp => {
    if (!emp.start_date) return null;
    const months = differenceInMonths(new Date(), new Date(emp.start_date));
    const years = Math.floor(months / 12);
    return { name: emp.full_name, tenure: years, department: emp.department };
  }).filter(Boolean);

  const tenureBuckets = tenureData.reduce((acc, emp) => {
    if (emp.tenure < 1) acc["< 1 year"] = (acc["< 1 year"] || 0) + 1;
    else if (emp.tenure < 3) acc["1-3 years"] = (acc["1-3 years"] || 0) + 1;
    else if (emp.tenure < 5) acc["3-5 years"] = (acc["3-5 years"] || 0) + 1;
    else acc["5+ years"] = (acc["5+ years"] || 0) + 1;
    return acc;
  }, {});

  const tenureChartData = Object.entries(tenureBuckets).map(([name, value]) => ({ name, value }));

  // Skills Inventory
  const skillCategories = Object.entries(
    skills.reduce((acc, skill) => {
      acc[skill.category] = (acc[skill.category] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ 
    name: name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()), 
    value 
  }));

  // Top Skills
  const topSkills = Object.entries(
    skills.reduce((acc, skill) => {
      acc[skill.skill_name] = (acc[skill.skill_name] || 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  // Training Completion Rates
  const trainingByStatus = Object.entries(
    trainingAssignments.reduce((acc, assignment) => {
      acc[assignment.status] = (acc[assignment.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ 
    name: name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()), 
    value 
  }));

  const trainingCompletionRate = trainingAssignments.length > 0
    ? ((trainingAssignments.filter(a => a.status === "completed").length / trainingAssignments.length) * 100).toFixed(1)
    : 0;

  // Performance Review Trends
  const reviewsByRating = performanceReviews
    .filter(r => r.overall_rating)
    .reduce((acc, review) => {
      const rating = review.overall_rating;
      acc[rating] = (acc[rating] || 0) + 1;
      return acc;
    }, {});

  const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
    rating: `${rating} Star`,
    count: reviewsByRating[rating] || 0,
  }));

  const averageRating = performanceReviews.length > 0
    ? (performanceReviews.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / performanceReviews.filter(r => r.overall_rating).length).toFixed(2)
    : "N/A";

  // Skill Development Progress
  const developmentByStatus = Object.entries(
    developmentRequests.reduce((acc, req) => {
      acc[req.status] = (acc[req.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ 
    name: name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()), 
    value 
  }));

  // Time Off Trends
  const timeOffByType = Object.entries(
    timeOffRequests.reduce((acc, req) => {
      acc[req.type] = (acc[req.type] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ 
    name: name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()), 
    value 
  }));

  // Department Skills Radar
  const departmentSkills = filteredEmployees.map(emp => {
    const empSkills = skills.filter(s => s.employee_id === emp.id);
    return {
      department: emp.department,
      skillCount: empSkills.length,
      avgRating: empSkills.length > 0 
        ? empSkills.reduce((sum, s) => sum + s.self_rating, 0) / empSkills.length 
        : 0,
    };
  });

  const departmentSkillsAvg = Object.entries(
    departmentSkills.reduce((acc, { department, skillCount, avgRating }) => {
      if (!acc[department]) acc[department] = { count: 0, total: 0, ratingTotal: 0 };
      acc[department].count++;
      acc[department].total += skillCount;
      acc[department].ratingTotal += avgRating;
      return acc;
    }, {})
  ).map(([name, data]) => ({
    department: name,
    avgSkills: (data.total / data.count).toFixed(1),
    avgRating: (data.ratingTotal / data.count).toFixed(1),
  }));

  const handleExportReport = () => {
    const report = {
      generated_at: new Date().toISOString(),
      department_filter: selectedDepartment,
      summary: {
        total_employees: filteredEmployees.length,
        total_skills: skills.length,
        training_completion_rate: trainingCompletionRate,
        average_performance_rating: averageRating,
      },
      department_distribution: departmentData,
      skills_inventory: skillCategories,
      training_status: trainingByStatus,
      performance_ratings: ratingDistribution,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hr-analytics-report-${format(new Date(), "yyyy-MM-dd")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isAdmin = user?.role === "admin";
  const canView = isAdmin || filteredEmployees.some(e => e.email === user?.email && e.department === "HR");

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Access Restricted</h2>
          <p className="text-slate-600">Analytics dashboard is only available to HR and Admins.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="HR Analytics Dashboard"
        subtitle="Insights into workforce metrics and trends"
      >
        <div className="flex items-center gap-3">
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="HR">HR</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
              <SelectItem value="Sales">Sales</SelectItem>
              <SelectItem value="Legal">Legal</SelectItem>
              <SelectItem value="IT">IT</SelectItem>
              <SelectItem value="Marketing">Marketing</SelectItem>
              <SelectItem value="Operations">Operations</SelectItem>
              <SelectItem value="Executive">Executive</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportReport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </PageHeader>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Total Employees</p>
                <p className="text-3xl font-bold text-indigo-600">{filteredEmployees.length}</p>
              </div>
              <Users className="w-12 h-12 text-indigo-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Skills Tracked</p>
                <p className="text-3xl font-bold text-emerald-600">{skills.length}</p>
              </div>
              <Award className="w-12 h-12 text-emerald-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Training Completion</p>
                <p className="text-3xl font-bold text-amber-600">{trainingCompletionRate}%</p>
              </div>
              <GraduationCap className="w-12 h-12 text-amber-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Avg Performance</p>
                <p className="text-3xl font-bold text-purple-600">{averageRating}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different analytics views */}
      <Tabs defaultValue="workforce" className="w-full">
        <TabsList>
          <TabsTrigger value="workforce">Workforce</TabsTrigger>
          <TabsTrigger value="skills">Skills & Training</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="development">Development</TabsTrigger>
        </TabsList>

        {/* Workforce Tab */}
        <TabsContent value="workforce" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Department Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={departmentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {departmentData.map((entry, index) => (
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
                <CardTitle>Employee Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#4F46E5" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Tenure Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={tenureChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Time Off Requests by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={timeOffByType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {timeOffByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Skills & Training Tab */}
        <TabsContent value="skills" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Skills by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={skillCategories}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Top 10 Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topSkills} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#EC4899" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Training Completion Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={trainingByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {trainingByStatus.map((entry, index) => (
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
                <CardTitle>Department Skills Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={departmentSkillsAvg}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="department" />
                    <PolarRadiusAxis />
                    <Radar name="Avg Skills" dataKey="avgSkills" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.6} />
                    <Tooltip />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Performance Rating Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ratingDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="rating" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#F59E0B" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-500">Total Reviews</p>
                    <p className="text-2xl font-bold text-slate-900">{performanceReviews.length}</p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-lg">
                    <p className="text-sm text-emerald-600">Average Rating</p>
                    <p className="text-2xl font-bold text-emerald-700">{averageRating} / 5</p>
                  </div>
                  <div className="p-4 bg-indigo-50 rounded-lg">
                    <p className="text-sm text-indigo-600">Completed Reviews</p>
                    <p className="text-2xl font-bold text-indigo-700">
                      {performanceReviews.filter(r => r.status === "completed").length}
                    </p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-lg">
                    <p className="text-sm text-amber-600">Pending Reviews</p>
                    <p className="text-2xl font-bold text-amber-700">
                      {performanceReviews.filter(r => r.status !== "completed").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Development Tab */}
        <TabsContent value="development" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Development Request Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={developmentByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {developmentByStatus.map((entry, index) => (
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
                <CardTitle>Development Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-500">Total Requests</p>
                    <p className="text-2xl font-bold text-slate-900">{developmentRequests.length}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600">Pending Approval</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {developmentRequests.filter(r => r.status === "pending").length}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-600">In Progress</p>
                    <p className="text-2xl font-bold text-purple-700">
                      {developmentRequests.filter(r => r.status === "in_progress").length}
                    </p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-lg">
                    <p className="text-sm text-emerald-600">Completed</p>
                    <p className="text-2xl font-bold text-emerald-700">
                      {developmentRequests.filter(r => r.status === "completed").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}