import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SHARED_SECRET = Deno.env.get("SHARED_API_SECRET");

Deno.serve(async (req) => {
  // Validate shared secret
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!SHARED_SECRET || token !== SHARED_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const base44 = createClientFromRequest(req);
  const body = await req.json().catch(() => ({}));
  const { action, entity, data, query } = body;

  if (!action || !entity) {
    return Response.json({ error: "Missing required fields: action, entity" }, { status: 400 });
  }

  // Allowed entities (expand as needed)
  const allowedEntities = [
    "Employee", "TimeOffRequest", "Department", "Announcement",
    "PerformanceReview", "PerformanceGoal", "TrainingAssignment"
  ];

  if (!allowedEntities.includes(entity)) {
    return Response.json({ error: `Entity '${entity}' not allowed` }, { status: 403 });
  }

  const entityRef = base44.asServiceRole.entities[entity];

  if (!entityRef) {
    return Response.json({ error: `Entity '${entity}' not found` }, { status: 404 });
  }

  switch (action) {
    case "list": {
      const records = await entityRef.list();
      return Response.json({ success: true, data: records });
    }
    case "filter": {
      const records = await entityRef.filter(query || {});
      return Response.json({ success: true, data: records });
    }
    case "get": {
      if (!data?.id) return Response.json({ error: "Missing id" }, { status: 400 });
      const record = await entityRef.get(data.id);
      return Response.json({ success: true, data: record });
    }
    case "create": {
      if (!data) return Response.json({ error: "Missing data" }, { status: 400 });
      const record = await entityRef.create(data);
      return Response.json({ success: true, data: record });
    }
    case "update": {
      if (!data?.id) return Response.json({ error: "Missing id" }, { status: 400 });
      const { id, ...updateData } = data;
      const record = await entityRef.update(id, updateData);
      return Response.json({ success: true, data: record });
    }
    case "delete": {
      if (!data?.id) return Response.json({ error: "Missing id" }, { status: 400 });
      await entityRef.delete(data.id);
      return Response.json({ success: true });
    }
    default:
      return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }
});