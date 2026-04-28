import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ndaId, ndaTitle, fileUrl, signers } = await req.json();

    if (!ndaId || !ndaTitle || !signers || signers.length === 0) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get DocuSign credentials from environment
    const docusignApiKey = Deno.env.get('DOCUSIGN_API_KEY');
    const docusignAccountId = Deno.env.get('DOCUSIGN_ACCOUNT_ID');
    const docusignBaseUrl = Deno.env.get('DOCUSIGN_BASE_URL') || 'https://demo.docusign.net/restapi';

    if (!docusignApiKey || !docusignAccountId) {
      // Fallback to internal signature workflow if DocuSign not configured
      return await fallbackSignatureWorkflow(base44, ndaId, ndaTitle, signers);
    }

    // Create envelope with DocuSign
    const envelopeData = {
      emailSubject: `Please sign: ${ndaTitle}`,
      documents: [{
        documentId: "1",
        name: ndaTitle,
        fileExtension: "pdf",
        documentBase64: fileUrl // In production, fetch and convert to base64
      }],
      recipients: {
        signers: signers.map((signer, index) => ({
          email: signer.email,
          name: signer.name,
          recipientId: String(index + 1),
          routingOrder: String(index + 1)
        }))
      },
      status: "sent"
    };

    const docusignResponse = await fetch(
      `${docusignBaseUrl}/v2.1/accounts/${docusignAccountId}/envelopes`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${docusignApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(envelopeData)
      }
    );

    if (!docusignResponse.ok) {
      throw new Error(`DocuSign API error: ${docusignResponse.statusText}`);
    }

    const docusignData = await docusignResponse.json();

    // Create signature records for tracking
    const signatureRecords = [];
    for (const signer of signers) {
      const signatureRecord = await base44.asServiceRole.entities.NDASignature.create({
        nda_id: ndaId,
        nda_title: ndaTitle,
        signer_name: signer.name,
        signer_email: signer.email,
        signer_role: signer.role,
        status: 'pending',
        sent_date: new Date().toISOString().split('T')[0],
        notes: `DocuSign Envelope ID: ${docusignData.envelopeId}`
      });
      signatureRecords.push(signatureRecord);
    }

    // Update NDA status
    await base44.asServiceRole.entities.Contract.update(ndaId, {
      status: 'pending_signature',
      notes: `DocuSign Envelope ID: ${docusignData.envelopeId}`
    });

    return Response.json({
      success: true,
      envelopeId: docusignData.envelopeId,
      message: `NDA sent via DocuSign to ${signers.length} signer(s)`,
      signatures: signatureRecords
    });
  } catch (error) {
    console.error('Error sending to DocuSign:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Fallback to internal workflow if DocuSign not configured
async function fallbackSignatureWorkflow(base44, ndaId, ndaTitle, signers) {
  const signatureRecords = [];

  for (const signer of signers) {
    const signatureRecord = await base44.asServiceRole.entities.NDASignature.create({
      nda_id: ndaId,
      nda_title: ndaTitle,
      signer_name: signer.name,
      signer_email: signer.email,
      signer_role: signer.role,
      status: 'pending',
      sent_date: new Date().toISOString().split('T')[0],
    });

    signatureRecords.push(signatureRecord);

    await base44.integrations.Core.SendEmail({
      to: signer.email,
      subject: `Action Required: Sign NDA - ${ndaTitle}`,
      body: `
        <h2>NDA Signature Request</h2>
        <p>Dear ${signer.name},</p>
        
        <p>You have been requested to sign the following Non-Disclosure Agreement:</p>
        <p><strong>${ndaTitle}</strong></p>
        
        <p>Please review and sign the NDA at your earliest convenience.</p>
        
        <p>To sign this document, please log in to the OpsHub portal and navigate to the NDAs section.</p>
        
        <p>If you have any questions, please contact our legal team.</p>
        
        <p>Best regards,<br/>Legal Team</p>
      `
    });
  }

  await base44.asServiceRole.entities.Contract.update(ndaId, {
    status: 'pending_signature'
  });

  return Response.json({
    success: true,
    message: `NDA sent to ${signers.length} signer(s) (internal workflow)`,
    signatures: signatureRecords,
    note: 'DocuSign not configured - using internal signature workflow'
  });
}