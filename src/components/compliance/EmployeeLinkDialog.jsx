import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Link as LinkIcon } from "lucide-react";

export default function EmployeeLinkDialog({ open, onOpenChange, employee, programs }) {
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedRole, setSelectedRole] = useState("subject_to");
  const [isLinking, setIsLinking] = useState(false);

  const queryClient = useQueryClient();

  const linkEmployee = async () => {
    setIsLinking(true);
    try {
      // Get or create compliance personnel record
      const syncResponse = await base44.functions.invoke('syncEmployeeToCompliance', {
        employee_id: employee.id
      });

      if (!syncResponse.data.success) {
        throw new Error('Failed to sync employee');
      }

      const personnelRecord = syncResponse.data.personnelRecord;
      const program = programs.find(p => p.id === selectedProgram);

      // Update authorized programs
      const existingPrograms = personnelRecord.authorized_programs || [];
      const updatedPrograms = [
        ...existingPrograms,
        {
          program_id: selectedProgram,
          program_name: program.program_name,
          role: selectedRole,
          assigned_date: new Date().toISOString().split('T')[0]
        }
      ];

      await base44.entities.CompliancePersonnel.update(personnelRecord.id, {
        authorized_programs: updatedPrograms
      });

      queryClient.invalidateQueries({ queryKey: ["compliancePersonnel"] });
      onOpenChange(false);
      setSelectedProgram("");
      setSelectedRole("subject_to");
    } catch (error) {
      console.error('Error linking employee:', error);
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link Employee to Program</DialogTitle>
          <DialogDescription>
            Link {employee?.full_name} to a compliance program
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Compliance Program</Label>
            <Select value={selectedProgram} onValueChange={setSelectedProgram}>
              <SelectTrigger>
                <SelectValue placeholder="Select program" />
              </SelectTrigger>
              <SelectContent>
                {programs.map((program) => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.program_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="responsible">Responsible For</SelectItem>
                <SelectItem value="subject_to">Subject To</SelectItem>
                <SelectItem value="reviewer">Reviewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={linkEmployee} 
            disabled={!selectedProgram || isLinking}
          >
            {isLinking ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Linking...
              </>
            ) : (
              <>
                <LinkIcon className="w-4 h-4 mr-2" />
                Link Employee
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}