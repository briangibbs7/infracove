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
import { format, isPast, parseISO, differenceInDays } from "date-fns";
import { Package, MoreVertical, Pencil, Trash2, Search, AlertTriangle, Laptop, Monitor, Smartphone, Server, HardDrive, TrendingDown, Key, FileText, CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import AssetDepreciationCard from "@/components/assets/AssetDepreciationCard";
import LicenseManagementCard from "@/components/assets/LicenseManagementCard";
import AssetRequestForm from "@/components/assets/AssetRequestForm";

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
  const [viewAsset, setViewAsset] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("assets");
  const queryClient = useQueryClient();

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["assets"],
    queryFn: () => base44.entities.Asset.list("-created_date"),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: assetRequests = [] } = useQuery({
    queryKey: ["assetRequests"],
    queryFn: () => base44.entities.AssetRequest.list("-created_date"),
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
    const assetType = formData.get("type");
    
    const data = {
      name: formData.get("name"),
      asset_tag: formData.get("asset_tag"),
      type: assetType,
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
      depreciation_method: formData.get("depreciation_method") || "straight_line",
      useful_life_years: formData.get("useful_life_years") ? parseInt(formData.get("useful_life_years")) : 3,
      salvage_value: formData.get("salvage_value") ? parseFloat(formData.get("salvage_value")) : 0,
    };

    // Add software license fields if applicable
    if (assetType === "software_license") {
      data.license_key = formData.get("license_key");
      data.license_expiry_date = formData.get("license_expiry_date");
      data.total_seats = formData.get("total_seats") ? parseInt(formData.get("total_seats")) : undefined;
      data.seats_in_use = formData.get("seats_in_use") ? parseInt(formData.get("seats_in_use")) : 0;
      data.renewal_cost = formData.get("renewal_cost") ? parseFloat(formData.get("renewal_cost")) : undefined;
    }

    if (editingAsset) {
      updateMutation.mutate({ id: editingAsset.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const updateRequestMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AssetRequest.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assetRequests"] });
    },
  });

  const handleApproveRequest = async (request) => {
    await updateRequestMutation.mutateAsync({
      id: request.id,
      data: { status: "approved", approved_by: user?.id, approved_by_name: user?.full_name, approved_date: new Date().toISOString().split("T")[0] }
    });

    // Notify requester
    await base44.entities.Notification.create({
      type: "asset_request_approved",
      title: "Asset Request Approved",
      message: `Your request for ${request.requested_item_name} has been approved`,
      recipient_id: request.requested_by,
      link: "/Assets"
    });
  };

  const handleRejectRequest = async (request, reason) => {
    await updateRequestMutation.mutateAsync({
      id: request.id,
      data: { status: "rejected", rejection_reason: reason, approved_by: user?.id, approved_by_name: user?.full_name }
    });

    // Notify requester
    await base44.entities.Notification.create({
      type: "asset_request_rejected",
      title: "Asset Request Rejected",
      message: `Your request for ${request.requested_item_name} was rejected`,
      recipient_id: request.requested_by,
      link: "/Assets"
    });
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
                setViewAsset(row);
                setIsViewDialogOpen(true);
              }}
            >
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </DropdownMenuItem>
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
  const softwareLicenses = assets.filter(a => a.type === "software_license");
  const expiringLicenses = softwareLicenses.filter(a => {
    if (!a.license_expiry_date) return false;
    const days = differenceInDays(parseISO(a.license_expiry_date), new Date());
    return days >= 0 && days <= 30;
  });

  const [user, setUser] = useState(null);
  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const isAdmin = user?.role === "admin";
  const pendingRequests = assetRequests.filter(r => r.status === "pending");

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
      >
        <Button
          onClick={() => setIsRequestDialogOpen(true)}
          variant="outline"
        >
          <FileText className="w-4 h-4 mr-2" />
          Request Asset
        </Button>
      </PageHeader>

      {/* Alert Banners */}
      {expiringLicenses.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <p className="font-medium text-amber-900">
              {expiringLicenses.length} software license{expiringLicenses.length > 1 ? "s" : ""} expiring soon
            </p>
            <p className="text-sm text-amber-700 mt-1">
              Review and renew licenses to avoid service interruptions
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="requests">
            Requests
            {pendingRequests.length > 0 && (
              <Badge className="ml-2 bg-red-500">{pendingRequests.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === "assets" && (
        <>
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
        </>
      )}

      {activeTab === "requests" && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            {assetRequests.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No asset requests"
                description="Submitted requests will appear here"
              />
            ) : (
              <div className="space-y-4">
                {assetRequests.map((request) => (
                  <Card key={request.id} className="border-slate-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-slate-900">{request.requested_item_name}</h3>
                            <StatusBadge status={request.status} />
                            <Badge variant="outline" className="capitalize">{request.priority}</Badge>
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{request.justification}</p>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span>Requested by: {request.requested_by_name}</span>
                            <span>Date: {request.requested_date && format(parseISO(request.requested_date), "MMM d, yyyy")}</span>
                            {request.needed_by_date && (
                              <span>Needed by: {format(parseISO(request.needed_by_date), "MMM d, yyyy")}</span>
                            )}
                            {request.estimated_cost && (
                              <span>Est. Cost: ${request.estimated_cost.toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                        {isAdmin && request.status === "pending" && (
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              onClick={() => handleApproveRequest(request)}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const reason = prompt("Rejection reason:");
                                if (reason) handleRejectRequest(request, reason);
                              }}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                      {request.rejection_reason && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-red-600">Rejection reason: {request.rejection_reason}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* View Asset Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewAsset?.name}</DialogTitle>
          </DialogHeader>
          {viewAsset && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Asset Tag</span>
                  <p className="font-medium">{viewAsset.asset_tag}</p>
                </div>
                <div>
                  <span className="text-slate-500">Type</span>
                  <p className="font-medium capitalize">{viewAsset.type?.replace(/_/g, " ")}</p>
                </div>
                <div>
                  <span className="text-slate-500">Status</span>
                  <StatusBadge status={viewAsset.status} />
                </div>
                <div>
                  <span className="text-slate-500">Assigned To</span>
                  <p className="font-medium">{viewAsset.assigned_to_name || "Unassigned"}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AssetDepreciationCard asset={viewAsset} />
                <LicenseManagementCard asset={viewAsset} />
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={() => {
                    setEditingAsset(viewAsset);
                    setIsViewDialogOpen(false);
                    setIsDialogOpen(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Asset
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Asset Request Dialog */}
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request New Asset</DialogTitle>
          </DialogHeader>
          <AssetRequestForm
            onSuccess={() => setIsRequestDialogOpen(false)}
            onCancel={() => setIsRequestDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Add/Edit Asset Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAsset ? "Edit Asset" : "Add New Asset"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="financial">Financial</TabsTrigger>
                <TabsTrigger value="license">License</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
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
              </TabsContent>

              <TabsContent value="financial" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="depreciation_method">Depreciation Method</Label>
                    <Select name="depreciation_method" defaultValue={editingAsset?.depreciation_method || "straight_line"}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="straight_line">Straight Line</SelectItem>
                        <SelectItem value="declining_balance">Declining Balance</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="useful_life_years">Useful Life (Years)</Label>
                    <Input
                      id="useful_life_years"
                      name="useful_life_years"
                      type="number"
                      defaultValue={editingAsset?.useful_life_years || 3}
                      min="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="salvage_value">Salvage Value ($)</Label>
                    <Input
                      id="salvage_value"
                      name="salvage_value"
                      type="number"
                      defaultValue={editingAsset?.salvage_value || 0}
                      min="0"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="license" className="space-y-4 mt-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    These fields are only applicable for software licenses
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="license_key">License Key</Label>
                    <Input
                      id="license_key"
                      name="license_key"
                      defaultValue={editingAsset?.license_key}
                      placeholder="XXXX-XXXX-XXXX-XXXX"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="license_expiry_date">License Expiry Date</Label>
                    <Input
                      id="license_expiry_date"
                      name="license_expiry_date"
                      type="date"
                      defaultValue={editingAsset?.license_expiry_date}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="renewal_cost">Annual Renewal Cost ($)</Label>
                    <Input
                      id="renewal_cost"
                      name="renewal_cost"
                      type="number"
                      defaultValue={editingAsset?.renewal_cost}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="total_seats">Total Seats/Licenses</Label>
                    <Input
                      id="total_seats"
                      name="total_seats"
                      type="number"
                      defaultValue={editingAsset?.total_seats}
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seats_in_use">Seats Currently In Use</Label>
                    <Input
                      id="seats_in_use"
                      name="seats_in_use"
                      type="number"
                      defaultValue={editingAsset?.seats_in_use || 0}
                      min="0"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
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