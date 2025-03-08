import React from 'react';
import { FileImage, FileVideo, Headphones, AlertTriangle } from 'lucide-react';
import { generatePDFReport } from '@/services/reportService';
import { toast } from './ui/use-toast';
import { v4 as uuidv4 } from 'uuid';

interface DetectionResult {
  isManipulated: boolean;
  confidence: number;
  classification: string;
  metadata: {
    type: 'image' | 'video' | 'audio';
    [key: string]: any;
  };
  suspiciousFrames?: { timestamp: number; confidence: number }[];
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
    // Pass only three arguments to match the function signature
    generatePDFReport(
      results, 
      mediaUrl || undefined, 
      gradCamUrl || undefined
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
    : suspiciousFrames.slice(0, 4).map(frame => ({ 
        url: gradCamUrl || mediaUrl, 
        timestamp: frame.timestamp,
        ...(typeof frame.confidence === 'number' && { confidence: frame.confidence })
      }));
  
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

    return (
      <span className={`font-semibold ${textColorClass}`}>
        {confidenceLevel.toFixed(2)}%
      </span>
    );
  };

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
                  Object.entries(metadata).map(([key, value]) => (
                    <div key={key} className="text-sm">
                      <span className="font-semibold">{key}:</span> {String(value)}
                    </div>
                  ))}
              </td>
            </tr>
          </tbody>
        </table>
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

      {gradCamUrl && metadata.type === 'image' && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Grad-CAM Visualization</h3>
          <div className="relative rounded-lg overflow-hidden">
            <img src={gradCamUrl} alt="Grad-CAM Visualization" className="w-full h-auto object-cover" />
          </div>
        </div>
      )}

      {suspiciousFrames.length > 0 && renderFrameAnalysis()}

      <div className="text-center">
        <button
          onClick={handleDownloadReport}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md py-2 px-4 font-semibold transition-colors duration-200"
        >
          Download Analysis Report
        </button>
      </div>
    </div>
  );
};

export default AnalysisDisplay;
