import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { task_id, employee_email, task_title } = await req.json();

    const task = await base44.entities.OnboardingTask.get(task_id);
    
    if (!task) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }

    const subject = `New Onboarding Task Assigned: ${task_title}`;
    const body = `Hello,

You have been assigned a new onboarding task:

Task: ${task.title}
Category: ${task.category}
Priority: ${task.priority}
${task.due_date ? `Due Date: ${task.due_date}` : ''}

${task.description ? `Description: ${task.description}` : ''}

Please log in to the system to view details and update the task status.

Best regards,
${user.full_name}`;

    await base44.integrations.Core.SendEmail({
      to: employee_email,
      subject: subject,
      body: body
    });

    return Response.json({ success: true });

  } catch (error) {
    console.error('Task notification error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});