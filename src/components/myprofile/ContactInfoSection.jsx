import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { Pencil, Save, X, Phone, MapPin, User } from "lucide-react";
import toast from "react-hot-toast";

export default function ContactInfoSection({ employee, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    phone: employee?.phone || "",
    location: employee?.location || "",
    bio: employee?.bio || "",
  });

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Employee.update(employee.id, form);
    await base44.auth.updateMe({ phone: form.phone });
    toast.success("Contact info updated!");
    setSaving(false);
    setEditing(false);
    onUpdated?.();
  };

  const handleCancel = () => {
    setForm({ phone: employee?.phone || "", location: employee?.location || "", bio: employee?.bio || "" });
    setEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-500" />
            Contact Information
          </div>
          {!editing && (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="w-3 h-3 mr-1" /> Edit
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {editing ? (
          <>
            <div className="space-y-1">
              <Label>Phone Number</Label>
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 (555) 000-0000" />
            </div>
            <div className="space-y-1">
              <Label>Location / Office</Label>
              <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Phoenix, AZ" />
            </div>
            <div className="space-y-1">
              <Label>Bio</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                placeholder="Tell your colleagues a little about yourself..."
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
                <Save className="w-3 h-3 mr-1" />{saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-3 h-3 mr-1" />Cancel
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">{employee?.phone || <span className="text-slate-400 italic">Not set</span>}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">{employee?.location || <span className="text-slate-400 italic">Not set</span>}</span>
            </div>
            {employee?.bio && (
              <p className="text-slate-600 pt-1 border-t">{employee.bio}</p>
            )}
            {!employee?.bio && (
              <p className="text-slate-400 italic text-xs">No bio added yet.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}