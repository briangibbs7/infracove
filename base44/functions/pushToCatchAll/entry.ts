import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const catchAllUrl = Deno.env.get('OTHER_APP_API_URL');
    const syncSecret = Deno.env.get('catchall');

    if (!catchAllUrl) {
      return Response.json({ error: 'OTHER_APP_API_URL secret not set' }, { status: 500 });
    }
    if (!syncSecret) {
      return Response.json({ error: 'catchall secret not set' }, { status: 500 });
    }

    // Fetch all active employees from InfraCove
    const employees = await base44.asServiceRole.entities.Employee.filter({ status: 'active' });

    // Map to the shape CatchAll AI expects
    const members = employees.map(emp => ({
      id: emp.id,
      email: emp.email,
      full_name: emp.full_name,
      job_title: emp.job_title || null,
      department: emp.department || null,
      status: emp.status,
      hire_date: emp.hire_date || null,
      manager_name: emp.manager_name || null,
    }));

    // POST to CatchAll AI's infracoveUserSync function
    const targetUrl = catchAllUrl.replace(/\/[^/]+$/, '/infracoveUserSync');

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-sync-secret': syncSecret,
      },
      body: JSON.stringify({ members }),
    });

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    if (!response.ok) {
      return Response.json({
        error: 'CatchAll AI returned an error',
        status: response.status,
        details: responseData,
      }, { status: 502 });
    }

    return Response.json({
      success: true,
      members_synced: members.length,
      catchall_response: responseData,
    });

  } catch (error) {
    console.error('pushToCatchAll error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});