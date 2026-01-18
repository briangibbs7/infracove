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
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "@/components/ui/StatusBadge";
import { format, parseISO } from "date-fns";
import {
  User,
  Calendar,
  FileText,
  DollarSign,
  Download,
  CheckCircle2,
  Plus,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Shield,
  MessageCircle,
  Award
} from "lucide-react";
import MessagingDialog from "@/components/communications/MessagingDialog";
import SkillsSection from "@/components/portal/SkillsSection";

export default function EmployeePortal() {
  const [user, setUser] = useState(null);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [isTimeOffDialogOpen, setIsTimeOffDialogOpen] = useState(false);
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);
  const [messagingRecipient, setMessagingRecipient] = useState(null);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: timeOffRequests = [] } = useQuery({
    queryKey: ["timeOffRequests"],
    queryFn: () => base44.entities.TimeOffRequest.list("-created_date"),
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["companyDocuments"],
    queryFn: () => base44.entities.CompanyDocument.filter({ status: "active" }),
  });

  const { data: payslips = [] } = useQuery({
    queryKey: ["payslips"],
    queryFn: () => base44.entities.Payslip.list("-pay_date"),
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ["contracts"],
    queryFn: () => base44.entities.Contract.list(),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", currentEmployee?.id],
    queryFn: async () => {
      if (!currentEmployee) return [];
      const sent = await base44.entities.Message.filter({ sender_id: currentEmployee.id });
      const received = await base44.entities.Message.filter({ recipient_id: currentEmployee.id });
      return [...sent, ...received];
    },
    enabled: !!currentEmployee,
  });

  useEffect(() => {
    if (user && employees.length > 0) {
      const emp = employees.find(e => e.email === user.email);
      setCurrentEmployee(emp);
      setEmergencyContacts(emp?.emergency_contacts || []);
    }
  }, [user, employees]);

  const updateEmployeeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Employee.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });

  const createTimeOffMutation = useMutation({
    mutationFn: (data) => base44.entities.TimeOffRequest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeOffRequests"] });
      setIsTimeOffDialogOpen(false);
    },
  });

  const acknowledgeDocumentMutation = useMutation({
    mutationFn: ({ docId, acknowledgments }) => 
      base44.entities.CompanyDocument.update(docId, { acknowledged_by: acknowledgments }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyDocuments"] });
    },
  });

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    updateEmployeeMutation.mutate({
      id: currentEmployee.id,
      data: {
        phone: formData.get("phone"),
        location: formData.get("location"),
        emergency_contacts: emergencyContacts,
      },
    });
  };

  const handleAddEmergencyContact = () => {
    setEmergencyContacts([...emergencyContacts, { name: "", phone: "", relationship: "", is_primary: false }]);
  };

  const handleUpdateEmergencyContact = (index, field, value) => {
    const updated = [...emergencyContacts];
    updated[index][field] = value;
    setEmergencyContacts(updated);
  };

  const handleRemoveEmergencyContact = (index) => {
    setEmergencyContacts(emergencyContacts.filter((_, i) => i !== index));
  };

  const handleSubmitTimeOff = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const startDate = formData.get("start_date");
    const endDate = formData.get("end_date");
    
    const daysDiff = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;

    createTimeOffMutation.mutate({
      employee_id: currentEmployee.id,
      employee_name: currentEmployee.full_name,
      type: formData.get("type"),
      start_date: startDate,
      end_date: endDate,
      days_requested: daysDiff,
      reason: formData.get("reason"),
      status: "pending_approval",
    });
  };

  const handleAcknowledgeDocument = (doc) => {
    const alreadyAcknowledged = doc.acknowledged_by?.some(ack => ack.employee_id === currentEmployee.id);
    if (alreadyAcknowledged) return;

    const newAcknowledgment = {
      employee_id: currentEmployee.id,
      employee_name: currentEmployee.full_name,
      acknowledged_date: new Date().toISOString().split('T')[0],
    };

    acknowledgeDocumentMutation.mutate({
      docId: doc.id,
      acknowledgments: [...(doc.acknowledged_by || []), newAcknowledgment],
    });
  };

  if (!currentEmployee) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Employee Profile Not Found</h2>
          <p className="text-slate-500">Please contact HR to set up your employee profile.</p>
        </div>
      </div>
    );
  }

  const myTimeOffRequests = timeOffRequests.filter(r => r.employee_id === currentEmployee.id);
  const myPayslips = payslips.filter(p => p.employee_id === currentEmployee.id);
  const myContract = contracts.find(c => 
    c.type === "employment" && 
    (c.party_name === currentEmployee.full_name || c.title?.includes(currentEmployee.full_name))
  );
  const relevantDocuments = documents.filter(d => 
    d.department === "all" || d.department === currentEmployee.department
  );

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome, {currentEmployee.full_name}! 👋</h1>
        <p className="text-indigo-100">{currentEmployee.job_title} • {currentEmployee.department}</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile">
            <User className="w-4 h-4 mr-2" />
            My Profile
          </TabsTrigger>
          <TabsTrigger value="skills">
            <Award className="w-4 h-4 mr-2" />
            Skills
          </TabsTrigger>
          <TabsTrigger value="messages">
            <MessageCircle className="w-4 h-4 mr-2" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="timeoff">
            <Calendar className="w-4 h-4 mr-2" />
            Time Off
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="w-4 h-4 mr-2" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="payroll">
            <DollarSign className="w-4 h-4 mr-2" />
            Payroll
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={currentEmployee.full_name} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={currentEmployee.email} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      defaultValue={currentEmployee.phone}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      defaultValue={currentEmployee.location}
                      placeholder="City, State"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-base">Emergency Contacts</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddEmergencyContact}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Contact
                    </Button>
                  </div>
                  
                  {emergencyContacts.map((contact, index) => (
                    <div key={index} className="p-4 bg-slate-50 rounded-lg mb-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Input
                          placeholder="Name"
                          value={contact.name}
                          onChange={(e) => handleUpdateEmergencyContact(index, "name", e.target.value)}
                        />
                        <Input
                          placeholder="Phone"
                          value={contact.phone}
                          onChange={(e) => handleUpdateEmergencyContact(index, "phone", e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Input
                            placeholder="Relationship"
                            value={contact.relationship}
                            onChange={(e) => handleUpdateEmergencyContact(index, "relationship", e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveEmergencyContact(index)}
                            className="text-red-600"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Employment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Shield className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Employee ID</p>
                    <p className="font-medium text-slate-900">{currentEmployee.employee_id || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Start Date</p>
                    <p className="font-medium text-slate-900">
                      {currentEmployee.start_date ? format(parseISO(currentEmployee.start_date), "MMM d, yyyy") : "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Employment Type</p>
                    <p className="font-medium text-slate-900 capitalize">
                      {currentEmployee.employment_type?.replace(/_/g, " ") || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <MapPin className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Department</p>
                    <p className="font-medium text-slate-900">{currentEmployee.department}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Skills & Development Tab */}
        <TabsContent value="skills" className="space-y-6">
          <SkillsSection currentEmployee={currentEmployee} isAdmin={user?.role === "admin"} />
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">My Messages</h2>
            <p className="text-sm text-slate-500">View and send messages to colleagues</p>
          </div>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              {messages.length > 0 ? (
                <div className="space-y-3">
                  {messages
                    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
                    .slice(0, 20)
                    .map((message) => {
                      const isSent = message.sender_id === currentEmployee.id;
                      const otherPerson = isSent 
                        ? employees.find(e => e.id === message.recipient_id)
                        : employees.find(e => e.id === message.sender_id);
                      
                      return (
                        <div
                          key={message.id}
                          className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                          onClick={() => {
                            setMessagingRecipient(otherPerson);
                            setIsMessagingOpen(true);
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-slate-900">
                                  {isSent ? `To: ${message.recipient_name}` : `From: ${message.sender_name}`}
                                </p>
                                {!message.is_read && !isSent && (
                                  <Badge className="bg-indigo-600 text-xs">New</Badge>
                                )}
                              </div>
                              <p className="text-sm text-slate-600 line-clamp-2">{message.content}</p>
                            </div>
                            <p className="text-xs text-slate-400">
                              {format(new Date(message.created_date), "MMM d, h:mm a")}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No messages yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Time Off Tab */}
        <TabsContent value="timeoff" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">My Time Off Requests</h2>
              <p className="text-sm text-slate-500">Submit and track your time-off requests</p>
            </div>
            <Button onClick={() => setIsTimeOffDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Request Time Off
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm text-slate-500 mb-2">Pending Approval</p>
                  <p className="text-3xl font-bold text-amber-600">
                    {myTimeOffRequests.filter(r => r.status === "pending_approval").length}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm text-slate-500 mb-2">Approved</p>
                  <p className="text-3xl font-bold text-emerald-600">
                    {myTimeOffRequests.filter(r => r.status === "approved").length}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm text-slate-500 mb-2">Days Requested</p>
                  <p className="text-3xl font-bold text-indigo-600">
                    {myTimeOffRequests.reduce((sum, r) => sum + (r.days_requested || 0), 0)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Request History</CardTitle>
            </CardHeader>
            <CardContent>
              {myTimeOffRequests.length > 0 ? (
                <div className="space-y-3">
                  {myTimeOffRequests.map((request) => (
                    <div key={request.id} className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-slate-900 capitalize">
                              {request.type?.replace(/_/g, " ")}
                            </h3>
                            <StatusBadge status={request.status} />
                          </div>
                          <p className="text-sm text-slate-600 mb-2">
                            {format(parseISO(request.start_date), "MMM d, yyyy")} - {format(parseISO(request.end_date), "MMM d, yyyy")}
                          </p>
                          <p className="text-sm text-slate-500">
                            {request.days_requested} {request.days_requested === 1 ? "day" : "days"}
                          </p>
                          {request.reason && (
                            <p className="text-sm text-slate-600 mt-2 italic">"{request.reason}"</p>
                          )}
                        </div>
                        {request.approved_by_name && (
                          <div className="text-right text-sm text-slate-500">
                            <p>Reviewed by</p>
                            <p className="font-medium text-slate-700">{request.approved_by_name}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No time-off requests yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Company Policies & Documents</h2>
            <p className="text-sm text-slate-500">View and acknowledge important company documents</p>
          </div>

          <div className="space-y-4">
            {relevantDocuments.map((doc) => {
              const isAcknowledged = doc.acknowledged_by?.some(ack => ack.employee_id === currentEmployee.id);
              
              return (
                <Card key={doc.id} className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <FileText className="w-5 h-5 text-indigo-600" />
                          <h3 className="font-semibold text-slate-900">{doc.title}</h3>
                          <Badge variant="outline" className="capitalize">
                            {doc.category}
                          </Badge>
                          {isAcknowledged && (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Acknowledged
                            </Badge>
                          )}
                        </div>
                        {doc.description && (
                          <p className="text-sm text-slate-600 mb-3">{doc.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          {doc.version && <span>Version {doc.version}</span>}
                          {doc.effective_date && (
                            <span>Effective: {format(parseISO(doc.effective_date), "MMM d, yyyy")}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {doc.file_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(doc.file_url, '_blank')}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        )}
                        {doc.requires_acknowledgment && !isAcknowledged && (
                          <Button
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700"
                            onClick={() => handleAcknowledgeDocument(doc)}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Acknowledge
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {relevantDocuments.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No documents available</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Payroll Tab */}
        <TabsContent value="payroll" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Payroll Information</h2>
            <p className="text-sm text-slate-500">Access your payslips and contract documents</p>
          </div>

          {/* Contract Section */}
          {myContract && (
            <Card className="border-0 shadow-sm border-indigo-200 bg-indigo-50">
              <CardHeader>
                <CardTitle className="text-indigo-900">Employment Contract</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-indigo-700 mb-2">{myContract.title}</p>
                    <div className="flex items-center gap-4 text-sm text-indigo-600">
                      <span>Start: {format(parseISO(myContract.start_date), "MMM d, yyyy")}</span>
                      {myContract.end_date && (
                        <span>End: {format(parseISO(myContract.end_date), "MMM d, yyyy")}</span>
                      )}
                      <StatusBadge status={myContract.status} />
                    </div>
                  </div>
                  {myContract.file_url && (
                    <Button
                      variant="outline"
                      className="border-indigo-300 text-indigo-700 hover:bg-indigo-100"
                      onClick={() => window.open(myContract.file_url, '_blank')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Contract
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payslips Section */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Payslips</CardTitle>
            </CardHeader>
            <CardContent>
              {myPayslips.length > 0 ? (
                <div className="space-y-3">
                  {myPayslips.map((payslip) => (
                    <div key={payslip.id} className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-slate-900">{payslip.pay_period}</h3>
                            <StatusBadge status={payslip.status} />
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-slate-500">Gross Pay</p>
                              <p className="font-medium text-slate-900">
                                ${payslip.gross_pay?.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-500">Deductions</p>
                              <p className="font-medium text-red-600">
                                -${(
                                  (payslip.deductions?.tax || 0) +
                                  (payslip.deductions?.insurance || 0) +
                                  (payslip.deductions?.retirement || 0) +
                                  (payslip.deductions?.other || 0)
                                ).toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-500">Net Pay</p>
                              <p className="font-semibold text-emerald-600 text-lg">
                                ${payslip.net_pay?.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 mt-2">
                            Pay Date: {format(parseISO(payslip.pay_date), "MMM d, yyyy")}
                          </p>
                        </div>
                        {payslip.file_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(payslip.file_url, '_blank')}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No payslips available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Time Off Request Dialog */}
      <Dialog open={isTimeOffDialogOpen} onOpenChange={setIsTimeOffDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Time Off</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitTimeOff} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type of Leave *</Label>
              <Select name="type" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacation">Vacation</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="bereavement">Bereavement</SelectItem>
                  <SelectItem value="parental">Parental Leave</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
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
                <Label htmlFor="end_date">End Date *</Label>
                <Input
                  id="end_date"
                  name="end_date"
                  type="date"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                name="reason"
                placeholder="Brief description..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsTimeOffDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                Submit Request
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Messaging Dialog */}
      <MessagingDialog
        isOpen={isMessagingOpen}
        onClose={() => {
          setIsMessagingOpen(false);
          setMessagingRecipient(null);
        }}
        recipient={messagingRecipient}
        currentEmployee={currentEmployee}
      />
    </div>
  );
}