import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.2';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { grant_id } = await req.json();

    if (!grant_id) {
      return Response.json({ error: 'grant_id is required' }, { status: 400 });
    }

    // Fetch grant data
    const grants = await base44.entities.EquityGrant.filter({ id: grant_id });
    const grant = grants[0];

    if (!grant) {
      return Response.json({ error: 'Grant not found' }, { status: 404 });
    }

    // Fetch shareholder
    const shareholders = await base44.entities.Shareholder.filter({ id: grant.shareholder_id });
    const shareholder = shareholders[0];

    if (!shareholder) {
      return Response.json({ error: 'Shareholder not found' }, { status: 404 });
    }

    // Create PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Header
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('EQUITY GRANT AGREEMENT', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Agreement Date: ${new Date(grant.grant_date).toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Parties section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('1. PARTIES', 20, yPos);
    yPos += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const partiesText = `This Equity Grant Agreement ("Agreement") is entered into as of ${new Date(grant.grant_date).toLocaleDateString()} by and between the Company and ${shareholder.name} ("Grantee").`;
    const partiesLines = doc.splitTextToSize(partiesText, pageWidth - 40);
    doc.text(partiesLines, 20, yPos);
    yPos += partiesLines.length * 5 + 10;

    // Grant details
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('2. GRANT DETAILS', 20, yPos);
    yPos += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Grant Type: ${grant.grant_type.replace(/_/g, ' ').toUpperCase()}`, 20, yPos);
    yPos += 7;
    doc.text(`Number of Shares Granted: ${(grant.shares_granted || 0).toLocaleString()}`, 20, yPos);
    yPos += 7;
    if (grant.strike_price) {
      doc.text(`Exercise Price per Share: $${grant.strike_price.toFixed(2)}`, 20, yPos);
      yPos += 7;
    }
    if (grant.share_class) {
      doc.text(`Share Class: ${grant.share_class}`, 20, yPos);
      yPos += 7;
    }
    yPos += 5;

    // Vesting schedule
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('3. VESTING SCHEDULE', 20, yPos);
    yPos += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Vesting Start Date: ${grant.vesting_start_date ? new Date(grant.vesting_start_date).toLocaleDateString() : 'N/A'}`, 20, yPos);
    yPos += 7;
    doc.text(`Vesting Period: ${grant.vesting_period_months || 0} months`, 20, yPos);
    yPos += 7;
    doc.text(`Cliff Period: ${grant.cliff_months || 0} months`, 20, yPos);
    yPos += 7;
    doc.text(`Vesting Schedule: ${grant.vesting_schedule?.replace(/_/g, ' ') || 'N/A'}`, 20, yPos);
    yPos += 10;

    const vestingText = `The shares subject to this grant shall vest in accordance with the vesting schedule set forth above, subject to the Grantee's continuous service with the Company.`;
    const vestingLines = doc.splitTextToSize(vestingText, pageWidth - 40);
    doc.text(vestingLines, 20, yPos);
    yPos += vestingLines.length * 5 + 10;

    // Terms and conditions
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('4. TERMS AND CONDITIONS', 20, yPos);
    yPos += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const terms = [
      'Termination: If the Grantee\'s service with the Company terminates for any reason, unvested shares shall be forfeited.',
      'Non-Transferability: This grant is non-transferable except by will or the laws of descent and distribution.',
      'Tax Obligations: The Grantee is responsible for all tax obligations arising from this grant.',
      'Compliance: This grant is subject to all applicable laws, regulations, and the Company\'s equity incentive plan.'
    ];

    terms.forEach((term, idx) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      const termLines = doc.splitTextToSize(`4.${idx + 1} ${term}`, pageWidth - 40);
      doc.text(termLines, 20, yPos);
      yPos += termLines.length * 5 + 5;
    });

    // Signature section
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }

    yPos += 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('5. ACCEPTANCE', 20, yPos);
    yPos += 15;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('_________________________________', 20, yPos);
    doc.text('_________________________________', 110, yPos);
    yPos += 7;
    doc.text('Company Representative', 20, yPos);
    doc.text('Grantee Signature', 110, yPos);
    yPos += 7;
    doc.text('Date: _______________', 20, yPos);
    doc.text('Date: _______________', 110, yPos);

    // Footer
    yPos = doc.internal.pageSize.getHeight() - 15;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text(`Agreement ID: ${grant.id}`, pageWidth / 2, yPos, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPos + 4, { align: 'center' });

    // Generate PDF
    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=grant-agreement-${shareholder.name.replace(/\s+/g, '-')}.pdf`
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});