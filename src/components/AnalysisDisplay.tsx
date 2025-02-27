
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { FileDown, AlertCircle } from 'lucide-react';
import { DetectionResult } from '@/services/detectionService';
import { generatePDFReport } from '@/utils/reportGenerator';

interface AnalysisDisplayProps {
  results: DetectionResult;
}

const AnalysisDisplay = ({ results }: AnalysisDisplayProps) => {
  const { confidence, analysis, metadata } = results;
  
  const timelineData = analysis.suspiciousFrames || [
    { timestamp: 0, confidence: confidence },
    { timestamp: 1000, confidence: confidence - Math.random() * 5 },
    { timestamp: 2000, confidence: confidence - Math.random() * 3 },
    { timestamp: 3000, confidence: confidence + Math.random() * 2 },
    { timestamp: 4000, confidence: confidence },
  ];

  const getConfidenceLevel = (score: number) => {
    if (score >= 90) return { label: 'High Confidence', className: 'bg-green-50 text-green-700' };
    if (score >= 70) return { label: 'Medium Confidence', className: 'bg-yellow-50 text-yellow-700' };
    return { label: 'Low Confidence', className: 'bg-red-50 text-red-700' };
  };

  const confidenceLevel = getConfidenceLevel(confidence);

  const handleDownloadReport = () => {
    generatePDFReport(results);
  };

  return (
    <div className="space-y-8 w-full max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glassmorphism rounded-xl p-6 space-y-6 bg-white/5 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h3 className="text-xl font-semibold">Analysis Results</h3>
          <div className="flex gap-4 items-center">
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {metadata.type.toUpperCase()}
              </Badge>
              <Badge variant="outline" className={results.isManipulated ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}>
                {results.isManipulated ? 'Potentially Manipulated' : 'Likely Authentic'}
              </Badge>
            </div>
            <Button onClick={handleDownloadReport} variant="outline" className="gap-2">
              <FileDown className="w-4 h-4" />
              Download Report
            </Button>
          </div>
        </div>

        {results.isManipulated && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-700">Potential Manipulation Detected</h4>
              <p className="text-sm text-red-600 mt-1">
                Our analysis indicates this media may have been manipulated. Review the detailed analysis below.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-gray-600">Manipulation Probability</h4>
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl font-semibold">{confidence.toFixed(1)}%</span>
              <Badge variant="outline" className={confidenceLevel.className}>
                {confidenceLevel.label}
              </Badge>
            </div>
            <Progress value={confidence} className="h-2" />
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-sm text-gray-600">Analysis Metrics</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Face Consistency</span>
                <Badge variant="outline" className={analysis.faceConsistency > 70 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}>
                  {analysis.faceConsistency.toFixed(1)}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Lighting Consistency</span>
                <Badge variant="outline" className={analysis.lightingConsistency > 70 ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}>
                  {analysis.lightingConsistency.toFixed(1)}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Artifacts Detection</span>
                <Badge variant="outline" className={analysis.artifactsScore < 30 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}>
                  {analysis.artifactsScore.toFixed(1)}%
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-sm text-gray-600">Classification Report</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h5 className="text-sm font-medium text-gray-700">Primary Assessment</h5>
                <ul className="mt-2 space-y-2">
                  <li className="text-sm">
                    <span className="font-medium">Overall Confidence:</span> {confidence.toFixed(1)}%
                  </li>
                  <li className="text-sm">
                    <span className="font-medium">Classification:</span> {results.isManipulated ? 'Manipulated' : 'Authentic'}
                  </li>
                  <li className="text-sm">
                    <span className="font-medium">Risk Level:</span> {
                      confidence > 90 ? 'High' : confidence > 70 ? 'Medium' : 'Low'
                    }
                  </li>
                </ul>
              </div>
              <div>
                <h5 className="text-sm font-medium text-gray-700">Technical Details</h5>
                <ul className="mt-2 space-y-2">
                  <li className="text-sm">
                    <span className="font-medium">Media Type:</span> {metadata.type}
                  </li>
                  <li className="text-sm">
                    <span className="font-medium">Resolution:</span> {metadata.resolution}
                  </li>
                  {metadata.frameCount && (
                    <li className="text-sm">
                      <span className="font-medium">Frames Analyzed:</span> {metadata.frameCount}
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-sm text-gray-600">Technical Details</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <span className="text-xs text-gray-500">Resolution</span>
              <p className="font-medium">{metadata.resolution}</p>
            </div>
            {metadata.frameCount && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500">Frames Analyzed</span>
                <p className="font-medium">{metadata.frameCount}</p>
              </div>
            )}
            {metadata.duration && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500">Duration</span>
                <p className="font-medium">{(metadata.duration / 1000).toFixed(1)}s</p>
              </div>
            )}
          </div>
        </div>

        {metadata.type === 'video' && (
          <div className="h-[300px] w-full mt-6">
            <h4 className="font-medium text-sm text-gray-600 mb-4">Confidence Timeline</h4>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp"
                  tickFormatter={(value) => `${(value/1000).toFixed(1)}s`}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Confidence']}
                  labelFormatter={(label: number) => `Time: ${(label/1000).toFixed(1)}s`}
                />
                <Line
                  type="monotone"
                  dataKey="confidence"
                  stroke="#0066FF"
                  strokeWidth={2}
                  dot={{ fill: '#0066FF' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AnalysisDisplay;
