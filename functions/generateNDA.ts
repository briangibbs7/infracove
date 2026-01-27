import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      partyName, 
      companyName, 
      effectiveDate, 
      expiryDate,
      confidentialInfo,
      specialTerms 
    } = await req.json();

    if (!partyName || !companyName || !effectiveDate) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Use AI to generate NDA content
    const prompt = `Generate a professional Non-Disclosure Agreement (NDA) with the following details:

Company Name: ${companyName}
Other Party: ${partyName}
Effective Date: ${effectiveDate}
${expiryDate ? `Expiry Date: ${expiryDate}` : ''}
${confidentialInfo ? `Confidential Information Scope: ${confidentialInfo}` : ''}
${specialTerms ? `Special Terms: ${specialTerms}` : ''}

Generate a complete, legally-formatted NDA document with:
1. Title and parties
2. Recitals
3. Definition of confidential information
4. Obligations of receiving party
5. Exclusions from confidential information
6. Term and termination
7. Return of materials
8. No license
9. Remedies
10. Miscellaneous provisions
11. Signature blocks

Format the document professionally with proper sections, numbering, and legal language. Make it ready to sign.`;

    const ndaContent = await base44.integrations.Core.InvokeLLM({
      prompt: prompt
    });

    return Response.json({
      success: true,
      content: ndaContent,
      metadata: {
        partyName,
        companyName,
        effectiveDate,
        expiryDate,
        generatedBy: user.email,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error generating NDA:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});