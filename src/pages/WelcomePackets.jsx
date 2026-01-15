import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import DataTable from "@/components/ui/DataTable";
import EmptyState from "@/components/ui/EmptyState";
import { FileText, Upload, Send, Eye, Pencil, Trash2, Plus } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function WelcomePackets() {
  const [user, setUser] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPacket, setEditingPacket] = useState(null);
  const [uploading, setUploading] = useState({});
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: packets = [], isLoading } = useQuery({
    queryKey: ["welcomePackets"],
    queryFn: () => base44.entities.WelcomePacket.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.WelcomePacket.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["welcomePackets"] });
      setIsDialogOpen(false);
      setEditingPacket(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WelcomePacket.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["welcomePackets"] });
      setIsDialogOpen(false);
      setEditingPacket(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.WelcomePacket.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["welcomePackets"] }),
  });

  const handleFileUpload = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(prev => ({ ...prev, [fieldName]: true }));
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      document.getElementById(fieldName).value = file_url;
    } catch (error) {
      alert("Failed to upload file");
    } finally {
      setUploading(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const data = {
      employee_name: formData.get("employee_name"),
      company_handbook_url: formData.get("company_handbook_url"),
      benefits_information_url: formData.get("benefits_information_url"),
      it_policies_url: formData.get("it_policies_url"),
      status: formData.get("status"),
      notes: formData.get("notes"),
    };

    if (editingPacket) {
      updateMutation.mutate({ id: editingPacket.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleSendPacket = async (packet) => {
    try {
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: `Welcome Packet for ${packet.employee_name}`,
        body: `
Welcome Packet for ${packet.employee_name}

${packet.company_handbook_url ? `Company Handbook: ${packet.company_handbook_url}` : ''}
${packet.benefits_information_url ? `Benefits Information: ${packet.benefits_information_url}` : ''}
${packet.it_policies_url ? `IT Policies: ${packet.it_policies_url}` : ''}

${packet.notes ? `Notes:\n${packet.notes}` : ''}

Please review all materials before your start date.
        `
      });

      await updateMutation.mutateAsync({
        id: packet.id,
        data: { 
          ...packet, 
          status: 'sent',
          sent_date: new Date().toISOString().split('T')[0]
        }
      });

      alert('Welcome packet sent!');
    } catch (error) {
      alert('Failed to send packet');
    }
  };

  const columns = [
    {
      header: "Employee",
      accessor: "employee_name",
      cell: (row) => (
        <div className="font-medium text-slate-900">{row.employee_name}</div>
      ),
    },
    {
      header: "Documents",
      cell: (row) => (
        <div className="flex gap-2 flex-wrap">
          {row.company_handbook_url && <StatusBadge status="Handbook" />}
          {row.benefits_information_url && <StatusBadge status="Benefits" />}
          {row.it_policies_url && <StatusBadge status="IT Policies" />}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: "Sent Date",
      accessor: "sent_date",
      cell: (row) => row.sent_date ? format(parseISO(row.sent_date), "MMM d, yyyy") : "-",
    },
    {
      header: "Actions",
      cell: (row) => (
        <div className="flex gap-2">
          {row.status !== 'sent' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSendPacket(row)}
            >
              <Send className="w-4 h-4 mr-1" />
              Send
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setEditingPacket(row);
              setIsDialogOpen(true);
            }}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => deleteMutation.mutate(row.id)}
            className="text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Welcome Packets"
        subtitle="Manage new employee welcome materials"
        action={() => setIsDialogOpen(true)}
        actionLabel="Create Packet"
      />

      {isLoading ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12">
            <p className="text-center text-slate-500">Loading welcome packets...</p>
          </CardContent>
        </Card>
      ) : packets.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No welcome packets"
          description="Create welcome packets with company handbooks, benefits info, and IT policies"
          action={() => setIsDialogOpen(true)}
          actionLabel="Create First Packet"
        />
      ) : (
        <Card className="border-0 shadow-sm">
          <DataTable columns={columns} data={packets} />
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPacket ? "Edit" : "Create"} Welcome Packet</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employee_name">Employee Name *</Label>
              <Input
                id="employee_name"
                name="employee_name"
                defaultValue={editingPacket?.employee_name}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_handbook_url">Company Handbook</Label>
              <div className="flex gap-2">
                <Input
                  id="company_handbook_url"
                  name="company_handbook_url"
                  defaultValue={editingPacket?.company_handbook_url}
                  placeholder="Enter URL or upload file"
                />
                <label>
                  <Button type="button" variant="outline" disabled={uploading.handbook} asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading.handbook ? "Uploading..." : "Upload"}
                    </span>
                  </Button>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, "company_handbook_url")}
                    accept=".pdf,.doc,.docx"
                  />
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="benefits_information_url">Benefits Information</Label>
              <div className="flex gap-2">
                <Input
                  id="benefits_information_url"
                  name="benefits_information_url"
                  defaultValue={editingPacket?.benefits_information_url}
                  placeholder="Enter URL or upload file"
                />
                <label>
                  <Button type="button" variant="outline" disabled={uploading.benefits} asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading.benefits ? "Uploading..." : "Upload"}
                    </span>
                  </Button>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, "benefits_information_url")}
                    accept=".pdf,.doc,.docx"
                  />
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="it_policies_url">IT Policies</Label>
              <div className="flex gap-2">
                <Input
                  id="it_policies_url"
                  name="it_policies_url"
                  defaultValue={editingPacket?.it_policies_url}
                  placeholder="Enter URL or upload file"
                />
                <label>
                  <Button type="button" variant="outline" disabled={uploading.policies} asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading.policies ? "Uploading..." : "Upload"}
                    </span>
                  </Button>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, "it_policies_url")}
                    accept=".pdf,.doc,.docx"
                  />
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={editingPacket?.notes}
                placeholder="Additional information..."
              />
            </div>

            <input type="hidden" name="status" value={editingPacket?.status || "draft"} />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setEditingPacket(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                {editingPacket ? "Update" : "Create"} Packet
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}