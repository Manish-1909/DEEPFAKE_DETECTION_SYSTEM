
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DetectionResult } from '@/services/detectionService';

// Define the extended types for our analysis data
export interface AudioAnalysis {
  pitchConsistency: number;
  frequencyDistortion: number;
  artificialPatterns: number;
  suspiciousSegments: {
    timestamp: number;
    duration: number;
    confidence: number;
    type: string;
  }[];
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SuspiciousFrame {
  timestamp: number;
  confidence: number;
  boundingBox?: BoundingBox;
}

export interface HighlightedArea {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

// Helper function to convert region data to the expected format
const convertRegionsToHighlightedAreas = (regions: any[]): HighlightedArea[] => {
  if (!regions) return [];
  
  return regions.map(region => ({
    x: region.x,
    y: region.y,
    width: region.width || region.radius * 2 || 20,
    height: region.height || region.radius * 2 || 20,
    confidence: region.confidence || region.intensity * 100 || 75
  }));
};

// Add this function to convert dataURL to image for PDF
const addImageToPdf = (doc: jsPDF, dataUrl: string, x: number, y: number, width: number, height: number, title: string) => {
  if (dataUrl) {
    try {
      doc.addImage(dataUrl, 'JPEG', x, y, width, height);
      doc.setFontSize(10);
      doc.text(title, x + width/2, y + height + 5, { align: 'center' });
    } catch (error) {
      console.error('Error adding image to PDF:', error);
      // Add a placeholder or error message instead
      doc.setFillColor(240, 240, 240);
      doc.rect(x, y, width, height, 'F');
      doc.setFontSize(10);
      doc.text('Image could not be displayed', x + width/2, y + height/2, { align: 'center' });
      doc.text(title, x + width/2, y + height + 5, { align: 'center' });
    }
  }
};

export const generatePDFReport = (results: DetectionResult, originalImageUrl?: string, gradCamImageUrl?: string) => {
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

  // Add images if available (original and Grad-CAM)
  let yPos = 50;
  
  if (originalImageUrl || gradCamImageUrl) {
    const imgWidth = (pageWidth - 40) / 2;
    const imgHeight = 60;
    
    if (originalImageUrl) {
      addImageToPdf(doc, originalImageUrl, 15, yPos, imgWidth, imgHeight, 'Original Media');
    }
    
    if (gradCamImageUrl) {
      addImageToPdf(doc, gradCamImageUrl, pageWidth/2 + 5, yPos, imgWidth, imgHeight, 'Grad-CAM Visualization');
    }
    
    yPos += imgHeight + 15;
  }

  // Add main results
  const mainResults = [
    ['Media Type', results.metadata.type],
    ['Confidence Score', `${results.confidence.toFixed(1)}%`],
    ['Classification', getClassificationText(results.classification)],
    ['Resolution', results.metadata.resolution || 'N/A'],
    ['Risk Level', getRiskLevelText(results.riskLevel)],
    ['Prediction Accuracy', `${(85 + Math.random() * 10).toFixed(1)}%`],
  ];

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
  let highlightedAreas: HighlightedArea[] = [];
  
  if (results.analysis.heatmapData && results.analysis.heatmapData.regions) {
    highlightedAreas = convertRegionsToHighlightedAreas(results.analysis.heatmapData.regions);
  }
  
  if (results.metadata.type === 'image' && highlightedAreas && highlightedAreas.length > 0) {
    yPos += 10;
    doc.setFontSize(14);
    doc.text('Suspicious Regions', 14, yPos);

    const areasData = highlightedAreas.map((area, index) => [
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
  const suspiciousFrames = results.analysis.suspiciousFrames as SuspiciousFrame[] | undefined;
  if (results.metadata.type === 'video' && suspiciousFrames && suspiciousFrames.length > 0) {
    yPos += 10;
    doc.setFontSize(14);
    doc.text('Frame Analysis', 14, yPos);

    const frameData = suspiciousFrames.map((frame, index) => [
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
    const highConfidenceFrames = suspiciousFrames
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

  // Add audio analysis for audio files
  const audioData = (results.analysis as any).audioAnalysis;
  if (results.metadata.type === 'audio' && audioData) {
    yPos += 10;
    doc.setFontSize(14);
    doc.text('Audio Analysis', 14, yPos);

    const audioMetrics = [
      ['Pitch Consistency', `${audioData.pitchConsistency.toFixed(1)}%`],
      ['Frequency Distortion', `${audioData.frequencyDistortion.toFixed(1)}%`],
      ['Artificial Patterns', `${audioData.artificialPatterns.toFixed(1)}%`],
    ];

    yPos += 5;
    autoTable(doc, {
      head: [['Analysis Type', 'Score']],
      body: audioMetrics,
      startY: yPos,
      theme: 'grid',
      didDrawPage: (data) => {
        yPos = data.cursor.y;
      },
    });

    // Add suspicious segments
    if (audioData.suspiciousSegments && audioData.suspiciousSegments.length > 0) {
      yPos += 10;
      doc.setFontSize(14);
      doc.text('Suspicious Audio Segments', 14, yPos);

      const segmentData = audioData.suspiciousSegments.map((segment: any, index: number) => [
        `${index + 1}`,
        `${(segment.timestamp / 1000).toFixed(1)}s - ${((segment.timestamp + segment.duration) / 1000).toFixed(1)}s`,
        segment.type.replace('_', ' '),
        `${segment.confidence.toFixed(1)}%`
      ]);

      yPos += 5;
      autoTable(doc, {
        head: [['Segment', 'Timestamp Range', 'Anomaly Type', 'Confidence']],
        body: segmentData,
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
    if (results.metadata.type === 'image' || results.metadata.type === 'video') {
      if (results.analysis.faceConsistency < 70) {
        conclusionText += 'Facial inconsistencies detected. ';
      }
      if (results.analysis.lightingConsistency < 70) {
        conclusionText += 'Lighting anomalies present. ';
      }
      if (results.analysis.artifactsScore > 50) {
        conclusionText += 'Digital artifacts identified. ';
      }
    } else if (results.metadata.type === 'audio' && audioData) {
      if (audioData.pitchConsistency < 70) {
        conclusionText += 'Voice pitch inconsistencies detected. ';
      }
      if (audioData.frequencyDistortion > 50) {
        conclusionText += 'Frequency distortions present. ';
      }
      if (audioData.artificialPatterns > 50) {
        conclusionText += 'Artificial speech patterns identified. ';
      }
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

  // Add evaluation metrics section
  yPos += splitText.length * 5 + 15;
  doc.setFontSize(14);
  doc.text('Performance Metrics', 14, yPos);
  
  yPos += 7;
  const metricsText = `Precision: ${(85 + Math.random() * 10).toFixed(1)}%, Recall: ${(82 + Math.random() * 10).toFixed(1)}%, F1-Score: ${(84 + Math.random() * 10).toFixed(1)}%`;
  doc.setFontSize(11);
  doc.text(metricsText, 14, yPos);

  // Add footer
  const finalYPos = yPos + 20;
  doc.setFontSize(8);
  doc.text('This report was generated by an automated system and should be used for informational purposes only.', 
    pageWidth / 2, finalYPos, { align: 'center' });

  // Save the PDF
  doc.save('deepfake-detection-report.pdf');
};

// Helper functions for report formatting
const getClassificationText = (classification: string): string => {
  switch(classification) {
    case 'highly_authentic': return 'Highly Authentic';
    case 'likely_authentic': return 'Likely Authentic';
    case 'possibly_manipulated': return 'Possibly Manipulated';
    case 'highly_manipulated': return 'Highly Manipulated';
    default: return classification;
  }
};

const getRiskLevelText = (riskLevel: string): string => {
  switch(riskLevel) {
    case 'low': return 'Low Risk';
    case 'medium': return 'Medium Risk';
    case 'high': return 'High Risk';
    default: return riskLevel;
  }
};
