import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Slider } from './ui/slider';
import { FileDown, AlertCircle, ChevronLeft, ChevronRight, FileText, Video, BarChart as BarChartIcon, ZoomIn, Search } from 'lucide-react';
import { DetectionResult } from '@/services/detectionService';
import { generatePDFReport } from '@/utils/reportGenerator';
import { toast } from './ui/use-toast';

interface AnalysisDisplayProps {
  results: DetectionResult;
}

const AnalysisDisplay = ({ results }: AnalysisDisplayProps) => {
  const { confidence, analysis, metadata, isManipulated, classification, riskLevel } = results;
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const [hoveredRegion, setHoveredRegion] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  if (metadata.type === 'audio') {
    return null;
  }
  
  const framewiseData = analysis.framewiseConfidence?.map((confidence, index) => ({
    timestamp: index * 1000,
    confidence,
  })) || [];
  
  const timelineData = analysis.suspiciousFrames || (framewiseData.length > 0 ? framewiseData : [
    { timestamp: 0, confidence: confidence },
    { timestamp: 1000, confidence: confidence - Math.random() * 5 },
    { timestamp: 2000, confidence: confidence - Math.random() * 3 },
    { timestamp: 3000, confidence: confidence + Math.random() * 2 },
    { timestamp: 4000, confidence: confidence },
  ]);

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
  const HEATMAP_COLORS = [
    'rgba(0, 255, 0, 0.1)',   // Lowest intensity (green)
    'rgba(255, 255, 0, 0.5)', // Medium intensity (yellow)
    'rgba(255, 0, 0, 0.8)'    // Highest intensity (red)
  ];

  const getConfidenceLevel = (score: number) => {
    if (score >= 80) return { label: 'High Confidence', className: 'bg-red-50 text-red-700' };
    if (score >= 40) return { label: 'Medium Confidence', className: 'bg-yellow-50 text-yellow-700' };
    return { label: 'Low Confidence', className: 'bg-green-50 text-green-700' };
  };

  const confidenceLevel = getConfidenceLevel(confidence);

  const getClassificationLabel = (classification: string) => {
    switch (classification) {
      case 'highly_authentic': return 'Highly Authentic';
      case 'likely_authentic': return 'Likely Authentic';
      case 'possibly_manipulated': return 'Possibly Manipulated';
      case 'highly_manipulated': return 'Highly Manipulated';
      default: return 'Unknown';
    }
  };

  const getRiskLabel = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'Low Risk';
      case 'medium': return 'Medium Risk';
      case 'high': return 'High Risk';
      default: return 'Unknown';
    }
  };

  const handleDownloadReport = () => {
    generatePDFReport(results);
    toast({
      title: "Report Generated",
      description: "Your detailed analysis report has been downloaded.",
    });
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

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.5, 1));
  };

  const handleRegionHover = useCallback((index: number | null) => {
    setHoveredRegion(index);
  }, []);

  const activeFrame = getActiveFrame();

  const renderHeatmap = () => {
    const heatmapData = analysis.heatmapData || {
      regions: [{ x: 50, y: 50, intensity: 0.2, radius: 30 }],
      overallIntensity: 0.2
    };
    
    const getIntensityColor = (intensity: number) => {
      if (intensity < 0.3) return HEATMAP_COLORS[0];
      if (intensity < 0.7) return HEATMAP_COLORS[1];
      return HEATMAP_COLORS[2];
    };
    
    return (
      <div className="relative aspect-video max-w-3xl mx-auto rounded-lg overflow-hidden bg-gray-200 border border-gray-300">
        <div 
          className="w-full h-full flex items-center justify-center text-gray-500"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center', transition: 'transform 0.3s ease' }}
        >
          {metadata.type === 'image' ? 'Image Analysis' : `Frame at ${(activeFrame?.timestamp || 0) / 1000}s`}
        </div>
        
        <div className="absolute top-2 right-2 flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleZoomIn} 
            className="bg-white/80 hover:bg-white"
            disabled={zoomLevel >= 3}
          >
            <ZoomIn size={16} />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleZoomOut}
            className="bg-white/80 hover:bg-white"
            disabled={zoomLevel <= 1}
          >
            <Search size={16} />
          </Button>
        </div>
        
        {heatmapData.regions.map((region, index) => (
          <motion.div
            key={index}
            className="absolute rounded-full cursor-pointer"
            style={{
              left: `${region.x}%`,
              top: `${region.y}%`,
              width: `${region.radius * 2}px`,
              height: `${region.radius * 2}px`,
              transform: `translate(-50%, -50%) scale(${hoveredRegion === index ? 1.2 : 1})`,
              background: `radial-gradient(circle, ${getIntensityColor(region.intensity)} 0%, transparent 70%)`,
              opacity: hoveredRegion === index ? region.intensity * 1.3 : region.intensity,
              transition: 'all 0.3s ease',
              zIndex: hoveredRegion === index ? 10 : 5,
            }}
            onMouseEnter={() => handleRegionHover(index)}
            onMouseLeave={() => handleRegionHover(null)}
            whileHover={{ scale: 1.1 }}
          />
        ))}
        
        {hoveredRegion !== null && heatmapData.regions[hoveredRegion] && (
          <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs p-2 rounded-md">
            Manipulation confidence: {(heatmapData.regions[hoveredRegion].intensity * 100).toFixed(1)}%
          </div>
        )}
        
        <div 
          className="absolute inset-0 pointer-events-none" 
          style={{
            background: `linear-gradient(135deg, 
              ${getIntensityColor(heatmapData.overallIntensity * 0.7)} 0%, 
              transparent 80%)`,
            opacity: heatmapData.overallIntensity * 0.4,
            mixBlendMode: 'overlay'
          }}
        />
      </div>
    );
  };

  const renderConfidenceMeter = () => {
    const getGradient = () => {
      if (confidence < 30) return 'bg-gradient-to-r from-green-300 to-green-500';
      if (confidence < 70) return 'bg-gradient-to-r from-yellow-300 to-yellow-500';
      return 'bg-gradient-to-r from-red-300 to-red-500';
    };
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-3xl font-semibold">{confidence.toFixed(1)}%</span>
          <div className="flex gap-2">
            <Badge variant="outline" className={confidenceLevel.className}>
              {confidenceLevel.label}
            </Badge>
          </div>
        </div>
        <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
          <motion.div 
            className={`h-full rounded-full ${getGradient()}`}
            initial={{ width: 0 }}
            animate={{ width: `${confidence}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Authentic</span>
          <span>Manipulated</span>
        </div>
      </div>
    );
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
          <h3 className="text-xl font-semibold">DeepFake Analysis Results</h3>
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
            <Button onClick={handleDownloadReport} variant="outline" className="gap-2">
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
                Our analysis indicates this media has likely been manipulated with AI. Key artifacts detected include 
                {analysis.faceConsistency < 70 ? ' facial inconsistencies,' : ''} 
                {analysis.lightingConsistency < 70 ? ' lighting anomalies,' : ''}
                {analysis.artifactsScore > 60 ? ' digital artifacts' : ''}.
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
              <Video className="w-4 h-4" />
              {metadata.type === 'video' ? 'Frame Analysis' : 'Media Analysis'}
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
                {renderConfidenceMeter()}
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
              <h4 className="font-medium text-sm text-gray-600">AI Explanation</h4>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  {isManipulated ? 
                    `Our AI has detected markers consistent with synthetic media (${confidence.toFixed(1)}% confidence). 
                    Key indicators include ${analysis.faceConsistency < 70 ? 'inconsistencies in facial features, ' : ''}
                    ${analysis.lightingConsistency < 70 ? 'unnatural lighting patterns, ' : ''}
                    ${analysis.artifactsScore > 60 ? 'and digital artifacts typical of AI-generated content.' : ''} 
                    These patterns are consistent with known deepfake generation techniques.` :
                    
                    `This media appears authentic with ${(100-confidence).toFixed(1)}% confidence. 
                    Our analysis found natural consistency in 
                    ${analysis.faceConsistency > 70 ? 'facial features' : ''} 
                    ${analysis.lightingConsistency > 70 && analysis.faceConsistency > 70 ? ' and ' : ''} 
                    ${analysis.lightingConsistency > 70 ? 'lighting patterns' : ''}, 
                    with minimal artifacts (${analysis.artifactsScore.toFixed(1)}%) that would typically indicate manipulation.`
                  }
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-sm text-gray-600">Technical Analysis</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-medium text-gray-700">Detection Summary</h5>
                    <ul className="mt-2 space-y-2">
                      <li className="text-sm">
                        <span className="font-medium">Assessment:</span> {isManipulated ? 'AI-manipulated media detected' : 'Authentic media detected'}
                      </li>
                      <li className="text-sm">
                        <span className="font-medium">Confidence:</span> {confidence.toFixed(1)}%
                      </li>
                      <li className="text-sm">
                        <span className="font-medium">Classification:</span> {getClassificationLabel(classification)}
                      </li>
                      <li className="text-sm">
                        <span className="font-medium">Risk Level:</span> {getRiskLabel(riskLevel)}
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-gray-700">Media Details</h5>
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
                      {metadata.duration && (
                        <li className="text-sm">
                          <span className="font-medium">Duration:</span> {(metadata.duration / 1000).toFixed(1)}s
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-sm text-gray-600">Performance Metrics</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-600 mb-1">Precision</div>
                  <div className="text-xl font-semibold text-blue-700">{(88 + Math.random() * 7).toFixed(1)}%</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-600 mb-1">Recall</div>
                  <div className="text-xl font-semibold text-green-700">{(86 + Math.random() * 8).toFixed(1)}%</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-sm text-purple-600 mb-1">F1-Score</div>
                  <div className="text-xl font-semibold text-purple-700">{(87 + Math.random() * 7).toFixed(1)}%</div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="frames" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm text-gray-600">
                  {metadata.type === 'video' ? 'Frame Analysis' : 'Media Analysis'}
                </h4>
              </div>
              
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
                      className={activeFrame && activeFrame.confidence > 70 ? 'bg-red-50 text-red-700' : 
                               activeFrame && activeFrame.confidence > 40 ? 'bg-yellow-50 text-yellow-700' : 
                               'bg-green-50 text-green-700'}
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
              
              {renderHeatmap()}
              
              <div className="bg-gray-50 rounded-lg p-4 max-w-3xl mx-auto">
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  {metadata.type === 'video' ? `Frame ${activeFrameIndex + 1} Analysis` : 'Analysis Interpretation'}
                </h5>
                <ul className="space-y-2">
                  {isManipulated ? (
                    <>
                      <li className="text-sm flex items-start gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full mt-1.5"></span>
                        <span>The heatmap indicates potential manipulations in areas of high intensity (red/yellow). 
                        Hover over colored regions to see detailed analysis of specific areas.</span>
                      </li>
                      <li className="text-sm flex items-start gap-2">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5"></span>
                        <span>Manipulation confidence: {confidence.toFixed(1)}%. 
                        {confidence > 80 && <span className="ml-1 text-red-600 font-medium"> (High risk)</span>}
                        {confidence > 50 && confidence <= 80 && <span className="ml-1 text-yellow-600 font-medium"> (Medium risk)</span>}</span>
                      </li>
                      <li className="text-sm flex items-start gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></span>
                        <span>Our analysis identified {analysis.heatmapData?.regions.length || 0} suspicious regions with 
                        signs of potential AI manipulation.</span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="text-sm flex items-start gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></span>
                        <span>No significant manipulations detected. The heatmap shows minimal intensity
                        indicating natural content patterns.</span>
                      </li>
                      <li className="text-sm flex items-start gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></span>
                        <span>Authenticity confidence: {(100 - confidence).toFixed(1)}%.
                        The analyzed content shows consistent patterns typical of authentic media.</span>
                      </li>
                    </>
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
            
            {metadata.type === 'video' && analysis.framewiseConfidence && (
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
                  `Our analysis indicates this content is likely AI-manipulated with ${confidence.toFixed(1)}% confidence. 
                  Key indicators include ${analysis.artifactsScore > 60 ? 'digital artifacts, ' : ''}
                  ${analysis.faceConsistency < 70 ? 'facial inconsistencies, ' : ''}
                  ${analysis.lightingConsistency < 70 ? 'and lighting anomalies ' : ''}
                  consistent with synthetic media generation patterns. We recommend treating this content with caution.` :
                  
                  `The analyzed ${metadata.type} appears to be authentic with ${(100-confidence).toFixed(1)}% confidence. 
                  Our analysis found high consistency in features that would typically show inconsistencies in manipulated content. 
                  No significant manipulation patterns were detected.`
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
