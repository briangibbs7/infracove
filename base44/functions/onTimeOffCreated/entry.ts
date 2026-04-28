import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Entity automation handler: fires when a TimeOffRequest is created
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { event, data } = body;

    if (event?.type !== 'create') return Response.json({ skipped: true });

    const request = data;
    if (!request?.employee_id) return Response.json({ skipped: true });

    // Find the employee to get their manager
    const employees = await base44.asServiceRole.entities.Employee.filter({ id: request.employee_id });
    const employee = employees[0];
    if (!employee?.manager_id) return Response.json({ skipped: false, reason: 'No manager found' });

    const managers = await base44.asServiceRole.entities.Employee.filter({ id: employee.manager_id });
    const manager = managers[0];
    if (!manager) return Response.json({ skipped: false, reason: 'Manager record not found' });

    const requiresHR = (request.days_requested || 0) > 5 || ['parental', 'bereavement'].includes(request.type);

    // Notify manager
    await base44.asServiceRole.entities.Notification.create({
      recipient_id: manager.email,
      recipient_name: manager.full_name,
      type: 'approval_needed',
      title: 'Time Off Request Awaiting Your Review',
      message: `${request.employee_name} has requested ${request.days_requested} day(s) off (${request.type}) from ${request.start_date} to ${request.end_date}.`,
      link: 'TimeOff',
      priority: requiresHR ? 'high' : 'normal',
    });

    // Advance status to manager_review
    await base44.asServiceRole.entities.TimeOffRequest.update(request.id, {
      status: 'manager_review',
      review_stage: 'submitted',
      requires_hr_review: requiresHR,
      manager_id: manager.id,
      manager_name: manager.full_name,
      manager_email: manager.email,
      audit_trail: [{
        stage: 'submitted',
        action: 'submit',
        actor_name: request.employee_name,
        actor_email: request.employee_email || '',
        comments: '',
        timestamp: new Date().toISOString(),
      }],
    });

    return Response.json({ success: true, manager: manager.full_name, requiresHR });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});