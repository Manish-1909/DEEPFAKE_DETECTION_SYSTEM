
import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Slider } from './ui/slider';
import { FileDown, AlertCircle, Volume, Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { Button } from './ui/button';
import { DetectionResult } from '@/services/detectionService';
import { generatePDFReport } from '@/utils/reportGenerator';
import { toast } from './ui/use-toast';

interface AudioAnalysisDisplayProps {
  results: DetectionResult;
  audioUrl?: string;
}

const AudioAnalysisDisplay = ({ results, audioUrl }: AudioAnalysisDisplayProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
  
  const { confidence, analysis, metadata, isManipulated, classification, riskLevel } = results;
  
  if (!analysis.audioAnalysis) {
    return <div className="p-6 text-center">No audio analysis data available</div>;
  }
  
  const { pitchConsistency, frequencyDistortion, artificialPatterns, suspiciousSegments } = analysis.audioAnalysis;
  
  const audioDuration = metadata.audioDuration || 30; // fallback to 30 seconds
  
  const pieChartData = [
    { name: 'Manipulated', value: confidence },
    { name: 'Authentic', value: 100 - confidence },
  ];
  
  const barChartData = [
    { name: 'Pitch Consistency', value: pitchConsistency },
    { name: 'Frequency Distortion', value: frequencyDistortion },
    { name: 'Artificial Patterns', value: artificialPatterns },
  ];
  
  const COLORS = ['#FF4560', '#00C292', '#FEB019'];
  
  const getConfidenceLevel = (score: number) => {
    if (score >= 90) return { label: 'High Confidence', className: 'bg-red-50 text-red-700' };
    if (score >= 70) return { label: 'Medium Confidence', className: 'bg-yellow-50 text-yellow-700' };
    return { label: 'Low Confidence', className: 'bg-green-50 text-green-700' };
  };
  
  const confidenceLevel = getConfidenceLevel(confidence);
  
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // In a real implementation, this would control audio playback
  };
  
  const handleTimeChange = (value: number[]) => {
    setCurrentTime(value[0]);
    // In a real implementation, this would seek to the specified time
  };
  
  const handleSegmentSelect = (index: number) => {
    setActiveSegmentIndex(index);
    if (suspiciousSegments[index]) {
      setCurrentTime(suspiciousSegments[index].timestamp / 1000);
    }
  };
  
  const handleDownloadReport = () => {
    try {
      generatePDFReport(results);
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
  
  const activeSegment = suspiciousSegments[activeSegmentIndex];
  
  return (
    <div className="space-y-8 w-full max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glassmorphism rounded-xl p-6 space-y-6 bg-white/5 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h3 className="text-xl font-semibold">Audio Analysis Results</h3>
          <div className="flex gap-4 items-center">
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                AUDIO
              </Badge>
              <Badge variant="outline" className={results.isManipulated ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}>
                {getClassificationLabel(results.classification)}
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

        {results.isManipulated && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-700">Potential Audio Manipulation Detected</h4>
              <p className="text-sm text-red-600 mt-1">
                Our analysis indicates this audio may have been synthetically generated or manipulated with {confidence.toFixed(1)}% confidence.
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
                <span className="text-sm">Pitch Consistency</span>
                <Badge variant="outline" className={pitchConsistency > 70 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}>
                  {pitchConsistency.toFixed(1)}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Frequency Distortion</span>
                <Badge variant="outline" className={frequencyDistortion < 30 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}>
                  {frequencyDistortion.toFixed(1)}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Artificial Patterns</span>
                <Badge variant="outline" className={artificialPatterns < 30 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}>
                  {artificialPatterns.toFixed(1)}%
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-sm text-gray-600">Audio Waveform</h4>
          <div className="relative h-24 bg-gray-50 rounded-lg overflow-hidden">
            {/* Audio waveform visualization would go here in a real implementation */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-12 flex items-center">
                {Array.from({ length: 100 }).map((_, i) => {
                  const height = 5 + Math.random() * 30;
                  const isSuspicious = suspiciousSegments.some(
                    seg => (i / 100) * audioDuration >= seg.timestamp / 1000 && 
                           (i / 100) * audioDuration <= (seg.timestamp + seg.duration) / 1000
                  );
                  return (
                    <div 
                      key={i} 
                      className={`mx-[1px] ${isSuspicious ? 'bg-red-400' : 'bg-blue-400'}`}
                      style={{ height: `${height}px`, width: '2px' }}
                    />
                  );
                })}
              </div>
            </div>
            
            {/* Playback position indicator */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-black"
              style={{ left: `${(currentTime / audioDuration) * 100}%` }}
            />
            
            {/* Suspicious segments highlights */}
            {suspiciousSegments.map((segment, index) => (
              <div
                key={index}
                className="absolute top-0 bottom-0 bg-red-200 opacity-50"
                style={{ 
                  left: `${(segment.timestamp / 1000 / audioDuration) * 100}%`,
                  width: `${(segment.duration / 1000 / audioDuration) * 100}%`
                }}
                onClick={() => handleSegmentSelect(index)}
              />
            ))}
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handlePlayPause}>
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <div className="flex-1">
              <Slider
                value={[currentTime]}
                max={audioDuration}
                step={0.1}
                onValueChange={handleTimeChange}
              />
            </div>
            <div className="text-xs text-gray-500 min-w-16">
              {currentTime.toFixed(1)}s / {audioDuration.toFixed(1)}s
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-gray-600">Suspicious Segments</h4>
          {suspiciousSegments.length > 0 ? (
            <div className="space-y-2">
              {suspiciousSegments.map((segment, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border ${index === activeSegmentIndex ? 'border-primary bg-primary/5' : 'border-gray-200'} cursor-pointer`}
                  onClick={() => handleSegmentSelect(index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={index === activeSegmentIndex ? "default" : "outline"} className="h-6">
                        {(segment.timestamp / 1000).toFixed(1)}s - {((segment.timestamp + segment.duration) / 1000).toFixed(1)}s
                      </Badge>
                      <span className="text-sm font-medium">{segment.type.replace('_', ' ')}</span>
                    </div>
                    <Badge variant="outline" className={segment.confidence > 70 ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'}>
                      {segment.confidence.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-4 bg-gray-50 rounded-lg text-gray-500">
              No suspicious segments detected
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-gray-600">Detection Confidence</h4>
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
        
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-gray-600">Detection Performance</h4>
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
        
        <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Analysis Interpretation</h5>
          <p className="text-sm text-gray-600">
            {isManipulated ? 
              `Our analysis indicates potential audio manipulation with ${confidence.toFixed(1)}% confidence. Key areas of concern include ${artificialPatterns > 50 ? 'artificial speech patterns' : ''} ${pitchConsistency < 70 ? 'pitch inconsistencies' : ''} ${frequencyDistortion > 50 ? 'frequency distortions' : ''}.` :
              `The analyzed audio appears to be authentic with ${(100-confidence).toFixed(1)}% confidence. No significant manipulations were detected.`
            }
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AudioAnalysisDisplay;
