import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { candidate_id, resume_url, job_requirements } = await req.json();

    // Fetch the resume content
    const resumeResponse = await fetch(resume_url);
    const resumeBlob = await resumeResponse.blob();

    // Use AI to extract structured data from resume
    const extractionPrompt = `Analyze this resume and extract the following information in JSON format:
- skills: array of technical and soft skills
- experience: array of objects with {company, title, duration}
- education: array of objects with {degree, institution, year}
- years_of_experience: total years (number)
- summary: brief 2-3 sentence summary of candidate

Return ONLY valid JSON, no additional text.`;

    const extractedData = await base44.integrations.Core.InvokeLLM({
      prompt: extractionPrompt,
      file_urls: resume_url,
      response_json_schema: {
        type: "object",
        properties: {
          skills: { type: "array", items: { type: "string" } },
          experience: {
            type: "array",
            items: {
              type: "object",
              properties: {
                company: { type: "string" },
                title: { type: "string" },
                duration: { type: "string" }
              }
            }
          },
          education: {
            type: "array",
            items: {
              type: "object",
              properties: {
                degree: { type: "string" },
                institution: { type: "string" },
                year: { type: "string" }
              }
            }
          },
          years_of_experience: { type: "number" },
          summary: { type: "string" }
        }
      }
    });

    // Score candidate against job requirements
    const scoringPrompt = `Given the following:

Job Requirements:
${job_requirements}

Candidate Skills: ${extractedData.skills.join(", ")}
Candidate Experience: ${JSON.stringify(extractedData.experience)}
Candidate Summary: ${extractedData.summary}

Analyze the match and provide:
1. match_score: 0-100 score of how well the candidate matches the job
2. strengths: array of 3-5 key strengths or good matches
3. red_flags: array of any concerns or missing qualifications (empty if none)

Return ONLY valid JSON.`;

    const scoringData = await base44.integrations.Core.InvokeLLM({
      prompt: scoringPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          match_score: { type: "number" },
          strengths: { type: "array", items: { type: "string" } },
          red_flags: { type: "array", items: { type: "string" } }
        }
      }
    });

    // Combine all analysis
    const aiAnalysis = {
      extracted_skills: extractedData.skills,
      extracted_experience: extractedData.experience,
      education: extractedData.education,
      match_score: scoringData.match_score,
      strengths: scoringData.strengths,
      red_flags: scoringData.red_flags,
      summary: extractedData.summary
    };

    // Update candidate with AI analysis
    await base44.asServiceRole.entities.JobCandidate.update(candidate_id, {
      ai_analysis: aiAnalysis,
      skills: extractedData.skills,
      years_of_experience: extractedData.years_of_experience
    });

    return Response.json({
      success: true,
      analysis: aiAnalysis
    });

  } catch (error) {
    console.error('Resume analysis error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});