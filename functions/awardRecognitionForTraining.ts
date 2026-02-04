import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { event, data } = await req.json();

    // Only trigger on training completion
    if (event.type !== 'update' || data.status !== 'completed') {
      return Response.json({ message: 'No action needed' });
    }

    // Check if already awarded
    const existingRecognition = await base44.asServiceRole.entities.Recognition.filter({
      recipient_id: data.employee_id,
      related_training_id: data.course_id,
      type: 'training_completion'
    });

    if (existingRecognition.length > 0) {
      return Response.json({ message: 'Already awarded' });
    }

    // Award recognition
    await base44.asServiceRole.entities.Recognition.create({
      recipient_id: data.employee_id,
      recipient_name: data.employee_name,
      giver_id: 'system',
      giver_name: 'OpsHub System',
      type: 'training_completion',
      title: `Training Completed: ${data.course_title}`,
      message: `Congratulations on completing the training course! Your dedication to learning is recognized.`,
      points_awarded: 30,
      related_training_id: data.course_id,
      related_training_name: data.course_title,
      is_public: true,
    });

    // Update employee points
    const existingPoints = await base44.asServiceRole.entities.EmployeePoints.filter({
      employee_id: data.employee_id
    });

    if (existingPoints.length > 0) {
      await base44.asServiceRole.entities.EmployeePoints.update(existingPoints[0].id, {
        total_points: (existingPoints[0].total_points || 0) + 30,
        points_this_month: (existingPoints[0].points_this_month || 0) + 30,
        points_this_quarter: (existingPoints[0].points_this_quarter || 0) + 30,
        recognition_count: (existingPoints[0].recognition_count || 0) + 1,
      });
    } else {
      await base44.asServiceRole.entities.EmployeePoints.create({
        employee_id: data.employee_id,
        employee_name: data.employee_name,
        total_points: 30,
        points_this_month: 30,
        points_this_quarter: 30,
        recognition_count: 1,
      });
    }

    // Notify employee
    await base44.asServiceRole.entities.Notification.create({
      recipient_id: data.employee_id,
      recipient_name: data.employee_name,
      type: 'recognition_received',
      title: '🎉 Training Completion Recognition!',
      message: `You earned 30 points for completing ${data.course_title}`,
      link: '/Recognition',
      priority: 'normal',
    });

    return Response.json({ success: true, points_awarded: 30 });
  } catch (error) {
    console.error('Error awarding training recognition:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});