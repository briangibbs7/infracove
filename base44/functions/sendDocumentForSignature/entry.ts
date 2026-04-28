import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { document_type, recipient_email, recipient_name, grant_id, election_id, metadata } = await req.json();

    const docusignKey = Deno.env.get('DOCUSIGN_INTEGRATION_KEY');
    const docusignUserId = Deno.env.get('DOCUSIGN_USER_ID');
    const docusignAccountId = Deno.env.get('DOCUSIGN_ACCOUNT_ID');
    const privateKey = Deno.env.get('DOCUSIGN_PRIVATE_KEY');

    if (!docusignKey || !docusignUserId || !docusignAccountId || !privateKey) {
      return Response.json({ 
        error: 'DocuSign credentials not configured',
        message: 'Please set DOCUSIGN_INTEGRATION_KEY, DOCUSIGN_USER_ID, DOCUSIGN_ACCOUNT_ID, and DOCUSIGN_PRIVATE_KEY in environment variables'
      }, { status: 400 });
    }

    // JWT authentication with DocuSign
    const jwtPayload = {
      iss: docusignKey,
      sub: docusignUserId,
      aud: 'account-d.docusign.com',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      scope: 'signature impersonation'
    };

    // For production, use proper JWT signing library
    const authResponse = await fetch('https://account-d.docusign.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwtPayload // In production, properly sign this JWT
      })
    });

    const { access_token } = await authResponse.json();

    // Generate document content based on type
    let documentContent = '';
    let documentName = '';

    if (document_type === 'grant_agreement') {
      const grant = await base44.asServiceRole.entities.EquityGrant.get(grant_id);
      documentName = `Equity_Grant_Agreement_${grant.shareholder_name}`;
      documentContent = `
        <html>
          <body>
            <h1>Equity Grant Agreement</h1>
            <p>This agreement grants ${grant.shares_granted} shares to ${grant.shareholder_name}</p>
            <p>Grant Type: ${grant.grant_type}</p>
            <p>Strike Price: $${grant.strike_price}</p>
            <p>Grant Date: ${grant.grant_date}</p>
            <p>Vesting Schedule: ${grant.vesting_schedule}</p>
            <br/><br/>
            <p>Signature: /s1/</p>
            <p>Date: /d1/</p>
          </body>
        </html>
      `;
    } else if (document_type === '83b_election') {
      const election = await base44.asServiceRole.entities.EightyThreeBElection.get(election_id);
      documentName = `83b_Election_${election.employee_name}`;
      documentContent = `
        <html>
          <body>
            <h1>83(b) Election</h1>
            <p>Employee: ${election.employee_name}</p>
            <p>Shares: ${election.shares_subject_to_election}</p>
            <p>Grant Date: ${election.grant_date}</p>
            <p>Fair Market Value: $${election.fair_market_value_per_share}</p>
            <br/><br/>
            <p>Signature: /s1/</p>
            <p>Date: /d1/</p>
          </body>
        </html>
      `;
    }

    // Create envelope
    const envelopeDefinition = {
      emailSubject: `Please sign: ${documentName}`,
      documents: [{
        documentBase64: btoa(documentContent),
        name: documentName,
        fileExtension: 'html',
        documentId: '1'
      }],
      recipients: {
        signers: [{
          email: recipient_email,
          name: recipient_name,
          recipientId: '1',
          routingOrder: '1',
          tabs: {
            signHereTabs: [{ 
              documentId: '1', 
              pageNumber: '1', 
              xPosition: '100', 
              yPosition: '200' 
            }],
            dateSignedTabs: [{
              documentId: '1',
              pageNumber: '1',
              xPosition: '100',
              yPosition: '250'
            }]
          }
        }]
      },
      status: 'sent'
    };

    const envelopeResponse = await fetch(
      `https://demo.docusign.net/restapi/v2.1/accounts/${docusignAccountId}/envelopes`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(envelopeDefinition)
      }
    );

    const envelope = await envelopeResponse.json();

    // Log the activity
    await base44.asServiceRole.functions.invoke('logEquityActivity', {
      entity_type: document_type === 'grant_agreement' ? 'EquityGrant' : 'EightyThreeBElection',
      entity_id: grant_id || election_id,
      action: 'sent_for_signature',
      description: `Document sent to ${recipient_name} for electronic signature`,
      user_name: user.full_name
    });

    return Response.json({
      success: true,
      envelope_id: envelope.envelopeId,
      status: envelope.status,
      message: 'Document sent for signature successfully'
    });

  } catch (error) {
    console.error('Error sending document for signature:', error);
    return Response.json({ 
      error: error.message,
      details: error.toString()
    }, { status: 500 });
  }
});