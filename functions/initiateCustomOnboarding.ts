import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { employeeId, startDate, selectedDepartments, customTasks } = await req.json();

    if (!employeeId || !startDate) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get employee details
    const employee = await base44.asServiceRole.entities.Employee.get(employeeId);
    
    if (!employee) {
      return Response.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Get all active employees to find department heads
    const allEmployees = await base44.asServiceRole.entities.Employee.list();

    const start = new Date(startDate);
    const getDueDate = (daysOffset) => {
      const date = new Date(start);
      date.setDate(date.getDate() + daysOffset);
      return date.toISOString().split('T')[0];
    };

    // Task templates organized by department
    const taskTemplates = {
      HR: [
        { 
          title: "Create Employee Profile", 
          task_type: "create_profile",
          description: `Create comprehensive employee profile for ${employee.full_name}`,
          priority: "urgent",
          days: -7,
          assignee: "HR"
        },
        { 
          title: "Benefits Enrollment", 
          task_type: "benefits_enrollment",
          description: `Guide ${employee.full_name} through benefits enrollment`,
          priority: "medium",
          days: 3,
          assignee: "HR"
        },
        { 
          title: "Team Introduction", 
          task_type: "team_introduction",
          description: `Introduce ${employee.full_name} to team members`,
          priority: "medium",
          days: 1,
          assignee: "HR"
        },
      ],
      IT: [
        { 
          title: "Assign Equipment", 
          task_type: "assign_equipment",
          description: `Order and assign laptop, phone, and equipment for ${employee.full_name}`,
          priority: "high",
          days: -3,
          assignee: "IT"
        },
        { 
          title: "Setup Accounts", 
          task_type: "setup_accounts",
          description: `Create email, Slack, and system accounts for ${employee.full_name}`,
          priority: "high",
          days: -2,
          assignee: "IT"
        },
      ],
      General: [
        { 
          title: "Send Welcome Materials", 
          task_type: "send_welcome_materials",
          description: `Send welcome packet to ${employee.full_name}`,
          priority: "medium",
          days: -1,
          assignee: "HR"
        },
        { 
          title: "Schedule Orientation", 
          task_type: "schedule_orientation",
          description: `Schedule first day orientation for ${employee.full_name}`,
          priority: "high",
          days: 0,
          assignee: "HR"
        },
      ]
    };

    // Create tasks based on selected departments
    const createdTasks = [];
    let order = 1;

    for (const dept of selectedDepartments) {
      if (dept === "Training") continue; // Handle separately
      
      const templates = taskTemplates[dept] || [];
      for (const template of templates) {
        // Find assignee
        const assigneeDept = template.assignee || dept;
        const assignee = allEmployees.find(e => 
          e.department === assigneeDept && 
          (e.job_title?.toLowerCase().includes('manager') || e.job_title?.toLowerCase().includes('lead'))
        );

        const task = await base44.asServiceRole.entities.OnboardingTask.create({
          employee_id: employeeId,
          employee_name: employee.full_name,
          title: template.title,
          task_type: template.task_type,
          description: template.description,
          priority: template.priority,
          due_date: getDueDate(template.days),
          status: "pending",
          order: order++,
          assigned_to: assignee?.id,
          assigned_to_name: assignee?.full_name,
        });
        createdTasks.push(task);
      }
    }

    // Auto-assign onboarding training courses if Training is selected
    if (selectedDepartments.includes("Training")) {
      const courses = await base44.asServiceRole.entities.TrainingCourse.filter({ 
        category: "onboarding",
        status: "active"
      });

      for (const course of courses) {
        await base44.asServiceRole.entities.TrainingAssignment.create({
          course_id: course.id,
          course_title: course.title,
          employee_id: employeeId,
          employee_name: employee.full_name,
          assigned_by: user.id,
          assigned_by_name: user.full_name,
          assigned_date: new Date().toISOString().split('T')[0],
          due_date: getDueDate(14), // 2 weeks to complete onboarding training
          status: "not_started",
          progress: 0,
        });

        // Notify employee about training
        await base44.asServiceRole.entities.Notification.create({
          recipient_id: employeeId,
          recipient_name: employee.full_name,
          type: "task_assigned",
          title: "Onboarding Training Assigned",
          message: `Welcome! You've been assigned the course: ${course.title}`,
          link: "/Training",
          priority: course.is_mandatory ? "high" : "normal",
        });
      }
    }

    // Update employee status to onboarding
    await base44.asServiceRole.entities.Employee.update(employeeId, {
      status: "onboarding"
    });

    // Send welcome email to employee
    await base44.integrations.Core.SendEmail({
      to: employee.email,
      subject: `Welcome to the Team, ${employee.full_name}!`,
      body: `
        <h2>Welcome aboard!</h2>
        <p>Dear ${employee.full_name},</p>
        
        <p>We're excited to have you join our team on <strong>${startDate}</strong>!</p>
        
        <p>Your onboarding journey has begun. Here's what to expect:</p>
        <ul>
          <li>✓ You'll receive your equipment and account credentials before your start date</li>
          <li>✓ Training courses have been assigned in the OpsHub system</li>
          <li>✓ Your orientation is scheduled for your first day</li>
          <li>✓ A dedicated onboarding checklist is available in your employee portal</li>
        </ul>
        
        <p>If you have any questions before your start date, feel free to reach out!</p>
        
        <p>Looking forward to working with you!</p>
        <p>Best regards,<br/>The Team</p>
      `
    });

    // Notify user who initiated
    await base44.asServiceRole.entities.Notification.create({
      recipient_id: user.id,
      recipient_name: user.full_name,
      type: "info",
      title: "Onboarding Initiated",
      message: `Successfully initiated onboarding for ${employee.full_name}. ${createdTasks.length} tasks created.`,
      link: "/Onboarding",
    });

    return Response.json({
      success: true,
      tasks_created: createdTasks.length,
      training_assigned: selectedDepartments.includes("Training"),
    });
  } catch (error) {
    console.error('Error initiating onboarding:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});