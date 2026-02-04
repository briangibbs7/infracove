import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from "@/components/ui/PageHeader";
import {
  User,
  Bell,
  Shield,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Upload,
  Save,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [profileData, setProfileData] = useState({});
  const [notificationPrefs, setNotificationPrefs] = useState({
    email_notifications: true,
    task_reminders: true,
    feedback_notifications: true,
    review_reminders: true,
    announcement_notifications: true,
    training_reminders: true,
  });
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  useEffect(() => {
    if (user && employees.length > 0) {
      const emp = employees.find(e => e.email === user.email);
      setCurrentEmployee(emp);
      if (emp) {
        setProfileData({
          full_name: emp.full_name || "",
          email: emp.email || "",
          phone: emp.phone || "",
          job_title: emp.job_title || "",
          department: emp.department || "",
          bio: emp.bio || "",
          location: emp.location || "",
        });
        setNotificationPrefs({
          email_notifications: emp.email_notifications ?? true,
          task_reminders: emp.task_reminders ?? true,
          feedback_notifications: emp.feedback_notifications ?? true,
          review_reminders: emp.review_reminders ?? true,
          announcement_notifications: emp.announcement_notifications ?? true,
          training_reminders: emp.training_reminders ?? true,
        });
      }
    }
  }, [user, employees]);

  const updateEmployeeMutation = useMutation({
    mutationFn: (data) => base44.entities.Employee.update(currentEmployee.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Settings updated successfully");
    },
  });

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    updateEmployeeMutation.mutate(profileData);
  };

  const handleNotificationUpdate = () => {
    updateEmployeeMutation.mutate(notificationPrefs);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await updateEmployeeMutation.mutateAsync({ avatar_url: file_url });
      toast.success("Avatar updated successfully");
    } catch (error) {
      toast.error("Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  if (!currentEmployee) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Manage your account and preferences"
      />

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="profile">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="account">
            <Shield className="w-4 h-4 mr-2" />
            Account
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information and profile picture</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={currentEmployee.avatar_url} />
                  <AvatarFallback className="bg-indigo-100 text-indigo-700 text-2xl">
                    {currentEmployee.full_name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">Profile Picture</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Upload a new profile picture (JPG, PNG, max 5MB)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById("avatar-upload").click()}
                      disabled={uploading}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? "Uploading..." : "Upload Photo"}
                    </Button>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Profile Form */}
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="full_name"
                        value={profileData.full_name}
                        onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        disabled
                        className="pl-9 bg-slate-50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="location"
                        value={profileData.location}
                        onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="job_title">Job Title</Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="job_title"
                        value={profileData.job_title}
                        disabled
                        className="pl-9 bg-slate-50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="department"
                        value={profileData.department}
                        disabled
                        className="pl-9 bg-slate-50"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    rows={4}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700"
                    disabled={updateEmployeeMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateEmployeeMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose what notifications you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email updates about important events
                    </p>
                  </div>
                  <Switch
                    checked={notificationPrefs.email_notifications}
                    onCheckedChange={(checked) =>
                      setNotificationPrefs({ ...notificationPrefs, email_notifications: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Task Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about upcoming task deadlines
                    </p>
                  </div>
                  <Switch
                    checked={notificationPrefs.task_reminders}
                    onCheckedChange={(checked) =>
                      setNotificationPrefs({ ...notificationPrefs, task_reminders: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Feedback Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive alerts when you receive feedback
                    </p>
                  </div>
                  <Switch
                    checked={notificationPrefs.feedback_notifications}
                    onCheckedChange={(checked) =>
                      setNotificationPrefs({ ...notificationPrefs, feedback_notifications: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Performance Review Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Get reminded about pending performance reviews
                    </p>
                  </div>
                  <Switch
                    checked={notificationPrefs.review_reminders}
                    onCheckedChange={(checked) =>
                      setNotificationPrefs({ ...notificationPrefs, review_reminders: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Announcement Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications about company announcements
                    </p>
                  </div>
                  <Switch
                    checked={notificationPrefs.announcement_notifications}
                    onCheckedChange={(checked) =>
                      setNotificationPrefs({ ...notificationPrefs, announcement_notifications: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Training Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Get reminded about assigned training courses
                    </p>
                  </div>
                  <Switch
                    checked={notificationPrefs.training_reminders}
                    onCheckedChange={(checked) =>
                      setNotificationPrefs({ ...notificationPrefs, training_reminders: checked })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleNotificationUpdate}
                  className="bg-indigo-600 hover:bg-indigo-700"
                  disabled={updateEmployeeMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateEmployeeMutation.isPending ? "Saving..." : "Save Preferences"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>View your account details and role</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Employee ID</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      {currentEmployee.employee_id || "Not assigned"}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Role</Label>
                  <div className="flex items-center gap-2">
                    <Badge className={isAdmin ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}>
                      {isAdmin ? "Administrator" : "Employee"}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {currentEmployee.status || "Active"}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Join Date</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {currentEmployee.hire_date
                        ? new Date(currentEmployee.hire_date).toLocaleDateString()
                        : "Not available"}
                    </span>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900">Manager Information</h3>
                {currentEmployee.manager_name ? (
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-indigo-100 text-indigo-700">
                        {currentEmployee.manager_name?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-slate-900">{currentEmployee.manager_name}</p>
                      <p className="text-sm text-muted-foreground">Direct Manager</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No manager assigned</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>Irreversible account actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div>
                  <h4 className="font-semibold text-slate-900">Sign Out</h4>
                  <p className="text-sm text-muted-foreground">Sign out of your account</p>
                </div>
                <Button
                  variant="outline"
                  className="border-red-600 text-red-600 hover:bg-red-50"
                  onClick={() => base44.auth.logout()}
                >
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}