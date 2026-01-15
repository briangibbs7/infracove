import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { event, data } = await req.json();
    
    // Only proceed for new time off requests
    if (event.type !== 'create') {
      return Response.json({ message: 'No action needed' });
    }

    const timeOffRequest = data;
    
    // Find the employee to get their manager
    const employees = await base44.asServiceRole.entities.Employee.list();
    const employee = employees.find(emp => emp.id === timeOffRequest.employee_id);
    
    if (!employee) {
      return Response.json({ 
        success: false,
        message: 'Employee not found' 
      }, { status: 404 });
    }

    if (!employee.manager_id) {
      return Response.json({ 
        success: false,
        message: 'No manager assigned to this employee' 
      });
    }

    // Find the manager
    const manager = employees.find(emp => emp.id === employee.manager_id);
    
    if (!manager) {
      return Response.json({ 
        success: false,
        message: 'Manager not found' 
      }, { status: 404 });
    }

    // Update the time off request with manager info
    await base44.asServiceRole.entities.TimeOffRequest.update(timeOffRequest.id, {
      manager_id: manager.id,
      manager_name: manager.full_name,
      status: 'pending_approval'
    });

    // Send email notification to manager
    await base44.integrations.Core.SendEmail({
      from_name: 'OpsHub - Time Off System',
      to: manager.email,
      subject: `Time Off Request - ${employee.full_name}`,
      body: `
Hello ${manager.full_name},

${employee.full_name} has submitted a time off request that requires your approval.

Request Details:
• Employee: ${employee.full_name}
• Type: ${timeOffRequest.type?.replace(/_/g, ' ').toUpperCase()}
• Start Date: ${timeOffRequest.start_date}
• End Date: ${timeOffRequest.end_date}
• Days Requested: ${timeOffRequest.days_requested || 'N/A'}
${timeOffRequest.reason ? `• Reason: ${timeOffRequest.reason}` : ''}

Please log in to OpsHub to review and approve or reject this request.

Best regards,
OpsHub Time Off System
      `
    });

    return Response.json({ 
      success: true,
      message: `Assigned to manager ${manager.full_name} and notification sent`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});