import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { 
  CheckCircle2, 
  Laptop, 
  Mail, 
  Calendar, 
  Shield, 
  FileText, 
  Users,
  GraduationCap,
  Heart 
} from "lucide-react";

const ONBOARDING_TEMPLATES = {
  HR: [
    { id: "create_profile", title: "Create Employee Profile", icon: Users, priority: "urgent", days: -7 },
    { id: "benefits_enrollment", title: "Benefits Enrollment", icon: Heart, priority: "medium", days: 3 },
    { id: "team_introduction", title: "Team Introduction", icon: Users, priority: "medium", days: 1 },
  ],
  IT: [
    { id: "assign_equipment", title: "Assign Equipment", icon: Laptop, priority: "high", days: -3 },
    { id: "setup_accounts", title: "Setup Accounts", icon: Shield, priority: "high", days: -2 },
  ],
  Training: [
    { id: "onboarding_training", title: "Assign Onboarding Courses", icon: GraduationCap, priority: "high", days: 0 },
  ],
  General: [
    { id: "send_welcome_materials", title: "Send Welcome Materials", icon: Mail, priority: "medium", days: -1 },
    { id: "schedule_orientation", title: "Schedule Orientation", icon: Calendar, priority: "high", days: 0 },
  ]
};

export default function OnboardingTemplateSelector({ employee, onComplete }) {
  const [selectedDepartments, setSelectedDepartments] = useState(["HR", "IT", "Training", "General"]);
  const [startDate, setStartDate] = useState(employee.start_date || "");
  const [customTasks, setCustomTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleDepartment = (dept) => {
    setSelectedDepartments(prev =>
      prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]
    );
  };

  const handleInitiate = async () => {
    if (!startDate) {
      alert("Please select a start date");
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('initiateCustomOnboarding', {
        employeeId: employee.id,
        startDate: startDate,
        selectedDepartments: selectedDepartments,
        customTasks: customTasks
      });

      alert(`${response.data.tasks_created} onboarding tasks created successfully!`);
      onComplete();
    } catch (error) {
      alert("Failed to initiate onboarding: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedTasksCount = Object.entries(ONBOARDING_TEMPLATES)
    .filter(([dept]) => selectedDepartments.includes(dept))
    .reduce((sum, [_, tasks]) => sum + tasks.length, 0);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg border border-indigo-100">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-indigo-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-indigo-900">{employee.full_name}</h3>
            <p className="text-sm text-indigo-700">{employee.job_title} • {employee.department}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="start_date">Start Date *</Label>
        <Input
          id="start_date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base">Select Task Categories</Label>
          <Badge variant="outline">{selectedTasksCount} tasks selected</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(ONBOARDING_TEMPLATES).map(([dept, tasks]) => (
            <Card 
              key={dept}
              className={`cursor-pointer transition-all ${
                selectedDepartments.includes(dept)
                  ? "border-indigo-300 bg-indigo-50/50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
              onClick={() => toggleDepartment(dept)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedDepartments.includes(dept)}
                    onCheckedChange={() => toggleDepartment(dept)}
                  />
                  <CardTitle className="text-base">{dept}</CardTitle>
                  <Badge variant="outline" className="ml-auto">{tasks.length}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tasks.map(task => {
                    const Icon = task.icon;
                    return (
                      <div key={task.id} className="flex items-center gap-2 text-sm text-slate-600">
                        <Icon className="w-4 h-4" />
                        <span>{task.title}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
        <p className="text-sm text-amber-900">
          <strong>Auto-assignment:</strong> Tasks will be automatically assigned to department heads and relevant training courses will be assigned based on the employee's department.
        </p>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          onClick={handleInitiate}
          disabled={loading || !startDate || selectedDepartments.length === 0}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {loading ? "Creating..." : `Create ${selectedTasksCount} Tasks & Assign Training`}
        </Button>
      </div>
    </div>
  );
}