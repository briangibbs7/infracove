import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { toast } from "react-hot-toast";
import { Loader2, Send, CheckCircle } from "lucide-react";

export default function ElectronicSigningDialog({ open, onClose, documentType, grantId, electionId, recipientEmail, recipientName }) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState(recipientEmail || "");
  const [name, setName] = useState(recipientName || "");

  const handleSend = async () => {
    if (!email || !name) {
      toast.error("Please enter recipient email and name");
      return;
    }

    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('sendDocumentForSignature', {
        document_type: documentType,
        recipient_email: email,
        recipient_name: name,
        grant_id: grantId,
        election_id: electionId
      });

      if (data.success) {
        setSent(true);
        toast.success('Document sent for signature!');
        setTimeout(() => {
          onClose();
          setSent(false);
        }, 2000);
      } else {
        toast.error(data.message || 'Failed to send document');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to send document for signature');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send for Electronic Signature</DialogTitle>
        </DialogHeader>

        {sent ? (
          <div className="py-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900">Document Sent!</h3>
            <p className="text-slate-600 mt-2">
              {name} will receive an email with the document to sign.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <Label>Document Type</Label>
                <Input 
                  value={documentType === 'grant_agreement' ? 'Equity Grant Agreement' : '83(b) Election'} 
                  disabled 
                  className="bg-slate-50"
                />
              </div>
              <div>
                <Label>Recipient Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label>Recipient Email *</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-medium">How it works:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Recipient receives an email from DocuSign</li>
                  <li>They can sign electronically from any device</li>
                  <li>You'll be notified when signed</li>
                  <li>Signed document is automatically stored</li>
                </ul>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleSend} disabled={loading || !email || !name}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send for Signature
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}