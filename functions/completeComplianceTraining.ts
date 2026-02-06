import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { assignment_id, quiz_score, time_spent_minutes } = await req.json();

    // Get assignment
    const assignments = await base44.entities.ComplianceTrainingAssignment.filter({ id: assignment_id });
    if (assignments.length === 0) {
      return Response.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const assignment = assignments[0];

    // Get training details
    const trainings = await base44.entities.ComplianceTraining.filter({ id: assignment.training_id });
    if (trainings.length === 0) {
      return Response.json({ error: 'Training not found' }, { status: 404 });
    }

    const training = trainings[0];
    const passed = quiz_score >= training.passing_score;

    // Calculate expiry date
    const completedDate = new Date();
    const expiryDate = new Date(completedDate);
    expiryDate.setMonth(expiryDate.getMonth() + training.validity_months);

    // Update assignment
    await base44.entities.ComplianceTrainingAssignment.update(assignment_id, {
      status: passed ? 'completed' : 'failed',
      completed_date: completedDate.toISOString(),
      expiry_date: passed ? expiryDate.toISOString().split('T')[0] : null,
      quiz_score,
      time_spent_minutes,
      attempts: assignment.attempts + 1
    });

    // Update employee training record if passed
    if (passed && training.training_type === 'export_control') {
      const employees = await base44.entities.Employee.filter({ id: assignment.employee_id });
      if (employees.length > 0) {
        await base44.entities.Employee.update(assignment.employee_id, {
          export_control_training: true,
          training_date: completedDate.toISOString().split('T')[0],
          training_expiry: expiryDate.toISOString().split('T')[0]
        });

        // Update compliance personnel record
        const personnelRecords = await base44.entities.CompliancePersonnel.filter({ 
          employee_id: assignment.employee_id 
        });
        
        if (personnelRecords.length > 0) {
          await base44.entities.CompliancePersonnel.update(personnelRecords[0].id, {
            export_control_training: true,
            training_date: completedDate.toISOString().split('T')[0],
            training_expiry: expiryDate.toISOString().split('T')[0]
          });

          // Recalculate risk score
          await base44.functions.invoke('calculateRiskScore', { 
            employee_id: assignment.employee_id 
          });
        }
      }
    }

    return Response.json({
      success: true,
      passed,
      score: quiz_score,
      expiryDate: passed ? expiryDate.toISOString().split('T')[0] : null
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});