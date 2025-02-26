
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { DetectionResult } from '@/services/detectionService';

interface AnalysisDisplayProps {
  results: DetectionResult;
}

const AnalysisDisplay = ({ results }: AnalysisDisplayProps) => {
  const { confidence, analysis } = results;
  
  const mockTimelineData = [
    { frame: 1, confidence: confidence },
    { frame: 2, confidence: confidence - Math.random() * 5 },
    { frame: 3, confidence: confidence - Math.random() * 3 },
    { frame: 4, confidence: confidence + Math.random() * 2 },
    { frame: 5, confidence: confidence },
  ];

  const getConfidenceLevel = (score: number) => {
    if (score >= 90) return { label: 'High Confidence', className: 'bg-green-50 text-green-700' };
    if (score >= 70) return { label: 'Medium Confidence', className: 'bg-yellow-50 text-yellow-700' };
    return { label: 'Low Confidence', className: 'bg-red-50 text-red-700' };
  };

  const confidenceLevel = getConfidenceLevel(confidence);

  return (
    <div className="space-y-8 w-full max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glassmorphism rounded-xl p-6 space-y-6 bg-white/5 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Analysis Results</h3>
          <Badge variant="outline" className="bg-green-50 text-green-700">
            Analysis Complete
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-gray-600">Overall Confidence Score</h4>
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl font-semibold">{confidence.toFixed(1)}%</span>
              <Badge variant="outline" className={confidenceLevel.className}>
                {confidenceLevel.label}
              </Badge>
            </div>
            <Progress value={confidence} className="h-2" />
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-sm text-gray-600">Detection Metrics</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Face Consistency</span>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {analysis.faceConsistency.toFixed(1)}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Lighting Consistency</span>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                  {analysis.lightingConsistency.toFixed(1)}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Artifacts Score</span>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {analysis.artifactsScore.toFixed(1)}%
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="h-[300px] w-full mt-6">
          <h4 className="font-medium text-sm text-gray-600 mb-4">Confidence Timeline</h4>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockTimelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="frame" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
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
      </motion.div>
    </div>
  );
};

export default AnalysisDisplay;
