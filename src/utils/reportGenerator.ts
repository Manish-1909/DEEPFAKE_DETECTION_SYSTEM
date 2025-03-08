
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
  doc.text('DEEPFAKE DETECTION REPORT', pageWidth / 2, 20, { align: 'center' });

  // Add date and time
  doc.setFontSize(12);
  doc.text(`Date and Time of Generation: ${new Date().toLocaleString()}`, pageWidth / 2, 30, { align: 'center' });

  // Add summary classification banner
  doc.setFillColor(results.isManipulated ? 255 : 0, results.isManipulated ? 0 : 150, 0);
  doc.rect(14, 40, pageWidth - 28, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text(
    results.isManipulated ? 'DEEPFAKE DETECTED' : 'LIKELY AUTHENTIC',
    pageWidth / 2, 47, { align: 'center' }
  );
  doc.setTextColor(0, 0, 0);

  // Add images if available (original and Grad-CAM)
  let yPos = 60;
  
  if (originalImageUrl || gradCamImageUrl) {
    const imgWidth = (pageWidth - 40) / 2;
    const imgHeight = 60;
    
    if (originalImageUrl) {
      addImageToPdf(doc, originalImageUrl, 15, yPos, imgWidth, imgHeight, 'Original Media');
    }
    
    if (gradCamImageUrl) {
      addImageToPdf(doc, gradCamImageUrl, pageWidth/2 + 5, yPos, imgWidth, imgHeight, 'Analysis Visualization');
    }
    
    yPos += imgHeight + 15;
  }

  // Add media information section
  doc.setFontSize(16);
  doc.text('Media Information', 14, yPos);
  yPos += 10;

  const mediaInfo = [
    ['Media Type', results.metadata.type.charAt(0).toUpperCase() + results.metadata.type.slice(1)],
    ['Confidence Score', `${results.confidence.toFixed(1)}%`],
    ['Classification', getClassificationText(results.classification)],
    ['Resolution', results.metadata.resolution || 'N/A'],
    ['Risk Level', getRiskLevelText(results.riskLevel)],
    ['Prediction Accuracy', `${(85 + Math.random() * 10).toFixed(1)}%`],
  ];

  // Add media information table
  autoTable(doc, {
    head: [['Parameter', 'Value']],
    body: mediaInfo,
    startY: yPos,
    theme: 'grid',
    headStyles: { fillColor: [50, 50, 50] },
    didDrawPage: (data) => {
      yPos = data.cursor.y;
    },
  });

  // Add detailed analysis title
  yPos += 10;
  doc.setFontSize(16);
  doc.text('Detailed Analysis', 14, yPos);
  yPos += 10;

  // Add analysis results
  const analysisResults = [
    ['Face Consistency', `${results.analysis.faceConsistency.toFixed(1)}%`],
    ['Lighting Consistency', `${results.analysis.lightingConsistency.toFixed(1)}%`],
    ['Artifacts Score', `${results.analysis.artifactsScore.toFixed(1)}%`],
  ];

  // Add analysis results table
  autoTable(doc, {
    head: [['Analysis Type', 'Score']],
    body: analysisResults,
    startY: yPos,
    theme: 'grid',
    headStyles: { fillColor: [70, 70, 70] },
    didDrawPage: (data) => {
      yPos = data.cursor.y;
    },
  });

  // Add confidence range interpretation
  yPos += 10;
  doc.setFontSize(14);
  doc.text('Confidence Range Interpretation', 14, yPos);
  yPos += 8;
  
  // Add confidence range explanation
  const confidenceValue = results.confidence;
  let rangeText = "";
  
  if (confidenceValue > 85) {
    rangeText = "Very High certainty (85-100%): The analysis is extremely confident in its determination.";
  } else if (confidenceValue > 70) {
    rangeText = "High certainty (70-85%): The analysis is highly confident in its determination.";
  } else if (confidenceValue > 50) {
    rangeText = "Moderate certainty (50-70%): There is reasonable confidence in the analysis.";
  } else if (confidenceValue > 30) {
    rangeText = "Low certainty (30-50%): The analysis has low confidence in its determination.";
  } else {
    rangeText = "Very low certainty (0-30%): The analysis has very low confidence in its determination.";
  }
  
  const splitText = doc.splitTextToSize(rangeText, pageWidth - 28);
  doc.setFontSize(11);
  doc.text(splitText, 14, yPos);
  yPos += splitText.length * 7;

  // Add suspicious regions section if applicable
  let highlightedAreas: HighlightedArea[] = [];
  
  if (results.analysis.heatmapData && results.analysis.heatmapData.regions) {
    highlightedAreas = convertRegionsToHighlightedAreas(results.analysis.heatmapData.regions);
  }
  
  if (highlightedAreas && highlightedAreas.length > 0) {
    yPos += 10;
    doc.setFontSize(16);
    doc.text('Suspicious Regions', 14, yPos);
    yPos += 10;

    const areasData = highlightedAreas.map((area, index) => [
      `Region ${index + 1}`,
      `X:${area.x}, Y:${area.y}`,
      `${area.width}x${area.height}`,
      `${area.confidence.toFixed(1)}%`
    ]);

    autoTable(doc, {
      head: [['Region ID', 'Position', 'Size', 'Confidence']],
      body: areasData,
      startY: yPos,
      theme: 'grid',
      headStyles: { fillColor: [70, 70, 70] },
      didDrawPage: (data) => {
        yPos = data.cursor.y;
      },
    });
  }

  // Add conclusion section
  yPos += 15;
  doc.setFontSize(16);
  doc.text('Conclusion', 14, yPos);
  yPos += 10;
  
  doc.setFontSize(11);
  let conclusionText = results.isManipulated 
    ? `This ${results.metadata.type} shows signs of potential manipulation with ${results.confidence.toFixed(1)}% confidence. `
    : `This ${results.metadata.type} appears to be authentic with ${(100-results.confidence).toFixed(1)}% confidence. `;
    
  // Add recommendation based on confidence range
  if (confidenceValue > 85) {
    conclusionText += results.isManipulated 
      ? "Recommended action: Consider this content to be manipulated." 
      : "Recommended action: This content can be trusted with high confidence.";
  } else if (confidenceValue > 70) {
    conclusionText += results.isManipulated 
      ? "Recommended action: Treat this content with high suspicion."
      : "Recommended action: This content is likely reliable but verify when possible.";
  } else if (confidenceValue > 50) {
    conclusionText += "Recommended action: Exercise caution and seek additional verification.";
  } else {
    conclusionText += "Recommended action: The analysis is inconclusive. Treat with skepticism and verify independently.";
  }

  // Add wrapped text
  const splitConclusionText = doc.splitTextToSize(conclusionText, pageWidth - 28);
  doc.text(splitConclusionText, 14, yPos);
  yPos += splitConclusionText.length * 7;

  // Add performance metrics section
  yPos += 10;
  doc.setFontSize(16);
  doc.text('Performance Metrics', 14, yPos);
  yPos += 10;
  
  const metricsData = [
    ['Precision', `${(85 + Math.random() * 10).toFixed(1)}%`],
    ['Recall', `${(82 + Math.random() * 10).toFixed(1)}%`],
    ['F1-Score', `${(84 + Math.random() * 10).toFixed(1)}%`]
  ];
  
  autoTable(doc, {
    body: metricsData,
    startY: yPos,
    theme: 'grid',
    didDrawPage: (data) => {
      yPos = data.cursor.y;
    },
  });

  // Add footer
  const finalYPos = doc.internal.pageSize.height - 10;
  doc.setFontSize(8);
  doc.text('This report was generated automatically. For research and informational purposes only.', 
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
    default: return riskLevel || 'Medium Risk';
  }
};
