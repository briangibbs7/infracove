import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CreateTechPlanDialog({ open, onOpenChange, onSubmit }) {
  const [formData, setFormData] = useState({
    plan_name: "",
    technology_description: "",
    classification: "",
    plan_type: "internal",
    contractor_company: "",
    contractor_contact: "",
    contractor_email: "",
    contract_number: "",
    effective_date: "",
    expiration_date: "",
    review_frequency: "annual",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      status: "draft",
    });
    setFormData({
      plan_name: "",
      technology_description: "",
      classification: "",
      plan_type: "internal",
      contractor_company: "",
      contractor_contact: "",
      contractor_email: "",
      contract_number: "",
      effective_date: "",
      expiration_date: "",
      review_frequency: "annual",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Technology Control Plan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Plan Name</Label>
            <Input
              value={formData.plan_name}
              onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label>Technology Description</Label>
            <Textarea
              value={formData.technology_description}
              onChange={(e) => setFormData({ ...formData, technology_description: e.target.value })}
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Classification (ECCN/ITAR)</Label>
              <Input
                value={formData.classification}
                onChange={(e) => setFormData({ ...formData, classification: e.target.value })}
                placeholder="e.g., ITAR, EAR99, ECCN 3A001"
                required
              />
            </div>

            <div>
              <Label>Plan Type</Label>
              <Select value={formData.plan_type} onValueChange={(value) => setFormData({ ...formData, plan_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="external_contractor">External Contractor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.plan_type === "external_contractor" && (
            <>
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-4">
                <h4 className="font-semibold text-purple-900">Contractor Information</h4>
                
                <div>
                  <Label>Contractor Company</Label>
                  <Input
                    value={formData.contractor_company}
                    onChange={(e) => setFormData({ ...formData, contractor_company: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Primary Contact</Label>
                    <Input
                      value={formData.contractor_contact}
                      onChange={(e) => setFormData({ ...formData, contractor_contact: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Contact Email</Label>
                    <Input
                      type="email"
                      value={formData.contractor_email}
                      onChange={(e) => setFormData({ ...formData, contractor_email: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Contract Number</Label>
                  <Input
                    value={formData.contract_number}
                    onChange={(e) => setFormData({ ...formData, contract_number: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Effective Date</Label>
              <Input
                type="date"
                value={formData.effective_date}
                onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
              />
            </div>

            <div>
              <Label>Expiration Date</Label>
              <Input
                type="date"
                value={formData.expiration_date}
                onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Review Frequency</Label>
            <Select value={formData.review_frequency} onValueChange={(value) => setFormData({ ...formData, review_frequency: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="semi_annual">Semi-Annual</SelectItem>
                <SelectItem value="annual">Annual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Plan</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}