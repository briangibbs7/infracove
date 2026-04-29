import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { accessToken, connectionConfig } = await base44.asServiceRole.connectors.getConnection('bamboohr');
    const subdomain = connectionConfig?.subdomain;

    if (!subdomain) {
      return Response.json({ error: 'BambooHR subdomain not found in connection config' }, { status: 500 });
    }

    const baseUrl = `https://${subdomain}.bamboohr.com/api/v1`;

    // Fetch employee directory from BambooHR
    const dirRes = await fetch(`${baseUrl}/employees/directory`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!dirRes.ok) {
      const err = await dirRes.text();
      return Response.json({ error: 'BambooHR API error', details: err, status: dirRes.status }, { status: 502 });
    }

    const dirData = await dirRes.json();
    const bambooEmployees = dirData.employees || [];

    // Get existing employees in InfraCove (keyed by email)
    const existingEmployees = await base44.asServiceRole.entities.Employee.list();
    const existingByEmail = {};
    for (const emp of existingEmployees) {
      if (emp.email) existingByEmail[emp.email.toLowerCase()] = emp;
    }

    let created = 0;
    let updated = 0;
    const errors = [];

    for (const b of bambooEmployees) {
      const email = (b.workEmail || b.homeEmail || '').toLowerCase();
      if (!email) continue;

      const mapped = {
        email,
        full_name: b.displayName || `${b.firstName || ''} ${b.lastName || ''}`.trim(),
        job_title: b.jobTitle || null,
        department: b.department || null,
        phone: b.mobilePhone || b.workPhone || null,
        location: b.location || null,
        profile_photo: b.photoUrl || null,
        status: 'active',
      };

      // Remove null values
      Object.keys(mapped).forEach(k => mapped[k] === null && delete mapped[k]);

      try {
        if (existingByEmail[email]) {
          await base44.asServiceRole.entities.Employee.update(existingByEmail[email].id, mapped);
          updated++;
        } else {
          await base44.asServiceRole.entities.Employee.create(mapped);
          created++;
        }
      } catch (e) {
        errors.push({ email, error: e.message });
      }
    }

    return Response.json({
      success: true,
      total_from_bamboohr: bambooEmployees.length,
      created,
      updated,
      errors,
    });

  } catch (error) {
    console.error('syncBambooHR error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});