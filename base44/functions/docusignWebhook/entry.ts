import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    // This endpoint receives webhooks from DocuSign
    // No user authentication needed, but validate webhook signature
    
    const webhookSecret = Deno.env.get('DOCUSIGN_WEBHOOK_SECRET');
    const base44 = createClientFromRequest(req);
    
    // Validate webhook (in production, verify HMAC signature)
    const signature = req.headers.get('X-DocuSign-Signature-1');
    // In production: verify signature using webhookSecret
    
    const webhookData = await req.json();
    
    const envelopeId = webhookData.data?.envelopeId;
    const status = webhookData.event; // e.g., 'envelope-sent', 'envelope-delivered', 'envelope-completed'
    const recipientEmail = webhookData.data?.recipientEmail;
    
    if (!envelopeId) {
      return Response.json({ error: 'Missing envelope ID' }, { status: 400 });
    }

    // Find NDA signature records with this envelope ID
    const allSignatures = await base44.asServiceRole.entities.NDASignature.list();
    const signatures = allSignatures.filter(sig => 
      sig.notes && sig.notes.includes(envelopeId)
    );

    if (signatures.length === 0) {
      return Response.json({ message: 'No matching signatures found' }, { status: 200 });
    }

    // Update signature status based on webhook event
    for (const sig of signatures) {
      if (recipientEmail && sig.signer_email !== recipientEmail) continue;

      let newStatus = sig.status;
      let updateData = {};

      switch (status) {
        case 'envelope-sent':
          newStatus = 'pending';
          break;
        case 'envelope-delivered':
        case 'recipient-viewed':
          newStatus = 'reminded'; // Using 'reminded' to indicate viewed
          break;
        case 'recipient-completed':
        case 'envelope-completed':
          newStatus = 'signed';
          updateData.signed_date = new Date().toISOString().split('T')[0];
          break;
        case 'recipient-declined':
          newStatus = 'declined';
          break;
      }

      if (newStatus !== sig.status) {
        await base44.asServiceRole.entities.NDASignature.update(sig.id, {
          status: newStatus,
          ...updateData
        });
      }
    }

    // Check if all signers have completed
    if (status === 'envelope-completed') {
      const ndaId = signatures[0].nda_id;
      const allNDASignatures = allSignatures.filter(s => s.nda_id === ndaId);
      const allSigned = allNDASignatures.every(s => s.status === 'signed');

      if (allSigned) {
        // Update NDA to active status
        await base44.asServiceRole.entities.Contract.update(ndaId, {
          status: 'active'
        });

        // Mark current version as signed
        const versions = await base44.asServiceRole.entities.NDAVersion.filter({ 
          nda_id: ndaId,
          is_current: true
        });

        if (versions.length > 0) {
          await base44.asServiceRole.entities.NDAVersion.update(versions[0].id, {
            status: 'signed',
            signed_date: new Date().toISOString().split('T')[0],
            signed_by: allNDASignatures.map(s => s.signer_name)
          });
        }

        // TODO: Download signed document from DocuSign and store it
        // const signedDocUrl = await downloadFromDocuSign(envelopeId);
        // await base44.asServiceRole.entities.Contract.update(ndaId, { file_url: signedDocUrl });
      }
    }

    return Response.json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('Error processing DocuSign webhook:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});