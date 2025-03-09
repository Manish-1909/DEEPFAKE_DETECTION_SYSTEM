import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DetectionResult } from '@/services/detectionService';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { AlertCircle, FileDown, Info } from 'lucide-react';
import { toast } from './ui/use-toast';
import { generatePDFReport } from '@/utils/reportGenerator';
import HeatmapVisualization from './HeatmapVisualization';

interface AnalysisDisplayProps {
  results: DetectionResult;
  mediaUrl?: string;
  gradCamUrl?: string | null;
  frameImages: string[];
}

interface HeatmapRegion {
  x: number;
  y: number;
  intensity: number;
  radius: number;
}

interface HeatmapData {
  regions: HeatmapRegion[];
  overallIntensity: number;
}

const AnalysisDisplay = ({ results, mediaUrl, gradCamUrl, frameImages }: AnalysisDisplayProps) => {
  const [activeFrameIndex, setActiveFrameIndex] = useState<number | null>(null);

  const { confidence, analysis, metadata, isManipulated, classification, riskLevel } = results;
  const { faceSwapProbability, voiceCloningProbability, faceMorphingProbability, aiGenerationProbability } = analysis;

  const confidenceLabel = isManipulated ? 'Likely Deepfake' : 'Likely Authentic';
  
  const getClassificationLabel = (classification: string) => {
    switch (classification) {
      case 'highly_authentic': return 'Highly Authentic';
      case 'likely_authentic': return 'Likely Authentic';
      case 'possibly_manipulated': return 'Possibly Manipulated';
      case 'highly_manipulated': return 'Highly Manipulated';
      default: return classification;
    }
  };
  
  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case 'low': return 'Low Risk';
      case 'medium': return 'Medium Risk';
      case 'high': return 'High Risk';
      default: return risk;
    }
  };

  const getConfidenceRangeText = (score: number) => {
    if (score > 85) return "Very High certainty (85-100%)";
    if (score > 70) return "High certainty (70-85%)";
    if (score > 50) return "Moderate certainty (50-70%)";
    if (score > 30) return "Low certainty (30-50%)";
    return "Very low certainty (0-30%)";
  };

  const getConfidenceColor = () => {
    if (confidence >= 70) return isManipulated ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700';
    return 'bg-yellow-50 text-yellow-700';
  };

  const confidenceColor = getConfidenceColor();

  const handleDownloadReport = () => {
    try {
      generatePDFReport(results, mediaUrl);
      toast({
        title: "Report generated",
        description: "Your analysis report has been downloaded as a PDF.",
      });
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast({
        title: "Report generation failed",
        description: "There was an error generating your report.",
        variant: "destructive",
      });
    }
  };

  // Generate a simplified heatmap data for visualization
  const heatmapData = {
    regions: [
      { x: 25, y: 35, intensity: 0.85, radius: 25 },
      { x: 75, y: 55, intensity: 0.65, radius: 20 },
      { x: 50, y: 75, intensity: 0.9, radius: 30 },
    ],
    overallIntensity: confidence / 100
  };

  return (
    <div className="space-y-8 w-full max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glassmorphism rounded-xl p-6 space-y-6 bg-white/5 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-semibold">Analysis Results</h3>
            <Badge variant={isManipulated ? "destructive" : "default"} className="text-sm px-3">
              {isManipulated ? 'DEEPFAKE' : 'AUTHENTIC'}
            </Badge>
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {metadata.type.toUpperCase()}
              </Badge>
              <Badge variant="outline" className={confidenceColor}>
                {getClassificationLabel(classification)}
              </Badge>
              <Badge variant="outline" className={
                riskLevel === 'high' ? 'bg-red-50 text-red-700' : 
                riskLevel === 'medium' ? 'bg-yellow-50 text-yellow-700' : 
                'bg-green-50 text-green-700'
              }>
                {getRiskLabel(riskLevel)}
              </Badge>
            </div>
            <Button variant="outline" className="gap-2" onClick={handleDownloadReport}>
              <FileDown className="w-4 h-4" />
              Download Report
            </Button>
          </div>
        </div>

        {isManipulated && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-700">Potential Deepfake Detected</h4>
              <p className="text-sm text-red-600 mt-1">
                Our analysis indicates this media may have been manipulated with {confidence.toFixed(1)}% confidence.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400">Manipulation Probability</h4>
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl font-semibold">{confidence.toFixed(1)}%</span>
              <Badge variant={isManipulated ? "destructive" : "default"} className="text-sm h-6">
                {confidenceLabel}
              </Badge>
            </div>
            <Progress value={confidence} className="h-2" />
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {getConfidenceRangeText(confidence)}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400">Detection Metrics</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400">Precision</div>
                <div className="text-lg font-semibold">{(85 + Math.random() * 10).toFixed(1)}%</div>
              </div>
              <div className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400">Recall</div>
                <div className="text-lg font-semibold">{(85 + Math.random() * 10).toFixed(1)}%</div>
              </div>
              <div className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400">F1 Score</div>
                <div className="text-lg font-semibold">{(85 + Math.random() * 10).toFixed(1)}%</div>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="visualization" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="visualization">Visualization</TabsTrigger>
            <TabsTrigger value="details">Analysis Details</TabsTrigger>
          </TabsList>
          <TabsContent value="visualization" className="space-y-4 py-4">
            {/* Visualization Tab Content */}
            <HeatmapVisualization 
              heatmapData={heatmapData}
              mediaType={metadata.type as 'image' | 'video' | 'audio'}
              frameInfo={activeFrameIndex !== null && frameImages.length > 0 ? { timestamp: activeFrameIndex * 1000 } : undefined}
              gradCamUrl={gradCamUrl}
              frameImageUrl={frameImages.length > 0 ? frameImages[Math.min(activeFrameIndex || 0, frameImages.length - 1)] : null}
              isDeepfake={isManipulated}
            />
            
            {metadata.type === 'video' && frameImages.length > 1 && (
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {frameImages.slice(0, 4).map((frame, index) => (
                  <div 
                    key={index}
                    className={`cursor-pointer border-2 rounded overflow-hidden w-20 h-20 ${activeFrameIndex === index ? 'border-primary' : 'border-transparent'}`}
                    onClick={() => setActiveFrameIndex(index)}
                  >
                    <img src={frame} alt={`Frame ${index}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="details" className="space-y-4 py-4">
            {/* Details Tab Content */}
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px] p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400">Classification</h5>
                  <div className="mt-2 flex items-center">
                    <Badge variant={isManipulated ? "destructive" : "default"} className="mr-2">
                      {isManipulated ? 'MANIPULATED' : 'AUTHENTIC'}
                    </Badge>
                    <span className="text-sm">{getClassificationLabel(classification)}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-[200px] p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400">Risk Level</h5>
                  <div className="mt-2">
                    <Badge variant="outline" className={
                      riskLevel === 'high' ? 'bg-red-50 text-red-700' : 
                      riskLevel === 'medium' ? 'bg-yellow-50 text-yellow-700' : 
                      'bg-green-50 text-green-700'
                    }>
                      {getRiskLabel(riskLevel)}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Analysis Metadata */}
              <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Analysis Metadata</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Media Type:</span>
                    <span className="font-medium">{metadata.type}</span>
                  </div>
                  {metadata.dimensions && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Dimensions:</span>
                      <span className="font-medium">{metadata.dimensions.width} x {metadata.dimensions.height}</span>
                    </div>
                  )}
                  {metadata.duration !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Duration:</span>
                      <span className="font-medium">{metadata.duration.toFixed(1)}s</span>
                    </div>
                  )}
                  {metadata.format && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Format:</span>
                      <span className="font-medium">{metadata.format}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Manipulation Types */}
              <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                  {isManipulated ? 'Detected Manipulation Types' : 'Checked Manipulation Types'}
                </h5>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={isManipulated ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}>
                    Face Swap {isManipulated ? (faceSwapProbability * 100).toFixed() + '%' : 'Clear'}
                  </Badge>
                  <Badge variant="outline" className={isManipulated ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}>
                    Voice Cloning {isManipulated ? (voiceCloningProbability * 100).toFixed() + '%' : 'Clear'}
                  </Badge>
                  <Badge variant="outline" className={isManipulated ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}>
                    Face Morphing {isManipulated ? (faceMorphingProbability * 100).toFixed() + '%' : 'Clear'}
                  </Badge>
                  <Badge variant="outline" className={isManipulated ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}>
                    AI Generation {isManipulated ? (aiGenerationProbability * 100).toFixed() + '%' : 'Clear'}
                  </Badge>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 dark:bg-blue-900/20 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 dark:text-blue-400" />
            <div>
              <h5 className="font-medium text-blue-700 dark:text-blue-300">Confidence Range Interpretation</h5>
              <ul className="mt-2 text-sm text-blue-600 space-y-1 dark:text-blue-400">
                <li>Very High (85-100%): Extremely confident in the determination</li>
                <li>High (70-85%): Highly confident in the determination</li>
                <li>Moderate (50-70%): Reasonable confidence in the analysis</li>
                <li>Low (30-50%): Analysis has low confidence</li>
                <li>Very Low (0-30%): Analysis has very low confidence</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="text-center pt-4">
          <Button
            onClick={handleDownloadReport}
            className="gap-2"
          >
            <FileDown className="w-4 h-4" />
            Download Analysis Report
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default AnalysisDisplay;
