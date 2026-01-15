import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { event, data, old_data } = await req.json();
    
    // Only proceed if status changed to 'sent'
    if (event.type !== 'update' || data.status !== 'sent' || old_data?.status === 'sent') {
      return Response.json({ message: 'No action needed' });
    }

    const packet = data;
    
    // Try to find employee email from employee_name
    const employees = await base44.asServiceRole.entities.Employee.list();
    const employee = employees.find(emp => 
      emp.full_name === packet.employee_name || 
      emp.email === packet.employee_name
    );
    
    const recipientEmail = employee?.email || packet.employee_name;
    
    // Build document links
    let documentsSection = '';
    if (packet.company_handbook_url) {
      documentsSection += `\nCompany Handbook: ${packet.company_handbook_url}`;
    }
    if (packet.benefits_information_url) {
      documentsSection += `\nBenefits Information: ${packet.benefits_information_url}`;
    }
    if (packet.it_policies_url) {
      documentsSection += `\nIT Policies: ${packet.it_policies_url}`;
    }

    // Send welcome email
    await base44.integrations.Core.SendEmail({
      from_name: 'HR Team',
      to: recipientEmail,
      subject: `Welcome to the Team! Your Welcome Packet is Ready`,
      body: `
Dear ${packet.employee_name},

Welcome to the team! We're excited to have you join us.

Your welcome packet has been prepared and is now available. Please review the following materials before your start date:
${documentsSection}

${packet.notes ? `\nImportant Notes:\n${packet.notes}\n` : ''}

These documents contain important information about:
• Company policies and culture
• Benefits and compensation details
• IT systems and security guidelines
• Your role and responsibilities

Please take time to review all materials. If you have any questions, don't hesitate to reach out to the HR team.

We look forward to working with you!

Best regards,
HR Team
      `
    });

    return Response.json({ 
      success: true,
      message: `Welcome email sent to ${recipientEmail}`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});