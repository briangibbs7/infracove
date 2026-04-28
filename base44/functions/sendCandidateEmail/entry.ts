import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { candidate_id, template_id, custom_subject, custom_body } = await req.json();

    // Get candidate details
    const candidate = await base44.entities.JobCandidate.get(candidate_id);
    
    if (!candidate) {
      return Response.json({ error: 'Candidate not found' }, { status: 404 });
    }

    let subject, body, templateName;

    if (template_id) {
      // Use template
      const template = await base44.entities.EmailTemplate.get(template_id);
      subject = template.subject;
      body = template.body;
      templateName = template.name;

      // Replace placeholders
      const replacements = {
        '{{first_name}}': candidate.first_name || '',
        '{{last_name}}': candidate.last_name || '',
        '{{full_name}}': `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim(),
        '{{job_title}}': candidate.job_title || '',
        '{{email}}': candidate.email || '',
      };

      Object.entries(replacements).forEach(([placeholder, value]) => {
        subject = subject.replace(new RegExp(placeholder, 'g'), value);
        body = body.replace(new RegExp(placeholder, 'g'), value);
      });
    } else {
      // Use custom email
      subject = custom_subject;
      body = custom_body;
      templateName = 'Custom Email';
    }

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
      template_id: template_id || null,
      template_name: templateName,
      subject: subject,
      body: body,
      sent_by: user.id,
      sent_by_name: user.full_name,
      sent_date: new Date().toISOString(),
      status: 'sent'
    });

    return Response.json({ success: true });

  } catch (error) {
    console.error('Email send error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});