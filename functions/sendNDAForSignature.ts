import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ndaId, ndaTitle, signers } = await req.json();

    if (!ndaId || !ndaTitle || !signers || signers.length === 0) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const signatureRecords = [];

    // Create signature records for each signer
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

      // Send email to signer
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

    // Update NDA status to pending_signature
    await base44.asServiceRole.entities.Contract.update(ndaId, {
      status: 'pending_signature'
    });

    return Response.json({
      success: true,
      message: `NDA sent to ${signers.length} signer(s)`,
      signatures: signatureRecords
    });
  } catch (error) {
    console.error('Error sending NDA for signature:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});