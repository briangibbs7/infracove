import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import RecognitionFeed from "@/components/recognition/RecognitionFeed";
import GiveRecognitionDialog from "@/components/recognition/GiveRecognitionDialog";
import EmployeeProfileModal from "@/components/employees/EmployeeProfileModal";
import EquityDashboardWidget from "@/components/equity/EquityDashboardWidget";
import { format, parseISO, isFuture, isPast } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  DollarSign,
  TrendingUp,
  FileText,
  Package,
  HeadphonesIcon,
  ArrowRight,
  Clock,
  Calendar,
  CheckCircle2,
  Briefcase,
  AlertCircle,
  ShieldCheck,
  GraduationCap,
  Target,
  Award,
  Trophy
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899"];

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [isGiveRecognitionOpen, setIsGiveRecognitionOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: timeOffRequests = [] } = useQuery({
    queryKey: ["timeoff"],
    queryFn: () => base44.entities.TimeOffRequest.list("-created_date"),
  });

  const { data: onboardingTasks = [] } = useQuery({
    queryKey: ["onboardingTasks"],
    queryFn: () => base44.entities.OnboardingTask.list(),
  });

  const { data: hrContracts = [] } = useQuery({
    queryKey: ["hrContracts"],
    queryFn: () => base44.entities.Contract.filter({ type: "employment" }),
  });

  const { data: performanceReviews = [] } = useQuery({
    queryKey: ["performanceReviews"],
    queryFn: () => base44.entities.PerformanceReview.list(),
  });

  useEffect(() => {
    if (user && employees.length > 0) {
      const emp = employees.find(e => e.email === user.email);
      setCurrentEmployee(emp);
    }
  }, [user, employees]);

  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => base44.entities.Expense.list(),
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ["contracts"],
    queryFn: () => base44.entities.Contract.list(),
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ["tickets"],
    queryFn: () => base44.entities.SupportTicket.list(),
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => base44.entities.Invoice.list(),
  });

  const { data: ndas = [] } = useQuery({
    queryKey: ["ndas"],
    queryFn: () => base44.entities.Contract.filter({ type: "nda" }),
  });

  const { data: assets = [] } = useQuery({
    queryKey: ["assets"],
    queryFn: () => base44.entities.Asset.list(),
  });

  const { data: trainingAssignments = [] } = useQuery({
    queryKey: ["trainingAssignments"],
    queryFn: () => base44.entities.TrainingAssignment.list(),
  });

  const { data: recognitions = [] } = useQuery({
    queryKey: ["recognitions"],
    queryFn: () => base44.entities.Recognition.list("-created_date"),
  });

  const { data: employeePoints = [] } = useQuery({
    queryKey: ["employeePoints"],
    queryFn: () => base44.entities.EmployeePoints.list(),
  });

  // Personal data for employee
  const myTimeOffRequests = currentEmployee 
    ? timeOffRequests.filter(r => r.employee_id === currentEmployee.id)
    : [];
  const myUpcomingTimeOff = myTimeOffRequests.filter(r => 
    r.status === "approved" && r.start_date && isFuture(parseISO(r.start_date))
  );
  const myPendingTimeOff = myTimeOffRequests.filter(r => r.status === "pending_approval");
  
  const myTasks = currentEmployee
    ? onboardingTasks.filter(t => t.assigned_to === currentEmployee.id || t.employee_id === currentEmployee.id)
    : [];
  const myPendingTasks = myTasks.filter(t => t.status !== "completed");

  const myContract = currentEmployee
    ? hrContracts.find(c => c.party_name === currentEmployee.full_name || c.title?.includes(currentEmployee.full_name))
    : null;

  const myPendingReviews = currentEmployee
    ? performanceReviews.filter(r => 
        r.employee_id === currentEmployee.id && 
        r.status === "pending_self_assessment"
      )
    : [];

  // Manager-specific data
  const myTeam = currentEmployee
    ? employees.filter(e => e.manager_id === currentEmployee.id)
    : [];
  const teamTimeOffRequests = timeOffRequests.filter(r => r.manager_id === currentEmployee?.id);
  const pendingApprovals = teamTimeOffRequests.filter(r => r.status === "pending_approval");

  // Admin/HR data
  const activeEmployees = employees.filter((e) => e.status === "active").length;
  const pendingExpenses = expenses.filter((e) => e.status === "pending");
  const totalExpenseAmount = pendingExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const openTickets = tickets.filter((t) => t.status === "open" || t.status === "in_progress").length;
  const onboardingEmployees = employees.filter(e => e.status === "onboarding").length;
  
  // Enhanced metrics
  const overdueInvoices = invoices.filter(inv => 
    inv.status === "pending" && inv.due_date && isPast(parseISO(inv.due_date))
  );
  const totalOverdueAmount = overdueInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  
  const activeNDAs = ndas.filter(n => n.status === "active").length;
  const pendingSignatureNDAs = ndas.filter(n => n.status === "pending_signature").length;
  const expiringNDAs = ndas.filter(n => {
    if (n.status === "active" && n.end_date) {
      const daysUntil = Math.ceil((new Date(n.end_date) - new Date()) / (1000 * 60 * 60 * 24));
      return daysUntil <= 30 && daysUntil >= 0;
    }
    return false;
  }).length;

  const assignedAssets = assets.filter(a => a.status === "assigned").length;
  const availableAssets = assets.filter(a => a.status === "available").length;
  const totalApprovedExpenses = expenses.filter(e => e.status === "approved").reduce((sum, e) => sum + (e.amount || 0), 0);
  
  const myTraining = currentEmployee 
    ? trainingAssignments.filter(t => t.employee_id === currentEmployee.id && t.status !== "completed")
    : [];
  
  const completedTraining = currentEmployee
    ? trainingAssignments.filter(t => t.employee_id === currentEmployee.id && t.status === "completed").length
    : 0;

  const myPoints = currentEmployee
    ? employeePoints.find(ep => ep.employee_id === currentEmployee.id)
    : null;

  const myRecognitions = currentEmployee
    ? recognitions.filter(r => r.recipient_id === currentEmployee.id)
    : [];

  const recentRecognitions = recognitions.filter(r => r.is_public).slice(0, 5);

  const departmentData = employees.reduce((acc, emp) => {
    const dept = emp.department || "Other";
    const existing = acc.find((d) => d.name === dept);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: dept, value: 1 });
    }
    return acc;
  }, []);

  const expenseStatusData = [
    { name: "Pending", value: expenses.filter((e) => e.status === "pending").length },
    { name: "Approved", value: expenses.filter((e) => e.status === "approved").length },
    { name: "Rejected", value: expenses.filter((e) => e.status === "rejected").length },
  ].filter((d) => d.value > 0);

  const recentActivities = [
    ...expenses.slice(0, 3).map((e) => ({
      type: "expense",
      title: `Expense: ${e.title}`,
      subtitle: `$${e.amount?.toLocaleString()} - ${e.category?.replace(/_/g, " ")}`,
      status: e.status,
      date: e.created_date,
    })),
    ...timeOffRequests.slice(0, 3).map((t) => ({
      type: "timeoff",
      title: `Time Off: ${t.employee_name}`,
      subtitle: `${t.type?.replace(/_/g, " ")} - ${t.days_requested} days`,
      status: t.status,
      date: t.created_date,
    })),
    ...ndas.slice(0, 2).map((n) => ({
      type: "nda",
      title: `NDA: ${n.title}`,
      subtitle: n.party_name,
      status: n.status,
      date: n.created_date,
    })),
    ...onboardingTasks.slice(0, 2).map((t) => ({
      type: "task",
      title: `Task: ${t.title}`,
      subtitle: t.employee_name || "Onboarding",
      status: t.status,
      date: t.created_date,
    })),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8);

  const isAdmin = user?.role === "admin";
  const isManager = myTeam.length > 0;

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-900">
          Welcome back, {user?.full_name || "User"}
        </h1>
        <p className="text-sm md:text-base text-slate-500 mt-1">
          {isAdmin ? "Here's your organization overview" : "Here's your personalized dashboard"}
        </p>
      </div>

      {/* Employee Personal Dashboard */}
      {!isAdmin && currentEmployee && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatCard
              title="Upcoming Time Off"
              value={myUpcomingTimeOff.length}
              icon={Calendar}
              iconBg="bg-blue-100"
              iconColor="text-blue-600"
              change={`${myPendingTimeOff.length} pending approval`}
            />
            <StatCard
              title="My Tasks"
              value={myPendingTasks.length}
              icon={CheckCircle2}
              iconBg="bg-indigo-100"
              iconColor="text-indigo-600"
              change={`${myTasks.filter(t => t.status === "completed").length} completed`}
            />
            <StatCard
              title="Training Progress"
              value={myTraining.length}
              icon={GraduationCap}
              iconBg="bg-purple-100"
              iconColor="text-purple-600"
              change={`${completedTraining} completed`}
            />
            <StatCard
              title="My Points"
              value={myPoints?.total_points || 0}
              icon={Trophy}
              iconBg="bg-amber-100"
              iconColor="text-amber-600"
              change={`Rank: ${myPoints?.rank || "bronze"}`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">My Time Off Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {myTimeOffRequests.length > 0 ? (
                  <div className="space-y-2 md:space-y-3">
                    {myTimeOffRequests.slice(0, 5).map((request) => (
                      <div key={request.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-slate-900 text-sm md:text-base capitalize">
                            {request.type?.replace(/_/g, " ")}
                          </p>
                          <p className="text-xs md:text-sm text-slate-500">
                            {request.start_date && format(parseISO(request.start_date), "MMM d")} - {request.end_date && format(parseISO(request.end_date), "MMM d")}
                          </p>
                        </div>
                        <StatusBadge status={request.status} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400">
                    <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>No time off requests</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">My Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                {myPendingTasks.length > 0 ? (
                  <div className="space-y-2 md:space-y-3">
                    {myPendingTasks.slice(0, 5).map((task) => (
                      <div key={task.id} className="flex flex-col sm:flex-row items-start justify-between gap-2 p-3 bg-slate-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 text-sm md:text-base">{task.title}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <StatusBadge status={task.priority} />
                            {task.due_date && (
                              <span className={`text-xs ${isPast(parseISO(task.due_date)) ? "text-red-600" : "text-slate-500"}`}>
                                Due: {format(parseISO(task.due_date), "MMM d")}
                              </span>
                            )}
                          </div>
                        </div>
                        <StatusBadge status={task.status} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>No pending tasks</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EquityDashboardWidget user={user} />

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Recent Recognition</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { window.location.href = createPageUrl("Recognition"); }}
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <RecognitionFeed
                  recognitions={recentRecognitions}
                  currentUser={user}
                  employees={employees}
                />
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">My Recognitions</CardTitle>
            </CardHeader>
            <CardContent>
              {myRecognitions.length > 0 ? (
                <div className="space-y-3">
                  {myRecognitions.slice(0, 3).map((rec) => (
                    <div key={rec.id} className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-semibold text-slate-900">{rec.title}</p>
                        <Badge className="bg-amber-100 text-amber-700">
                          +{rec.points_awarded} pts
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-700 mb-2">{rec.message}</p>
                      <p className="text-xs text-slate-500">
                        From {rec.giver_name} • {format(parseISO(rec.created_date), "MMM d")}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400">
                  <Award className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recognitions yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {myPendingReviews.length > 0 && (
            <Card className="border-0 shadow-sm border-amber-200 bg-amber-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <CardTitle className="text-lg font-semibold text-amber-900">Pending Performance Reviews</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {myPendingReviews.map((review) => (
                    <div key={review.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div>
                        <p className="font-medium text-slate-900">{review.review_period}</p>
                        <p className="text-sm text-slate-500 capitalize">{review.review_type} Review</p>
                      </div>
                      <Button
                        size="sm"
                        className="bg-amber-600 hover:bg-amber-700"
                        onClick={() => { window.location.href = createPageUrl("Performance"); }}
                      >
                        Complete Now
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Manager View */}
      {isManager && !isAdmin && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Team Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <h3 className="font-medium text-slate-900 mb-3 text-sm md:text-base">Pending Approvals</h3>
                {pendingApprovals.length > 0 ? (
                  <div className="space-y-2">
                    {pendingApprovals.map((request) => (
                      <div key={request.id} className="flex items-start sm:items-center justify-between gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 text-sm md:text-base truncate">{request.employee_name}</p>
                          <p className="text-xs md:text-sm text-slate-500 capitalize">
                            {request.type?.replace(/_/g, " ")} • {request.days_requested} days
                          </p>
                        </div>
                        <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-amber-600 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs md:text-sm text-slate-500">No pending approvals</p>
                )}
              </div>
              <div>
                <h3 className="font-medium text-slate-900 mb-3 text-sm md:text-base">Your Team ({myTeam.length})</h3>
                <div className="space-y-2">
                  {myTeam.slice(0, 5).map((emp) => (
                    <div
                      key={emp.id}
                      onClick={() => {
                        setSelectedEmployee(emp);
                        setIsProfileModalOpen(true);
                      }}
                      className="flex items-start sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 text-sm md:text-base truncate">{emp.full_name}</p>
                        <p className="text-xs md:text-sm text-slate-500 truncate">{emp.job_title}</p>
                      </div>
                      <StatusBadge status={emp.status} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin/HR View */}
      {isAdmin && (
        <>
          {/* Top Skills Across Organization */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Top Skills in Organization</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const skillCounts = {};
                employees.forEach(emp => {
                  emp.skills?.forEach(skill => {
                    skillCounts[skill] = (skillCounts[skill] || 0) + 1;
                  });
                });
                const topSkills = Object.entries(skillCounts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 10);

                return topSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {topSkills.map(([skill, count]) => (
                      <Badge key={skill} className="bg-indigo-100 text-indigo-700">
                        {skill} ({count})
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No skills data available</p>
                );
              })()}
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatCard
              title="Active Employees"
              value={activeEmployees}
              icon={Users}
              iconBg="bg-blue-100"
              iconColor="text-blue-600"
              change={`${onboardingEmployees} onboarding`}
            />
            <StatCard
              title="Pending Expenses"
              value={`$${totalExpenseAmount.toLocaleString()}`}
              icon={DollarSign}
              iconBg="bg-amber-100"
              iconColor="text-amber-600"
              change={`${pendingExpenses.length} requests`}
            />
            <StatCard
              title="Overdue Invoices"
              value={`$${totalOverdueAmount.toLocaleString()}`}
              icon={AlertCircle}
              iconBg="bg-red-100"
              iconColor="text-red-600"
              change={`${overdueInvoices.length} invoices`}
            />
            <StatCard
              title="IT Assets"
              value={assignedAssets}
              icon={Package}
              iconBg="bg-cyan-100"
              iconColor="text-cyan-600"
              change={`${availableAssets} available`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <StatCard
              title="Active NDAs"
              value={activeNDAs}
              icon={ShieldCheck}
              iconBg="bg-indigo-100"
              iconColor="text-indigo-600"
              change={pendingSignatureNDAs > 0 ? `${pendingSignatureNDAs} pending signature` : `${expiringNDAs} expiring soon`}
            />
            <StatCard
              title="Pending Approvals"
              value={pendingApprovals.length}
              icon={Clock}
              iconBg="bg-amber-100"
              iconColor="text-amber-600"
              change="Time off requests"
            />
            <StatCard
              title="Onboarding Tasks"
              value={onboardingTasks.filter(t => t.status === "pending" || t.status === "in_progress").length}
              icon={Target}
              iconBg="bg-purple-100"
              iconColor="text-purple-600"
              change={`${onboardingEmployees} new hires`}
            />
          </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Employees by Department</CardTitle>
          </CardHeader>
          <CardContent>
            {departmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200} className="md:!h-[250px]">
                <BarChart data={departmentData}>
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
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-400">
                No employee data yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Expense Status</CardTitle>
          </CardHeader>
          <CardContent>
            {expenseStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200} className="md:!h-[250px]">
                <PieChart>
                  <Pie
                    data={expenseStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {expenseStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-400">
                No expense data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivities.length > 0 ? (
              <div className="space-y-3 md:space-y-4">
                {recentActivities.map((activity, i) => (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 md:p-4 bg-slate-50 rounded-xl"
                  >
                    <div className="flex items-start sm:items-center gap-3 md:gap-4 flex-1 min-w-0">
                      <div
                        className={`w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          activity.type === "expense" ? "bg-amber-100 text-amber-600" :
                          activity.type === "timeoff" ? "bg-blue-100 text-blue-600" :
                          activity.type === "nda" ? "bg-indigo-100 text-indigo-600" :
                          activity.type === "task" ? "bg-purple-100 text-purple-600" :
                          "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {activity.type === "expense" ? <DollarSign className="w-4 h-4 md:w-5 md:h-5" /> :
                         activity.type === "timeoff" ? <Calendar className="w-4 h-4 md:w-5 md:h-5" /> :
                         activity.type === "nda" ? <ShieldCheck className="w-4 h-4 md:w-5 md:h-5" /> :
                         activity.type === "task" ? <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" /> :
                         <FileText className="w-4 h-4 md:w-5 md:h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 text-sm md:text-base truncate">{activity.title}</p>
                        <p className="text-xs md:text-sm text-slate-500 truncate">{activity.subtitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 self-end sm:self-auto">
                      <StatusBadge status={activity.status} />
                      <span className="text-xs text-slate-400">
                        {activity.date && format(new Date(activity.date), "MMM d")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 md:space-y-3">
            <Link
              to={createPageUrl("Employees")}
              className="flex items-center justify-between p-3 md:p-4 bg-blue-50 rounded-xl hover:bg-blue-100 active:bg-blue-200 transition-colors group"
            >
              <div className="flex items-center gap-2 md:gap-3">
                <Users className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                <span className="font-medium text-blue-900 text-sm md:text-base">Add Employee</span>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to={createPageUrl("Expenses")}
              className="flex items-center justify-between p-3 md:p-4 bg-amber-50 rounded-xl hover:bg-amber-100 active:bg-amber-200 transition-colors group"
            >
              <div className="flex items-center gap-2 md:gap-3">
                <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />
                <span className="font-medium text-amber-900 text-sm md:text-base">Submit Expense</span>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-600 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to={createPageUrl("TimeOff")}
              className="flex items-center justify-between p-3 md:p-4 bg-blue-50 rounded-xl hover:bg-blue-100 active:bg-blue-200 transition-colors group"
            >
              <div className="flex items-center gap-2 md:gap-3">
                <Calendar className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                <span className="font-medium text-blue-900 text-sm md:text-base">Request Time Off</span>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to={createPageUrl("Payroll")}
              className="flex items-center justify-between p-3 md:p-4 bg-cyan-50 rounded-xl hover:bg-cyan-100 active:bg-cyan-200 transition-colors group"
            >
              <div className="flex items-center gap-2 md:gap-3">
                <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-cyan-600" />
                <span className="font-medium text-cyan-900 text-sm md:text-base">Run Payroll</span>
              </div>
              <ArrowRight className="w-4 h-4 text-cyan-600 group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardContent>
        </Card>
      </div>
        </>
      )}

      <EmployeeProfileModal
        employee={selectedEmployee}
        open={isProfileModalOpen}
        onOpenChange={setIsProfileModalOpen}
      />
    </div>
  );
}