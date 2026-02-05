import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "@/components/ui/StatusBadge";
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
  DollarSign,
  Download,
  CheckCircle2,
  Plus,
  Award,
  MessageCircle,
  Cloud,
  Video,
  Star,
  Building2,
  Camera,
  Edit
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "react-hot-toast";

export default function EmployeePortal() {
  const [user, setUser] = useState(null);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeOffDialogOpen, setTimeOffDialogOpen] = useState(false);
  const [payrollDialogOpen, setPayrollDialogOpen] = useState(false);
  const [documentsDialogOpen, setDocumentsDialogOpen] = useState(false);
  const [trainingDialogOpen, setTrainingDialogOpen] = useState(false);
  const [marketplaceDialogOpen, setMarketplaceDialogOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [profileFormData, setProfileFormData] = useState({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const queryClient = useQueryClient();

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

  const { data: announcements = [] } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => base44.entities.Announcement.list("-created_date", 5),
  });

  const { data: timeOffRequests = [] } = useQuery({
    queryKey: ["timeOffRequests"],
    queryFn: () => base44.entities.TimeOffRequest.list("-created_date"),
  });

  const { data: payrolls = [] } = useQuery({
    queryKey: ["payrolls"],
    queryFn: () => base44.entities.Payroll.list("-pay_date"),
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["companyDocuments"],
    queryFn: () => base44.entities.CompanyDocument.filter({ status: "active" }),
  });

  const { data: trainingAssignments = [] } = useQuery({
    queryKey: ["trainingAssignments"],
    queryFn: () => base44.entities.TrainingAssignment.list(),
  });

  const { data: trainingCourses = [] } = useQuery({
    queryKey: ["trainingCourses"],
    queryFn: () => base44.entities.TrainingCourse.list(),
  });

  useEffect(() => {
    if (user && employees.length > 0) {
      const emp = employees.find(e => e.email === user.email);
      setCurrentEmployee(emp);
    }
  }, [user, employees]);

  const createTimeOffMutation = useMutation({
    mutationFn: (data) => base44.entities.TimeOffRequest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeOffRequests"] });
      setTimeOffDialogOpen(false);
      toast.success("Time off request submitted successfully");
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Employee.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setEditProfileOpen(false);
      toast.success("Profile updated successfully");
    },
  });

  const acknowledgeDocumentMutation = useMutation({
    mutationFn: ({ docId, acknowledgments }) =>
      base44.entities.CompanyDocument.update(docId, { acknowledged_by: acknowledgments }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyDocuments"] });
      toast.success("Document acknowledged");
    },
  });

  const handleSubmitTimeOff = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const startDate = formData.get("start_date");
    const endDate = formData.get("end_date");
    const daysDiff = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;

    const manager = employees.find(emp => emp.id === currentEmployee.manager_id);

    createTimeOffMutation.mutate({
      employee_id: currentEmployee.id,
      employee_name: currentEmployee.name,
      manager_id: manager?.id,
      manager_name: manager?.name,
      type: formData.get("type"),
      start_date: startDate,
      end_date: endDate,
      days_requested: daysDiff,
      reason: formData.get("reason"),
      status: "pending_approval",
    });
  };

  const handleAcknowledgeDocument = (doc) => {
    const alreadyAcknowledged = doc.acknowledged_by?.some(ack => ack.employee_id === currentEmployee.id);
    if (alreadyAcknowledged) return;

    const newAcknowledgment = {
      employee_id: currentEmployee.id,
      employee_name: currentEmployee.name,
      acknowledged_date: new Date().toISOString().split("T")[0],
    };

    acknowledgeDocumentMutation.mutate({
      docId: doc.id,
      acknowledgments: [...(doc.acknowledged_by || []), newAcknowledgment],
    });
  };

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

  const getIconComponent = (iconName) => {
    const icons = {
      Mail: <Mail className="w-5 h-5" />,
      Calendar: <Calendar className="w-5 h-5" />,
      Briefcase: <Briefcase className="w-5 h-5" />,
      MessageCircle: <MessageCircle className="w-5 h-5" />,
      Cloud: <Cloud className="w-5 h-5" />,
      Video: <Video className="w-5 h-5" />,
      Users: <Users className="w-5 h-5" />,
      FileText: <FileText className="w-5 h-5" />,
      BookOpen: <BookOpen className="w-5 h-5" />,
      Grid: <Grid className="w-5 h-5" />,
    };
    return icons[iconName] || <Grid className="w-5 h-5" />;
  };

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

  const getThemeGradient = (theme) => {
    const gradients = {
      blue: "from-blue-500 to-indigo-600",
      purple: "from-purple-500 to-pink-600",
      green: "from-green-500 to-emerald-600",
      orange: "from-orange-500 to-red-600",
      pink: "from-pink-500 to-rose-600",
      slate: "from-slate-500 to-slate-700",
    };
    return gradients[theme] || gradients.blue;
  };

  const getThemeBg = (theme) => {
    const backgrounds = {
      blue: "bg-blue-500",
      purple: "bg-purple-500",
      green: "bg-green-500",
      orange: "bg-orange-500",
      pink: "bg-pink-500",
      slate: "bg-slate-500",
    };
    return backgrounds[theme] || backgrounds.blue;
  };

  const getThemeBadge = (theme) => {
    const badges = {
      blue: "border-blue-200 bg-blue-50 text-blue-700",
      purple: "border-purple-200 bg-purple-50 text-purple-700",
      green: "border-green-200 bg-green-50 text-green-700",
      orange: "border-orange-200 bg-orange-50 text-orange-700",
      pink: "border-pink-200 bg-pink-50 text-pink-700",
      slate: "border-slate-200 bg-slate-50 text-slate-700",
    };
    return badges[theme] || badges.blue;
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await updateEmployeeMutation.mutateAsync({
        id: currentEmployee.id,
        data: { profile_photo: file_url }
      });
      toast.success("Photo updated successfully");
    } catch (error) {
      toast.error("Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = () => {
    updateEmployeeMutation.mutate({
      id: currentEmployee.id,
      data: profileFormData
    });
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
          {/* My Apps Shortcuts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>My Apps</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMarketplaceDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Apps
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {appLinks
                  .filter((app) => app.is_featured)
                  .map((app) => (
                    <button
                      key={app.id}
                      onClick={() => window.open(app.url, "_blank")}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-slate-50 transition-colors group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white group-hover:shadow-lg transition-shadow">
                        {getIconComponent(app.icon)}
                      </div>
                      <span className="text-xs font-medium text-center text-slate-700">
                        {app.name}
                      </span>
                    </button>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button 
                  className="w-full h-24 flex flex-col gap-2 bg-blue-600 hover:bg-blue-700"
                  onClick={() => setTimeOffDialogOpen(true)}
                >
                  <Calendar className="w-6 h-6" />
                  <span>Time Off</span>
                </Button>
                <Button 
                  className="w-full h-24 flex flex-col gap-2 bg-green-600 hover:bg-green-700"
                  onClick={() => setPayrollDialogOpen(true)}
                >
                  <DollarSign className="w-6 h-6" />
                  <span>Payroll</span>
                </Button>
                <Button 
                  className="w-full h-24 flex flex-col gap-2 bg-purple-600 hover:bg-purple-700"
                  onClick={() => setDocumentsDialogOpen(true)}
                >
                  <FileText className="w-6 h-6" />
                  <span>Documents</span>
                </Button>
                <Button 
                  className="w-full h-24 flex flex-col gap-2 bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => setTrainingDialogOpen(true)}
                >
                  <BookOpen className="w-6 h-6" />
                  <span>Training</span>
                </Button>
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
              <div className="flex items-center justify-between">
                <CardTitle>My Applications</CardTitle>
                <Button onClick={() => setMarketplaceDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Browse Marketplace
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {appLinks.filter(a => a.is_featured).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No apps added yet. Browse the marketplace to add apps.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {appLinks.filter(a => a.is_featured).map((app) => (
                    <div
                      key={app.id}
                      className="flex flex-col items-center gap-3 p-4 border rounded-lg hover:shadow-lg transition-all cursor-pointer group"
                      onClick={() => window.open(app.url, "_blank")}
                    >
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                        {getIconComponent(app.icon)}
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-sm">{app.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {app.description}
                        </p>
                      </div>
                    </div>
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
          {/* Profile Header with Theme */}
          <Card className="overflow-hidden">
            <div className={`h-32 bg-gradient-to-r ${getThemeGradient(currentEmployee?.profile_theme || "blue")}`} />
            <CardContent className="relative pt-0 pb-6">
              <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-16">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden">
                    {currentEmployee?.profile_photo ? (
                      <img
                        src={currentEmployee.profile_photo}
                        alt={currentEmployee.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center text-4xl font-bold text-white ${getThemeBg(currentEmployee?.profile_theme || "blue")}`}>
                        {currentEmployee?.full_name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                    <Camera className="w-4 h-4 text-slate-600" />
                  </label>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-900">{currentEmployee?.full_name}</h2>
                  <p className="text-slate-600">{currentEmployee?.job_title}</p>
                  <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                    <MapPin className="w-4 h-4" />
                    {currentEmployee?.location || "Location not set"}
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setEditProfileOpen(true)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* About Section */}
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 whitespace-pre-wrap">
                {currentEmployee?.bio || "No bio added yet. Click 'Edit Profile' to add your bio."}
              </p>
            </CardContent>
          </Card>

          {/* Career Information */}
          <Card>
            <CardHeader>
              <CardTitle>Career</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-slate-500">Department</Label>
                <p className="text-slate-900">{currentEmployee?.department || "Not set"}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-500">Manager</Label>
                <p className="text-slate-900">{currentEmployee?.manager_name || "Not assigned"}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-500">Hire Date</Label>
                <p className="text-slate-900">
                  {currentEmployee?.start_date ? format(new Date(currentEmployee.start_date), "MMMM d, yyyy") : "Not set"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-500">Career Goals</Label>
                <p className="text-slate-700">
                  {currentEmployee?.career_goals || "No career goals set. Click 'Edit Profile' to add them."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Skills & Interests */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Skills</CardTitle>
              </CardHeader>
              <CardContent>
                {currentEmployee?.skills?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {currentEmployee.skills.map((skill, idx) => (
                      <Badge key={idx} variant="outline" className={`${getThemeBadge(currentEmployee?.profile_theme || "blue")}`}>
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No skills added yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Interests & Hobbies</CardTitle>
              </CardHeader>
              <CardContent>
                {currentEmployee?.interests?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {currentEmployee.interests.map((interest, idx) => (
                      <Badge key={idx} variant="outline" className={`${getThemeBadge(currentEmployee?.profile_theme || "blue")}`}>
                        {interest}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No interests added yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-slate-400" />
                <div>
                  <Label className="text-sm font-medium text-slate-500">Email</Label>
                  <p className="text-slate-900">{currentEmployee?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-slate-400" />
                <div>
                  <Label className="text-sm font-medium text-slate-500">Phone</Label>
                  <p className="text-slate-900">{currentEmployee?.phone || "Not set"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-slate-400" />
                <div>
                  <Label className="text-sm font-medium text-slate-500">Location</Label>
                  <p className="text-slate-900">{currentEmployee?.location || "Not set"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leave Balances */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Leave Balances
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-600 mb-1 font-medium">Vacation</p>
                  <p className="text-3xl font-bold text-blue-700">
                    {currentEmployee?.vacation_balance || 0}
                  </p>
                  <p className="text-xs text-blue-500 mt-1">days remaining</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-red-600 mb-1 font-medium">Sick</p>
                  <p className="text-3xl font-bold text-red-700">
                    {currentEmployee?.sick_balance || 0}
                  </p>
                  <p className="text-xs text-red-500 mt-1">days remaining</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-600 mb-1 font-medium">Personal</p>
                  <p className="text-3xl font-bold text-purple-700">
                    {currentEmployee?.personal_balance || 0}
                  </p>
                  <p className="text-xs text-purple-500 mt-1">days remaining</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-600 mb-1 font-medium">Bereavement</p>
                  <p className="text-3xl font-bold text-slate-700">
                    {currentEmployee?.bereavement_balance || 0}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">days remaining</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-600 mb-1 font-medium">Parental</p>
                  <p className="text-3xl font-bold text-green-700">
                    {currentEmployee?.parental_balance || 0}
                  </p>
                  <p className="text-xs text-green-500 mt-1">days remaining</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Time Off Request Dialog */}
      <Dialog open={timeOffDialogOpen} onOpenChange={setTimeOffDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Time Off</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitTimeOff} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type of Leave *</Label>
              <Select name="type" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacation">Vacation</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="bereavement">Bereavement</SelectItem>
                  <SelectItem value="parental">Parental Leave</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date *</Label>
                <Input id="start_date" name="start_date" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date *</Label>
                <Input id="end_date" name="end_date" type="date" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                name="reason"
                placeholder="Brief description..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTimeOffDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Payroll Dialog */}
      <Dialog open={payrollDialogOpen} onOpenChange={setPayrollDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>My Payroll</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {payrolls.filter(p => p.employee_id === currentEmployee?.id).length > 0 ? (
              payrolls
                .filter(p => p.employee_id === currentEmployee?.id)
                .map((payroll) => (
                  <div key={payroll.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {format(parseISO(payroll.pay_period_start), "MMM d")} -{" "}
                          {format(parseISO(payroll.pay_period_end), "MMM d, yyyy")}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Pay Date: {format(parseISO(payroll.pay_date), "MMM d, yyyy")}
                        </p>
                      </div>
                      <StatusBadge status={payroll.status} />
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-3 border-t">
                      <div>
                        <p className="text-sm text-slate-500">Gross Pay</p>
                        <p className="text-lg font-semibold text-slate-900">
                          ${payroll.gross_pay?.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Total Deductions</p>
                        <p className="text-lg font-semibold text-red-600">
                          -${payroll.total_deductions?.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Net Pay</p>
                        <p className="text-lg font-bold text-green-600">
                          ${payroll.net_pay?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No payroll records available</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Documents Dialog */}
      <Dialog open={documentsDialogOpen} onOpenChange={setDocumentsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>My Documents</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {documents
              .filter(d => d.department === "all" || d.department === currentEmployee?.department)
              .map((doc) => {
                const isAcknowledged = doc.acknowledged_by?.some(
                  (ack) => ack.employee_id === currentEmployee?.id
                );
                return (
                  <div key={doc.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <FileText className="w-5 h-5 text-indigo-600" />
                          <h3 className="font-semibold">{doc.title}</h3>
                          <Badge variant="outline" className="capitalize">
                            {doc.category}
                          </Badge>
                          {isAcknowledged && (
                            <Badge className="bg-emerald-100 text-emerald-700">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Acknowledged
                            </Badge>
                          )}
                        </div>
                        {doc.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {doc.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {doc.file_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(doc.file_url, "_blank")}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        )}
                        {doc.requires_acknowledgment && !isAcknowledged && (
                          <Button
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700"
                            onClick={() => handleAcknowledgeDocument(doc)}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Acknowledge
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            {documents.filter(d => d.department === "all" || d.department === currentEmployee?.department)
              .length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No documents available</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Training Dialog */}
      <Dialog open={trainingDialogOpen} onOpenChange={setTrainingDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>My Training</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {trainingAssignments
              .filter(a => a.employee_id === currentEmployee?.id)
              .map((assignment) => {
                const course = trainingCourses.find(c => c.id === assignment.course_id);
                if (!course) return null;
                
                return (
                  <div key={assignment.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <BookOpen className="w-5 h-5 text-indigo-600" />
                          <h3 className="font-semibold">{course.title}</h3>
                          <StatusBadge status={assignment.status} />
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {course.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <span>Duration: {course.duration_hours}h</span>
                          {assignment.due_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Due: {format(parseISO(assignment.due_date), "MMM d, yyyy")}
                            </span>
                          )}
                        </div>
                      </div>
                      {assignment.certificate_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(assignment.certificate_url, "_blank")}
                        >
                          <Award className="w-4 h-4 mr-2" />
                          Certificate
                        </Button>
                      )}
                    </div>
                    {assignment.completion_date && (
                      <div className="pt-3 border-t flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        Completed on {format(parseISO(assignment.completion_date), "MMM d, yyyy")}
                      </div>
                    )}
                  </div>
                );
              })}
            {trainingAssignments.filter(a => a.employee_id === currentEmployee?.id).length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No training assigned yet</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* App Marketplace Dialog */}
      <Dialog open={marketplaceDialogOpen} onOpenChange={setMarketplaceDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>App Marketplace</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appLinks.map((app) => {
                const isFeatured = app.is_featured;
                return (
                  <div
                    key={app.id}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shrink-0">
                        {getIconComponent(app.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 mb-1">{app.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {app.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs capitalize">
                            {app.category}
                          </Badge>
                          {app.requires_login && (
                            <Badge variant="outline" className="text-xs">
                              Login Required
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {isFeatured ? (
                          <Badge className="bg-green-100 text-green-700">
                            <Star className="w-3 h-3 mr-1" />
                            Added
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={async () => {
                              await base44.entities.AppLink.update(app.id, {
                                is_featured: true,
                              });
                              queryClient.invalidateQueries({ queryKey: ["appLinks"] });
                              toast.success(`${app.name} added to your apps`);
                            }}
                          >
                            Add
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(app.url, "_blank")}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea
                placeholder="Tell us about yourself..."
                rows={4}
                defaultValue={currentEmployee?.bio}
                onChange={(e) => setProfileFormData({ ...profileFormData, bio: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Career Goals</Label>
              <Textarea
                placeholder="What are your career aspirations?"
                rows={3}
                defaultValue={currentEmployee?.career_goals}
                onChange={(e) => setProfileFormData({ ...profileFormData, career_goals: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Skills (comma separated)</Label>
              <Input
                placeholder="e.g., JavaScript, Project Management, Communication"
                defaultValue={currentEmployee?.skills?.join(", ")}
                onChange={(e) => setProfileFormData({ 
                  ...profileFormData, 
                  skills: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                })}
              />
            </div>

            <div className="space-y-2">
              <Label>Interests & Hobbies (comma separated)</Label>
              <Input
                placeholder="e.g., Photography, Hiking, Reading"
                defaultValue={currentEmployee?.interests?.join(", ")}
                onChange={(e) => setProfileFormData({ 
                  ...profileFormData, 
                  interests: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  placeholder="Your phone number"
                  defaultValue={currentEmployee?.phone}
                  onChange={(e) => setProfileFormData({ ...profileFormData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  placeholder="e.g., New York, NY"
                  defaultValue={currentEmployee?.location}
                  onChange={(e) => setProfileFormData({ ...profileFormData, location: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Profile Theme</Label>
              <div className="grid grid-cols-3 gap-3">
                {["blue", "purple", "green", "orange", "pink", "slate"].map((theme) => (
                  <button
                    key={theme}
                    onClick={() => setProfileFormData({ ...profileFormData, profile_theme: theme })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      (profileFormData.profile_theme || currentEmployee?.profile_theme) === theme
                        ? "border-slate-900 ring-2 ring-slate-200"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className={`w-full h-12 rounded bg-gradient-to-r ${getThemeGradient(theme)} mb-2`} />
                    <p className="text-sm font-medium capitalize text-center">{theme}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProfileOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} className="bg-indigo-600 hover:bg-indigo-700">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}