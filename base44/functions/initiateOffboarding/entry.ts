import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { employeeId, lastWorkingDay } = await req.json();

    if (!employeeId || !lastWorkingDay) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get employee details
    const employee = await base44.entities.Employee.get(employeeId);
    
    if (!employee) {
      return Response.json({ error: 'Employee not found' }, { status: 404 });
    }

    const lastDay = new Date(lastWorkingDay);
    
    // Calculate due dates
    const dayBefore = new Date(lastDay);
    dayBefore.setDate(dayBefore.getDate() - 1);
    
    const threeDaysBefore = new Date(lastDay);
    threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);
    
    const oneWeekBefore = new Date(lastDay);
    oneWeekBefore.setDate(oneWeekBefore.getDate() - 7);

    const formatDate = (date) => date.toISOString().split('T')[0];

    // Define task templates with due dates
    const taskTemplates = [
      // IT - Critical tasks (day before last day)
      { 
        title: "Revoke system access and credentials", 
        task_type: "revoke_access", 
        department: "IT", 
        priority: "urgent", 
        description: "Disable all system accounts, VPN access, and authentication credentials",
        due_date: formatDate(dayBefore)
      },
      { 
        title: "Deactivate email and setup forwarding", 
        task_type: "deactivate_accounts", 
        department: "IT", 
        priority: "urgent", 
        description: "Deactivate email account and forward to manager",
        due_date: formatDate(dayBefore)
      },
      
      // IT - Equipment (3 days before)
      { 
        title: "Collect laptop and IT equipment", 
        task_type: "return_equipment", 
        department: "IT", 
        priority: "high", 
        description: "Retrieve company laptop, monitors, keyboard, mouse, and other peripherals",
        due_date: formatDate(threeDaysBefore)
      },
      { 
        title: "Remove from shared drives and cloud storage", 
        task_type: "revoke_access", 
        department: "IT", 
        priority: "medium", 
        description: "Remove access to Google Drive, SharePoint, and other shared resources",
        due_date: formatDate(threeDaysBefore)
      },
      
      // HR - Critical (day before)
      { 
        title: "Update employee status to terminated", 
        task_type: "other", 
        department: "HR", 
        priority: "urgent", 
        description: "Update HRIS system with termination details",
        due_date: formatDate(dayBefore)
      },
      
      // HR - Exit process (3 days before)
      { 
        title: "Conduct exit interview", 
        task_type: "exit_interview", 
        department: "HR", 
        priority: "high", 
        description: "Schedule and conduct comprehensive exit interview",
        due_date: formatDate(threeDaysBefore)
      },
      { 
        title: "Process benefits termination", 
        task_type: "benefits_termination", 
        department: "HR", 
        priority: "high", 
        description: "Terminate health insurance, 401k contributions, and other benefits",
        due_date: formatDate(threeDaysBefore)
      },
      { 
        title: "Collect company ID badge and access cards", 
        task_type: "collect_company_property", 
        department: "HR", 
        priority: "medium", 
        description: "Retrieve all building access cards and identification badges",
        due_date: formatDate(threeDaysBefore)
      },
      
      // Finance - Critical (day before)
      { 
        title: "Process final paycheck", 
        task_type: "final_paycheck", 
        department: "Finance", 
        priority: "urgent", 
        description: "Calculate and process final paycheck including unused PTO and prorated salary",
        due_date: formatDate(dayBefore)
      },
      
      // Finance - Other (3 days before)
      { 
        title: "Collect and cancel corporate credit card", 
        task_type: "collect_company_property", 
        department: "Finance", 
        priority: "high", 
        description: "Retrieve corporate credit card and process cancellation",
        due_date: formatDate(threeDaysBefore)
      },
      { 
        title: "Clear all pending expense reports", 
        task_type: "other", 
        department: "Finance", 
        priority: "medium", 
        description: "Review and process any outstanding expense reimbursements",
        due_date: formatDate(threeDaysBefore)
      },
      
      // Knowledge Transfer (1 week before)
      { 
        title: "Facilitate knowledge transfer sessions", 
        task_type: "knowledge_transfer", 
        department: "HR", 
        priority: "high", 
        description: "Document and transfer critical knowledge to team members",
        due_date: formatDate(oneWeekBefore)
      },
      
      // Legal (3 days before)
      { 
        title: "Collect confidential documents and files", 
        task_type: "collect_company_property", 
        department: "Legal", 
        priority: "medium", 
        description: "Retrieve any confidential company documents or proprietary materials",
        due_date: formatDate(threeDaysBefore)
      },
    ];

    // Create all tasks
    const createdTasks = [];
    for (const [index, template] of taskTemplates.entries()) {
      const task = await base44.asServiceRole.entities.OffboardingTask.create({
        ...template,
        employee_id: employeeId,
        employee_name: employee.full_name,
        status: "pending",
        order: index + 1,
        last_working_day: lastWorkingDay,
      });
      createdTasks.push(task);
    }

    // Update employee status
    await base44.asServiceRole.entities.Employee.update(employeeId, {
      status: "on_leave" // Using on_leave as a placeholder for offboarding
    });

    // Send notifications to departments
    const departmentTasks = {
      IT: createdTasks.filter(t => t.department === "IT"),
      HR: createdTasks.filter(t => t.department === "HR"),
      Finance: createdTasks.filter(t => t.department === "Finance"),
      Legal: createdTasks.filter(t => t.department === "Legal"),
    };

    // Get department heads
    const allEmployees = await base44.asServiceRole.entities.Employee.list();
    
    for (const [dept, tasks] of Object.entries(departmentTasks)) {
      if (tasks.length === 0) continue;
      
      // Find department manager or admin
      const deptHead = allEmployees.find(e => 
        e.department === dept && (e.job_title?.toLowerCase().includes('manager') || e.job_title?.toLowerCase().includes('director'))
      );

      if (deptHead?.email) {
        const taskList = tasks.map(t => `• ${t.title} (Due: ${t.due_date}, Priority: ${t.priority})`).join('\n');
        
        await base44.integrations.Core.SendEmail({
          to: deptHead.email,
          subject: `Action Required: Offboarding Tasks for ${employee.full_name}`,
          body: `
            <h2>Employee Offboarding Notification</h2>
            <p>Dear ${deptHead.full_name},</p>
            
            <p>This is to inform you that <strong>${employee.full_name}</strong> will be leaving the company.</p>
            <p><strong>Last Working Day:</strong> ${lastWorkingDay}</p>
            
            <p>The following ${dept} tasks have been assigned and require your attention:</p>
            <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px;">${taskList}</pre>
            
            <p>Please ensure all tasks are completed by their respective due dates.</p>
            
            <p>You can view and manage these tasks in the OpsHub Offboarding section.</p>
            
            <p>Best regards,<br/>HR Team</p>
          `
        });
      }
    }

    // Create notification for the initiating user
    await base44.asServiceRole.entities.Notification.create({
      user_id: user.id,
      type: "offboarding_initiated",
      title: "Offboarding Workflow Started",
      message: `Offboarding workflow initiated for ${employee.full_name}. ${createdTasks.length} tasks created across all departments.`,
      link: "/Offboarding",
    });

    return Response.json({
      success: true,
      message: `Offboarding workflow initiated for ${employee.full_name}`,
      tasks_created: createdTasks.length,
      tasks: createdTasks,
    });
  } catch (error) {
    console.error('Error initiating offboarding:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});