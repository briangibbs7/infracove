import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { employeeId, employeeName, employeeEmail } = await req.json();

    if (!employeeId || !employeeName || !employeeEmail) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Send welcome email
    await base44.integrations.Core.SendEmail({
      to: employeeEmail,
      subject: `Welcome to the Team, ${employeeName.split(' ')[0]}! 🎉`,
      body: `
        <h2>Welcome to OpsHub!</h2>
        <p>Dear ${employeeName},</p>
        <p>We're thrilled to have you join our team! This is the beginning of an exciting journey.</p>
        
        <h3>What's Next?</h3>
        <ul>
          <li><strong>Complete Your Onboarding Tasks</strong> - Log in to your portal to see your personalized checklist</li>
          <li><strong>Review Important Documents</strong> - Access company policies, benefits info, and handbooks</li>
          <li><strong>Meet Your Team</strong> - Your manager will schedule introductions</li>
        </ul>
        
        <p>If you have any questions, don't hesitate to reach out to the HR team.</p>
        
        <p>We're excited to see all the great things you'll accomplish!</p>
        
        <p>Best regards,<br/>The HR Team</p>
      `
    });

    // Create notification
    await base44.asServiceRole.entities.Notification.create({
      recipient_id: employeeId,
      recipient_name: employeeName,
      type: "other",
      title: "Welcome to the Team!",
      message: "Check your email for important onboarding information and complete your tasks to get started.",
      priority: "high",
    });

    return Response.json({ 
      success: true,
      message: "Welcome email sent successfully"
    });
  } catch (error) {
    console.error('Error sending onboarding welcome:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});