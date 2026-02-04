import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { Plus, Edit, Archive, Target, Award } from "lucide-react";

const CATEGORIES = ["technical", "leadership", "communication", "analytical", "creative", "operational", "other"];
const DEPARTMENTS = ["all", "HR", "Finance", "Legal", "IT"];

export default function CompanySkills() {
  const [user, setUser] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: skills = [] } = useQuery({
    queryKey: ["companySkills"],
    queryFn: () => base44.entities.CompanySkill.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CompanySkill.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companySkills"] });
      setIsDialogOpen(false);
      setSelectedSkill(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CompanySkill.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companySkills"] });
      setIsDialogOpen(false);
      setSelectedSkill(null);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const data = {
      name: formData.get("name"),
      category: formData.get("category"),
      description: formData.get("description"),
      department: formData.get("department"),
      is_core: formData.get("is_core") === "on",
      status: formData.get("status") || "active",
      created_by_name: user?.full_name,
    };

    if (selectedSkill) {
      updateMutation.mutate({ id: selectedSkill.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredSkills = skills.filter(s => 
    categoryFilter === "all" || s.category === categoryFilter
  );

  const groupedSkills = filteredSkills.reduce((acc, skill) => {
    const cat = skill.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {});

  const activeSkills = skills.filter(s => s.status === "active").length;
  const coreSkills = skills.filter(s => s.is_core).length;

  const isAdmin = user?.role === "admin";

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">Admin access required</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Company Skills Management"
        subtitle={`${activeSkills} active skills • ${coreSkills} core skills`}
        action={() => {
          setSelectedSkill(null);
          setIsDialogOpen(true);
        }}
        actionLabel="Add Skill"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Total Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-slate-900">{skills.length}</div>
              <Target className="w-8 h-8 text-slate-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Active Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-emerald-600">{activeSkills}</div>
              <Award className="w-8 h-8 text-emerald-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Core Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-indigo-600">{coreSkills}</div>
              <Award className="w-8 h-8 text-indigo-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat} value={cat} className="capitalize">
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {Object.keys(groupedSkills).length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <Target className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No skills defined</h3>
            <p className="text-slate-500 mb-4">Start by adding company skills</p>
            <Button onClick={() => setIsDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Add First Skill
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedSkills).map(([category, categorySkills]) => (
            <Card key={category} className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg capitalize">{category}</CardTitle>
                  <Badge variant="outline">{categorySkills.length} skills</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categorySkills.map(skill => (
                    <div
                      key={skill.id}
                      className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer"
                      onClick={() => {
                        setSelectedSkill(skill);
                        setIsDialogOpen(true);
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-slate-900">{skill.name}</h4>
                        <Edit className="w-4 h-4 text-slate-400" />
                      </div>
                      <p className="text-sm text-slate-600 mb-3">{skill.description}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={skill.status} />
                        {skill.is_core && (
                          <Badge className="bg-amber-100 text-amber-700">Core</Badge>
                        )}
                        <Badge variant="outline">{skill.department}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedSkill ? "Edit Skill" : "Add Company Skill"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Skill Name *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={selectedSkill?.name}
                placeholder="e.g., JavaScript, Project Management"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select name="category" defaultValue={selectedSkill?.category || "technical"} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat} className="capitalize">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select name="department" defaultValue={selectedSkill?.department || "all"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(dept => (
                      <SelectItem key={dept} value={dept} className="capitalize">
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={selectedSkill?.description}
                placeholder="Brief description of the skill..."
                rows={3}
              />
            </div>

            {selectedSkill && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={selectedSkill?.status || "active"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Checkbox
                id="is_core"
                name="is_core"
                defaultChecked={selectedSkill?.is_core}
              />
              <Label htmlFor="is_core" className="cursor-pointer">
                Mark as core company skill
              </Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                {selectedSkill ? "Update" : "Create"} Skill
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}