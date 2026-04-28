import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  TrendingUp,
  Scale,
  Monitor,
  ChevronDown,
  Menu,
  X,
  Building2,
  LogOut,
  Settings,
  Bell,
  Search,
  FileText,
  Receipt,
  Briefcase,
  ShieldCheck,
  HeadphonesIcon,
  Package,
  UserCircle,
  User,
  Award,
  Target,
  Shield,
  Heart,
  CreditCard,
  BookOpen,
  Grid,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import NotificationCenter from "@/components/communications/NotificationCenter";
import ChatButton from "@/components/chat/ChatButton";

const navigation = [
  { name: "Dashboard", href: "Dashboard", icon: LayoutDashboard, color: "slate" },
  { name: "My Portal", href: "EmployeePortal", icon: User, color: "red" },
  { name: "My Profile", href: "MyProfile", icon: UserCircle, color: "indigo" },
  { name: "Announcements", href: "Announcements", icon: Building2, color: "blue" },
  {
    name: "People",
    icon: Users,
    color: "pink",
    children: [
      { name: "Hiring", href: "Hiring", icon: Briefcase },
      { name: "Email Templates", href: "EmailTemplates", icon: FileText },
      { name: "Employees", href: "Employees", icon: Users },
      { name: "Org Chart", href: "OrgChart", icon: Users },
      { name: "Time Off", href: "TimeOff", icon: FileText },
      { name: "Performance", href: "Performance", icon: TrendingUp },
      { name: "Training", href: "Training", icon: TrendingUp },
      { name: "Mentorship", href: "MentorshipProgram", icon: Users },
      { name: "Internships", href: "InternshipProgram", icon: Users },
      { name: "Career Paths", href: "CareerPathing", icon: TrendingUp },
      { name: "Contracts", href: "HRContracts", icon: ShieldCheck },
      { name: "Onboarding", href: "Onboarding", icon: UserCircle },
      { name: "Offboarding", href: "Offboarding", icon: UserCircle },
      { name: "Company Skills", href: "CompanySkills", icon: Target },
      { name: "Recognition", href: "Recognition", icon: Award },
      { name: "Surveys", href: "Surveys", icon: FileText },
      { name: "Departments", href: "Departments", icon: Building2 },
      { name: "AI Assistant", href: "HRAIAssistant", icon: Sparkles },
    ],
  },
  { name: "Benefits", href: "Benefits", icon: Heart, color: "green" },
  { name: "Compliance", href: "Compliance", icon: ShieldCheck, color: "purple" },
  { name: "Documents", href: "Documents", icon: FileText, color: "slate" },
  { name: "Equity", href: "EquityManagement", icon: TrendingUp, color: "orange" },
  { name: "Finance", href: "Expenses", icon: DollarSign, color: "yellow" },
  { name: "Payroll", href: "Payroll", icon: CreditCard, color: "cyan" },
  { name: "Legal", href: "Contracts", icon: Scale, color: "blue" },
  { name: "IT", href: "Assets", icon: Monitor, color: "green" },
  {
    name: "Admin",
    icon: Shield,
    color: "blue",
    children: [
      { name: "Admin Dashboard", href: "Admin", icon: Shield },
      { name: "App Links", href: "AppLinks", icon: Grid },
    ],
  },
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState([]);
  const [user, setUser] = useState(null);
  const [currentEmployee, setCurrentEmployee] = useState(null);

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (user && employees.length > 0) {
      const emp = employees.find(e => e.email === user.email);
      setCurrentEmployee(emp);
    }
  }, [user, employees]);

  const toggleGroup = (groupName) => {
    setExpandedGroups((prev) =>
      prev.includes(groupName)
        ? prev.filter((g) => g !== groupName)
        : [...prev, groupName]
    );
  };

  const isActivePage = (href) => currentPageName === href;
  const isActiveGroup = (group) => 
    group.children?.some((child) => currentPageName === child.href);

  const isAdmin = user?.role === "admin";
  const myTeam = currentEmployee
    ? employees.filter(e => e.manager_id === currentEmployee.id)
    : [];
  const isManager = myTeam.length > 0;
  
  // RBAC: Filter navigation based on department and role
  const filteredNavigation = navigation.filter(item => {
    // Admins see everything
    if (isAdmin) return true;
    
    // Employee Portal is for all employees
    if (item.href === "EmployeePortal") return true;
    
    // Dashboard and Announcements are for everyone
    if (item.href === "Dashboard" || item.href === "Announcements") return true;
    
    // Department-specific access
    if (item.name === "People" && currentEmployee?.department === "HR") return true;
    if (item.name === "Finance" && currentEmployee?.department === "Finance") return true;
    if (item.name === "Legal" && currentEmployee?.department === "Legal") return true;
    if (item.name === "IT" && currentEmployee?.department === "IT") return true;
    
    // Documents, Benefits are for everyone
    if (item.href === "Documents" || item.href === "Benefits") return true;
    
    // Hide department sections if not in that department
    if (["People", "Finance", "Legal", "IT", "Admin"].includes(item.name)) return false;
    
    return true;
  });

  const getColorClasses = (color, isActive) => {
    const colors = {
      slate: isActive ? "bg-slate-600 text-white shadow-lg shadow-slate-200" : "bg-slate-50 hover:bg-slate-100 border-l-4 border-slate-600",
      red: isActive ? "bg-red-600 text-white shadow-lg shadow-red-200" : "bg-red-50 hover:bg-red-100 border-l-4 border-red-600",
      blue: isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-600",
      purple: isActive ? "bg-purple-600 text-white shadow-lg shadow-purple-200" : "bg-purple-50 hover:bg-purple-100 border-l-4 border-purple-600",
      pink: isActive ? "bg-pink-600 text-white shadow-lg shadow-pink-200" : "bg-pink-50 hover:bg-pink-100 border-l-4 border-pink-600",
      green: isActive ? "bg-green-600 text-white shadow-lg shadow-green-200" : "bg-green-50 hover:bg-green-100 border-l-4 border-green-600",
      orange: isActive ? "bg-orange-600 text-white shadow-lg shadow-orange-200" : "bg-orange-50 hover:bg-orange-100 border-l-4 border-orange-600",
      yellow: isActive ? "bg-yellow-600 text-white shadow-lg shadow-yellow-200" : "bg-yellow-50 hover:bg-yellow-100 border-l-4 border-yellow-600",
      cyan: isActive ? "bg-cyan-600 text-white shadow-lg shadow-cyan-200" : "bg-cyan-50 hover:bg-cyan-100 border-l-4 border-cyan-600",
    };
    return colors[color] || colors.indigo;
  };

  const getGroupColorClasses = (color, isActive) => {
    const colors = {
      pink: isActive ? "bg-pink-50 text-pink-700 border-l-4 border-pink-600" : "bg-pink-50 border-l-4 border-pink-400",
      blue: isActive ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600" : "bg-blue-50 border-l-4 border-blue-400",
    };
    return colors[color] || colors.pink;
  };

  const getIconColorClasses = (color, isActive) => {
    const colors = {
      pink: isActive ? "text-pink-700" : "text-pink-600",
      blue: isActive ? "text-blue-700" : "text-blue-600",
    };
    return colors[color] || colors.pink;
  };

  const NavItem = ({ item, depth = 0 }) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedGroups.includes(item.name);
    const isActive = item.href && isActivePage(item.href);
    const isGroupActive = hasChildren && isActiveGroup(item);

    if (hasChildren) {
      return (
        <div className="space-y-1">
          <button
            onClick={() => toggleGroup(item.name)}
            className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              getGroupColorClasses(item.color, isGroupActive)
            }`}
          >
            <div className="flex items-center gap-3">
              <item.icon className={`w-5 h-5 ${getIconColorClasses(item.color, isGroupActive)}`} />
              <span className="text-slate-700">{item.name}</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </button>
          {isExpanded && (
            <div className="ml-4 pl-4 border-l border-slate-200 space-y-1">
              {item.children.map((child) => (
                <NavItem key={child.name} item={{...child, color: item.color}} depth={depth + 1} />
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        to={createPageUrl(item.href)}
        onClick={() => setSidebarOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
          depth === 0
            ? isActive
              ? getColorClasses(item.color, true)
              : getColorClasses(item.color, false)
            : isActive
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        }`}
      >
        <item.icon className={`w-5 h-5 ${isActive ? "text-white" : depth === 0 ? "text-slate-600" : "text-slate-400"}`} />
        <span className={isActive ? "text-white" : "text-slate-700"}>{item.name}</span>
      </Link>
    );
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
            InfraCove
          </h1>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {filteredNavigation.map((item) => (
          <NavItem key={item.name} item={item} />
        ))}
      </nav>

      {user && (
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback className="bg-indigo-100 text-indigo-700 font-medium">
                {user.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {user.full_name || "User"}
              </p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-72 z-50 transform transition-transform duration-300 lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:w-72 lg:block border-r border-slate-200">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-slate-200">
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent border-none outline-none text-sm w-64 placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <NotificationCenter currentEmployee={currentEmployee} />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar_url} />
                      <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm font-medium">
                        {user?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">{user?.full_name}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl("EmployeePortal")} className="flex items-center cursor-pointer">
                      <UserCircle className="w-4 h-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl("Settings")} className="flex items-center cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-red-600"
                    onClick={() => base44.auth.logout()}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-3 sm:p-4 lg:p-8">
          {children}
        </main>

        {/* Chat Button */}
        {user && currentEmployee && (
          <ChatButton currentUser={user} currentEmployee={currentEmployee} />
        )}
        </div>
        </div>
        );
        }