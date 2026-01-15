import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { format, isPast, parseISO } from "date-fns";
import { Package, MoreVertical, Pencil, Trash2, Search, AlertTriangle, Laptop, Monitor, Smartphone, Server, HardDrive } from "lucide-react";

const ASSET_TYPES = ["laptop", "desktop", "monitor", "phone", "tablet", "software_license", "server", "network_equipment", "other"];
const STATUSES = ["available", "assigned", "maintenance", "retired"];
const DEPARTMENTS = ["HR", "Finance", "Sales", "Legal", "IT", "Marketing", "Operations", "Executive"];

const typeIcons = {
  laptop: Laptop,
  desktop: Monitor,
  monitor: Monitor,
  phone: Smartphone,
  tablet: Smartphone,
  server: Server,
  network_equipment: HardDrive,
};

export default function Assets() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const queryClient = useQueryClient();

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["assets"],
    queryFn: () => base44.entities.Asset.list("-created_date"),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Asset.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      setIsDialogOpen(false);
      setEditingAsset(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Asset.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      setIsDialogOpen(false);
      setEditingAsset(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Asset.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assets"] }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const assignee = employees.find((emp) => emp.id === formData.get("assigned_to"));
    
    const data = {
      name: formData.get("name"),
      asset_tag: formData.get("asset_tag"),
      type: formData.get("type"),
      manufacturer: formData.get("manufacturer"),
      model: formData.get("model"),
      serial_number: formData.get("serial_number"),
      purchase_date: formData.get("purchase_date"),
      purchase_cost: formData.get("purchase_cost") ? parseFloat(formData.get("purchase_cost")) : undefined,
      warranty_expiry: formData.get("warranty_expiry"),
      assigned_to: formData.get("assigned_to") || null,
      assigned_to_name: assignee?.full_name || null,
      department: formData.get("department"),
      status: formData.get("assigned_to") ? "assigned" : (formData.get("status") || "available"),
      location: formData.get("location"),
      notes: formData.get("notes"),
    };

    if (editingAsset) {
      updateMutation.mutate({ id: editingAsset.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.asset_tag?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.serial_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || asset.type === filterType;
    return matchesSearch && matchesType;
  });

  const columns = [
    {
      header: "Asset",
      cell: (row) => {
        const Icon = typeIcons[row.type] || Package;
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
              <Icon className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">{row.name}</p>
              <p className="text-sm text-slate-500">{row.asset_tag}</p>
            </div>
          </div>
        );
      },
    },
    {
      header: "Type",
      accessor: "type",
      cell: (row) => (
        <span className="text-sm capitalize">{row.type?.replace(/_/g, " ")}</span>
      ),
    },
    {
      header: "Manufacturer",
      cell: (row) => (
        <div>
          <p className="text-sm">{row.manufacturer || "-"}</p>
          <p className="text-xs text-slate-500">{row.model}</p>
        </div>
      ),
    },
    {
      header: "Assigned To",
      accessor: "assigned_to_name",
      cell: (row) => (
        <span className="text-sm">{row.assigned_to_name || "-"}</span>
      ),
    },
    {
      header: "Warranty",
      accessor: "warranty_expiry",
      cell: (row) => {
        if (!row.warranty_expiry) return "-";
        const isExpired = isPast(parseISO(row.warranty_expiry));
        return (
          <div className="flex items-center gap-2">
            <span className={isExpired ? "text-red-600" : ""}>
              {format(new Date(row.warranty_expiry), "MMM d, yyyy")}
            </span>
            {isExpired && <AlertTriangle className="w-4 h-4 text-red-500" />}
          </div>
        );
      },
    },
    {
      header: "Status",
      accessor: "status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: "",
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setEditingAsset(row);
                setIsDialogOpen(true);
              }}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => deleteMutation.mutate(row.id)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const totalValue = assets.reduce((sum, a) => sum + (a.purchase_cost || 0), 0);

  return (
    <div>
      <PageHeader
        title="IT Assets"
        subtitle={`${assets.length} assets • $${totalValue.toLocaleString()} total value`}
        action={() => {
          setEditingAsset(null);
          setIsDialogOpen(true);
        }}
        actionLabel="Add Asset"
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {ASSET_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-0 shadow-sm">
        {filteredAssets.length === 0 && !isLoading ? (
          <EmptyState
            icon={Package}
            title="No assets found"
            description="Start tracking your IT equipment"
            action={() => setIsDialogOpen(true)}
            actionLabel="Add Asset"
          />
        ) : (
          <DataTable columns={columns} data={filteredAssets} isLoading={isLoading} />
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAsset ? "Edit Asset" : "Add New Asset"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Asset Name *</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingAsset?.name}
                  required
                  placeholder="e.g., MacBook Pro 14"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset_tag">Asset Tag *</Label>
                <Input
                  id="asset_tag"
                  name="asset_tag"
                  defaultValue={editingAsset?.asset_tag}
                  required
                  placeholder="e.g., IT-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select name="type" defaultValue={editingAsset?.type}>
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
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  name="manufacturer"
                  defaultValue={editingAsset?.manufacturer}
                  placeholder="e.g., Apple"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  name="model"
                  defaultValue={editingAsset?.model}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serial_number">Serial Number</Label>
                <Input
                  id="serial_number"
                  name="serial_number"
                  defaultValue={editingAsset?.serial_number}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchase_date">Purchase Date</Label>
                <Input
                  id="purchase_date"
                  name="purchase_date"
                  type="date"
                  defaultValue={editingAsset?.purchase_date}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchase_cost">Purchase Cost ($)</Label>
                <Input
                  id="purchase_cost"
                  name="purchase_cost"
                  type="number"
                  defaultValue={editingAsset?.purchase_cost}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warranty_expiry">Warranty Expiry</Label>
                <Input
                  id="warranty_expiry"
                  name="warranty_expiry"
                  type="date"
                  defaultValue={editingAsset?.warranty_expiry}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select name="department" defaultValue={editingAsset?.department}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assigned_to">Assigned To</Label>
                <Select name="assigned_to" defaultValue={editingAsset?.assigned_to}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Unassigned</SelectItem>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={editingAsset?.status || "available"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  defaultValue={editingAsset?.location}
                  placeholder="e.g., HQ - Floor 2"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={editingAsset?.notes}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                {editingAsset ? "Update" : "Create"} Asset
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}