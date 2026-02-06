import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { employee_id } = await req.json();

    // Get employee and compliance personnel data
    const employees = await base44.entities.Employee.filter({ id: employee_id });
    if (employees.length === 0) {
      return Response.json({ error: 'Employee not found' }, { status: 404 });
    }

    const employee = employees[0];
    const personnelRecords = await base44.entities.CompliancePersonnel.filter({ employee_id });
    const personnel = personnelRecords.length > 0 ? personnelRecords[0] : null;

    // Determine if deemed export review is required
    let reviewRequired = false;
    const flags = [];

    const citizenship = personnel?.citizenship || employee.citizenship;
    const visaType = personnel?.visa_type || employee.visa_type;
    const technologiesAccessed = personnel?.technologies_accessed || [];
    const clearanceLevel = personnel?.clearance_level || employee.clearance_level;

    // Flag 1: Non-US citizenship
    if (citizenship && citizenship !== 'US' && citizenship !== 'USA') {
      reviewRequired = true;
      flags.push('Non-US citizenship');
    }

    // Flag 2: Temporary visa status
    if (visaType && visaType !== 'US Citizen' && visaType !== 'Green Card') {
      reviewRequired = true;
      flags.push('Temporary visa status');
    }

    // Flag 3: Access to controlled technology without clearance
    const hasControlledTech = technologiesAccessed.some(tech => 
      tech.classification && (
        tech.classification.includes('ITAR') || 
        tech.classification.includes('EAR') ||
        tech.classification.includes('ECCN')
      )
    );

    if (hasControlledTech && (!clearanceLevel || clearanceLevel === 'none')) {
      reviewRequired = true;
      flags.push('Access to controlled technology without security clearance');
    }

    // Flag 4: High-risk countries
    const highRiskCountries = ['CN', 'RU', 'IR', 'KP', 'SY', 'BY', 'VE', 'CU'];
    if (citizenship && highRiskCountries.includes(citizenship)) {
      reviewRequired = true;
      flags.push('Citizenship from high-risk country');
    }

    // Update deemed export status if review required
    if (reviewRequired && personnel) {
      const currentStatus = personnel.deemed_export_status;
      
      // Only update if not already approved
      if (currentStatus !== 'approved') {
        await base44.entities.CompliancePersonnel.update(personnel.id, {
          deemed_export_status: 'pending'
        });
      }
    }

    return Response.json({
      reviewRequired,
      flags,
      currentStatus: personnel?.deemed_export_status || 'not_required'
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});