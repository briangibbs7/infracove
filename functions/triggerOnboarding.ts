import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contractId } = await req.json();
    
    // Get the contract details
    const contracts = await base44.entities.Contract.list();
    const contract = contracts.find(c => c.id === contractId);
    
    if (!contract) {
      return Response.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Verify it's an employment contract
    if (contract.type !== 'employment') {
      return Response.json({ 
        error: 'Only employment contracts trigger onboarding' 
      }, { status: 400 });
    }

    // Calculate due dates (start date + days)
    const startDate = new Date(contract.start_date);
    const getDueDate = (daysOffset) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + daysOffset);
      return date.toISOString().split('T')[0];
    };

    // Create onboarding tasks
    const tasks = [
      {
        title: 'Create Employee Profile',
        task_type: 'create_profile',
        description: `Create employee profile for ${contract.party_name} in the system`,
        priority: 'urgent',
        order: 1,
        due_date: getDueDate(-5) // 5 days before start
      },
      {
        title: 'Assign Equipment',
        task_type: 'assign_equipment',
        description: `Order and assign laptop, phone, and other equipment for ${contract.party_name}`,
        priority: 'high',
        order: 2,
        due_date: getDueDate(-3) // 3 days before start
      },
      {
        title: 'Setup Accounts',
        task_type: 'setup_accounts',
        description: `Create email, Slack, and system accounts for ${contract.party_name}`,
        priority: 'high',
        order: 3,
        due_date: getDueDate(-2) // 2 days before start
      },
      {
        title: 'Send Welcome Materials',
        task_type: 'send_welcome_materials',
        description: `Send employee handbook, company policies, and welcome package to ${contract.party_name}`,
        priority: 'medium',
        order: 4,
        due_date: getDueDate(-1) // 1 day before start
      },
      {
        title: 'Schedule Orientation',
        task_type: 'schedule_orientation',
        description: `Schedule first day orientation and office tour for ${contract.party_name}`,
        priority: 'high',
        order: 5,
        due_date: getDueDate(0) // Start date
      },
      {
        title: 'Benefits Enrollment',
        task_type: 'benefits_enrollment',
        description: `Guide ${contract.party_name} through benefits enrollment process`,
        priority: 'medium',
        order: 6,
        due_date: getDueDate(3) // 3 days after start
      },
      {
        title: 'Team Introduction',
        task_type: 'team_introduction',
        description: `Introduce ${contract.party_name} to team members and key stakeholders`,
        priority: 'medium',
        order: 7,
        due_date: getDueDate(1) // 1 day after start
      }
    ];

    // Create all tasks
    const createdTasks = await Promise.all(
      tasks.map(task => 
        base44.asServiceRole.entities.OnboardingTask.create({
          ...task,
          contract_id: contractId,
          employee_name: contract.party_name,
          status: 'pending',
          assigned_to: user.email,
          assigned_to_name: user.full_name
        })
      )
    );

    // Send notification email
    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject: `Onboarding Workflow Triggered: ${contract.party_name}`,
      body: `
Hello ${user.full_name},

A new onboarding workflow has been triggered for ${contract.party_name}.

Contract Details:
- Start Date: ${contract.start_date}
- Department: ${contract.department || 'N/A'}
- Contract #: ${contract.contract_number || 'N/A'}

${createdTasks.length} onboarding tasks have been created. Please review and complete them in the HR Onboarding section.

Best regards,
OpsHub System
      `
    });

    return Response.json({ 
      success: true,
      tasksCreated: createdTasks.length,
      tasks: createdTasks
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});