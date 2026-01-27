import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ndaId, changeSummary, content, fileUrl } = await req.json();

    if (!ndaId) {
      return Response.json({ error: 'Missing NDA ID' }, { status: 400 });
    }

    // Get NDA details
    const nda = await base44.entities.Contract.get(ndaId);
    
    if (!nda) {
      return Response.json({ error: 'NDA not found' }, { status: 404 });
    }

    // Get all versions for this NDA to determine next version number
    const existingVersions = await base44.asServiceRole.entities.NDAVersion.filter({ nda_id: ndaId });
    const nextVersionNumber = existingVersions.length + 1;

    // Mark all previous versions as not current and superseded
    for (const version of existingVersions) {
      if (version.is_current) {
        await base44.asServiceRole.entities.NDAVersion.update(version.id, {
          is_current: false,
          status: version.status === 'signed' ? 'signed' : 'superseded'
        });
      }
    }

    // Create new version
    const newVersion = await base44.asServiceRole.entities.NDAVersion.create({
      nda_id: ndaId,
      version_number: nextVersionNumber,
      title: nda.title,
      file_url: fileUrl || nda.file_url,
      content: content,
      status: 'active',
      change_summary: changeSummary || `Version ${nextVersionNumber}`,
      created_by_name: user.full_name,
      is_current: true
    });

    // Update NDA status to draft (needs new signatures)
    await base44.asServiceRole.entities.Contract.update(ndaId, {
      status: 'draft'
    });

    // Cancel any pending signatures from previous version
    const pendingSignatures = await base44.asServiceRole.entities.NDASignature.filter({ 
      nda_id: ndaId,
      status: 'pending'
    });

    for (const sig of pendingSignatures) {
      await base44.asServiceRole.entities.NDASignature.update(sig.id, {
        status: 'declined',
        notes: 'Cancelled due to new version'
      });
    }

    return Response.json({
      success: true,
      version: newVersion,
      message: `Version ${nextVersionNumber} created successfully`
    });
  } catch (error) {
    console.error('Error creating NDA version:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});