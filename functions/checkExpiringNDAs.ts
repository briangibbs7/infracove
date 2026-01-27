import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all active NDAs
    const ndas = await base44.asServiceRole.entities.Contract.filter({ 
      type: 'nda', 
      status: 'active' 
    });

    const today = new Date();
    const notificationsToSend = [];

    for (const nda of ndas) {
      if (!nda.end_date) continue;

      const expiryDate = new Date(nda.end_date);
      const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      const reminderDays = nda.renewal_reminder_days || 30;

      // Check if we should send notification
      if (daysUntilExpiry <= reminderDays && daysUntilExpiry > 0 && !nda.expiry_notification_sent) {
        // Get owner details
        if (nda.owner) {
          const owner = await base44.asServiceRole.entities.Employee.get(nda.owner);
          
          if (owner?.email) {
            await base44.integrations.Core.SendEmail({
              to: owner.email,
              subject: `NDA Expiring Soon - ${nda.title}`,
              body: `
                <h2>NDA Expiration Notice</h2>
                <p>Dear ${owner.full_name},</p>
                
                <p>The following NDA is expiring soon:</p>
                
                <p><strong>${nda.title}</strong></p>
                <p>Party: ${nda.party_name}</p>
                <p>NDA Number: ${nda.contract_number}</p>
                <p>Expiry Date: ${nda.end_date}</p>
                <p>Days Until Expiry: ${daysUntilExpiry}</p>
                
                ${nda.auto_renew ? 
                  '<p><strong>Note:</strong> This NDA is set to auto-renew. Please review if renewal is still appropriate.</p>' :
                  '<p><strong>Action Required:</strong> Please review if this NDA should be renewed or allowed to expire.</p>'
                }
                
                <p>Please log in to OpsHub to take appropriate action.</p>
                
                <p>Best regards,<br/>Legal Team</p>
              `
            });

            // Mark notification as sent
            await base44.asServiceRole.entities.Contract.update(nda.id, {
              expiry_notification_sent: true
            });

            notificationsToSend.push({
              nda_id: nda.id,
              title: nda.title,
              owner: owner.full_name,
              days_until_expiry: daysUntilExpiry
            });
          }
        }
      }

      // Auto-expire NDAs past their end date
      if (daysUntilExpiry < 0) {
        await base44.asServiceRole.entities.Contract.update(nda.id, {
          status: 'expired'
        });
      }
    }

    return Response.json({
      success: true,
      notifications_sent: notificationsToSend.length,
      details: notificationsToSend
    });
  } catch (error) {
    console.error('Error checking expiring NDAs:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});