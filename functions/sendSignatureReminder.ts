import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { signatureId } = await req.json();

    if (!signatureId) {
      return Response.json({ error: 'Missing signature ID' }, { status: 400 });
    }

    // Get signature record
    const signature = await base44.entities.NDASignature.get(signatureId);

    if (!signature) {
      return Response.json({ error: 'Signature not found' }, { status: 404 });
    }

    if (signature.status !== 'pending') {
      return Response.json({ error: 'Signature is not pending' }, { status: 400 });
    }

    // Send reminder email
    await base44.integrations.Core.SendEmail({
      to: signature.signer_email,
      subject: `Reminder: Sign NDA - ${signature.nda_title}`,
      body: `
        <h2>NDA Signature Reminder</h2>
        <p>Dear ${signature.signer_name},</p>
        
        <p>This is a friendly reminder that you have a pending NDA signature request:</p>
        <p><strong>${signature.nda_title}</strong></p>
        
        <p>Originally sent: ${signature.sent_date}</p>
        
        <p>Please review and sign the NDA at your earliest convenience.</p>
        
        <p>To sign this document, please log in to the OpsHub portal and navigate to the NDAs section.</p>
        
        <p>If you have any questions or concerns, please contact our legal team.</p>
        
        <p>Best regards,<br/>Legal Team</p>
      `
    });

    // Update signature record
    await base44.asServiceRole.entities.NDASignature.update(signatureId, {
      reminder_count: (signature.reminder_count || 0) + 1,
      last_reminder_date: new Date().toISOString().split('T')[0],
      status: 'reminded'
    });

    return Response.json({
      success: true,
      message: 'Reminder sent successfully'
    });
  } catch (error) {
    console.error('Error sending reminder:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});