import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { provider, sync_type } = await req.json(); // provider: 'gusto' | 'rippling', sync_type: 'employees' | 'equity' | 'all'

    let results = {
      provider,
      sync_type,
      employees_synced: 0,
      grants_synced: 0,
      errors: []
    };

    if (provider === 'gusto') {
      const gustoApiKey = Deno.env.get('GUSTO_API_KEY');
      
      if (!gustoApiKey) {
        return Response.json({ 
          error: 'Gusto API key not configured',
          message: 'Please set GUSTO_API_KEY in environment variables'
        }, { status: 400 });
      }

      // Sync employees from Gusto
      if (sync_type === 'employees' || sync_type === 'all') {
        const employeesResponse = await fetch('https://api.gusto.com/v1/employees', {
          headers: {
            'Authorization': `Bearer ${gustoApiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (!employeesResponse.ok) {
          throw new Error(`Gusto API error: ${employeesResponse.statusText}`);
        }

        const gustoEmployees = await employeesResponse.json();

        for (const emp of gustoEmployees) {
          try {
            const existingEmployees = await base44.asServiceRole.entities.Employee.filter({ 
              email: emp.email 
            });

            const employeeData = {
              email: emp.email,
              full_name: `${emp.first_name} ${emp.last_name}`,
              job_title: emp.job_title,
              department: emp.department,
              hire_date: emp.hire_date,
              status: emp.terminated ? 'inactive' : 'active',
              phone: emp.phone
            };

            if (existingEmployees.length > 0) {
              await base44.asServiceRole.entities.Employee.update(
                existingEmployees[0].id,
                employeeData
              );
            } else {
              await base44.asServiceRole.entities.Employee.create(employeeData);
            }

            results.employees_synced++;
          } catch (error) {
            results.errors.push(`Error syncing employee ${emp.email}: ${error.message}`);
          }
        }
      }

      // Sync equity grants from Gusto
      if (sync_type === 'equity' || sync_type === 'all') {
        const grantsResponse = await fetch('https://api.gusto.com/v1/equity_grants', {
          headers: {
            'Authorization': `Bearer ${gustoApiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (grantsResponse.ok) {
          const gustoGrants = await grantsResponse.json();

          for (const grant of gustoGrants) {
            try {
              const employees = await base44.asServiceRole.entities.Employee.filter({ 
                email: grant.employee_email 
              });

              if (employees.length > 0) {
                const shareholders = await base44.asServiceRole.entities.Shareholder.filter({
                  email: grant.employee_email
                });

                let shareholderId;
                if (shareholders.length > 0) {
                  shareholderId = shareholders[0].id;
                } else {
                  const newShareholder = await base44.asServiceRole.entities.Shareholder.create({
                    name: `${grant.employee_first_name} ${grant.employee_last_name}`,
                    email: grant.employee_email,
                    type: 'employee'
                  });
                  shareholderId = newShareholder.id;
                }

                await base44.asServiceRole.entities.EquityGrant.create({
                  shareholder_id: shareholderId,
                  shareholder_name: `${grant.employee_first_name} ${grant.employee_last_name}`,
                  grant_type: grant.grant_type || 'stock_options',
                  shares_granted: grant.quantity,
                  strike_price: grant.strike_price,
                  grant_date: grant.grant_date,
                  vesting_schedule: grant.vesting_schedule
                });

                results.grants_synced++;
              }
            } catch (error) {
              results.errors.push(`Error syncing grant for ${grant.employee_email}: ${error.message}`);
            }
          }
        }
      }

    } else if (provider === 'rippling') {
      const ripplingApiKey = Deno.env.get('RIPPLING_API_KEY');
      
      if (!ripplingApiKey) {
        return Response.json({ 
          error: 'Rippling API key not configured',
          message: 'Please set RIPPLING_API_KEY in environment variables'
        }, { status: 400 });
      }

      // Sync employees from Rippling
      if (sync_type === 'employees' || sync_type === 'all') {
        const employeesResponse = await fetch('https://api.rippling.com/platform/api/employees', {
          headers: {
            'Authorization': `Bearer ${ripplingApiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (!employeesResponse.ok) {
          throw new Error(`Rippling API error: ${employeesResponse.statusText}`);
        }

        const ripplingEmployees = await employeesResponse.json();

        for (const emp of ripplingEmployees.employees || []) {
          try {
            const existingEmployees = await base44.asServiceRole.entities.Employee.filter({ 
              email: emp.workEmail 
            });

            const employeeData = {
              email: emp.workEmail,
              full_name: `${emp.firstName} ${emp.lastName}`,
              job_title: emp.jobTitle,
              department: emp.department,
              hire_date: emp.startDate,
              status: emp.status === 'ACTIVE' ? 'active' : 'inactive',
              phone: emp.phoneNumber,
              location: emp.workLocation
            };

            if (existingEmployees.length > 0) {
              await base44.asServiceRole.entities.Employee.update(
                existingEmployees[0].id,
                employeeData
              );
            } else {
              await base44.asServiceRole.entities.Employee.create(employeeData);
            }

            results.employees_synced++;
          } catch (error) {
            results.errors.push(`Error syncing employee ${emp.workEmail}: ${error.message}`);
          }
        }
      }
    }

    // Log the sync activity
    await base44.asServiceRole.functions.invoke('logEquityActivity', {
      entity_type: 'System',
      action: 'hris_sync',
      description: `HRIS sync completed: ${results.employees_synced} employees, ${results.grants_synced} grants synced from ${provider}`,
      user_name: user.full_name
    });

    return Response.json({
      success: true,
      ...results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error syncing HRIS data:', error);
    return Response.json({ 
      error: error.message,
      details: error.toString()
    }, { status: 500 });
  }
});