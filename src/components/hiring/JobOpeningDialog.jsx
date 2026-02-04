import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function JobOpeningDialog({ isOpen, onClose, job }) {
  const [formData, setFormData] = useState({
    title: "",
    department: "IT",
    location: "",
    employment_type: "full_time",
    description: "",
    requirements: "",
    responsibilities: "",
    salary_range_min: "",
    salary_range_max: "",
    openings_count: 1,
    status: "draft",
    benefits: "",
  });

  const queryClient = useQueryClient();

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  useEffect(() => {
    if (job) {
      setFormData(job);
    } else {
      setFormData({
        title: "",
        department: "IT",
        location: "",
        employment_type: "full_time",
        description: "",
        requirements: "",
        responsibilities: "",
        salary_range_min: "",
        salary_range_max: "",
        openings_count: 1,
        status: "draft",
        benefits: "",
      });
    }
  }, [job]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.JobOpening.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobOpenings"] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.JobOpening.update(job.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobOpenings"] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const dataToSubmit = {
      ...formData,
      salary_range_min: formData.salary_range_min ? Number(formData.salary_range_min) : undefined,
      salary_range_max: formData.salary_range_max ? Number(formData.salary_range_max) : undefined,
    };

    if (job) {
      updateMutation.mutate(dataToSubmit);
    } else {
      createMutation.mutate(dataToSubmit);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{job ? "Edit Job Opening" : "Create Job Opening"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Job Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Department *</Label>
              <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Legal">Legal</SelectItem>
                  <SelectItem value="IT">IT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Employment Type</Label>
              <Select value={formData.employment_type} onValueChange={(value) => setFormData({ ...formData, employment_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">Full Time</SelectItem>
                  <SelectItem value="part_time">Part Time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Location</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            <div>
              <Label>Number of Openings</Label>
              <Input
                type="number"
                min="1"
                value={formData.openings_count}
                onChange={(e) => setFormData({ ...formData, openings_count: Number(e.target.value) })}
              />
            </div>

            <div>
              <Label>Salary Range Min</Label>
              <Input
                type="number"
                value={formData.salary_range_min}
                onChange={(e) => setFormData({ ...formData, salary_range_min: e.target.value })}
              />
            </div>

            <div>
              <Label>Salary Range Max</Label>
              <Input
                type="number"
                value={formData.salary_range_max}
                onChange={(e) => setFormData({ ...formData, salary_range_max: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="col-span-2">
              <Label>Requirements</Label>
              <Textarea
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                rows={3}
              />
            </div>

            <div className="col-span-2">
              <Label>Responsibilities</Label>
              <Textarea
                value={formData.responsibilities}
                onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                rows={3}
              />
            </div>

            <div className="col-span-2">
              <Label>Benefits</Label>
              <Textarea
                value={formData.benefits}
                onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                rows={2}
              />
            </div>

            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="filled">Filled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
              {job ? "Update" : "Create"} Job Opening
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}