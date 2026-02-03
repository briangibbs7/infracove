import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data } = await req.json();

    if (event.type === "update" && old_data && data.status !== old_data.status) {
      const statusMessages = {
        approved: "Your asset request has been approved",
        rejected: `Your asset request was rejected${data.rejection_reason ? `: ${data.rejection_reason}` : ""}`,
        fulfilled: "Your asset request has been fulfilled"
      };

      const message = statusMessages[data.status];
      
      if (message && data.requested_by) {
        await base44.asServiceRole.entities.Notification.create({
          type: "asset_request_status",
          title: "Asset Request Update",
          message: `${data.requested_item_name}: ${message}`,
          recipient_id: data.requested_by,
          priority: data.status === "approved" ? "medium" : "low",
          link: "/Assets"
        });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});