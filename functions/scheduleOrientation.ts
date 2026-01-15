import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { employeeName, employeeEmail, managerEmail, date, time, location } = await req.json();

    const orientationDate = new Date(`${date}T${time}`);
    const formattedDate = orientationDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const formattedTime = orientationDate.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    // Send calendar invite to employee
    await base44.integrations.Core.SendEmail({
      to: employeeEmail,
      subject: `New Employee Orientation - ${formattedDate}`,
      body: `
Dear ${employeeName},

Welcome to the team! Your orientation session has been scheduled.

Date: ${formattedDate}
Time: ${formattedTime}
Location: ${location || 'Office - Main Conference Room'}

During orientation, you will:
- Complete necessary paperwork
- Tour the office
- Meet your team members
- Learn about company policies and culture
- Set up your workspace

Please arrive 10 minutes early. If you have any questions, feel free to reach out.

Looking forward to seeing you!

Best regards,
${user.full_name}
HR Team
      `
    });

    // Send notification to manager if provided
    if (managerEmail) {
      await base44.integrations.Core.SendEmail({
        to: managerEmail,
        subject: `New Team Member Orientation - ${employeeName}`,
        body: `
Hello,

A new team member orientation has been scheduled:

Employee: ${employeeName}
Date: ${formattedDate}
Time: ${formattedTime}
Location: ${location || 'Office - Main Conference Room'}

Please plan to meet ${employeeName} after the orientation session to introduce them to the team.

Best regards,
${user.full_name}
HR Team
        `
      });
    }

    return Response.json({ 
      success: true,
      message: `Orientation scheduled for ${employeeName} on ${formattedDate} at ${formattedTime}`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});