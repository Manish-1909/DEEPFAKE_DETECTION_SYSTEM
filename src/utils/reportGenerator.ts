
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

  // Start position for first table
  let yPos = 40;

  // Add main results table
  autoTable(doc, {
    head: [['Parameter', 'Value']],
    body: mainResults,
    startY: yPos,
    theme: 'grid',
    didDrawPage: (data) => {
      yPos = data.cursor.y;
    },
  });

  // Add detailed analysis title
  yPos += 20;
  doc.setFontSize(14);
  doc.text('Detailed Analysis', 14, yPos);

  // Add analysis results
  const analysisResults = [
    ['Face Consistency', `${results.analysis.faceConsistency.toFixed(1)}%`],
    ['Lighting Consistency', `${results.analysis.lightingConsistency.toFixed(1)}%`],
    ['Artifacts Score', `${results.analysis.artifactsScore.toFixed(1)}%`],
  ];

  // Add analysis results table
  yPos += 5;
  autoTable(doc, {
    head: [['Analysis Type', 'Score']],
    body: analysisResults,
    startY: yPos,
    theme: 'grid',
    didDrawPage: (data) => {
      yPos = data.cursor.y;
    },
  });

  // Add frame analysis for videos
  if (results.metadata.type === 'video' && results.analysis.suspiciousFrames) {
    const frameData = results.analysis.suspiciousFrames.map(frame => [
      `${(frame.timestamp / 1000).toFixed(1)}s`,
      `${frame.confidence.toFixed(1)}%`
    ]);

    // Add frame analysis title
    yPos += 20;
    doc.setFontSize(14);
    doc.text('Frame Analysis', 14, yPos);

    // Add frame analysis table
    yPos += 5;
    autoTable(doc, {
      head: [['Timestamp', 'Confidence']],
      body: frameData,
      startY: yPos,
      theme: 'grid',
    });
  }

  // Save the PDF
  doc.save('deepfake-detection-report.pdf');
};
