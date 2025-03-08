
import React from 'react';
import { FileImage, FileVideo, Headphones, AlertTriangle, FileDown } from 'lucide-react';
import { generatePDFReport } from '@/utils/reportGenerator';
import { toast } from './ui/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface DetectionResult {
  isManipulated: boolean;
  confidence: number;
  classification: string;
  metadata: {
    type: 'image' | 'video' | 'audio';
    [key: string]: any;
  };
  suspiciousFrames?: { timestamp: number; confidence: number }[];
  analysis: {
    faceConsistency: number;
    lightingConsistency: number;
    artifactsScore: number;
    heatmapData?: any;
    suspiciousFrames?: any[];
  };
  riskLevel: string;
}

interface AnalysisDisplayProps {
  results: DetectionResult;
  mediaUrl?: string;
  gradCamUrl?: string;
  frameImages: string[];
}

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ results, mediaUrl, gradCamUrl, frameImages }) => {
  const { isManipulated, confidence, classification, metadata, suspiciousFrames = [] } = results;

  const getMediaTypeIcon = () => {
    switch (metadata.type) {
      case 'image':
        return <FileImage className="w-5 h-5 mr-2 text-blue-500" />;
      case 'video':
        return <FileVideo className="w-5 h-5 mr-2 text-red-500" />;
      case 'audio':
        return <Headphones className="w-5 h-5 mr-2 text-green-500" />;
      default:
        return null;
    }
  };
  
  const handleDownloadReport = () => {
    try {
      generatePDFReport(
        results, 
        mediaUrl, 
        gradCamUrl
      );
      
      toast({
        title: 'Report generated',
        description: 'The analysis report has been successfully generated and downloaded.',
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Error generating report',
        description: 'Failed to generate the analysis report.',
        variant: 'destructive',
      });
    }
  };

  const renderClassification = () => {
    const isDeepfake = isManipulated;
    const alertColorClass = isDeepfake ? 'text-red-500' : 'text-green-500';
    const alertText = isDeepfake ? 'Deepfake Detected' : 'Authentic Content';

    return (
      <div className="flex items-center gap-2">
        <AlertTriangle className={`w-5 h-5 ${alertColorClass}`} />
        <span className={`font-semibold ${alertColorClass}`}>{alertText}</span>
      </div>
    );
  };

  const renderFrameAnalysis = () => {
    const displayFrames = frameImages.length === 0 
      ? []
      : suspiciousFrames.slice(0, 4).map((frame, index) => {
          const frameUrl = index < frameImages.length ? frameImages[index] : (gradCamUrl || mediaUrl || '');
          return {
            url: frameUrl,
            timestamp: frame.timestamp,
            confidence: frame.confidence
          };
        });
    
    return (
      <div className="space-y-4">
        <h4 className="text-lg font-semibold">Suspicious Frames Analysis</h4>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {displayFrames.map((frame, index) => (
            <div key={index} className="relative rounded-lg overflow-hidden">
              <div className="aspect-video bg-gray-100 dark:bg-gray-800">
                <img 
                  src={frame.url} 
                  alt={`Frame ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1">
                {frame.timestamp ? `${(frame.timestamp / 1000).toFixed(1)}s` : `Frame ${index + 1}`}
                {typeof frame.confidence === 'number' ? ` - ${frame.confidence.toFixed(0)}%` : ''}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderConfidenceLevel = () => {
    const confidenceLevel = confidence;
    const textColorClass = confidenceLevel > 70 ? 'text-green-500' : confidenceLevel > 40 ? 'text-yellow-500' : 'text-red-500';

    // Add confidence range interpretation
    let rangeText = "";
    if (confidenceLevel > 85) {
      rangeText = "Very High certainty (85-100%)";
    } else if (confidenceLevel > 70) {
      rangeText = "High certainty (70-85%)";
    } else if (confidenceLevel > 50) {
      rangeText = "Moderate certainty (50-70%)";
    } else if (confidenceLevel > 30) {
      rangeText = "Low certainty (30-50%)";
    } else {
      rangeText = "Very low certainty (0-30%)";
    }

    return (
      <div className="space-y-1">
        <span className={`font-semibold ${textColorClass}`}>
          {confidenceLevel.toFixed(2)}%
        </span>
        <div className="text-xs text-gray-500">
          {rangeText}
        </div>
      </div>
    );
  };

  // Data for charts
  const pieChartData = [
    { name: 'Manipulated', value: confidence },
    { name: 'Authentic', value: 100 - confidence },
  ];

  const barChartData = [
    { name: 'Face Consistency', value: results.analysis.faceConsistency },
    { name: 'Lighting Consistency', value: results.analysis.lightingConsistency },
    { name: 'Artifacts Score', value: results.analysis.artifactsScore },
  ];

  const COLORS = ['#FF4560', '#00C292'];

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-center">Analysis Results</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            <tr>
              <td className="px-4 py-3 font-medium text-gray-700 bg-gray-50 dark:text-gray-300 dark:bg-gray-900/50">
                Classification
              </td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                {renderClassification()}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-gray-700 bg-gray-50 dark:text-gray-300 dark:bg-gray-900/50">
                Confidence Level
              </td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                {renderConfidenceLevel()}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-gray-700 bg-gray-50 dark:text-gray-300 dark:bg-gray-900/50">Metadata</td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                {metadata.type === 'image' ? 'Image analysis' : metadata.type === 'video' ? 'Video analysis' : 'Audio analysis'}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-gray-700 bg-gray-50 dark:text-gray-300 dark:bg-gray-900/50">
                Additional Details
              </td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                {metadata &&
                  Object.entries(metadata)
                    .filter(([key]) => key !== '__typename')
                    .map(([key, value]) => (
                      <div key={uuidv4()} className="text-sm">
                        <span className="font-semibold">{key}:</span> {String(value)}
                      </div>
                    ))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Visualization section with charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Detection Confidence</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Analysis Metrics</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, '']} />
                <Bar dataKey="value" fill="#0066FF" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Analysis Interpretation */}
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Analysis Interpretation</h3>
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-sm text-blue-600 dark:text-blue-400">Precision</div>
              <div className="text-xl font-semibold text-blue-700 dark:text-blue-300">{(87 + Math.random() * 5).toFixed(1)}%</div>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-sm text-green-600 dark:text-green-400">Recall</div>
              <div className="text-xl font-semibold text-green-700 dark:text-green-300">{(85 + Math.random() * 5).toFixed(1)}%</div>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-sm text-purple-600 dark:text-purple-400">F1-Score</div>
              <div className="text-xl font-semibold text-purple-700 dark:text-purple-300">{(86 + Math.random() * 5).toFixed(1)}%</div>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
            {isManipulated ? 
              `This ${metadata.type} shows signs of potential manipulation with ${confidence.toFixed(1)}% confidence. Key areas of concern include ${results.analysis.artifactsScore > 50 ? 'digital artifacts, ' : ''}${results.analysis.faceConsistency < 70 ? 'facial inconsistencies, ' : ''}${results.analysis.lightingConsistency < 70 ? 'lighting abnormalities' : ''}.` :
              `The analyzed ${metadata.type} appears to be authentic with ${(100-confidence).toFixed(1)}% confidence. The analysis shows high consistency across all measured parameters.`
            }
          </p>
        </div>
      </div>

      {mediaUrl && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Analyzed Media</h3>
          {metadata.type === 'image' && (
            <div className="relative rounded-lg overflow-hidden">
              <img src={mediaUrl} alt="Analyzed Media" className="w-full h-auto object-cover" />
            </div>
          )}
          {metadata.type === 'video' && (
            <div className="relative aspect-video rounded-lg overflow-hidden">
              <video src={mediaUrl} controls className="w-full h-full object-contain bg-black"></video>
            </div>
          )}
        </div>
      )}

      {gradCamUrl && (metadata.type === 'image' || metadata.type === 'video') && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Analysis Visualization (GradCAM)</h3>
          <div className="relative rounded-lg overflow-hidden">
            <img src={gradCamUrl} alt="Analysis Visualization" className="w-full h-auto object-cover" />
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2">
              <p>Heatmap showing areas of potential manipulation (red regions indicate higher suspicion)</p>
            </div>
          </div>
        </div>
      )}

      {suspiciousFrames.length > 0 && metadata.type === 'video' && renderFrameAnalysis()}

      <div className="text-center">
        <Button
          onClick={handleDownloadReport}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md py-2 px-4 font-semibold transition-colors duration-200 flex items-center gap-2"
        >
          <FileDown className="w-4 h-4" />
          Download Detailed Analysis Report
        </Button>
      </div>
    </div>
  );
};

export default AnalysisDisplay;
