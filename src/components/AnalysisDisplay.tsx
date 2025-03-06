
import { useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Slider } from './ui/slider';
import { FileDown, AlertCircle, ChevronLeft, ChevronRight, FileText, ImageIcon, Video, BarChart as BarChartIcon } from 'lucide-react';
import { DetectionResult } from '@/services/detectionService';
import { generatePDFReport } from '@/utils/reportGenerator';

interface AnalysisDisplayProps {
  results: DetectionResult;
}

const AnalysisDisplay = ({ results }: AnalysisDisplayProps) => {
  const { confidence, analysis, metadata, isManipulated } = results;
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  
  const timelineData = analysis.suspiciousFrames || [
    { timestamp: 0, confidence: confidence },
    { timestamp: 1000, confidence: confidence - Math.random() * 5 },
    { timestamp: 2000, confidence: confidence - Math.random() * 3 },
    { timestamp: 3000, confidence: confidence + Math.random() * 2 },
    { timestamp: 4000, confidence: confidence },
  ];

  const pieChartData = [
    { name: 'Manipulated', value: confidence },
    { name: 'Authentic', value: 100 - confidence },
  ];

  const barChartData = [
    { name: 'Face Consistency', value: analysis.faceConsistency },
    { name: 'Lighting Consistency', value: analysis.lightingConsistency },
    { name: 'Artifacts Score', value: analysis.artifactsScore },
  ];

  const COLORS = ['#FF4560', '#00C292', '#FEB019'];

  const getConfidenceLevel = (score: number) => {
    if (score >= 90) return { label: 'High Confidence', className: 'bg-green-50 text-green-700' };
    if (score >= 70) return { label: 'Medium Confidence', className: 'bg-yellow-50 text-yellow-700' };
    return { label: 'Low Confidence', className: 'bg-red-50 text-red-700' };
  };

  const confidenceLevel = getConfidenceLevel(confidence);

  const handleDownloadReport = () => {
    generatePDFReport(results);
  };

  const getActiveFrame = () => {
    if (!analysis.suspiciousFrames || analysis.suspiciousFrames.length === 0) {
      return null;
    }
    return analysis.suspiciousFrames[activeFrameIndex];
  };

  const handlePrevFrame = () => {
    setActiveFrameIndex(prev => (prev > 0 ? prev - 1 : prev));
  };

  const handleNextFrame = () => {
    setActiveFrameIndex(prev => 
      (prev < (analysis.suspiciousFrames?.length || 1) - 1 ? prev + 1 : prev)
    );
  };

  const handleSliderChange = (value: number[]) => {
    if (analysis.suspiciousFrames) {
      setActiveFrameIndex(value[0]);
    }
  };

  const activeFrame = getActiveFrame();

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

        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="summary" className="gap-2">
              <FileText className="w-4 h-4" />
              Summary Report
            </TabsTrigger>
            <TabsTrigger value="frames" className="gap-2">
              {metadata.type === 'image' ? <ImageIcon className="w-4 h-4" /> : <Video className="w-4 h-4" />}
              {metadata.type === 'image' ? 'Image Analysis' : 'Frame Analysis'}
            </TabsTrigger>
            <TabsTrigger value="charts" className="gap-2">
              <BarChartIcon className="w-4 h-4" />
              Charts
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="space-y-6">
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
          </TabsContent>
          
          <TabsContent value="frames" className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-gray-600">
                {metadata.type === 'image' ? 'Image Analysis' : 'Frame Analysis'}
              </h4>
              
              {metadata.type === 'video' && analysis.suspiciousFrames && analysis.suspiciousFrames.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handlePrevFrame}
                        disabled={activeFrameIndex === 0}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm font-medium">
                        Frame {activeFrameIndex + 1} of {analysis.suspiciousFrames.length}
                        {' '}({(activeFrame?.timestamp || 0) / 1000}s)
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleNextFrame}
                        disabled={activeFrameIndex === analysis.suspiciousFrames.length - 1}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={activeFrame && activeFrame.confidence > 70 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}
                    >
                      Confidence: {activeFrame?.confidence.toFixed(1)}%
                    </Badge>
                  </div>
                  
                  <div className="mt-2">
                    <Slider
                      defaultValue={[0]}
                      max={analysis.suspiciousFrames.length - 1}
                      step={1}
                      value={[activeFrameIndex]}
                      onValueChange={handleSliderChange}
                    />
                  </div>
                </div>
              )}
              
              <div className="relative aspect-video max-w-3xl mx-auto rounded-lg overflow-hidden bg-gray-200 border border-gray-300">
                {/* This would be a video frame or image, using a placeholder */}
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  {metadata.type === 'image' ? 'Image Preview' : `Frame at ${(activeFrame?.timestamp || 0) / 1000}s`}
                </div>
                
                {/* Overlay for highlighted areas */}
                {metadata.type === 'image' && analysis.highlightedAreas && analysis.highlightedAreas.map((area, idx) => (
                  <div 
                    key={idx}
                    className="absolute border-2 border-red-500 bg-red-500/20"
                    style={{
                      left: `${area.x / 19.2}%`,
                      top: `${area.y / 10.8}%`,
                      width: `${area.width / 19.2}%`,
                      height: `${area.height / 10.8}%`,
                    }}
                  >
                    <div className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-xs px-1 rounded">
                      {area.confidence.toFixed(0)}%
                    </div>
                  </div>
                ))}
                
                {/* Overlay for video frames */}
                {metadata.type === 'video' && activeFrame?.boundingBox && (
                  <div 
                    className="absolute border-2 border-red-500 bg-red-500/20"
                    style={{
                      left: `${activeFrame.boundingBox.x / 19.2}%`,
                      top: `${activeFrame.boundingBox.y / 10.8}%`,
                      width: `${activeFrame.boundingBox.width / 19.2}%`,
                      height: `${activeFrame.boundingBox.height / 10.8}%`,
                    }}
                  >
                    <div className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-xs px-1 rounded">
                      {activeFrame.confidence.toFixed(0)}%
                    </div>
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 max-w-3xl mx-auto">
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  {metadata.type === 'image' ? 'Detected Issues' : `Frame ${activeFrameIndex + 1} Analysis`}
                </h5>
                <ul className="space-y-2">
                  {metadata.type === 'image' ? (
                    analysis.highlightedAreas && analysis.highlightedAreas.length > 0 ? (
                      analysis.highlightedAreas.map((area, idx) => (
                        <li key={idx} className="text-sm flex items-center">
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                          Region {idx + 1}: Manipulation confidence {area.confidence.toFixed(1)}%
                        </li>
                      ))
                    ) : (
                      <li className="text-sm">No suspicious regions detected</li>
                    )
                  ) : (
                    activeFrame ? (
                      <>
                        <li className="text-sm flex items-center">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          Timestamp: {(activeFrame.timestamp / 1000).toFixed(1)}s
                        </li>
                        <li className="text-sm flex items-center">
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                          Manipulation confidence: {activeFrame.confidence.toFixed(1)}%
                        </li>
                        {activeFrame.boundingBox && (
                          <li className="text-sm flex items-center">
                            <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                            Suspicious region detected at coordinates (X:{activeFrame.boundingBox.x}, Y:{activeFrame.boundingBox.y})
                          </li>
                        )}
                      </>
                    ) : (
                      <li className="text-sm">No frame data available</li>
                    )
                  )}
                </ul>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="charts" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-gray-600">Manipulation Probability</h4>
                <div className="h-64 w-full">
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
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#FF4560' : '#00C292'} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-gray-600">Analysis Metrics</h4>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, '']} />
                      <Bar dataKey="value" fill="#0066FF">
                        {barChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            {metadata.type === 'video' && (
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-gray-600">Confidence Timeline</h4>
                <div className="h-64 w-full">
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
              </div>
            )}
            
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Analysis Interpretation</h5>
              <p className="text-sm text-gray-600">
                {isManipulated ? 
                  `Our analysis indicates potential manipulation with ${confidence.toFixed(1)}% confidence. Key areas of concern include ${analysis.artifactsScore > 50 ? 'digital artifacts' : ''} ${analysis.faceConsistency < 70 ? 'facial inconsistencies' : ''} ${analysis.lightingConsistency < 70 ? 'lighting anomalies' : ''}.` :
                  `The analyzed ${metadata.type} appears to be authentic with ${(100-confidence).toFixed(1)}% confidence. No significant manipulations were detected.`
                }
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default AnalysisDisplay;
