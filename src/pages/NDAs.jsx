import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogFooter,
} from "@/components/ui/dialog";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import NDAGenerator from "@/components/nda/NDAGenerator";
import { FileText, Upload, Download, Clock, AlertCircle, CheckCircle2, Filter, Send, Edit, Bell, Sparkles, Tag, FolderOpen } from "lucide-react";
import { format, parseISO, differenceInDays, addDays } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function NDAs() {
  const [user, setUser] = useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [selectedNDA, setSelectedNDA] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [signers, setSigners] = useState([{ name: "", email: "", role: "counterparty" }]);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: ndas = [], isLoading } = useQuery({
    queryKey: ["ndas"],
    queryFn: () => base44.entities.Contract.filter({ type: "nda" }, "-created_date"),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: signatures = [] } = useQuery({
    queryKey: ["ndaSignatures"],
    queryFn: () => base44.entities.NDASignature.list("-sent_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Contract.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ndas"] });
      setIsCreateDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Contract.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ndas"] });
      setIsDetailsDialogOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Contract.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ndas"] });
      setIsDetailsDialogOpen(false);
    },
  });

  const handleCreateNDA = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const ownerId = formData.get("owner");
    const ownerEmp = employees.find(emp => emp.id === ownerId);
    const tagsString = formData.get("tags");
    const tags = tagsString ? tagsString.split(',').map(t => t.trim()).filter(Boolean) : [];
    
    const data = {
      title: formData.get("title"),
      contract_number: formData.get("contract_number") || `NDA-${Date.now()}`,
      type: "nda",
      party_name: formData.get("party_name"),
      start_date: formData.get("start_date"),
      end_date: formData.get("end_date"),
      status: formData.get("status") || "draft",
      department: "Legal",
      owner: ownerId,
      owner_name: ownerEmp?.full_name,
      category: formData.get("category"),
      tags: tags,
      notes: formData.get("notes"),
    };

    createMutation.mutate(data);
  };

  const handleUpdateNDA = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const ownerId = formData.get("owner");
    const ownerEmp = employees.find(emp => emp.id === ownerId);
    
    const data = {
      status: formData.get("status"),
      end_date: formData.get("end_date"),
      owner: ownerId,
      owner_name: ownerEmp?.full_name,
      notes: formData.get("notes"),
    };

    updateMutation.mutate({ id: selectedNDA.id, data });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      updateMutation.mutate({
        id: selectedNDA.id,
        data: { file_url },
      });
    } catch (error) {
      alert("Failed to upload file");
    }
  };

  const handleSendForSignature = async (e) => {
    e.preventDefault();
    
    try {
      const response = await base44.functions.invoke('sendNDAForSignature', {
        ndaId: selectedNDA.id,
        ndaTitle: selectedNDA.title,
        signers: signers.filter(s => s.name && s.email)
      });

      alert(`NDA sent successfully to ${signers.filter(s => s.name && s.email).length} signer(s)`);
      queryClient.invalidateQueries({ queryKey: ["ndas"] });
      queryClient.invalidateQueries({ queryKey: ["ndaSignatures"] });
      setIsSendDialogOpen(false);
      setIsDetailsDialogOpen(false);
      setSigners([{ name: "", email: "", role: "counterparty" }]);
    } catch (error) {
      alert("Failed to send NDA for signature");
    }
  };

  const addSigner = () => {
    setSigners([...signers, { name: "", email: "", role: "counterparty" }]);
  };

  const removeSigner = (index) => {
    setSigners(signers.filter((_, i) => i !== index));
  };

  const updateSigner = (index, field, value) => {
    const updated = [...signers];
    updated[index][field] = value;
    setSigners(updated);
  };

  const getNDASignatures = (ndaId) => {
    return signatures.filter(sig => sig.nda_id === ndaId);
  };

  const handleGeneratedNDA = async (data) => {
    // Create NDA with generated content
    const ndaData = {
      title: `NDA - ${data.metadata.partyName}`,
      contract_number: `NDA-${Date.now()}`,
      type: "nda",
      party_name: data.metadata.partyName,
      start_date: data.metadata.effectiveDate,
      end_date: data.metadata.expiryDate || null,
      status: "draft",
      department: "Legal",
      owner: user?.id,
      owner_name: user?.full_name,
      notes: data.content
    };
    
    createMutation.mutate(ndaData);
    setIsGenerateDialogOpen(false);
  };

  const sendReminder = async (signatureId) => {
    try {
      await base44.functions.invoke('sendSignatureReminder', { signatureId });
      alert('Reminder sent successfully');
      queryClient.invalidateQueries({ queryKey: ["ndaSignatures"] });
    } catch (error) {
      alert('Failed to send reminder: ' + error.message);
    }
  };

  // Get unique categories and owners for filters
  const categories = [...new Set(ndas.map(n => n.category).filter(Boolean))];
  const owners = [...new Set(ndas.map(n => n.owner_name).filter(Boolean))];

  // Filter NDAs
  const filteredNDAs = ndas.filter(nda => {
    const statusMatch = statusFilter === "all" || nda.status === statusFilter;
    const categoryMatch = categoryFilter === "all" || nda.category === categoryFilter;
    const ownerMatch = ownerFilter === "all" || nda.owner_name === ownerFilter;
    const searchMatch = searchQuery === "" || 
      nda.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nda.party_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nda.contract_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nda.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nda.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return statusMatch && categoryMatch && ownerMatch && searchMatch;
  });

  // Stats
  const activeNDAs = ndas.filter(n => n.status === "active").length;
  const pendingNDAs = ndas.filter(n => n.status === "pending_signature" || n.status === "pending_review").length;
  const expiringNDAs = ndas.filter(n => {
    if (n.status === "active" && n.end_date) {
      const daysUntilExpiry = differenceInDays(parseISO(n.end_date), new Date());
      return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
    }
    return false;
  }).length;

  const getExpiryStatus = (nda) => {
    if (!nda.end_date || nda.status !== "active") return null;
    const daysUntilExpiry = differenceInDays(parseISO(nda.end_date), new Date());
    
    if (daysUntilExpiry < 0) return { type: "expired", days: Math.abs(daysUntilExpiry) };
    if (daysUntilExpiry <= 30) return { type: "expiring", days: daysUntilExpiry };
    return null;
  };

  return (
    <div>
      <PageHeader
        title="Non-Disclosure Agreements"
        subtitle={`${activeNDAs} active • ${pendingNDAs} pending • ${expiringNDAs} expiring soon`}
      >
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsGenerateDialogOpen(true)}
            className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate with AI
          </Button>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Create NDA
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Active NDAs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-emerald-600">{activeNDAs}</div>
              <CheckCircle2 className="w-8 h-8 text-emerald-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Pending Signature</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-amber-600">{pendingNDAs}</div>
              <Clock className="w-8 h-8 text-amber-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Expiring Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-red-600">{expiringNDAs}</div>
              <AlertCircle className="w-8 h-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 mb-6">
        <Input
          placeholder="Search NDAs by title, party, number, notes, or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
        
        <div className="flex flex-wrap gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending_review">Pending Review</SelectItem>
              <SelectItem value="pending_signature">Pending Signature</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>

          {categories.length > 0 && (
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {owners.length > 0 && (
            <Select value={ownerFilter} onValueChange={setOwnerFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by owner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Owners</SelectItem>
                {owners.map(owner => (
                  <SelectItem key={owner} value={owner}>{owner}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {isLoading ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12">
            <p className="text-center text-slate-500">Loading NDAs...</p>
          </CardContent>
        </Card>
      ) : filteredNDAs.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No NDAs found</h3>
            <p className="text-slate-500 mb-4">
              {searchQuery || statusFilter !== "all" 
                ? "Try adjusting your filters" 
                : "Create your first NDA to get started"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredNDAs.map(nda => {
            const expiryStatus = getExpiryStatus(nda);
            
            return (
              <Card 
                key={nda.id} 
                className={`border-0 shadow-sm hover:shadow-md transition-all cursor-pointer ${
                  expiryStatus?.type === "expired" ? "border-l-4 border-l-red-500" :
                  expiryStatus?.type === "expiring" ? "border-l-4 border-l-amber-500" : ""
                }`}
                onClick={() => {
                  setSelectedNDA(nda);
                  setIsDetailsDialogOpen(true);
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-slate-900">{nda.title}</h3>
                        <StatusBadge status={nda.status} />
                        {nda.category && (
                          <Badge variant="outline" className="text-xs">
                            <FolderOpen className="w-3 h-3 mr-1" />
                            {nda.category}
                          </Badge>
                        )}
                        {nda.tags?.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm mt-3">
                        <div>
                          <p className="text-slate-500">Party</p>
                          <p className="font-medium text-slate-900">{nda.party_name}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">NDA Number</p>
                          <p className="font-medium text-slate-900">{nda.contract_number}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Owner</p>
                          <p className="font-medium text-slate-900">{nda.owner_name || "Unassigned"}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Start Date</p>
                          <p className="font-medium text-slate-900">
                            {nda.start_date ? format(parseISO(nda.start_date), "MMM d, yyyy") : "N/A"}
                          </p>
                        </div>
                      </div>

                      {expiryStatus && (
                        <div className={`mt-3 text-sm flex items-center gap-2 ${
                          expiryStatus.type === "expired" ? "text-red-600" : "text-amber-600"
                        }`}>
                          <AlertCircle className="w-4 h-4" />
                          {expiryStatus.type === "expired" 
                            ? `Expired ${expiryStatus.days} days ago`
                            : `Expires in ${expiryStatus.days} days`
                          }
                        </div>
                      )}
                    </div>
                    
                    <FileText className="w-6 h-6 text-slate-400" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New NDA</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateNDA} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">NDA Title *</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Vendor NDA - Acme Corp"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="party_name">Party Name *</Label>
                <Input
                  id="party_name"
                  name="party_name"
                  placeholder="Company or individual name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contract_number">NDA Number</Label>
                <Input
                  id="contract_number"
                  name="contract_number"
                  placeholder="Auto-generated if empty"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  name="end_date"
                  type="date"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue="draft">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending_review">Pending Review</SelectItem>
                    <SelectItem value="pending_signature">Pending Signature</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner">Owner</Label>
                <Select name="owner">
                  <SelectTrigger>
                    <SelectValue placeholder="Select owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.filter(e => e.department === "Legal" || e.role === "admin").map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category/Project (optional)</Label>
              <Input
                id="category"
                name="category"
                placeholder="e.g., Vendor Partnerships, M&A, Client Projects"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (optional)</Label>
              <Input
                id="tags"
                name="tags"
                placeholder="Comma-separated tags for searchability"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Additional notes about this NDA..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                Create NDA
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>NDA Details</DialogTitle>
          </DialogHeader>
          {selectedNDA && (
            <div className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{selectedNDA.title}</h3>
                <div className="flex items-center gap-2">
                  <StatusBadge status={selectedNDA.status} />
                  <span className="text-sm text-slate-500">#{selectedNDA.contract_number}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500 mb-1">Party Name</p>
                  <p className="font-medium text-slate-900">{selectedNDA.party_name}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Owner</p>
                  <p className="font-medium text-slate-900">{selectedNDA.owner_name || "Unassigned"}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Start Date</p>
                  <p className="font-medium text-slate-900">
                    {selectedNDA.start_date ? format(parseISO(selectedNDA.start_date), "MMM d, yyyy") : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">End Date</p>
                  <p className="font-medium text-slate-900">
                    {selectedNDA.end_date ? format(parseISO(selectedNDA.end_date), "MMM d, yyyy") : "N/A"}
                  </p>
                </div>
              </div>

              {selectedNDA.notes && (
                <div>
                  <p className="text-slate-500 text-sm mb-1">Notes</p>
                  <p className="text-slate-900">{selectedNDA.notes}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <Label>Document</Label>
                  <div className="flex items-center gap-3">
                    {selectedNDA.file_url ? (
                      <a
                        href={selectedNDA.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-700 text-sm flex items-center gap-1"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </a>
                    ) : (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleFileUpload}
                          accept=".pdf,.doc,.docx"
                        />
                        <span className="text-indigo-600 hover:text-indigo-700 text-sm flex items-center gap-1">
                          <Upload className="w-4 h-4" />
                          Upload
                        </span>
                      </label>
                    )}
                  </div>
                </div>
                {selectedNDA.file_url && (
                  <div className="bg-emerald-50 p-3 rounded-lg text-sm text-emerald-700 flex items-center justify-between">
                    <span>✓ Document attached</span>
                    {(selectedNDA.status === "draft" || selectedNDA.status === "pending_review") && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setIsSendDialogOpen(true);
                          setIsDetailsDialogOpen(false);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send for Signature
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {getNDASignatures(selectedNDA.id).length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-slate-900 mb-3">Signature Status</h4>
                  <div className="space-y-2">
                    {getNDASignatures(selectedNDA.id).map(sig => (
                     <div key={sig.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                       <div className="flex-1">
                         <p className="font-medium text-slate-900">{sig.signer_name}</p>
                         <p className="text-sm text-slate-500">{sig.signer_email}</p>
                         {sig.reminder_count > 0 && (
                           <p className="text-xs text-slate-400 mt-1">
                             {sig.reminder_count} reminder(s) sent
                           </p>
                         )}
                       </div>
                       <div className="flex items-center gap-3">
                         <div className="text-right">
                           <StatusBadge status={sig.status} />
                           {sig.signed_date && (
                             <p className="text-xs text-slate-500 mt-1">
                               {format(parseISO(sig.signed_date), "MMM d, yyyy")}
                             </p>
                           )}
                         </div>
                         {(sig.status === 'pending' || sig.status === 'reminded') && (
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={(e) => {
                               e.stopPropagation();
                               sendReminder(sig.id);
                             }}
                           >
                             <Bell className="w-4 h-4 mr-1" />
                             Remind
                           </Button>
                         )}
                       </div>
                     </div>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleUpdateNDA} className="border-t pt-4 space-y-4">
                <h4 className="font-semibold text-slate-900">Update NDA</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue={selectedNDA.status}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="pending_review">Pending Review</SelectItem>
                        <SelectItem value="pending_signature">Pending Signature</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="terminated">Terminated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      name="end_date"
                      type="date"
                      defaultValue={selectedNDA.end_date}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="owner">Owner</Label>
                  <Select name="owner" defaultValue={selectedNDA.owner}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select owner" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.filter(e => e.department === "Legal" || e.role === "admin").map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    defaultValue={selectedNDA.notes}
                    rows={3}
                  />
                </div>

                <div className="flex justify-between gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this NDA?")) {
                        deleteMutation.mutate(selectedNDA.id);
                      }
                    }}
                  >
                    Delete
                  </Button>
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                      Update NDA
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Send NDA for Signature</DialogTitle>
          </DialogHeader>
          {selectedNDA && (
            <form onSubmit={handleSendForSignature} className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <h4 className="font-semibold text-slate-900">{selectedNDA.title}</h4>
                <p className="text-sm text-slate-500">#{selectedNDA.contract_number}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Signers</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addSigner}>
                    Add Signer
                  </Button>
                </div>

                {signers.map((signer, index) => (
                  <Card key={index} className="p-4 border-slate-200">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-sm text-slate-700">Signer {index + 1}</h5>
                        {signers.length > 1 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeSigner(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Name *</Label>
                          <Input
                            value={signer.name}
                            onChange={(e) => updateSigner(index, "name", e.target.value)}
                            placeholder="Full name"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Email *</Label>
                          <Input
                            type="email"
                            value={signer.email}
                            onChange={(e) => updateSigner(index, "email", e.target.value)}
                            placeholder="email@example.com"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Select 
                          value={signer.role} 
                          onValueChange={(value) => updateSigner(index, "role", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="company">Company Representative</SelectItem>
                            <SelectItem value="counterparty">External Party</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-900">
                <p><strong>Note:</strong> Each signer will receive an email with instructions to review and sign the NDA.</p>
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsSendDialogOpen(false);
                    setIsDetailsDialogOpen(true);
                    setSigners([{ name: "", email: "", role: "counterparty" }]);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                  <Send className="w-4 h-4 mr-2" />
                  Send for Signature
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate NDA with AI</DialogTitle>
          </DialogHeader>
          <NDAGenerator onComplete={handleGeneratedNDA} />
        </DialogContent>
      </Dialog>
    </div>
  );
}