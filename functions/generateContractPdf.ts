import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contractId } = await req.json();
    
    const contract = await base44.entities.Contract.list();
    const contractData = contract.find(c => c.id === contractId);
    
    if (!contractData) {
      return Response.json({ error: 'Contract not found' }, { status: 404 });
    }

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(79, 70, 229); // indigo-600
    doc.text('CONTRACT AGREEMENT', 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Contract #${contractData.contract_number || 'N/A'}`, 20, 28);
    
    // Contract Details
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(contractData.title, 20, 45);
    
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105); // slate-600
    
    let y = 55;
    const addField = (label, value) => {
      if (value) {
        doc.setFont(undefined, 'bold');
        doc.text(`${label}:`, 20, y);
        doc.setFont(undefined, 'normal');
        doc.text(String(value), 60, y);
        y += 8;
      }
    };
    
    addField('Type', contractData.type?.replace(/_/g, ' ').toUpperCase());
    addField('Party', contractData.party_name);
    addField('Value', contractData.value ? `$${contractData.value.toLocaleString()}` : null);
    addField('Department', contractData.department);
    addField('Start Date', contractData.start_date);
    addField('End Date', contractData.end_date);
    addField('Status', contractData.status?.replace(/_/g, ' ').toUpperCase());
    addField('Auto-Renew', contractData.auto_renew ? 'Yes' : 'No');
    
    if (contractData.notes) {
      y += 5;
      doc.setFont(undefined, 'bold');
      doc.text('Notes:', 20, y);
      y += 8;
      doc.setFont(undefined, 'normal');
      
      const splitNotes = doc.splitTextToSize(contractData.notes, 170);
      doc.text(splitNotes, 20, y);
      y += splitNotes.length * 6;
    }
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`Generated on ${new Date().toLocaleDateString()} by ${user.full_name}`, 20, 280);
    
    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=contract-${contractData.contract_number || contractData.id}.pdf`
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});