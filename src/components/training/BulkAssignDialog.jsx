import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

export default function BulkAssignDialog({ course, employees, onSubmit, onCancel }) {
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [dueDate, setDueDate] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");

  const handleToggleEmployee = (empId) => {
    setSelectedEmployees(prev =>
      prev.includes(empId)
        ? prev.filter(id => id !== empId)
        : [...prev, empId]
    );
  };

  const handleToggleAll = (filtered) => {
    if (selectedEmployees.length === filtered.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filtered.map(e => e.id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(selectedEmployees, dueDate);
  };

  const activeEmployees = employees.filter(e => e.status === "active");
  const filteredEmployees = filterDepartment === "all"
    ? activeEmployees
    : activeEmployees.filter(e => e.department === filterDepartment);

  const departments = [...new Set(activeEmployees.map(e => e.department))];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-indigo-50 p-4 rounded-lg">
        <h3 className="font-semibold text-indigo-900">{course.title}</h3>
        <p className="text-sm text-indigo-700 mt-1">{course.description}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="due_date">Due Date</Label>
        <Input
          id="due_date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Select Employees ({selectedEmployees.length} selected)</Label>
          <div className="flex gap-2">
            {departments.map(dept => (
              <Badge
                key={dept}
                variant={filterDepartment === dept ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setFilterDepartment(filterDepartment === dept ? "all" : dept)}
              >
                {dept}
              </Badge>
            ))}
          </div>
        </div>

        <div className="border rounded-lg p-3 max-h-64 overflow-y-auto space-y-2">
          <div className="flex items-center gap-2 pb-2 border-b sticky top-0 bg-white">
            <Checkbox
              checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0}
              onCheckedChange={() => handleToggleAll(filteredEmployees)}
            />
            <span className="text-sm font-medium">Select All ({filteredEmployees.length})</span>
          </div>

          {filteredEmployees.map((employee) => (
            <div key={employee.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded">
              <Checkbox
                checked={selectedEmployees.includes(employee.id)}
                onCheckedChange={() => handleToggleEmployee(employee.id)}
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">{employee.full_name}</p>
                <p className="text-xs text-slate-500">{employee.department} • {employee.job_title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700"
          disabled={selectedEmployees.length === 0}
        >
          <Users className="w-4 h-4 mr-2" />
          Assign to {selectedEmployees.length} {selectedEmployees.length === 1 ? "Employee" : "Employees"}
        </Button>
      </div>
    </form>
  );
}