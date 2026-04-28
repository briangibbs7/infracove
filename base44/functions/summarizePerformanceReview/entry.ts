import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { review_id } = await req.json();

    if (!review_id) {
      return Response.json({ error: 'review_id is required' }, { status: 400 });
    }

    // Fetch the review
    const review = await base44.asServiceRole.entities.PerformanceReview.get(review_id);
    
    if (!review) {
      return Response.json({ error: 'Review not found' }, { status: 404 });
    }

    // Compile all feedback
    const feedbackText = [];
    
    if (review.self_assessment) {
      feedbackText.push(`Self-Assessment: ${review.self_assessment.achievements || ''} ${review.self_assessment.challenges || ''}`);
    }
    
    if (review.manager_review) {
      feedbackText.push(`Manager Review: ${review.manager_review.strengths || ''} ${review.manager_review.areas_for_improvement || ''} ${review.manager_review.feedback || ''}`);
    }
    
    if (review.feedback_360 && review.feedback_360.length > 0) {
      review.feedback_360.forEach((f, idx) => {
        feedbackText.push(`360 Feedback ${idx + 1} (${f.relationship}): Strengths: ${f.strengths || ''}, Areas for Improvement: ${f.areas_for_improvement || ''}, Comments: ${f.comments || ''}`);
      });
    }

    const prompt = `Analyze this performance review feedback and provide:
1. A concise overall summary (2-3 sentences)
2. List 3-5 key strengths
3. List 3-5 development areas
4. List 3-5 recommended actions for improvement

Feedback:
${feedbackText.join('\n\n')}

Return the analysis as JSON with this structure:
{
  "overall_summary": "string",
  "key_strengths": ["string"],
  "development_areas": ["string"],
  "recommended_actions": ["string"]
}`;

    // Use AI to summarize
    const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: prompt,
      response_json_schema: {
        type: "object",
        properties: {
          overall_summary: { type: "string" },
          key_strengths: {
            type: "array",
            items: { type: "string" }
          },
          development_areas: {
            type: "array",
            items: { type: "string" }
          },
          recommended_actions: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    });

    // Update review with AI summary
    const aiSummary = {
      ...aiResponse,
      generated_date: new Date().toISOString().split('T')[0]
    };

    await base44.asServiceRole.entities.PerformanceReview.update(review_id, {
      ai_summary: aiSummary
    });

    return Response.json({
      success: true,
      ai_summary: aiSummary
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});