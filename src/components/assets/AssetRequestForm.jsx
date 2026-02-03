import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
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

const ASSET_TYPES = [
  "laptop",
  "desktop",
  "monitor",
  "phone",
  "tablet",
  "software_license",
  "server",
  "network_equipment",
  "other"
];

const PRIORITIES = ["low", "medium", "high", "urgent"];

export default function AssetRequestForm({ onSuccess, onCancel }) {
  const [user, setUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData(e.target);
      
      const data = {
        asset_type: formData.get("asset_type"),
        requested_item_name: formData.get("requested_item_name"),
        justification: formData.get("justification"),
        priority: formData.get("priority"),
        needed_by_date: formData.get("needed_by_date"),
        estimated_cost: formData.get("estimated_cost") ? parseFloat(formData.get("estimated_cost")) : undefined,
        notes: formData.get("notes"),
        requested_by: user?.id,
        requested_by_name: user?.full_name,
        requested_date: new Date().toISOString().split("T")[0],
        status: "pending"
      };

      await base44.entities.AssetRequest.create(data);
      
      // Create notification for IT admins
      await base44.entities.Notification.create({
        type: "asset_request",
        title: "New Asset Request",
        message: `${user?.full_name} requested a ${data.requested_item_name}`,
        priority: data.priority,
        link: "/Assets"
      });

      onSuccess();
    } catch (error) {
      console.error("Failed to create asset request:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="asset_type">Asset Type *</Label>
          <Select name="asset_type" required>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {ASSET_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority *</Label>
          <Select name="priority" defaultValue="medium" required>
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {priority.replace(/\b\w/g, (l) => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="requested_item_name">Item Name/Description *</Label>
          <Input
            id="requested_item_name"
            name="requested_item_name"
            required
            placeholder="e.g., MacBook Pro M3, Microsoft Office License"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="needed_by_date">Needed By Date</Label>
          <Input
            id="needed_by_date"
            name="needed_by_date"
            type="date"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimated_cost">Estimated Cost ($)</Label>
          <Input
            id="estimated_cost"
            name="estimated_cost"
            type="number"
            placeholder="Optional"
          />
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="justification">Business Justification *</Label>
          <Textarea
            id="justification"
            name="justification"
            required
            placeholder="Explain why you need this asset..."
            rows={3}
          />
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="notes">Additional Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            placeholder="Any additional information..."
            rows={2}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Request"}
        </Button>
      </div>
    </form>
  );
}