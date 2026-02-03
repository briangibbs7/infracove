import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, Loader2 } from "lucide-react";
import { addDays } from "date-fns";

export default function OnboardingWizard({ employee, onComplete }) {
  const [loading, setLoading] = useState(false);
  const [selectedDepartments, setSelectedDepartments] = useState({
    IT: true,
    HR: true,
    Finance: false,
  });

  const handleInitiateOnboarding = async () => {
    setLoading(true);
    try {
      const startDate = new Date(employee.start_date || new Date());
      const departments = Object.keys(selectedDepartments).filter(d => selectedDepartments[d]);

      // Create default onboarding tasks
      const defaultTasks = [];

      if (selectedDepartments.IT) {
        defaultTasks.push(
          {
            employee_id: employee.id,
            employee_name: employee.full_name,
            task_type: "setup_accounts",
            title: "Setup Email and System Accounts",
            description: "Create email account, Active Directory, VPN, and other necessary system access",
            priority: "high",
            due_date: addDays(startDate, -2).toISOString().split("T")[0],
            order: 1
          },
          {
            employee_id: employee.id,
            employee_name: employee.full_name,
            task_type: "assign_equipment",
            title: "Prepare and Assign Equipment",
            description: "Laptop, phone, monitor, and accessories",
            priority: "high",
            due_date: addDays(startDate, -1).toISOString().split("T")[0],
            order: 2
          }
        );
      }

      if (selectedDepartments.HR) {
        defaultTasks.push(
          {
            employee_id: employee.id,
            employee_name: employee.full_name,
            task_type: "send_welcome_materials",
            title: "Send Welcome Packet",
            description: "Company handbook, benefits info, and welcome materials",
            priority: "medium",
            due_date: addDays(startDate, -3).toISOString().split("T")[0],
            order: 3
          },
          {
            employee_id: employee.id,
            employee_name: employee.full_name,
            task_type: "schedule_orientation",
            title: "Schedule First Day Orientation",
            description: "Company overview, culture, policies, and team introductions",
            priority: "high",
            due_date: startDate.toISOString().split("T")[0],
            order: 4
          },
          {
            employee_id: employee.id,
            employee_name: employee.full_name,
            task_type: "benefits_enrollment",
            title: "Complete Benefits Enrollment",
            description: "Health insurance, 401k, and other benefits setup",
            priority: "medium",
            due_date: addDays(startDate, 7).toISOString().split("T")[0],
            order: 5
          }
        );
      }

      if (selectedDepartments.Finance) {
        defaultTasks.push(
          {
            employee_id: employee.id,
            employee_name: employee.full_name,
            task_type: "other",
            title: "Setup Payroll and Direct Deposit",
            description: "Complete tax forms and payment information",
            priority: "high",
            due_date: addDays(startDate, 1).toISOString().split("T")[0],
            order: 6
          }
        );
      }

      // Create all tasks
      await base44.entities.OnboardingTask.bulkCreate(defaultTasks);

      // Create default required documents
      const defaultDocuments = [
        {
          employee_id: employee.id,
          employee_name: employee.full_name,
          document_type: "employment_contract",
          title: "Employment Contract",
          is_required: true,
          due_date: addDays(startDate, 1).toISOString().split("T")[0],
        },
        {
          employee_id: employee.id,
          employee_name: employee.full_name,
          document_type: "w4_tax_form",
          title: "W-4 Tax Withholding Form",
          is_required: true,
          due_date: addDays(startDate, 3).toISOString().split("T")[0],
        },
        {
          employee_id: employee.id,
          employee_name: employee.full_name,
          document_type: "i9_form",
          title: "I-9 Employment Eligibility Verification",
          is_required: true,
          due_date: addDays(startDate, 3).toISOString().split("T")[0],
        },
        {
          employee_id: employee.id,
          employee_name: employee.full_name,
          document_type: "direct_deposit",
          title: "Direct Deposit Authorization",
          is_required: true,
          due_date: addDays(startDate, 5).toISOString().split("T")[0],
        },
        {
          employee_id: employee.id,
          employee_name: employee.full_name,
          document_type: "emergency_contact_form",
          title: "Emergency Contact Information",
          is_required: true,
          due_date: addDays(startDate, 2).toISOString().split("T")[0],
        }
      ];

      await base44.entities.OnboardingDocument.bulkCreate(defaultDocuments);

      // Update employee status to onboarding
      await base44.entities.Employee.update(employee.id, { status: "onboarding" });

      // Notify employee
      await base44.entities.Notification.create({
        type: "onboarding_started",
        title: "Welcome to the Team!",
        message: "Your onboarding process has started. Please check your tasks and documents.",
        recipient_id: employee.id,
        link: "/Onboarding"
      });

      onComplete();
    } catch (error) {
      alert("Failed to initiate onboarding");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-indigo-200 bg-indigo-50">
        <CardHeader>
          <CardTitle className="text-base">Initiate Onboarding for {employee.full_name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-700">
            Select which departments should receive automated onboarding tasks:
          </p>

          <div className="space-y-3">
            {Object.entries(selectedDepartments).map(([dept, selected]) => (
              <label key={dept} className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-slate-50">
                <Checkbox
                  checked={selected}
                  onCheckedChange={(checked) => 
                    setSelectedDepartments(prev => ({ ...prev, [dept]: checked }))
                  }
                />
                <div>
                  <p className="font-medium text-slate-900">{dept}</p>
                  <p className="text-xs text-slate-500">
                    {dept === "IT" && "Setup accounts, assign equipment"}
                    {dept === "HR" && "Welcome materials, orientation, benefits"}
                    {dept === "Finance" && "Payroll and tax forms"}
                  </p>
                </div>
              </label>
            ))}
          </div>

          <div className="pt-4 border-t">
            <Button
              onClick={handleInitiateOnboarding}
              disabled={loading || !Object.values(selectedDepartments).some(v => v)}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Initiating Onboarding...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Initiate Onboarding Process
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}