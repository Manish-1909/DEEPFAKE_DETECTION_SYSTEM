
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DetectionResult } from '@/services/detectionService';

export const generatePDFReport = (results: DetectionResult) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Add title
  doc.setFontSize(20);
  doc.text('Deepfake Detection Report', pageWidth / 2, 20, { align: 'center' });

  // Add timestamp
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, 30, { align: 'center' });

  // Add main results
  const mainResults = [
    ['Media Type', results.metadata.type],
    ['Confidence Score', `${results.confidence.toFixed(1)}%`],
    ['Classification', results.isManipulated ? 'Potential Deepfake' : 'Likely Authentic'],
    ['Resolution', results.metadata.resolution || 'N/A'],
  ];

  autoTable(doc, {
    head: [['Parameter', 'Value']],
    body: mainResults,
    startY: 40,
    theme: 'grid',
  });

  // Add detailed analysis
  const analysisResults = [
    ['Face Consistency', `${results.analysis.faceConsistency.toFixed(1)}%`],
    ['Lighting Consistency', `${results.analysis.lightingConsistency.toFixed(1)}%`],
    ['Artifacts Score', `${results.analysis.artifactsScore.toFixed(1)}%`],
  ];

  doc.setFontSize(14);
  doc.text('Detailed Analysis', 14, doc.lastAutoTable.finalY + 20);

  autoTable(doc, {
    head: [['Analysis Type', 'Score']],
    body: analysisResults,
    startY: doc.lastAutoTable.finalY + 25,
    theme: 'grid',
  });

  if (results.metadata.type === 'video' && results.analysis.suspiciousFrames) {
    const frameData = results.analysis.suspiciousFrames.map(frame => [
      `${(frame.timestamp / 1000).toFixed(1)}s`,
      `${frame.confidence.toFixed(1)}%`
    ]);

    doc.setFontSize(14);
    doc.text('Frame Analysis', 14, doc.lastAutoTable.finalY + 20);

    autoTable(doc, {
      head: [['Timestamp', 'Confidence']],
      body: frameData,
      startY: doc.lastAutoTable.finalY + 25,
      theme: 'grid',
    });
  }

  // Save the PDF
  doc.save('deepfake-detection-report.pdf');
};
