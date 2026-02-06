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
    const employee = await base44.entities.Employee.filter({ id: employee_id });
    if (!employee || employee.length === 0) {
      return Response.json({ error: 'Employee not found' }, { status: 404 });
    }

    const emp = employee[0];

    // Get compliance personnel record
    const personnelRecords = await base44.entities.CompliancePersonnel.filter({ employee_id });
    const personnel = personnelRecords.length > 0 ? personnelRecords[0] : null;

    // Calculate risk score (0-100, higher = more risk)
    let riskScore = 0;
    const riskFactors = [];

    // Citizenship factor (30 points max)
    const citizenship = personnel?.citizenship || emp.citizenship;
    const highRiskCountries = ['CN', 'RU', 'IR', 'KP', 'SY'];
    const moderateRiskCountries = ['BY', 'VE', 'CU', 'SD'];
    
    if (citizenship && citizenship !== 'US' && citizenship !== 'USA') {
      if (highRiskCountries.includes(citizenship)) {
        riskScore += 30;
        riskFactors.push('High-risk country citizenship');
      } else if (moderateRiskCountries.includes(citizenship)) {
        riskScore += 20;
        riskFactors.push('Moderate-risk country citizenship');
      } else {
        riskScore += 10;
        riskFactors.push('Non-US citizenship');
      }
    }

    // Visa status factor (20 points max)
    const visaType = personnel?.visa_type || emp.visa_type;
    if (visaType && visaType !== 'US Citizen' && visaType !== 'Green Card') {
      riskScore += 15;
      riskFactors.push('Temporary visa status');
      
      const visaExpiry = personnel?.visa_expiry || emp.visa_expiry;
      if (visaExpiry) {
        const daysUntilExpiry = (new Date(visaExpiry) - new Date()) / (1000 * 60 * 60 * 24);
        if (daysUntilExpiry < 90) {
          riskScore += 5;
          riskFactors.push('Visa expiring soon');
        }
      }
    }

    // Clearance factor (reduces risk, -20 points)
    const clearanceLevel = personnel?.clearance_level;
    if (clearanceLevel === 'top_secret') {
      riskScore = Math.max(0, riskScore - 20);
      riskFactors.push('Top Secret clearance (risk mitigated)');
    } else if (clearanceLevel === 'secret') {
      riskScore = Math.max(0, riskScore - 10);
      riskFactors.push('Secret clearance (risk mitigated)');
    } else if (clearanceLevel === 'none' && citizenship !== 'US') {
      riskScore += 10;
      riskFactors.push('No security clearance');
    }

    // Training factor (20 points max)
    const exportControlTraining = personnel?.export_control_training;
    if (!exportControlTraining) {
      riskScore += 15;
      riskFactors.push('No export control training');
    } else {
      const trainingExpiry = personnel?.training_expiry;
      if (trainingExpiry) {
        const daysUntilExpiry = (new Date(trainingExpiry) - new Date()) / (1000 * 60 * 60 * 24);
        if (daysUntilExpiry < 0) {
          riskScore += 10;
          riskFactors.push('Training expired');
        } else if (daysUntilExpiry < 30) {
          riskScore += 5;
          riskFactors.push('Training expiring soon');
        }
      }
    }

    // Technologies accessed factor (30 points max)
    const technologiesAccessed = personnel?.technologies_accessed || [];
    const hasITAR = technologiesAccessed.some(tech => 
      tech.classification?.toLowerCase().includes('itar')
    );
    const hasEAR = technologiesAccessed.some(tech => 
      tech.classification?.toLowerCase().includes('ear') ||
      tech.classification?.toLowerCase().includes('eccn')
    );

    if (hasITAR) {
      riskScore += 20;
      riskFactors.push('Access to ITAR-controlled technology');
    } else if (hasEAR) {
      riskScore += 10;
      riskFactors.push('Access to EAR-controlled technology');
    }

    // Deemed export status factor
    const deemedExportStatus = personnel?.deemed_export_status;
    if (deemedExportStatus === 'denied') {
      riskScore += 25;
      riskFactors.push('Deemed export denied');
    } else if (deemedExportStatus === 'pending') {
      riskScore += 15;
      riskFactors.push('Deemed export pending review');
    }

    // Cap at 100
    riskScore = Math.min(100, riskScore);

    // Determine risk level
    let riskLevel = 'low';
    if (riskScore >= 70) {
      riskLevel = 'critical';
    } else if (riskScore >= 50) {
      riskLevel = 'high';
    } else if (riskScore >= 30) {
      riskLevel = 'medium';
    }

    return Response.json({
      riskScore,
      riskLevel,
      riskFactors,
      calculatedDate: new Date().toISOString()
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});