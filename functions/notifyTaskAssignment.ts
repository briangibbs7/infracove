import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { taskId, taskTitle, assigneeName, assigneeId, assignedBy } = await req.json();

    // Create notification for the assignee
    await base44.asServiceRole.entities.Notification.create({
      type: "task_assigned",
      title: "New Task Assigned",
      message: `${assignedBy} assigned you a task: ${taskTitle}`,
      recipient_id: assigneeId,
      priority: "medium",
      link: "/Onboarding"
    });

    // Send email notification
    const assignee = await base44.asServiceRole.entities.Employee.filter({ id: assigneeId });
    if (assignee.length > 0 && assignee[0].email) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: assignee[0].email,
        subject: "New Task Assignment",
        body: `Hi ${assigneeName},\n\n${assignedBy} has assigned you a new task:\n\n${taskTitle}\n\nPlease log in to OpsHub to view the details and complete the task.\n\nBest regards,\nOpsHub Team`
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});