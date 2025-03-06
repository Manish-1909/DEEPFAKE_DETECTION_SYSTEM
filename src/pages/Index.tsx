
import { useState, useRef } from "react";
import Header from "@/components/Header";
import UploadZone from "@/components/UploadZone";
import AnalysisDisplay from "@/components/AnalysisDisplay";
import AudioAnalysisDisplay from "@/components/AudioAnalysisDisplay";
import AnalysisOptions, { AnalysisType } from "@/components/AnalysisOptions";
import { motion } from "framer-motion";
import { toast } from "@/components/ui/use-toast";
import { 
  DetectionResult, 
  analyzeImage, 
  analyzeVideo, 
  analyzeAudio,
  analyzeAudioSpectrogram,
  extractAudioFromVideo,
  startWebcamAnalysis 
} from "@/services/detectionService";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";

const Index = () => {
  const [analysisType, setAnalysisType] = useState<AnalysisType | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<DetectionResult | null>(null);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleAnalysisTypeSelect = (type: AnalysisType) => {
    setAnalysisType(type);
    setResults(null);
    setAudioUrl(null);
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
    }
    toast({
      title: "Mode changed",
      description: `Switched to ${type} mode`,
    });
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setWebcamStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      toast({
        title: "Webcam started",
        description: "Your webcam is now active and ready for analysis.",
      });
    } catch (error) {
      console.error('Failed to start webcam:', error);
      toast({
        title: "Webcam error",
        description: "Failed to access webcam. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const handleWebcamCapture = async () => {
    if (!webcamStream) return;
    
    setIsAnalyzing(true);
    try {
      const analysisResults = await startWebcamAnalysis(webcamStream);
      setResults(analysisResults);
      toast({
        title: "Analysis complete",
        description: "Webcam capture has been analyzed.",
      });
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: "Failed to analyze webcam capture.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileAnalysis = async (files: File[]) => {
    if (files.length === 0) return;
    
    setIsAnalyzing(true);
    try {
      const file = files[0];
      const fileUrl = URL.createObjectURL(file);
      
      let analysisResults: DetectionResult;
      
      if (file.type.startsWith('image/')) {
        analysisResults = await analyzeImage(fileUrl);
      } else if (file.type.startsWith('video/')) {
        analysisResults = await analyzeVideo(fileUrl);
      } else if (file.type.startsWith('audio/')) {
        if (analysisType === 'audioSpectrogram') {
          analysisResults = await analyzeAudioSpectrogram(fileUrl);
        } else {
          analysisResults = await analyzeAudio(fileUrl);
        }
        setAudioUrl(fileUrl);
      } else if (analysisType === 'extractAudio' && file.type.startsWith('video/')) {
        const audioUrl = await extractAudioFromVideo(fileUrl);
        analysisResults = await analyzeAudio(audioUrl);
        setAudioUrl(audioUrl);
      } else {
        throw new Error('Unsupported file type');
      }
      
      setResults(analysisResults);
      toast({
        title: "Analysis complete",
        description: "Your media has been successfully analyzed.",
      });
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        title: "Analysis failed",
        description: "There was an error analyzing your media.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUrlAnalysis = async (url: string) => {
    if (!url) return;
    
    setIsAnalyzing(true);
    try {
      let analysisResults: DetectionResult;
      
      if (analysisType === 'imageUrl') {
        analysisResults = await analyzeImage(url);
      } else if (analysisType === 'videoUrl') {
        analysisResults = await analyzeVideo(url);
      } else if (analysisType === 'audioUrl') {
        if (analysisType === 'audioSpectrogram') {
          analysisResults = await analyzeAudioSpectrogram(url);
        } else {
          analysisResults = await analyzeAudio(url);
        }
        setAudioUrl(url);
      } else {
        throw new Error('Invalid analysis type');
      }
      
      setResults(analysisResults);
      toast({
        title: "Analysis complete",
        description: "URL has been successfully analyzed.",
      });
    } catch (error) {
      console.error('URL analysis failed:', error);
      toast({
        title: "Analysis failed",
        description: "Failed to analyze the provided URL.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const isAudioAnalysis = results?.metadata.type === 'audio';

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4">
        <Header />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="max-w-6xl mx-auto space-y-8"
        >
          <AnalysisOptions onSelect={handleAnalysisTypeSelect} />
          {analysisType && (
            <>
              {analysisType === 'webcam' ? (
                <div className="space-y-4">
                  <div className="relative aspect-video max-w-3xl mx-auto rounded-lg overflow-hidden bg-black">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex justify-center gap-4">
                    {!webcamStream ? (
                      <Button onClick={startWebcam} disabled={isAnalyzing}>
                        <Camera className="w-4 h-4 mr-2" />
                        Start Webcam
                      </Button>
                    ) : (
                      <Button onClick={handleWebcamCapture} disabled={isAnalyzing}>
                        Analyze Webcam Feed
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <UploadZone 
                  analysisType={analysisType} 
                  onFileSelect={handleFileAnalysis}
                  onUrlSubmit={handleUrlAnalysis}
                  isAnalyzing={isAnalyzing}
                />
              )}
              
              {results && !isAudioAnalysis && (
                <AnalysisDisplay results={results} />
              )}
              
              {results && isAudioAnalysis && (
                <AudioAnalysisDisplay results={results} audioUrl={audioUrl || undefined} />
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
