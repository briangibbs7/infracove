import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entity_type, entity_id, entity_name, action, description, changes } = await req.json();

    // Create activity log
    const activity = await base44.entities.Activity.create({
      entity_type,
      entity_id,
      entity_name,
      action,
      description,
      user_name: user.full_name || user.email,
      changes: changes || {},
      metadata: {
        user_email: user.email,
        user_role: user.role,
        timestamp: new Date().toISOString()
      }
    });

    return Response.json({ success: true, activity });

  } catch (error) {
    console.error("Error logging activity:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});