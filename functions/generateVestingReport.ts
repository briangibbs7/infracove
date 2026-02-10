import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.2';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    const { shareholder_id, report_type } = await req.json();

    // Fetch data
    const shareholders = await base44.asServiceRole.entities.Shareholder.list();
    const equityGrants = await base44.asServiceRole.entities.EquityGrant.list();
    const valuations = await base44.asServiceRole.entities.Valuation.list("-valuation_date");

    const activeValuation = valuations.find(v => v.status === "active");
    const pricePerShare = activeValuation?.common_stock_price || 0;

    const doc = new jsPDF();
    let yPos = 20;

    // Header
    doc.setFontSize(20);
    doc.text("Vesting Report", 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPos);
    yPos += 15;

    if (report_type === "individual" && shareholder_id) {
      // Individual shareholder report
      const shareholder = shareholders.find(s => s.id === shareholder_id);
      if (!shareholder) {
        return Response.json({ error: "Shareholder not found" }, { status: 404 });
      }

      const shareholderGrants = equityGrants.filter(g => g.shareholder_id === shareholder_id);

      doc.setFontSize(16);
      doc.text(`${shareholder.name}`, 20, yPos);
      yPos += 7;

      doc.setFontSize(10);
      doc.text(`Email: ${shareholder.email || "N/A"}`, 20, yPos);
      yPos += 5;
      doc.text(`Type: ${shareholder.type}`, 20, yPos);
      yPos += 10;

      // Summary
      doc.setFontSize(12);
      doc.text("Equity Summary", 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.text(`Total Shares: ${(shareholder.total_shares || 0).toLocaleString()}`, 25, yPos);
      yPos += 5;
      doc.text(`Vested: ${(shareholder.shares_vested || 0).toLocaleString()}`, 25, yPos);
      yPos += 5;
      doc.text(`Unvested: ${((shareholder.total_shares || 0) - (shareholder.shares_vested || 0)).toLocaleString()}`, 25, yPos);
      yPos += 5;
      doc.text(`Ownership: ${shareholder.ownership_percentage?.toFixed(2) || 0}%`, 25, yPos);
      yPos += 5;
      
      if (pricePerShare > 0) {
        const portfolioValue = (shareholder.total_shares || 0) * pricePerShare;
        const vestedValue = (shareholder.shares_vested || 0) * pricePerShare;
        doc.text(`Portfolio Value: $${portfolioValue.toLocaleString()}`, 25, yPos);
        yPos += 5;
        doc.text(`Vested Value: $${vestedValue.toLocaleString()}`, 25, yPos);
        yPos += 5;
      }
      yPos += 10;

      // Grants detail
      doc.setFontSize(12);
      doc.text("Grant Details", 20, yPos);
      yPos += 8;

      shareholderGrants.forEach((grant, idx) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(10);
        doc.text(`Grant ${idx + 1}: ${grant.grant_type.replace(/_/g, " ").toUpperCase()}`, 25, yPos);
        yPos += 5;
        doc.text(`  Grant Date: ${grant.grant_date}`, 30, yPos);
        yPos += 5;
        doc.text(`  Total Shares: ${grant.shares_granted?.toLocaleString()}`, 30, yPos);
        yPos += 5;
        doc.text(`  Vested: ${grant.shares_vested?.toLocaleString()}`, 30, yPos);
        yPos += 5;
        doc.text(`  Progress: ${grant.shares_granted > 0 ? ((grant.shares_vested / grant.shares_granted) * 100).toFixed(1) : 0}%`, 30, yPos);
        yPos += 5;
        doc.text(`  Status: ${grant.status}`, 30, yPos);
        yPos += 8;
      });

    } else {
      // Company-wide report
      doc.setFontSize(16);
      doc.text("Company-Wide Vesting Report", 20, yPos);
      yPos += 10;

      // Overall stats
      const totalShares = shareholders.reduce((sum, s) => sum + (s.total_shares || 0), 0);
      const totalVested = shareholders.reduce((sum, s) => sum + (s.shares_vested || 0), 0);
      const totalUnvested = totalShares - totalVested;

      doc.setFontSize(12);
      doc.text("Overall Statistics", 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.text(`Total Shareholders: ${shareholders.length}`, 25, yPos);
      yPos += 5;
      doc.text(`Total Shares: ${totalShares.toLocaleString()}`, 25, yPos);
      yPos += 5;
      doc.text(`Total Vested: ${totalVested.toLocaleString()}`, 25, yPos);
      yPos += 5;
      doc.text(`Total Unvested: ${totalUnvested.toLocaleString()}`, 25, yPos);
      yPos += 5;
      doc.text(`Vesting Progress: ${totalShares > 0 ? ((totalVested / totalShares) * 100).toFixed(1) : 0}%`, 25, yPos);
      yPos += 10;

      // By shareholder type
      doc.setFontSize(12);
      doc.text("Breakdown by Type", 20, yPos);
      yPos += 8;

      const types = ["founder", "employee", "investor", "advisor"];
      types.forEach(type => {
        const typeShareholders = shareholders.filter(s => s.type === type);
        if (typeShareholders.length === 0) return;

        const typeShares = typeShareholders.reduce((sum, s) => sum + (s.total_shares || 0), 0);
        const typeVested = typeShareholders.reduce((sum, s) => sum + (s.shares_vested || 0), 0);

        doc.setFontSize(10);
        doc.text(`${type.charAt(0).toUpperCase() + type.slice(1)}s:`, 25, yPos);
        yPos += 5;
        doc.text(`  Count: ${typeShareholders.length}`, 30, yPos);
        yPos += 5;
        doc.text(`  Shares: ${typeShares.toLocaleString()}`, 30, yPos);
        yPos += 5;
        doc.text(`  Vested: ${typeVested.toLocaleString()} (${typeShares > 0 ? ((typeVested / typeShares) * 100).toFixed(1) : 0}%)`, 30, yPos);
        yPos += 8;

        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }
      });

      // Detailed shareholder list
      doc.addPage();
      yPos = 20;
      doc.setFontSize(14);
      doc.text("Detailed Shareholder List", 20, yPos);
      yPos += 10;

      shareholders.forEach((sh, idx) => {
        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(10);
        doc.text(`${idx + 1}. ${sh.name}`, 20, yPos);
        yPos += 5;
        doc.text(`   Type: ${sh.type}  |  Total: ${(sh.total_shares || 0).toLocaleString()}  |  Vested: ${(sh.shares_vested || 0).toLocaleString()}  |  Progress: ${sh.total_shares > 0 ? ((sh.shares_vested / sh.total_shares) * 100).toFixed(0) : 0}%`, 20, yPos);
        yPos += 8;
      });
    }

    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=vesting-report-${Date.now()}.pdf`
      }
    });

  } catch (error) {
    console.error("Error generating vesting report:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});