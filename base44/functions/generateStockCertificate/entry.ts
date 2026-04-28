import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.2';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { shareholder_id } = await req.json();

    if (!shareholder_id) {
      return Response.json({ error: 'shareholder_id is required' }, { status: 400 });
    }

    // Fetch shareholder data
    const shareholders = await base44.entities.Shareholder.filter({ id: shareholder_id });
    const shareholder = shareholders[0];

    if (!shareholder) {
      return Response.json({ error: 'Shareholder not found' }, { status: 404 });
    }

    // Fetch related data
    const equityGrants = await base44.entities.EquityGrant.filter({ shareholder_id });
    const shareClasses = await base44.entities.ShareClass.list();

    // Create PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Add decorative border
    doc.setLineWidth(2);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
    doc.setLineWidth(0.5);
    doc.rect(15, 15, pageWidth - 30, pageHeight - 30);

    // Title
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('STOCK CERTIFICATE', pageWidth / 2, 40, { align: 'center' });

    // Certificate number
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Certificate No: ${shareholder.id.slice(0, 8).toUpperCase()}`, pageWidth / 2, 50, { align: 'center' });

    // Main content
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('This certifies that', pageWidth / 2, 70, { align: 'center' });

    doc.setFontSize(20);
    doc.text(shareholder.name, pageWidth / 2, 85, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('is the registered holder of', pageWidth / 2, 100, { align: 'center' });

    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text((shareholder.total_shares || 0).toLocaleString(), pageWidth / 2, 115, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('shares of common stock', pageWidth / 2, 125, { align: 'center' });

    // Details section
    let yPos = 150;
    doc.setFontSize(12);
    doc.text('SHAREHOLDER DETAILS', 25, yPos);
    yPos += 10;

    doc.setFont('helvetica', 'normal');
    doc.text(`Type: ${shareholder.type}`, 25, yPos);
    yPos += 7;
    doc.text(`Entity Type: ${shareholder.entity_type || 'Individual'}`, 25, yPos);
    yPos += 7;
    doc.text(`Ownership: ${(shareholder.ownership_percentage || 0).toFixed(2)}%`, 25, yPos);
    yPos += 7;
    doc.text(`Vested Shares: ${(shareholder.shares_vested || 0).toLocaleString()}`, 25, yPos);
    yPos += 7;
    doc.text(`Unvested Shares: ${((shareholder.total_shares || 0) - (shareholder.shares_vested || 0)).toLocaleString()}`, 25, yPos);

    // Grants section
    if (equityGrants.length > 0) {
      yPos += 15;
      doc.setFont('helvetica', 'bold');
      doc.text('EQUITY GRANTS', 25, yPos);
      yPos += 10;

      doc.setFont('helvetica', 'normal');
      equityGrants.forEach((grant, idx) => {
        if (yPos > pageHeight - 40) {
          doc.addPage();
          yPos = 30;
        }
        const grantDate = new Date(grant.grant_date).toLocaleDateString();
        doc.text(`${idx + 1}. ${grant.grant_type}: ${grant.shares_granted} shares (${grantDate})`, 25, yPos);
        yPos += 7;
      });
    }

    // Footer
    const footerY = pageHeight - 30;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.text(`Issued: ${new Date().toLocaleDateString()}`, pageWidth / 2, footerY, { align: 'center' });
    doc.text('This certificate is void if altered or transferred without proper authorization', pageWidth / 2, footerY + 5, { align: 'center' });

    // Generate PDF
    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=stock-certificate-${shareholder.name.replace(/\s+/g, '-')}.pdf`
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});