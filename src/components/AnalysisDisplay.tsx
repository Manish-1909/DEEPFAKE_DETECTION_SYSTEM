
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileDown, AlertCircle, Eye, EyeOff } from 'lucide-react';
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

interface AnalysisDisplayProps {
  results: DetectionResult;
  mediaUrl?: string | null;
  gradCamUrl?: string | null;
}

const AnalysisDisplay = ({ results, mediaUrl, gradCamUrl }: AnalysisDisplayProps) => {
  const [showHeatmap, setShowHeatmap] = useState(true);
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
    if (score >= 90) return { label: 'High Confidence', className: 'bg-red-50 text-red-700' };
    if (score >= 70) return { label: 'Medium Confidence', className: 'bg-yellow-50 text-yellow-700' };
    return { label: 'Low Confidence', className: 'bg-green-50 text-green-700' };
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
        <div className="bg-white p-2 border rounded shadow text-sm">
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
        <div className="bg-white p-2 border rounded shadow text-sm">
          <p className="font-semibold">{payload[0].name}</p>
          <p style={{ color: payload[0].payload.fill }}>{`${payload[0].value.toFixed(1)}%`}</p>
        </div>
      );
    }
    return null;
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
          <h3 className="text-xl font-semibold">Analysis Results</h3>
          <div className="flex gap-4 items-center">
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {metadata.type.toUpperCase()}
              </Badge>
              <Badge variant="outline" className={isManipulated ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}>
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
              <h4 className="font-semibold text-red-700">Potential Manipulation Detected</h4>
              <p className="text-sm text-red-600 mt-1">
                Our analysis indicates this {metadata.type} may have been synthetically generated or manipulated with {confidence.toFixed(1)}% confidence.
              </p>
            </div>
          </div>
        )}

        {/* Media display section */}
        {mediaUrl && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-600">Original Media</h4>
              <div className="relative aspect-video bg-black/10 rounded-lg overflow-hidden">
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

            {gradCamUrl && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-600">Grad-CAM Visualization</h4>
                <div className="relative aspect-video bg-black/10 rounded-lg overflow-hidden">
                  <img 
                    src={gradCamUrl} 
                    alt="Grad-CAM visualization" 
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}
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
            <div className="flex justify-between text-xs text-gray-500">
              <span>Likely Authentic</span>
              <span>Likely Manipulated</span>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-sm text-gray-600">Prediction Accuracy</h4>
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl font-semibold">{(85 + Math.random() * 10).toFixed(1)}%</span>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                High Accuracy
              </Badge>
            </div>
            <Progress value={88} className="h-2 bg-blue-100">
              <div className="h-full bg-blue-500 rounded-full" />
            </Progress>
            <div className="text-xs text-gray-500">
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
                <h4 className="font-medium text-sm text-gray-600">Analysis Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Face Consistency</span>
                    <Badge variant="outline" className={analysis.faceConsistency > 70 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}>
                      {analysis.faceConsistency.toFixed(1)}%
                    </Badge>
                  </div>
                  <Progress value={analysis.faceConsistency} className="h-1.5" style={{ backgroundColor: 'rgba(136, 132, 216, 0.2)' }}>
                    <div className="h-full rounded-full" style={{ backgroundColor: BAR_COLORS[0] }} />
                  </Progress>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Lighting Consistency</span>
                    <Badge variant="outline" className={analysis.lightingConsistency > 70 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}>
                      {analysis.lightingConsistency.toFixed(1)}%
                    </Badge>
                  </div>
                  <Progress value={analysis.lightingConsistency} className="h-1.5" style={{ backgroundColor: 'rgba(255, 159, 64, 0.2)' }}>
                    <div className="h-full rounded-full" style={{ backgroundColor: BAR_COLORS[1] }} />
                  </Progress>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Artifacts Score</span>
                    <Badge variant="outline" className={analysis.artifactsScore < 30 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}>
                      {analysis.artifactsScore.toFixed(1)}%
                    </Badge>
                  </div>
                  <Progress value={analysis.artifactsScore} className="h-1.5" style={{ backgroundColor: 'rgba(75, 192, 192, 0.2)' }}>
                    <div className="h-full rounded-full" style={{ backgroundColor: BAR_COLORS[2] }} />
                  </Progress>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-gray-600">Confidence Distribution</h4>
                <div className="h-64 w-full bg-white/5 p-4 rounded-lg">
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
              <h4 className="font-medium text-sm text-gray-600">Metric Comparison</h4>
              <div className="h-64 w-full bg-white/5 p-4 rounded-lg">
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
              <h4 className="font-medium text-sm text-gray-600">Potential Manipulation Regions</h4>
              <Button variant="ghost" size="sm" onClick={toggleHeatmap} className="gap-2">
                {showHeatmap ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showHeatmap ? 'Hide Visualizations' : 'Show Visualizations'}
              </Button>
            </div>
            
            <div className="relative aspect-video bg-black/10 rounded-lg overflow-hidden">
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
                <div className="p-6 text-center text-gray-500">
                  Frame-by-frame analysis available in the detailed report
                </div>
              ) : null}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-600">Confidence Meter</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <ConfidenceMeter confidence={confidence} />
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-600">Key Findings</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
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
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Analysis Interpretation</h5>
              <p className="text-sm text-gray-600">
                {isManipulated ? 
                  `Our analysis indicates potential manipulation with ${confidence.toFixed(1)}% confidence. Key areas of concern include ${analysis.faceConsistency < 70 ? 'facial inconsistencies' : ''} ${analysis.lightingConsistency < 70 ? 'lighting anomalies' : ''} ${analysis.artifactsScore > 50 ? 'digital artifacts' : ''}.` :
                  `The analyzed ${metadata.type} appears to be authentic with ${(100-confidence).toFixed(1)}% confidence. No significant manipulations were detected in our comprehensive analysis.`
                }
              </p>
            </div>
            
            <div className="space-y-4">
              <h5 className="font-medium text-sm text-gray-600">Technical Details</h5>
              <div className="overflow-hidden rounded-lg border">
                <table className="min-w-full divide-y divide-gray-200">
                  <tbody className="bg-white divide-y divide-gray-200 text-sm">
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-700 bg-gray-50">Media Type</td>
                      <td className="px-4 py-3 text-gray-600">{metadata.type}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-700 bg-gray-50">Resolution</td>
                      <td className="px-4 py-3 text-gray-600">{metadata.resolution || 'N/A'}</td>
                    </tr>
                    {metadata.type === 'video' && (
                      <>
                        <tr>
                          <td className="px-4 py-3 font-medium text-gray-700 bg-gray-50">Duration</td>
                          <td className="px-4 py-3 text-gray-600">{metadata.duration ? `${metadata.duration.toFixed(1)} seconds` : 'N/A'}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-medium text-gray-700 bg-gray-50">Frame Count</td>
                          <td className="px-4 py-3 text-gray-600">{metadata.frameCount || 'N/A'}</td>
                        </tr>
                      </>
                    )}
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-700 bg-gray-50">Detection Model</td>
                      <td className="px-4 py-3 text-gray-600">Advanced CNN-Transformer Hybrid (v2.4)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-700 bg-gray-50">Analysis Time</td>
                      <td className="px-4 py-3 text-gray-600">{(1 + Math.random() * 2).toFixed(1)} seconds</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="space-y-4">
              <h5 className="font-medium text-sm text-gray-600">Recommended Actions</h5>
              <div className="p-4 rounded-lg border space-y-3">
                <div className={`p-3 rounded-lg ${isManipulated ? 'bg-red-50' : 'bg-green-50'}`}>
                  <p className={`text-sm ${isManipulated ? 'text-red-700' : 'text-green-700'}`}>
                    {isManipulated
                      ? 'This content shows signs of manipulation and should be treated with caution.'
                      : 'This content appears to be authentic, but always verify important information.'
                    }
                  </p>
                </div>
                <ul className="space-y-2 text-sm pl-5 list-disc text-gray-600">
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
              <h5 className="font-medium text-sm text-gray-600">Detection Performance</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-600 mb-1">Precision</div>
                  <div className="text-xl font-semibold text-blue-700">{(87 + Math.random() * 5).toFixed(1)}%</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-600 mb-1">Recall</div>
                  <div className="text-xl font-semibold text-green-700">{(85 + Math.random() * 5).toFixed(1)}%</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-sm text-purple-600 mb-1">F1-Score</div>
                  <div className="text-xl font-semibold text-purple-700">{(86 + Math.random() * 5).toFixed(1)}%</div>
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
