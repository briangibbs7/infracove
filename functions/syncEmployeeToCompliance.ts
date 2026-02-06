import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { employee_id } = await req.json();

    // Get employee data
    const employees = await base44.entities.Employee.filter({ id: employee_id });
    if (!employees || employees.length === 0) {
      return Response.json({ error: 'Employee not found' }, { status: 404 });
    }

    const employee = employees[0];

    // Check if compliance personnel record exists
    const existingRecords = await base44.entities.CompliancePersonnel.filter({ employee_id });
    
    const personnelData = {
      employee_id: employee.id,
      employee_name: employee.full_name,
      employee_email: employee.email,
      citizenship: employee.citizenship,
      visa_type: employee.visa_type,
      visa_expiry: employee.visa_expiry,
      clearance_level: employee.clearance_level || 'none',
      export_control_training: employee.export_control_training || false,
      training_date: employee.training_date,
      training_expiry: employee.training_expiry,
      last_review_date: new Date().toISOString().split('T')[0]
    };

    let personnelRecord;
    if (existingRecords.length > 0) {
      // Update existing record
      personnelRecord = await base44.entities.CompliancePersonnel.update(
        existingRecords[0].id,
        personnelData
      );
    } else {
      // Create new record
      personnelRecord = await base44.entities.CompliancePersonnel.create(personnelData);
    }

    // Calculate risk score
    const riskResponse = await base44.functions.invoke('calculateRiskScore', { employee_id });
    
    if (riskResponse.data.riskScore !== undefined) {
      await base44.entities.CompliancePersonnel.update(personnelRecord.id, {
        risk_score: riskResponse.data.riskScore,
        risk_factors: riskResponse.data.riskFactors
      });
    }

    return Response.json({
      success: true,
      personnelRecord,
      riskScore: riskResponse.data
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});