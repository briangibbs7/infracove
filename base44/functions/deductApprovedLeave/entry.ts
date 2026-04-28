import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data } = await req.json();

    // Only process when status changes to approved
    if (event.type !== 'update' || data.status !== 'approved' || old_data?.status === 'approved') {
      return Response.json({ message: 'No action needed' });
    }

    // Get the employee
    const employee = await base44.asServiceRole.entities.Employee.get(data.employee_id);
    if (!employee) {
      return Response.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Map leave type to balance field
    const balanceFieldMap = {
      vacation: 'vacation_balance',
      sick: 'sick_balance',
      personal: 'personal_balance',
      bereavement: 'bereavement_balance',
      parental: 'parental_balance',
    };

    const balanceField = balanceFieldMap[data.type];
    if (!balanceField) {
      return Response.json({ error: 'Invalid leave type' }, { status: 400 });
    }

    // Calculate current balance
    const currentBalance = employee[balanceField] || 0;
    const daysRequested = data.days_requested || 0;
    const newBalance = Math.max(0, currentBalance - daysRequested);

    // Update employee balance
    await base44.asServiceRole.entities.Employee.update(data.employee_id, {
      [balanceField]: newBalance,
    });

    return Response.json({
      success: true,
      employee_id: data.employee_id,
      leave_type: data.type,
      days_deducted: daysRequested,
      previous_balance: currentBalance,
      new_balance: newBalance,
    });
  } catch (error) {
    console.error('Error deducting leave:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});