import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all pending onboarding tasks that are due within 2 days
    const tasks = await base44.asServiceRole.entities.OnboardingTask.filter({ 
      status: "pending" 
    });

    const today = new Date();
    const twoDaysFromNow = new Date(today);
    twoDaysFromNow.setDate(today.getDate() + 2);

    const upcomingTasks = tasks.filter(task => {
      if (!task.due_date) return false;
      const dueDate = new Date(task.due_date);
      return dueDate >= today && dueDate <= twoDaysFromNow;
    });

    let sentCount = 0;

    for (const task of upcomingTasks) {
      if (!task.assigned_to_name) continue;

      // Get assignee email
      const employee = await base44.asServiceRole.entities.Employee.get(task.assigned_to);
      if (!employee || !employee.email) continue;

      const dueDate = new Date(task.due_date);
      const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

      const subject = `Reminder: Onboarding Task Due ${daysUntilDue === 0 ? 'Today' : `in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`}`;
      const body = `Hello ${employee.full_name},

This is a friendly reminder about an upcoming onboarding task:

Task: ${task.title}
For: ${task.employee_name}
Category: ${task.category}
Priority: ${task.priority}
Due Date: ${task.due_date}

${task.description ? `Description: ${task.description}` : ''}

Please make sure to complete this task on time.

Best regards,
HR Team`;

      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: employee.email,
          subject: subject,
          body: body
        });
        sentCount++;
      } catch (emailError) {
        console.error(`Failed to send reminder for task ${task.id}:`, emailError);
      }
    }

    return Response.json({ 
      success: true,
      reminders_sent: sentCount,
      tasks_checked: tasks.length
    });

  } catch (error) {
    console.error('Onboarding reminders error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});