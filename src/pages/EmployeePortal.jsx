import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/ui/PageHeader";
import {
  User,
  Briefcase,
  BookOpen,
  Users,
  Link2,
  AlertCircle,
  ExternalLink,
  Search,
  Mail,
  Phone,
  MapPin,
  Grid,
  FileText,
  Calendar,
  DollarSign
} from "lucide-react";
import { createPageUrl } from "../utils";
import { Link } from "react-router-dom";

export default function EmployeePortal() {
  const [user, setUser] = useState(null);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: appLinks = [] } = useQuery({
    queryKey: ["appLinks"],
    queryFn: () => base44.entities.AppLink.filter({ is_active: true }),
  });

  const { data: resources = [] } = useQuery({
    queryKey: ["companyResources"],
    queryFn: () => base44.entities.CompanyResource.filter({ is_active: true }),
  });

  const { data: quickLinks = [] } = useQuery({
    queryKey: ["quickLinks"],
    queryFn: () => base44.entities.QuickLink.filter({ is_active: true }),
  });

  useEffect(() => {
    if (user && employees.length > 0) {
      const emp = employees.find(e => e.email === user.email);
      setCurrentEmployee(emp);
    }
  }, [user, employees]);

  if (!currentEmployee) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Employee Profile Not Found</h2>
          <p className="text-slate-500">Please contact HR to set up your employee profile.</p>
        </div>
      </div>
    );
  }

  const filteredEmployees = employees.filter(
    (e) =>
      e.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.job_title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryIcon = (category) => {
    const icons = {
      productivity: <Briefcase className="w-5 h-5" />,
      communication: <Mail className="w-5 h-5" />,
      hr: <Users className="w-5 h-5" />,
      finance: <DollarSign className="w-5 h-5" />,
      development: <Grid className="w-5 h-5" />,
      design: <Grid className="w-5 h-5" />,
      handbook: <BookOpen className="w-5 h-5" />,
      policy: <FileText className="w-5 h-5" />,
      guide: <BookOpen className="w-5 h-5" />,
      template: <FileText className="w-5 h-5" />,
      training: <BookOpen className="w-5 h-5" />,
    };
    return icons[category] || <Grid className="w-5 h-5" />;
  };

  const getCategoryColor = (category) => {
    const colors = {
      productivity: "bg-blue-100 text-blue-700",
      communication: "bg-purple-100 text-purple-700",
      hr: "bg-indigo-100 text-indigo-700",
      finance: "bg-green-100 text-green-700",
      development: "bg-cyan-100 text-cyan-700",
      design: "bg-pink-100 text-pink-700",
      handbook: "bg-amber-100 text-amber-700",
      policy: "bg-red-100 text-red-700",
      guide: "bg-emerald-100 text-emerald-700",
      template: "bg-slate-100 text-slate-700",
      training: "bg-violet-100 text-violet-700",
    };
    return colors[category] || "bg-gray-100 text-gray-700";
  };

  const getLinkColor = (color) => {
    const colors = {
      blue: "bg-blue-600 hover:bg-blue-700",
      green: "bg-green-600 hover:bg-green-700",
      purple: "bg-purple-600 hover:bg-purple-700",
      red: "bg-red-600 hover:bg-red-700",
      amber: "bg-amber-600 hover:bg-amber-700",
      indigo: "bg-indigo-600 hover:bg-indigo-700",
      pink: "bg-pink-600 hover:bg-pink-700",
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome to Your Portal, {currentEmployee.name}! 👋</h1>
        <p className="text-indigo-100">{currentEmployee.job_title} • {currentEmployee.department}</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">
            <Grid className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="apps">
            <Briefcase className="w-4 h-4 mr-2" />
            Apps
          </TabsTrigger>
          <TabsTrigger value="resources">
            <BookOpen className="w-4 h-4 mr-2" />
            Resources
          </TabsTrigger>
          <TabsTrigger value="directory">
            <Users className="w-4 h-4 mr-2" />
            Directory
          </TabsTrigger>
          <TabsTrigger value="profile">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Link to={createPageUrl("TimeOff")}>
                  <Button className="w-full h-24 flex flex-col gap-2 bg-blue-600 hover:bg-blue-700">
                    <Calendar className="w-6 h-6" />
                    <span>Time Off</span>
                  </Button>
                </Link>
                <Link to={createPageUrl("Payroll")}>
                  <Button className="w-full h-24 flex flex-col gap-2 bg-green-600 hover:bg-green-700">
                    <DollarSign className="w-6 h-6" />
                    <span>Payroll</span>
                  </Button>
                </Link>
                <Link to={createPageUrl("Documents")}>
                  <Button className="w-full h-24 flex flex-col gap-2 bg-purple-600 hover:bg-purple-700">
                    <FileText className="w-6 h-6" />
                    <span>Documents</span>
                  </Button>
                </Link>
                <Link to={createPageUrl("Training")}>
                  <Button className="w-full h-24 flex flex-col gap-2 bg-indigo-600 hover:bg-indigo-700">
                    <BookOpen className="w-6 h-6" />
                    <span>Training</span>
                  </Button>
                </Link>
                {quickLinks.slice(0, 4).map((link) => (
                  <Button
                    key={link.id}
                    className={`w-full h-24 flex flex-col gap-2 ${getLinkColor(link.color)}`}
                    onClick={() => window.open(link.url, "_blank")}
                  >
                    <ExternalLink className="w-6 h-6" />
                    <span>{link.title}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Featured Apps */}
          <Card>
            <CardHeader>
              <CardTitle>Featured Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {appLinks
                  .filter((app) => app.is_featured)
                  .slice(0, 6)
                  .map((app) => (
                    <div
                      key={app.id}
                      className="p-4 border rounded-lg hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => window.open(app.url, "_blank")}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-3 rounded-lg ${getCategoryColor(app.category)}`}>
                          {getCategoryIcon(app.category)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 mb-1">{app.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {app.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Company Resources */}
          <Card>
            <CardHeader>
              <CardTitle>Important Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {resources
                  .filter((r) => r.is_featured)
                  .slice(0, 5)
                  .map((resource) => (
                    <div
                      key={resource.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      onClick={() => window.open(resource.url || resource.file_url, "_blank")}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getCategoryColor(resource.category)}`}>
                          {getCategoryIcon(resource.category)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{resource.title}</p>
                          <p className="text-sm text-muted-foreground">{resource.description}</p>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-400" />
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Apps Tab */}
        <TabsContent value="apps" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Application Repository</CardTitle>
            </CardHeader>
            <CardContent>
              {appLinks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No applications available yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {appLinks.map((app) => (
                    <Card
                      key={app.id}
                      className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => window.open(app.url, "_blank")}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`p-3 rounded-lg ${getCategoryColor(app.category)}`}>
                            {getCategoryIcon(app.category)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900 mb-1">{app.name}</h3>
                            <Badge variant="outline" className="text-xs">
                              {app.category}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {app.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {app.requires_login && (
                            <Badge variant="outline" className="text-xs">Login Required</Badge>
                          )}
                          <ExternalLink className="w-3 h-3" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Resources & Documentation</CardTitle>
            </CardHeader>
            <CardContent>
              {resources.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No resources available yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {resources.map((resource) => (
                    <div
                      key={resource.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => window.open(resource.url || resource.file_url, "_blank")}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`p-3 rounded-lg ${getCategoryColor(resource.category)}`}>
                          {getCategoryIcon(resource.category)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{resource.title}</h3>
                          <p className="text-sm text-muted-foreground">{resource.description}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs capitalize">
                              {resource.category}
                            </Badge>
                            {resource.tags?.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <ExternalLink className="w-5 h-5 text-slate-400" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Directory Tab */}
        <TabsContent value="directory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Employee Directory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search employees by name, email, department, or job title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredEmployees.map((employee) => (
                  <Card key={employee.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                          {employee.name?.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900">{employee.name}</h3>
                          <p className="text-sm text-muted-foreground">{employee.job_title}</p>
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Mail className="w-3 h-3" />
                              <a href={`mailto:${employee.email}`} className="hover:text-indigo-600">
                                {employee.email}
                              </a>
                            </div>
                            {employee.phone && (
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Phone className="w-3 h-3" />
                                <a href={`tel:${employee.phone}`} className="hover:text-indigo-600">
                                  {employee.phone}
                                </a>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Briefcase className="w-3 h-3" />
                              <span>{employee.department}</span>
                            </div>
                            {employee.location && (
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <MapPin className="w-3 h-3" />
                                <span>{employee.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredEmployees.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No employees found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 mb-6 pb-6 border-b">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-3xl">
                  {currentEmployee.name?.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{currentEmployee.name}</h2>
                  <p className="text-lg text-slate-600">{currentEmployee.job_title}</p>
                  <Badge className="mt-2">{currentEmployee.department}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Email</p>
                    <p className="font-medium">{currentEmployee.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Phone</p>
                    <p className="font-medium">{currentEmployee.phone || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Location</p>
                    <p className="font-medium">{currentEmployee.location || "Not provided"}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Employee ID</p>
                    <p className="font-medium">{currentEmployee.employee_id || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Employment Type</p>
                    <p className="font-medium capitalize">
                      {currentEmployee.employment_type?.replace(/_/g, " ") || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Status</p>
                    <Badge variant="outline" className="capitalize">
                      {currentEmployee.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <Button className="bg-indigo-600 hover:bg-indigo-700" asChild>
                  <Link to={createPageUrl("Settings")}>Edit Profile</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}