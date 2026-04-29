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
    const headers = { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' };

    // ─── 1. Fetch employee directory ──────────────────────────────────────────
    const dirRes = await fetch(`${baseUrl}/employees/directory`, { headers });
    if (!dirRes.ok) {
      const err = await dirRes.text();
      return Response.json({ error: 'BambooHR directory API error', details: err }, { status: 502 });
    }
    const dirData = await dirRes.json();
    const bambooEmployees = dirData.employees || [];

    // ─── 2. Fetch detailed employee fields (job info, manager, leave balances) ─
    // We'll fetch fields for each employee in batches using the fields API
    const fieldsList = 'firstName,lastName,workEmail,homeEmail,jobTitle,department,location,mobilePhone,workPhone,photoUrl,employmentHistoryStatus,hireDate,supervisorId,supervisor,vacationBalance,sickBalance,personalBalance';

    // Fetch all employee IDs first, then get details
    const bambooByEmail = {};
    const bambooById = {};

    for (const b of bambooEmployees) {
      const email = (b.workEmail || b.homeEmail || '').toLowerCase();
      if (email) bambooByEmail[email] = b;
      if (b.id) bambooById[b.id] = b;
    }

    // Fetch detailed data for each employee
    const detailFetches = bambooEmployees.slice(0, 100).map(b =>
      fetch(`${baseUrl}/employees/${b.id}?fields=${fieldsList}`, { headers })
        .then(r => r.ok ? r.json() : null)
        .catch(() => null)
    );
    const detailResults = await Promise.all(detailFetches);

    // Build enriched map by bamboohr id
    const enrichedById = {};
    for (let i = 0; i < bambooEmployees.length && i < detailResults.length; i++) {
      const detail = detailResults[i];
      if (detail) enrichedById[bambooEmployees[i].id] = detail;
    }

    // ─── Get existing InfraCove employees (keyed by email and by id) ──────────
    const existingEmployees = await base44.asServiceRole.entities.Employee.list();
    const existingByEmail = {};
    for (const emp of existingEmployees) {
      if (emp.email) existingByEmail[emp.email.toLowerCase()] = emp;
    }

    let empCreated = 0, empUpdated = 0;
    const empErrors = [];
    // Track bamboohr employee id -> infracove employee id for manager linking
    const bambooIdToInfracoveId = {};

    // First pass: create/update employees (without manager links yet)
    for (let i = 0; i < bambooEmployees.length; i++) {
      const b = bambooEmployees[i];
      const detail = enrichedById[b.id] || {};
      const email = (detail.workEmail || detail.homeEmail || b.workEmail || b.homeEmail || '').toLowerCase();
      if (!email) continue;

      const employmentStatus = detail.employmentHistoryStatus?.label || detail.employmentHistoryStatus || '';
      const isInactive = employmentStatus && (employmentStatus.toLowerCase().includes('terminated') || employmentStatus.toLowerCase().includes('inactive'));

      const mapped = {
        email,
        full_name: `${detail.firstName || b.firstName || ''} ${detail.lastName || b.lastName || ''}`.trim() || b.displayName,
        job_title: detail.jobTitle?.label || detail.jobTitle || b.jobTitle || null,
        department: detail.department?.label || detail.department || b.department || null,
        phone: detail.mobilePhone || detail.workPhone || b.mobilePhone || null,
        location: detail.location?.label || detail.location || b.location || null,
        profile_photo: b.photoUrl || null,
        hire_date: detail.hireDate || null,
        status: isInactive ? 'inactive' : 'active',
        // Leave balances
        vacation_balance: parseFloat(detail.vacationBalance) || null,
        sick_balance: parseFloat(detail.sickBalance) || null,
        personal_balance: parseFloat(detail.personalBalance) || null,
      };

      // Remove nulls
      Object.keys(mapped).forEach(k => mapped[k] === null && delete mapped[k]);

      try {
        let infracoveId;
        if (existingByEmail[email]) {
          await base44.asServiceRole.entities.Employee.update(existingByEmail[email].id, mapped);
          infracoveId = existingByEmail[email].id;
          empUpdated++;
        } else {
          const created = await base44.asServiceRole.entities.Employee.create(mapped);
          infracoveId = created.id;
          empCreated++;
        }
        bambooIdToInfracoveId[b.id] = infracoveId;
        // Also update existingByEmail so manager pass can find newly created ones
        existingByEmail[email] = { id: infracoveId, email };
      } catch (e) {
        empErrors.push({ email, error: e.message });
      }
    }

    // ─── 3. Second pass: sync manager/org structure ───────────────────────────
    let managerUpdated = 0;
    const managerErrors = [];

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    for (let i = 0; i < bambooEmployees.length; i++) {
      const b = bambooEmployees[i];
      const detail = enrichedById[b.id] || {};
      const email = (detail.workEmail || detail.homeEmail || b.workEmail || b.homeEmail || '').toLowerCase();
      if (!email) continue;

      const supervisorId = detail.supervisorId;
      const supervisorName = detail.supervisor?.label || detail.supervisor || null;

      if (!supervisorId && !supervisorName) continue;

      const infracoveEmpId = bambooIdToInfracoveId[b.id] || existingByEmail[email]?.id;
      if (!infracoveEmpId) continue;

      const managerInfracoveId = bambooIdToInfracoveId[supervisorId] || null;

      try {
        const update = {};
        if (managerInfracoveId) update.manager_id = managerInfracoveId;
        if (supervisorName) update.manager_name = supervisorName;
        if (Object.keys(update).length > 0) {
          await base44.asServiceRole.entities.Employee.update(infracoveEmpId, update);
          managerUpdated++;
          // Small delay to avoid rate limiting
          if (i % 10 === 0) await sleep(200);
        }
      } catch (e) {
        managerErrors.push({ email, error: e.message });
      }
    }

    // ─── 4. Sync Time-Off Requests ────────────────────────────────────────────
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth() - 3, 1).toISOString().split('T')[0];
    const endDate = new Date(today.getFullYear(), today.getMonth() + 6, 0).toISOString().split('T')[0];

    const torRes = await fetch(`${baseUrl}/time_off/requests?start=${startDate}&end=${endDate}&action=view&type=approved,requested`, { headers });

    let torCreated = 0, torUpdated = 0;
    const torErrors = [];

    if (torRes.ok) {
      const torData = await torRes.json();
      const bambooRequests = Array.isArray(torData) ? torData : [];

      // Get existing time-off requests (keyed by a unique combo)
      const existingTOR = await base44.asServiceRole.entities.TimeOffRequest.list();
      const existingTORByKey = {};
      for (const t of existingTOR) {
        if (t.bamboohr_id) existingTORByKey[t.bamboohr_id] = t;
      }

      for (const tor of bambooRequests) {
        const empId = tor.employeeId;
        const bambooEmp = bambooEmployees.find(b => String(b.id) === String(empId));
        const empEmail = (bambooEmp?.workEmail || bambooEmp?.homeEmail || '').toLowerCase();
        const infracoveEmp = empEmail ? existingByEmail[empEmail] : null;

        const statusMap = { approved: 'approved', requested: 'pending_approval', denied: 'rejected', superseded: 'rejected', cancelled: 'rejected' };
        const typeMap = { vacation: 'vacation', sick: 'sick', personal: 'personal', bereavement: 'bereavement', other: 'other' };

        const typeLabel = (tor.type?.name || tor.type || 'other').toLowerCase();
        const mappedType = Object.keys(typeMap).find(k => typeLabel.includes(k)) || 'other';
        const mappedStatus = statusMap[tor.status?.status || tor.status] || 'pending_approval';

        const torMapped = {
          bamboohr_id: String(tor.id),
          employee_id: infracoveEmp?.id || '',
          employee_name: bambooEmp ? `${bambooEmp.firstName || ''} ${bambooEmp.lastName || ''}`.trim() : '',
          employee_email: empEmail,
          type: mappedType,
          start_date: tor.start,
          end_date: tor.end,
          days_requested: tor.amount?.days || null,
          status: mappedStatus,
          notes: tor.notes?.employee || null,
        };

        Object.keys(torMapped).forEach(k => torMapped[k] === null && delete torMapped[k]);

        try {
          if (existingTORByKey[String(tor.id)]) {
            await base44.asServiceRole.entities.TimeOffRequest.update(existingTORByKey[String(tor.id)].id, torMapped);
            torUpdated++;
          } else {
            await base44.asServiceRole.entities.TimeOffRequest.create(torMapped);
            torCreated++;
          }
        } catch (e) {
          torErrors.push({ id: tor.id, error: e.message });
        }
      }
    }

    return Response.json({
      success: true,
      employees: { total: bambooEmployees.length, created: empCreated, updated: empUpdated, errors: empErrors },
      org_structure: { manager_links_updated: managerUpdated, errors: managerErrors },
      time_off: { created: torCreated, updated: torUpdated, errors: torErrors },
    });

  } catch (error) {
    console.error('syncBambooHR error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});