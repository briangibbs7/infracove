import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { employeeName, department } = await req.json();

    // Get all employees to determine next ID number
    const employees = await base44.asServiceRole.entities.Employee.list();
    
    // Generate employee ID format: DEPT-YYYY-#### (e.g., HR-2026-0001)
    const year = new Date().getFullYear();
    const deptCode = department ? department.substring(0, 3).toUpperCase() : 'EMP';
    
    // Find highest number for this department and year
    const deptEmployees = employees.filter(emp => 
      emp.employee_id && emp.employee_id.startsWith(`${deptCode}-${year}`)
    );
    
    let nextNumber = 1;
    if (deptEmployees.length > 0) {
      const numbers = deptEmployees.map(emp => {
        const parts = emp.employee_id.split('-');
        return parseInt(parts[2] || '0');
      });
      nextNumber = Math.max(...numbers) + 1;
    }
    
    const employeeId = `${deptCode}-${year}-${String(nextNumber).padStart(4, '0')}`;

    return Response.json({ 
      success: true,
      employeeId,
      message: `Generated employee ID: ${employeeId} for ${employeeName}`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});