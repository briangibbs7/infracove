import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function DeemedExportReviewDialog({ open, onOpenChange, personnelRecord, employee }) {
  const [formData, setFormData] = useState({
    technology_description: "",
    eccn_classification: "",
    itar_category: "",
    license_type: "no_license_required",
    authorization_type: "license_exception",
    project_name: "",
    end_use: "",
    risk_assessment: "medium",
    review_notes: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();

  const { data: programs = [] } = useQuery({
    queryKey: ["compliancePrograms"],
    queryFn: () => base44.entities.ComplianceProgram.list(),
  });

  const { data: techPlans = [] } = useQuery({
    queryKey: ["technologyControlPlans"],
    queryFn: () => base44.entities.TechnologyControlPlan.list(),
  });

  const approveDeemedExport = async () => {
    setIsSubmitting(true);
    try {
      const user = await base44.auth.me();

      // Create deemed export record
      await base44.entities.DeemedExport.create({
        employee_id: employee.id,
        employee_name: employee.full_name,
        technology_description: formData.technology_description,
        eccn_classification: formData.eccn_classification,
        itar_category: formData.itar_category,
        license_type: formData.license_type,
        authorization_type: formData.authorization_type,
        foreign_national_country: personnelRecord.citizenship,
        release_date: new Date().toISOString().split('T')[0],
        project_name: formData.project_name,
        end_use: formData.end_use,
        risk_assessment: formData.risk_assessment,
        approved_by: user.id,
        approved_by_name: user.full_name,
        approval_date: new Date().toISOString().split('T')[0],
        status: "approved",
        review_notes: formData.review_notes
      });

      // Update personnel status
      await base44.entities.CompliancePersonnel.update(personnelRecord.id, {
        deemed_export_status: "approved"
      });

      queryClient.invalidateQueries({ queryKey: ["compliancePersonnel"] });
      queryClient.invalidateQueries({ queryKey: ["deemedExports"] });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error approving deemed export:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const denyDeemedExport = async () => {
    setIsSubmitting(true);
    try {
      await base44.entities.CompliancePersonnel.update(personnelRecord.id, {
        deemed_export_status: "denied",
        restrictions: formData.review_notes
      });

      queryClient.invalidateQueries({ queryKey: ["compliancePersonnel"] });
      onOpenChange(false);
    } catch (error) {
      console.error('Error denying deemed export:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Deemed Export Review</DialogTitle>
          <DialogDescription>
            Review deemed export requirements for {employee?.full_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Employee Info */}
          <div className="p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold mb-2">Employee Information</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-600">Name:</span>
                <p className="font-medium">{employee?.full_name}</p>
              </div>
              <div>
                <span className="text-slate-600">Citizenship:</span>
                <p className="font-medium">{personnelRecord?.citizenship || "N/A"}</p>
              </div>
              <div>
                <span className="text-slate-600">Visa Type:</span>
                <p className="font-medium">{personnelRecord?.visa_type || "N/A"}</p>
              </div>
              <div>
                <span className="text-slate-600">Clearance Level:</span>
                <Badge>{personnelRecord?.clearance_level || "none"}</Badge>
              </div>
            </div>
          </div>

          {/* Risk Flags */}
          {personnelRecord?.risk_factors && personnelRecord.risk_factors.length > 0 && (
            <div>
              <Label>Risk Factors</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {personnelRecord.risk_factors.map((factor, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs bg-red-50">
                    {factor}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Technology Details */}
          <div>
            <Label>Technology Description *</Label>
            <Textarea
              value={formData.technology_description}
              onChange={(e) => setFormData({ ...formData, technology_description: e.target.value })}
              placeholder="Describe the technology or technical data to be released..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>ECCN Classification</Label>
              <Input
                value={formData.eccn_classification}
                onChange={(e) => setFormData({ ...formData, eccn_classification: e.target.value })}
                placeholder="e.g., 3E002"
              />
            </div>
            <div>
              <Label>ITAR Category</Label>
              <Input
                value={formData.itar_category}
                onChange={(e) => setFormData({ ...formData, itar_category: e.target.value })}
                placeholder="e.g., VIII(h)"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>License Type</Label>
              <Select
                value={formData.license_type}
                onValueChange={(value) => setFormData({ ...formData, license_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_license_required">No License Required</SelectItem>
                  <SelectItem value="license_exception">License Exception</SelectItem>
                  <SelectItem value="export_license">Export License</SelectItem>
                  <SelectItem value="technical_assistance_agreement">TAA</SelectItem>
                  <SelectItem value="manufacturing_license">Manufacturing License</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Authorization Type</Label>
              <Select
                value={formData.authorization_type}
                onValueChange={(value) => setFormData({ ...formData, authorization_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fundamental_research">Fundamental Research</SelectItem>
                  <SelectItem value="public_domain">Public Domain</SelectItem>
                  <SelectItem value="license_exception">License Exception</SelectItem>
                  <SelectItem value="export_license">Export License</SelectItem>
                  <SelectItem value="taa">TAA</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Project Name</Label>
              <Input
                value={formData.project_name}
                onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Risk Assessment</Label>
              <Select
                value={formData.risk_assessment}
                onValueChange={(value) => setFormData({ ...formData, risk_assessment: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>End Use</Label>
            <Textarea
              value={formData.end_use}
              onChange={(e) => setFormData({ ...formData, end_use: e.target.value })}
              placeholder="Describe the intended end use of the technology..."
            />
          </div>

          <div>
            <Label>Review Notes</Label>
            <Textarea
              value={formData.review_notes}
              onChange={(e) => setFormData({ ...formData, review_notes: e.target.value })}
              placeholder="Add any review notes, conditions, or restrictions..."
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={denyDeemedExport}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
            Deny
          </Button>
          <Button 
            onClick={approveDeemedExport}
            disabled={isSubmitting || !formData.technology_description}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}