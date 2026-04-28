import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { event, data } = await req.json();
    
    // Only proceed for task updates
    if (event.type !== 'update') {
      return Response.json({ message: 'No action needed' });
    }

    const task = data;
    
    // Only proceed if task was just completed
    if (task.status !== 'completed') {
      return Response.json({ message: 'Task not completed' });
    }

    // Get all tasks for this employee
    const allTasks = await base44.asServiceRole.entities.OnboardingTask.list();
    const employeeTasks = allTasks.filter(t => t.employee_id === task.employee_id);
    
    // Check if all tasks are completed
    const allCompleted = employeeTasks.every(t => t.status === 'completed');
    
    if (!allCompleted) {
      return Response.json({ 
        message: 'Not all tasks completed yet',
        completed: employeeTasks.filter(t => t.status === 'completed').length,
        total: employeeTasks.length
      });
    }

    // Update employee status to active
    const employee = await base44.asServiceRole.entities.Employee.list();
    const targetEmployee = employee.find(e => e.id === task.employee_id);
    
    if (!targetEmployee) {
      return Response.json({ 
        success: false,
        message: 'Employee not found' 
      }, { status: 404 });
    }

    await base44.asServiceRole.entities.Employee.update(targetEmployee.id, {
      status: 'active'
    });

    // Send completion email
    await base44.integrations.Core.SendEmail({
      from_name: 'OpsHub - HR Team',
      to: targetEmployee.email,
      subject: 'Welcome! Your Onboarding is Complete',
      body: `
Dear ${targetEmployee.full_name},

Congratulations! You have successfully completed your onboarding process.

Your employee status has been updated to "Active" and you now have full access to all company systems and resources.

Welcome to the team! We're excited to have you with us.

If you have any questions or need assistance, please don't hesitate to reach out to the HR team.

Best regards,
HR Team
      `
    });

    return Response.json({ 
      success: true,
      message: `Employee ${targetEmployee.full_name} status updated to active`,
      employee_id: targetEmployee.id
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});