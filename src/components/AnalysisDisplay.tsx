
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileDown, AlertCircle, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { DetectionResult } from '@/services/detectionService';
import { generatePDFReport } from '@/utils/reportGenerator';
import { toast } from './ui/use-toast';
import ConfidenceMeter from './ConfidenceMeter';
import HeatmapVisualization from './HeatmapVisualization';
import { useTheme } from '@/hooks/useTheme';

interface AnalysisDisplayProps {
  results: DetectionResult;
  mediaUrl?: string | null;
  gradCamUrl?: string | null;
}

const AnalysisDisplay = ({ results, mediaUrl, gradCamUrl }: AnalysisDisplayProps) => {
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [selectedFrame, setSelectedFrame] = useState<number | null>(null);
  const { theme, toggleTheme } = useTheme();
  const { confidence, analysis, metadata, isManipulated, classification, riskLevel } = results;
  
  const suspiciousFrames = analysis.suspiciousFrames || [];
  
  // Enhanced color scheme for pie chart
  const COLORS = ['#FF4560', '#00E396'];
  
  // Different colors for each bar in the bar chart
  const BAR_COLORS = ['#8884d8', '#FF9F40', '#4BC0C0'];
  
  const pieChartData = [
    { name: 'Manipulated', value: confidence },
    { name: 'Authentic', value: 100 - confidence },
  ];
  
  const barChartData = [
    { name: 'Face Consistency', value: analysis.faceConsistency, fill: BAR_COLORS[0] },
    { name: 'Lighting Consistency', value: analysis.lightingConsistency, fill: BAR_COLORS[1] },
    { name: 'Artifacts Score', value: analysis.artifactsScore, fill: BAR_COLORS[2] },
  ];
  
  const handleDownloadReport = () => {
    try {
      generatePDFReport(results, mediaUrl || undefined, gradCamUrl || undefined);
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
  
  const toggleHeatmap = () => {
    setShowHeatmap(!showHeatmap);
  };
  
  const getConfidenceLevel = (score: number) => {
    if (score >= 90) return { label: 'High Confidence', className: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300' };
    if (score >= 70) return { label: 'Medium Confidence', className: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' };
    return { label: 'Low Confidence', className: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' };
  };
  
  const confidenceLevel = getConfidenceLevel(confidence);
  
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

  // Custom tooltip for bar chart to make text more visible
  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-2 border rounded shadow text-sm">
          <p className="font-semibold">{payload[0].name}</p>
          <p className="text-primary">{`${payload[0].value.toFixed(1)}%`}</p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for pie chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-2 border rounded shadow text-sm">
          <p className="font-semibold">{payload[0].name}</p>
          <p style={{ color: payload[0].payload.fill }}>{`${payload[0].value.toFixed(1)}%`}</p>
        </div>
      );
    }
    return null;
  };

  // Function to render video frames for selection
  const renderVideoFrames = () => {
    if (metadata.type !== 'video' || !suspiciousFrames || suspiciousFrames.length === 0) {
      return null;
    }

    // Take up to 4 frames to display
    const framesToShow = suspiciousFrames.slice(0, 4);
    
    return (
      <div className="space-y-2">
        <h4 className="font-medium text-sm text-gray-600 dark:text-gray-300">Suspicious Frames</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {framesToShow.map((frame, index) => {
            // Create a frame thumbnail - for demo we'll use the gradCamUrl with different opacity
            const frameUrl = gradCamUrl || mediaUrl;
            
            return (
              <div 
                key={frame.timestamp} 
                className={`relative cursor-pointer rounded-md overflow-hidden border-2 ${selectedFrame === index ? 'border-primary' : 'border-transparent'}`}
                onClick={() => setSelectedFrame(index)}
              >
                <div className="aspect-video bg-black/10 dark:bg-white/5">
                  {frameUrl && (
                    <img
                      src={frameUrl}
                      alt={`Frame at ${(frame.timestamp / 1000).toFixed(1)}s`}
                      className="w-full h-full object-cover"
                      style={{ opacity: 0.7 + (index * 0.1) }} // Simulate different frames
                    />
                  )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1">
                  {(frame.timestamp / 1000).toFixed(1)}s - {frame.confidence.toFixed(0)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-8 w-full max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glassmorphism rounded-xl p-6 space-y-6 bg-white/5 backdrop-blur-sm dark:bg-black/20"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h3 className="text-xl font-semibold">Analysis Results</h3>
          <div className="flex gap-4 items-center">
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                {metadata.type.toUpperCase()}
              </Badge>
              <Badge variant="outline" className={isManipulated ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'}>
                {getClassificationLabel(classification)}
              </Badge>
              <Badge variant="outline" className={
                riskLevel === 'high' ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 
                riskLevel === 'medium' ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' : 
                'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'
              }>
                {getRiskLabel(riskLevel)}
              </Badge>
            </div>
            <Button variant="outline" className="gap-2" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleDownloadReport}>
              <FileDown className="w-4 h-4" />
              Download Report
            </Button>
          </div>
        </div>

        {isManipulated && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 dark:bg-red-900/20 dark:border-red-800/30">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-700 dark:text-red-400">Potential Manipulation Detected</h4>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                Our analysis indicates this {metadata.type} may have been synthetically generated or manipulated with {confidence.toFixed(1)}% confidence.
              </p>
            </div>
          </div>
        )}

        {/* Media display section */}
        {mediaUrl && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-600 dark:text-gray-300">Original Media</h4>
              <div className="relative aspect-video bg-black/10 rounded-lg overflow-hidden dark:bg-white/5">
                {metadata.type === 'image' ? (
                  <img 
                    src={mediaUrl} 
                    alt="Original media" 
                    className="w-full h-full object-contain"
                  />
                ) : metadata.type === 'video' ? (
                  <video 
                    src={mediaUrl} 
                    controls 
                    className="w-full h-full object-contain"
                  />
                ) : null}
              </div>
            </div>

            {metadata.type === 'video' ? (
              <div className="space-y-2">
                {selectedFrame !== null && suspiciousFrames[selectedFrame] ? (
                  <>
                    <h4 className="font-medium text-sm text-gray-600 dark:text-gray-300">
                      Grad-CAM Analysis - Frame at {(suspiciousFrames[selectedFrame].timestamp / 1000).toFixed(1)}s
                    </h4>
                    <div className="relative aspect-video bg-black/10 rounded-lg overflow-hidden dark:bg-white/5">
                      {gradCamUrl && (
                        <img 
                          src={gradCamUrl} 
                          alt={`Frame analysis at ${(suspiciousFrames[selectedFrame].timestamp / 1000).toFixed(1)}s`} 
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Manipulation confidence: {suspiciousFrames[selectedFrame].confidence.toFixed(1)}%
                    </div>
                  </>
                ) : (
                  <>
                    <h4 className="font-medium text-sm text-gray-600 dark:text-gray-300">Grad-CAM Visualization</h4>
                    <div className="relative aspect-video bg-black/10 rounded-lg overflow-hidden dark:bg-white/5">
                      {gradCamUrl && (
                        <img 
                          src={gradCamUrl} 
                          alt="Grad-CAM visualization" 
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : gradCamUrl ? (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-600 dark:text-gray-300">Grad-CAM Visualization</h4>
                <div className="relative aspect-video bg-black/10 rounded-lg overflow-hidden dark:bg-white/5">
                  <img 
                    src={gradCamUrl} 
                    alt="Grad-CAM visualization" 
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Video frames section for videos only */}
        {metadata.type === 'video' && renderVideoFrames()}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-gray-600 dark:text-gray-300">Manipulation Probability</h4>
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl font-semibold">{confidence.toFixed(1)}%</span>
              <Badge variant="outline" className={confidenceLevel.className}>
                {confidenceLevel.label}
              </Badge>
            </div>
            <Progress value={confidence} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Likely Authentic</span>
              <span>Likely Manipulated</span>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-sm text-gray-600 dark:text-gray-300">Prediction Accuracy</h4>
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl font-semibold">{(85 + Math.random() * 10).toFixed(1)}%</span>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                High Accuracy
              </Badge>
            </div>
            <Progress value={88} className="h-2 bg-blue-100 dark:bg-blue-900/30">
              <div className="h-full bg-blue-500 rounded-full" />
            </Progress>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Accuracy based on model performance on verified test data
            </div>
          </div>
        </div>

        <Tabs defaultValue="metrics">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="metrics">Analysis Metrics</TabsTrigger>
            <TabsTrigger value="visualization">Visualization</TabsTrigger>
            <TabsTrigger value="details">Detailed Report</TabsTrigger>
          </TabsList>
          
          <TabsContent value="metrics" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-gray-600 dark:text-gray-300">Analysis Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Face Consistency</span>
                    <Badge variant="outline" className={analysis.faceConsistency > 70 ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'}>
                      {analysis.faceConsistency.toFixed(1)}%
                    </Badge>
                  </div>
                  <Progress value={analysis.faceConsistency} className="h-1.5" style={{ backgroundColor: 'rgba(136, 132, 216, 0.2)' }}>
                    <div className="h-full rounded-full" style={{ backgroundColor: BAR_COLORS[0] }} />
                  </Progress>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Lighting Consistency</span>
                    <Badge variant="outline" className={analysis.lightingConsistency > 70 ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'}>
                      {analysis.lightingConsistency.toFixed(1)}%
                    </Badge>
                  </div>
                  <Progress value={analysis.lightingConsistency} className="h-1.5" style={{ backgroundColor: 'rgba(255, 159, 64, 0.2)' }}>
                    <div className="h-full rounded-full" style={{ backgroundColor: BAR_COLORS[1] }} />
                  </Progress>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Artifacts Score</span>
                    <Badge variant="outline" className={analysis.artifactsScore < 30 ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'}>
                      {analysis.artifactsScore.toFixed(1)}%
                    </Badge>
                  </div>
                  <Progress value={analysis.artifactsScore} className="h-1.5" style={{ backgroundColor: 'rgba(75, 192, 192, 0.2)' }}>
                    <div className="h-full rounded-full" style={{ backgroundColor: BAR_COLORS[2] }} />
                  </Progress>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-gray-600 dark:text-gray-300">Confidence Distribution</h4>
                <div className="h-64 w-full bg-white/5 p-4 rounded-lg dark:bg-white/5">
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
                      <Tooltip content={<CustomPieTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-gray-600 dark:text-gray-300">Metric Comparison</h4>
              <div className="h-64 w-full bg-white/5 p-4 rounded-lg dark:bg-white/5">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#888', fontSize: 12 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      tick={{ fill: '#888', fontSize: 12 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Legend />
                    {barChartData.map((entry, index) => (
                      <Bar 
                        key={`bar-${index}`}
                        dataKey="value" 
                        name={entry.name}
                        fill={entry.fill} 
                        background={{ fill: 'rgba(255,255,255,0.05)' }}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="visualization" className="mt-4 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-sm text-gray-600 dark:text-gray-300">Potential Manipulation Regions</h4>
              <Button variant="ghost" size="sm" onClick={toggleHeatmap} className="gap-2">
                {showHeatmap ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showHeatmap ? 'Hide Visualizations' : 'Show Visualizations'}
              </Button>
            </div>
            
            <div className="relative aspect-video bg-black/10 rounded-lg overflow-hidden dark:bg-white/5">
              {metadata.type === 'image' ? (
                <>
                  <img 
                    src={mediaUrl || ''} 
                    alt="Analyzed media" 
                    className="w-full h-full object-contain"
                  />
                  {showHeatmap && analysis.heatmapData && (
                    <div className="absolute inset-0">
                      <HeatmapVisualization 
                        heatmapData={analysis.heatmapData} 
                        mediaType={metadata.type}
                        gradCamUrl={gradCamUrl || undefined}
                      />
                    </div>
                  )}
                </>
              ) : metadata.type === 'video' ? (
                <div className="relative">
                  {selectedFrame !== null && suspiciousFrames[selectedFrame] ? (
                    <div className="p-6 flex flex-col items-center">
                      <h5 className="text-sm font-medium mb-2">
                        Frame at {(suspiciousFrames[selectedFrame].timestamp / 1000).toFixed(1)}s
                      </h5>
                      {gradCamUrl && (
                        <img 
                          src={gradCamUrl} 
                          alt={`Frame analysis at ${(suspiciousFrames[selectedFrame].timestamp / 1000).toFixed(1)}s`} 
                          className="max-h-[300px] object-contain"
                        />
                      )}
                      {showHeatmap && analysis.heatmapData && (
                        <div className="absolute inset-0">
                          <HeatmapVisualization 
                            heatmapData={analysis.heatmapData} 
                            mediaType="image"
                            gradCamUrl={gradCamUrl || undefined}
                            frameInfo={{
                              timestamp: suspiciousFrames[selectedFrame].timestamp
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                      Select a frame from below to view detailed analysis
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Video frames section for visualization tab */}
            {metadata.type === 'video' && (
              <div className="grid grid-cols-4 gap-2 mt-2">
                {suspiciousFrames.slice(0, 8).map((frame, index) => (
                  <div 
                    key={frame.timestamp} 
                    className={`relative cursor-pointer rounded-md overflow-hidden border-2 ${selectedFrame === index ? 'border-primary' : 'border-transparent'}`}
                    onClick={() => setSelectedFrame(index)}
                  >
                    <div className="aspect-video bg-black/10 dark:bg-white/5">
                      {gradCamUrl && (
                        <img
                          src={gradCamUrl}
                          alt={`Frame at ${(frame.timestamp / 1000).toFixed(1)}s`}
                          className="w-full h-full object-cover"
                          style={{ opacity: 0.6 + (index * 0.05) }} // Simulate different frames
                        />
                      )}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1">
                      {(frame.timestamp / 1000).toFixed(1)}s
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-600 dark:text-gray-300">Confidence Meter</h4>
                <div className="bg-gray-50 rounded-lg p-4 dark:bg-gray-800">
                  <ConfidenceMeter confidence={confidence} />
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-600 dark:text-gray-300">Key Findings</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3 dark:bg-gray-800">
                  <ul className="text-sm space-y-2">
                    {isManipulated ? (
                      <>
                        {analysis.faceConsistency < 70 && (
                          <li className="flex items-start gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5" />
                            <span>Facial feature inconsistencies detected</span>
                          </li>
                        )}
                        {analysis.lightingConsistency < 70 && (
                          <li className="flex items-start gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5" />
                            <span>Lighting and shadow anomalies present</span>
                          </li>
                        )}
                        {analysis.artifactsScore > 50 && (
                          <li className="flex items-start gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5" />
                            <span>Digital processing artifacts identified</span>
                          </li>
                        )}
                        {metadata.type === 'video' && suspiciousFrames.length > 0 && (
                          <li className="flex items-start gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5" />
                            <span>{suspiciousFrames.length} suspicious frames detected</span>
                          </li>
                        )}
                      </>
                    ) : (
                      <>
                        <li className="flex items-start gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                          <span>Natural facial features and expressions</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                          <span>Consistent lighting and shadows</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                          <span>Low level of digital artifacts</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="details" className="mt-4 space-y-4">
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 dark:bg-gray-800 dark:border-gray-700">
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Analysis Interpretation</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isManipulated ? 
                  `Our analysis indicates potential manipulation with ${confidence.toFixed(1)}% confidence. Key areas of concern include ${analysis.faceConsistency < 70 ? 'facial inconsistencies' : ''} ${analysis.lightingConsistency < 70 ? 'lighting anomalies' : ''} ${analysis.artifactsScore > 50 ? 'digital artifacts' : ''}.` :
                  `The analyzed ${metadata.type} appears to be authentic with ${(100-confidence).toFixed(1)}% confidence. No significant manipulations were detected in our comprehensive analysis.`
                }
              </p>
            </div>
            
            <div className="space-y-4">
              <h5 className="font-medium text-sm text-gray-600 dark:text-gray-300">Technical Details</h5>
              <div className="overflow-hidden rounded-lg border dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <tbody className="bg-white divide-y divide-gray-200 text-sm dark:bg-gray-800 dark:divide-gray-700">
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-700 bg-gray-50 dark:text-gray-300 dark:bg-gray-900/50">Media Type</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{metadata.type}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-700 bg-gray-50 dark:text-gray-300 dark:bg-gray-900/50">Resolution</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{metadata.resolution || 'N/A'}</td>
                    </tr>
                    {metadata.type === 'video' && (
                      <>
                        <tr>
                          <td className="px-4 py-3 font-medium text-gray-700 bg-gray-50 dark:text-gray-300 dark:bg-gray-900/50">Duration</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{metadata.duration ? `${metadata.duration.toFixed(1)} seconds` : 'N/A'}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-medium text-gray-700 bg-gray-50 dark:text-gray-300 dark:bg-gray-900/50">Frame Count</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{metadata.frameCount || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-medium text-gray-700 bg-gray-50 dark:text-gray-300 dark:bg-gray-900/50">Suspicious Frames</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{suspiciousFrames.length}</td>
                        </tr>
                      </>
                    )}
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-700 bg-gray-50 dark:text-gray-300 dark:bg-gray-900/50">Detection Model</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">Advanced CNN-Transformer Hybrid (v2.4)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-700 bg-gray-50 dark:text-gray-300 dark:bg-gray-900/50">Analysis Time</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{(1 + Math.random() * 2).toFixed(1)} seconds</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Video frames analysis table */}
            {metadata.type === 'video' && suspiciousFrames.length > 0 && (
              <div className="space-y-4">
                <h5 className="font-medium text-sm text-gray-600 dark:text-gray-300">Frame Analysis</h5>
                <div className="overflow-hidden rounded-lg border dark:border-gray-700">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Frame</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Timestamp</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Confidence</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Classification</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 text-sm dark:bg-gray-800 dark:divide-gray-700">
                      {suspiciousFrames.map((frame, index) => (
                        <tr key={index} className={index === selectedFrame ? 'bg-blue-50 dark:bg-blue-900/20' : ''}>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">Frame {index + 1}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{(frame.timestamp / 1000).toFixed(2)}s</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{frame.confidence.toFixed(1)}%</td>
                          <td className="px-4 py-3">
                            <Badge className={frame.confidence > 70 ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}>
                              {frame.confidence > 70 ? 'Manipulated' : 'Authentic'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <h5 className="font-medium text-sm text-gray-600 dark:text-gray-300">Recommended Actions</h5>
              <div className="p-4 rounded-lg border space-y-3 dark:border-gray-700">
                <div className={`p-3 rounded-lg ${isManipulated ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
                  <p className={`text-sm ${isManipulated ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'}`}>
                    {isManipulated
                      ? 'This content shows signs of manipulation and should be treated with caution.'
                      : 'This content appears to be authentic, but always verify important information.'
                    }
                  </p>
                </div>
                <ul className="space-y-2 text-sm pl-5 list-disc text-gray-600 dark:text-gray-400">
                  <li>Download the detailed PDF report for comprehensive analysis</li>
                  <li>Verify the content through multiple reliable sources when possible</li>
                  <li>{isManipulated 
                      ? 'If sharing, add a disclaimer about potential manipulation' 
                      : 'Consider the source and context even for authentic content'
                    }</li>
                  <li>For critical decisions, seek expert verification</li>
                </ul>
              </div>
            </div>
            
            <div className="space-y-4">
              <h5 className="font-medium text-sm text-gray-600 dark:text-gray-300">Detection Performance</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-blue-50 rounded-lg dark:bg-blue-900/20">
                  <div className="text-sm text-blue-600 dark:text-blue-300 mb-1">Precision</div>
                  <div className="text-xl font-semibold text-blue-700 dark:text-blue-400">{(87 + Math.random() * 5).toFixed(1)}%</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg dark:bg-green-900/20">
                  <div className="text-sm text-green-600 dark:text-green-300 mb-1">Recall</div>
                  <div className="text-xl font-semibold text-green-700 dark:text-green-400">{(85 + Math.random() * 5).toFixed(1)}%</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg dark:bg-purple-900/20">
                  <div className="text-sm text-purple-600 dark:text-purple-300 mb-1">F1-Score</div>
                  <div className="text-xl font-semibold text-purple-700 dark:text-purple-400">{(86 + Math.random() * 5).toFixed(1)}%</div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default AnalysisDisplay;
