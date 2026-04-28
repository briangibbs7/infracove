import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file_url, document_id, document_title } = await req.json();

    if (!file_url || !document_id) {
      return Response.json({ error: 'file_url and document_id are required' }, { status: 400 });
    }

    // Use LLM to extract text from document
    const ocrResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Extract all text content from this document. Return ONLY the extracted text, no additional commentary or formatting. If the document contains tables, preserve the structure as much as possible using plain text.`,
      file_urls: [file_url],
    });

    const extractedText = typeof ocrResult === 'string' ? ocrResult : ocrResult.text || '';

    return Response.json({ 
      success: true, 
      extracted_text: extractedText,
      document_id: document_id
    });
  } catch (error) {
    console.error('OCR processing error:', error);
    return Response.json({ 
      error: error.message,
      details: 'Failed to process OCR'
    }, { status: 500 });
  }
});