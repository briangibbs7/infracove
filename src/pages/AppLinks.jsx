import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, ExternalLink, Edit, Trash2, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/ui/PageHeader";

export default function AppLinks() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    url: "",
    thumbnail_url: "",
    icon: "Grid",
    category: "other",
    department: "all",
    is_featured: false,
    requires_login: false,
    is_active: true,
  });

  const queryClient = useQueryClient();

  const { data: appLinks = [] } = useQuery({
    queryKey: ["appLinks"],
    queryFn: () => base44.entities.AppLink.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AppLink.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appLinks"] });
      handleCloseDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AppLink.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appLinks"] });
      handleCloseDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AppLink.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appLinks"] });
    },
  });

  const handleOpenDialog = (app = null) => {
    if (app) {
      setEditingApp(app);
      setFormData(app);
    } else {
      setEditingApp(null);
      setFormData({
        name: "",
        description: "",
        url: "",
        thumbnail_url: "",
        icon: "Grid",
        category: "other",
        department: "all",
        is_featured: false,
        requires_login: false,
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingApp(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingApp) {
      updateMutation.mutate({ id: editingApp.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="App Links Management"
        subtitle="Manage company applications and integrations"
        actionLabel="Add App"
        actionIcon={Plus}
        onActionClick={() => handleOpenDialog()}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {appLinks.map((app) => (
          <Card key={app.id}>
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-slate-200 flex items-center justify-center shrink-0">
                  {app.thumbnail_url ? (
                    <img src={app.thumbnail_url} alt={app.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs">
                      {app.icon || "App"}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base flex items-center gap-2">
                    {app.name}
                    {app.is_featured && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                  </CardTitle>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-xs capitalize">{app.category}</Badge>
                    {!app.is_active && <Badge variant="outline" className="text-xs bg-red-50 text-red-700">Inactive</Badge>}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-3 line-clamp-2">{app.description}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(app.url, "_blank")}
                  className="flex-1"
                >
                  <ExternalLink className="w-3 h-3 mr-2" />
                  Open
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenDialog(app)}
                >
                  <Edit className="w-3 h-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm(`Delete ${app.name}?`)) {
                      deleteMutation.mutate(app.id);
                    }
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingApp ? "Edit App" : "Add New App"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>App Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Google Drive, Slack"
                required
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the app"
                rows={2}
              />
            </div>

            <div>
              <Label>URL *</Label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://..."
                required
              />
            </div>

            <div>
              <Label>Thumbnail URL (Logo Image)</Label>
              <Input
                value={formData.thumbnail_url}
                onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                placeholder="https://logo.clearbit.com/google.com"
              />
              <p className="text-xs text-slate-500 mt-1">
                Tip: Use <a href="https://logo.clearbit.com" target="_blank" className="text-blue-600 hover:underline">logo.clearbit.com/domain.com</a> for company logos
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="productivity">Productivity</SelectItem>
                    <SelectItem value="communication">Communication</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Department</Label>
                <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Legal">Legal</SelectItem>
                    <SelectItem value="IT">IT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Featured (Show on homepage)</Label>
                <Switch
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Requires Login</Label>
                <Switch
                  checked={formData.requires_login}
                  onCheckedChange={(checked) => setFormData({ ...formData, requires_login: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">{editingApp ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}