import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type === "create") {
      // Get all IT department employees and admins
      const employees = await base44.asServiceRole.entities.Employee.filter({
        department: "IT",
        status: "active"
      });

      const admins = await base44.asServiceRole.entities.User.list();
      const adminIds = admins.filter(u => u.role === "admin").map(u => u.id);

      // Notify IT staff
      for (const emp of employees) {
        await base44.asServiceRole.entities.Notification.create({
          type: "asset_request_new",
          title: "New Asset Request",
          message: `${data.requested_by_name} requested: ${data.requested_item_name}`,
          recipient_id: emp.id,
          priority: data.priority === "urgent" || data.priority === "high" ? "high" : "medium",
          link: "/Assets"
        });
      }

      return Response.json({ success: true, notified: employees.length });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});