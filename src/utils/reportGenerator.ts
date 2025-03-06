
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

  // Add summary banner
  doc.setFillColor(results.isManipulated ? 255 : 0, results.isManipulated ? 0 : 150, 0);
  doc.rect(14, 35, pageWidth - 28, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text(
    results.isManipulated ? 'POTENTIAL MANIPULATION DETECTED' : 'LIKELY AUTHENTIC',
    pageWidth / 2, 42, { align: 'center' }
  );
  doc.setTextColor(0, 0, 0);

  // Add main results
  const mainResults = [
    ['Media Type', results.metadata.type],
    ['Confidence Score', `${results.confidence.toFixed(1)}%`],
    ['Classification', results.isManipulated ? 'Potential Deepfake' : 'Likely Authentic'],
    ['Resolution', results.metadata.resolution || 'N/A'],
    ['Risk Level', results.confidence > 90 ? 'High' : results.confidence > 70 ? 'Medium' : 'Low'],
  ];

  // Add main results table
  let yPos = 50;
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
  yPos += 10;
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

  // Add highlighted areas for images
  if (results.metadata.type === 'image' && results.analysis.highlightedAreas && results.analysis.highlightedAreas.length > 0) {
    yPos += 10;
    doc.setFontSize(14);
    doc.text('Suspicious Regions', 14, yPos);

    const areasData = results.analysis.highlightedAreas.map((area, index) => [
      `Region ${index + 1}`,
      `X:${area.x}, Y:${area.y}`,
      `${area.width}x${area.height}`,
      `${area.confidence.toFixed(1)}%`
    ]);

    yPos += 5;
    autoTable(doc, {
      head: [['Region ID', 'Position', 'Size', 'Confidence']],
      body: areasData,
      startY: yPos,
      theme: 'grid',
      didDrawPage: (data) => {
        yPos = data.cursor.y;
      },
    });
  }

  // Add frame analysis for videos
  if (results.metadata.type === 'video' && results.analysis.suspiciousFrames && results.analysis.suspiciousFrames.length > 0) {
    yPos += 10;
    doc.setFontSize(14);
    doc.text('Frame Analysis', 14, yPos);

    const frameData = results.analysis.suspiciousFrames.map((frame, index) => [
      `${index + 1}`,
      `${(frame.timestamp / 1000).toFixed(1)}s`,
      `${frame.confidence.toFixed(1)}%`,
      frame.boundingBox ? 'Yes' : 'No'
    ]);

    // Add frame analysis table
    yPos += 5;
    autoTable(doc, {
      head: [['Frame', 'Timestamp', 'Confidence', 'Suspicious Region']],
      body: frameData,
      startY: yPos,
      theme: 'grid',
      didDrawPage: (data) => {
        yPos = data.cursor.y;
      },
    });

    // List individual suspicious frames with high confidence
    const highConfidenceFrames = results.analysis.suspiciousFrames
      .filter(frame => frame.confidence > 70)
      .map((frame, index) => [
        `${(frame.timestamp / 1000).toFixed(1)}s`,
        `${frame.confidence.toFixed(1)}%`,
        frame.boundingBox ? `X:${frame.boundingBox.x}, Y:${frame.boundingBox.y}` : 'N/A'
      ]);

    if (highConfidenceFrames.length > 0) {
      yPos += 10;
      doc.setFontSize(14);
      doc.text('High Confidence Suspicious Frames', 14, yPos);

      yPos += 5;
      autoTable(doc, {
        head: [['Timestamp', 'Confidence', 'Region']],
        body: highConfidenceFrames,
        startY: yPos,
        theme: 'grid',
        didDrawPage: (data) => {
          yPos = data.cursor.y;
        },
      });
    }
  }

  // Add conclusion
  yPos += 15;
  doc.setFontSize(14);
  doc.text('Conclusion', 14, yPos);
  
  yPos += 7;
  doc.setFontSize(11);
  let conclusionText = results.isManipulated 
    ? `This ${results.metadata.type} shows signs of potential manipulation with ${results.confidence.toFixed(1)}% confidence. `
    : `This ${results.metadata.type} appears to be authentic with ${(100-results.confidence).toFixed(1)}% confidence. `;
    
  // Add detailed analysis conclusion
  if (results.isManipulated) {
    if (results.analysis.faceConsistency < 70) {
      conclusionText += 'Facial inconsistencies detected. ';
    }
    if (results.analysis.lightingConsistency < 70) {
      conclusionText += 'Lighting anomalies present. ';
    }
    if (results.analysis.artifactsScore > 50) {
      conclusionText += 'Digital artifacts identified. ';
    }
  }
  
  // Add recommendations
  conclusionText += results.confidence > 90 
    ? 'Recommended action: Consider this media highly suspect and verify through alternative sources.'
    : results.confidence > 70
    ? 'Recommended action: Exercise caution when sharing or making decisions based on this media.'
    : 'Recommended action: This media appears to be reliable but caution is always advised.';

  // Add wrapped text
  const splitText = doc.splitTextToSize(conclusionText, pageWidth - 28);
  doc.text(splitText, 14, yPos);

  // Add footer
  const finalYPos = yPos + splitText.length * 5 + 20;
  doc.setFontSize(8);
  doc.text('This report was generated by an automated system and should be used for informational purposes only.', 
    pageWidth / 2, finalYPos, { align: 'center' });

  // Save the PDF
  doc.save('deepfake-detection-report.pdf');
};
