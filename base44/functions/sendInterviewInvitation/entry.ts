import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { candidate_id, interview_date, interview_type, interviewer, location } = await req.json();

    // Get candidate details
    const candidate = await base44.entities.JobCandidate.get(candidate_id);
    
    if (!candidate) {
      return Response.json({ error: 'Candidate not found' }, { status: 404 });
    }

    // Format date
    const date = new Date(interview_date);
    const dateOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    };
    const formattedDate = date.toLocaleString('en-US', dateOptions);

    // Format interview type
    const typeLabel = interview_type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');

    // Create email body
    const subject = `Interview Scheduled: ${candidate.job_title}`;
    const body = `Dear ${candidate.first_name},

We are pleased to invite you to an interview for the ${candidate.job_title} position.

Interview Details:
• Type: ${typeLabel}
• Date & Time: ${formattedDate}
• Interviewer: ${interviewer}
${location ? `• Location/Link: ${location}` : ''}

Please confirm your availability by replying to this email. If you have any questions or need to reschedule, don't hesitate to reach out.

We look forward to speaking with you!

Best regards,
${user.full_name}`;

    // Send email
    await base44.integrations.Core.SendEmail({
      to: candidate.email,
      subject: subject,
      body: body
    });

    // Log communication
    await base44.entities.CandidateEmail.create({
      candidate_id: candidate.id,
      candidate_name: `${candidate.first_name} ${candidate.last_name}`,
      candidate_email: candidate.email,
      template_name: 'Interview Invitation',
      subject: subject,
      body: body,
      sent_by: user.id,
      sent_by_name: user.full_name,
      sent_date: new Date().toISOString(),
      status: 'sent'
    });

    return Response.json({ success: true });

  } catch (error) {
    console.error('Interview invitation error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});