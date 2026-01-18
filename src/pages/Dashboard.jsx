import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { format, parseISO, isFuture, isPast } from "date-fns";
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
  AlertCircle
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
  Cell
} from "recharts";

const COLORS = ["#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899"];

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [currentEmployee, setCurrentEmployee] = useState(null);

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

  const { data: leads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: () => base44.entities.Lead.list(),
  });

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
  const pipelineValue = leads
    .filter((l) => !["won", "lost"].includes(l.status))
    .reduce((sum, l) => sum + (l.value || 0), 0);
  const onboardingEmployees = employees.filter(e => e.status === "onboarding").length;

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

  const leadStatusData = [
    { name: "New", value: leads.filter((l) => l.status === "new").length },
    { name: "Contacted", value: leads.filter((l) => l.status === "contacted").length },
    { name: "Qualified", value: leads.filter((l) => l.status === "qualified").length },
    { name: "Proposal", value: leads.filter((l) => l.status === "proposal").length },
    { name: "Won", value: leads.filter((l) => l.status === "won").length },
  ].filter((d) => d.value > 0);

  const recentActivities = [
    ...expenses.slice(0, 3).map((e) => ({
      type: "expense",
      title: `Expense: ${e.title}`,
      subtitle: `$${e.amount?.toLocaleString()} - ${e.category?.replace(/_/g, " ")}`,
      status: e.status,
      date: e.created_date,
    })),
    ...tickets.slice(0, 3).map((t) => ({
      type: "ticket",
      title: `Ticket: ${t.title}`,
      subtitle: t.category?.replace(/_/g, " "),
      status: t.status,
      date: t.created_date,
    })),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const isAdmin = user?.role === "admin";
  const isManager = myTeam.length > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
          Welcome back, {user?.full_name || "User"}
        </h1>
        <p className="text-slate-500 mt-1">
          {isAdmin ? "Here's your organization overview" : "Here's your personalized dashboard"}
        </p>
      </div>

      {/* Employee Personal Dashboard */}
      {!isAdmin && currentEmployee && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
              title="Contract Status"
              value={myContract ? myContract.status : "No Contract"}
              icon={Briefcase}
              iconBg="bg-emerald-100"
              iconColor="text-emerald-600"
              change={myContract?.end_date ? `Expires ${format(parseISO(myContract.end_date), "MMM d, yyyy")}` : ""}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">My Time Off Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {myTimeOffRequests.length > 0 ? (
                  <div className="space-y-3">
                    {myTimeOffRequests.slice(0, 5).map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-900 capitalize">
                            {request.type?.replace(/_/g, " ")}
                          </p>
                          <p className="text-sm text-slate-500">
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
                  <div className="space-y-3">
                    {myPendingTasks.slice(0, 5).map((task) => (
                      <div key={task.id} className="flex items-start justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{task.title}</p>
                          <div className="flex items-center gap-2 mt-1">
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
                        onClick={() => window.location.href = '/Performance'}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-slate-900 mb-3">Pending Approvals</h3>
                {pendingApprovals.length > 0 ? (
                  <div className="space-y-2">
                    {pendingApprovals.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <div>
                          <p className="font-medium text-slate-900">{request.employee_name}</p>
                          <p className="text-sm text-slate-500 capitalize">
                            {request.type?.replace(/_/g, " ")} • {request.days_requested} days
                          </p>
                        </div>
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No pending approvals</p>
                )}
              </div>
              <div>
                <h3 className="font-medium text-slate-900 mb-3">Your Team ({myTeam.length})</h3>
                <div className="space-y-2">
                  {myTeam.slice(0, 5).map((emp) => (
                    <div key={emp.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-900">{emp.full_name}</p>
                        <p className="text-sm text-slate-500">{emp.job_title}</p>
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

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Active Employees"
              value={activeEmployees}
              icon={Users}
              iconBg="bg-blue-100"
              iconColor="text-blue-600"
              change={`${onboardingEmployees} onboarding`}
            />
            <StatCard
              title="Pipeline Value"
              value={`$${pipelineValue.toLocaleString()}`}
              icon={TrendingUp}
              iconBg="bg-emerald-100"
              iconColor="text-emerald-600"
              change={`${leads.length} leads`}
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
              title="Open Tickets"
              value={openTickets}
              icon={HeadphonesIcon}
              iconBg="bg-purple-100"
              iconColor="text-purple-600"
              change={`${tickets.length} total`}
            />
          </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Employees by Department</CardTitle>
          </CardHeader>
          <CardContent>
            {departmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
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
            <CardTitle className="text-lg font-semibold">Sales Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            {leadStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={leadStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {leadStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-400">
                No lead data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((activity, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          activity.type === "expense"
                            ? "bg-amber-100 text-amber-600"
                            : "bg-purple-100 text-purple-600"
                        }`}
                      >
                        {activity.type === "expense" ? (
                          <DollarSign className="w-5 h-5" />
                        ) : (
                          <HeadphonesIcon className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-500">{activity.subtitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
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
          <CardContent className="space-y-3">
            <Link
              to={createPageUrl("Employees")}
              className="flex items-center justify-between p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">Add Employee</span>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to={createPageUrl("Expenses")}
              className="flex items-center justify-between p-4 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-amber-600" />
                <span className="font-medium text-amber-900">Submit Expense</span>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-600 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to={createPageUrl("Leads")}
              className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <span className="font-medium text-emerald-900">Add Lead</span>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to={createPageUrl("Support")}
              className="flex items-center justify-between p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <HeadphonesIcon className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-900">Create Ticket</span>
              </div>
              <ArrowRight className="w-4 h-4 text-purple-600 group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardContent>
        </Card>
      </div>
        </>
      )}
    </div>
  );
}