import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, request_id, comments } = await req.json();

    const request = await base44.entities.TimeOffRequest.get(request_id);
    if (!request) return Response.json({ error: 'Request not found' }, { status: 404 });

    const now = new Date().toISOString();
    const auditEntry = {
      stage: request.review_stage,
      action,
      actor_name: user.full_name,
      actor_email: user.email,
      comments: comments || '',
      timestamp: now,
    };
    const auditTrail = [...(request.audit_trail || []), auditEntry];

    // Determine if HR review is needed
    const requiresHR = request.requires_hr_review ||
      (request.days_requested || 0) > 5 ||
      ['parental', 'bereavement'].includes(request.type);

    if (action === 'submit') {
      // Notify manager
      const employee = await base44.entities.Employee.filter({ id: request.employee_id });
      const emp = employee[0];
      if (emp?.manager_id) {
        const manager = await base44.entities.Employee.filter({ id: emp.manager_id });
        const mgr = manager[0];
        if (mgr) {
          await base44.entities.Notification.create({
            recipient_id: mgr.email,
            recipient_name: mgr.full_name,
            type: 'approval_needed',
            title: 'Time Off Request Awaiting Your Review',
            message: `${request.employee_name} has requested ${request.days_requested} day(s) off (${request.type}) from ${request.start_date} to ${request.end_date}.`,
            link: 'TimeOff',
            priority: requiresHR ? 'high' : 'normal',
          });
          await base44.entities.TimeOffRequest.update(request_id, {
            status: 'manager_review',
            review_stage: 'submitted',
            requires_hr_review: requiresHR,
            manager_id: mgr.id,
            manager_name: mgr.full_name,
            manager_email: mgr.email,
            audit_trail: auditTrail,
          });
        }
      }
      return Response.json({ success: true, next_stage: 'manager_review' });
    }

    if (action === 'manager_approve') {
      if (requiresHR) {
        // Escalate to HR
        const hrEmployees = await base44.entities.Employee.filter({ department: 'HR' });
        const hrEmployee = hrEmployees[0];
        const update = {
          status: 'hr_review',
          review_stage: 'manager_reviewed',
          manager_decision: 'approved',
          manager_comments: comments || '',
          manager_reviewed_at: now,
          audit_trail: auditTrail,
        };
        await base44.entities.TimeOffRequest.update(request_id, update);
        if (hrEmployee) {
          await base44.entities.Notification.create({
            recipient_id: hrEmployee.email,
            recipient_name: hrEmployee.full_name,
            type: 'approval_needed',
            title: 'Time Off Requires HR Review',
            message: `${request.employee_name}'s ${request.days_requested}-day ${request.type} leave has been approved by their manager and needs final HR review.`,
            link: 'TimeOff',
            priority: 'high',
          });
        }
        return Response.json({ success: true, next_stage: 'hr_review' });
      } else {
        // Final approval
        await base44.entities.TimeOffRequest.update(request_id, {
          status: 'approved',
          review_stage: 'completed',
          manager_decision: 'approved',
          manager_comments: comments || '',
          manager_reviewed_at: now,
          approved_by: user.email,
          approved_by_name: user.full_name,
          approved_date: now.split('T')[0],
          audit_trail: auditTrail,
        });
        // Notify employee
        await base44.entities.Notification.create({
          recipient_id: request.employee_email || request.employee_id,
          recipient_name: request.employee_name,
          type: 'timeoff_approved',
          title: 'Your Time Off Request Was Approved',
          message: `Your ${request.type} leave from ${request.start_date} to ${request.end_date} has been approved by ${user.full_name}.`,
          link: 'TimeOff',
          priority: 'normal',
        });
        // Deduct balance
        await base44.asServiceRole.functions.invoke('deductApprovedLeave', {
          employee_id: request.employee_id,
          leave_type: request.type,
          days: request.days_requested,
        });
        return Response.json({ success: true, next_stage: 'approved' });
      }
    }

    if (action === 'manager_reject') {
      await base44.entities.TimeOffRequest.update(request_id, {
        status: 'rejected',
        review_stage: 'completed',
        manager_decision: 'rejected',
        manager_comments: comments || '',
        manager_reviewed_at: now,
        rejection_reason: comments || '',
        audit_trail: auditTrail,
      });
      await base44.entities.Notification.create({
        recipient_id: request.employee_email || request.employee_id,
        recipient_name: request.employee_name,
        type: 'timeoff_rejected',
        title: 'Your Time Off Request Was Declined',
        message: `Your ${request.type} leave from ${request.start_date} to ${request.end_date} was not approved. Reason: ${comments || 'No reason provided.'}`,
        link: 'TimeOff',
        priority: 'normal',
      });
      return Response.json({ success: true, next_stage: 'rejected' });
    }

    if (action === 'hr_approve') {
      await base44.entities.TimeOffRequest.update(request_id, {
        status: 'approved',
        review_stage: 'completed',
        hr_decision: 'approved',
        hr_comments: comments || '',
        hr_reviewer_name: user.full_name,
        hr_reviewed_at: now,
        approved_by: user.email,
        approved_by_name: user.full_name,
        approved_date: now.split('T')[0],
        audit_trail: auditTrail,
      });
      await base44.entities.Notification.create({
        recipient_id: request.employee_email || request.employee_id,
        recipient_name: request.employee_name,
        type: 'timeoff_approved',
        title: 'Your Time Off Request Was Approved',
        message: `Your ${request.type} leave from ${request.start_date} to ${request.end_date} has been fully approved.`,
        link: 'TimeOff',
        priority: 'normal',
      });
      await base44.asServiceRole.functions.invoke('deductApprovedLeave', {
        employee_id: request.employee_id,
        leave_type: request.type,
        days: request.days_requested,
      });
      return Response.json({ success: true, next_stage: 'approved' });
    }

    if (action === 'hr_reject') {
      await base44.entities.TimeOffRequest.update(request_id, {
        status: 'rejected',
        review_stage: 'completed',
        hr_decision: 'rejected',
        hr_comments: comments || '',
        hr_reviewer_name: user.full_name,
        hr_reviewed_at: now,
        rejection_reason: comments || '',
        audit_trail: auditTrail,
      });
      await base44.entities.Notification.create({
        recipient_id: request.employee_email || request.employee_id,
        recipient_name: request.employee_name,
        type: 'timeoff_rejected',
        title: 'Your Time Off Request Was Declined',
        message: `Your ${request.type} leave from ${request.start_date} to ${request.end_date} was declined after HR review. Reason: ${comments || 'No reason provided.'}`,
        link: 'TimeOff',
        priority: 'normal',
      });
      return Response.json({ success: true, next_stage: 'rejected' });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});