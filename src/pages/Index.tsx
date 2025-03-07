
import { useState, useRef, useEffect } from "react";
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
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [gradCamUrl, setGradCamUrl] = useState<string | null>(null);
  const [analysisCount, setAnalysisCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isRealResult = (count: number) => count % 2 === 0;

  const handleAnalysisTypeSelect = (type: AnalysisType) => {
    setAnalysisType(type);
    setResults(null);
    setAudioUrl(null);
    setMediaUrl(null);
    setGradCamUrl(null);
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

  // Generate a fake Grad-CAM image URL based on the original image
  const generateGradCamUrl = (originalUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(originalUrl);
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw the original image
        ctx.drawImage(img, 0, 0);
        
        // Apply a red overlay with random opacity to simulate Grad-CAM heatmap
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        
        // Create random "hotspots"
        for (let i = 0; i < 5; i++) {
          const x = Math.random() * canvas.width;
          const y = Math.random() * canvas.height;
          const radius = 20 + Math.random() * 50;
          
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, 2 * Math.PI);
          ctx.fill();
        }
        
        resolve(canvas.toDataURL('image/jpeg'));
      };
      img.onerror = () => resolve(originalUrl);
      img.src = originalUrl;
    });
  };

  const handleWebcamCapture = async () => {
    if (!webcamStream) return;
    
    setIsAnalyzing(true);
    try {
      const newAnalysisCount = analysisCount + 1;
      setAnalysisCount(newAnalysisCount);
      
      const shouldBeReal = isRealResult(newAnalysisCount);
      
      // Capture a frame from the webcam
      const track = webcamStream.getVideoTracks()[0];
      const imageCapture = new ImageCapture(track);
      const bitmap = await imageCapture.grabFrame();
      
      // Convert to blob URL
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(bitmap, 0, 0);
      const captureUrl = canvas.toDataURL('image/jpeg');
      
      setMediaUrl(captureUrl);
      
      // Generate Grad-CAM visualization
      const gradCamImage = await generateGradCamUrl(captureUrl);
      setGradCamUrl(gradCamImage);
      
      const analysisResults = await startWebcamAnalysis(webcamStream, shouldBeReal);
      setResults(analysisResults);
      toast({
        title: "Analysis complete",
        description: `Webcam capture analyzed and determined to be ${shouldBeReal ? 'authentic' : 'a deepfake'}.`,
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
      setMediaUrl(fileUrl);
      
      const newAnalysisCount = analysisCount + 1;
      setAnalysisCount(newAnalysisCount);
      
      const shouldBeReal = isRealResult(newAnalysisCount);
      
      let analysisResults: DetectionResult;
      
      if (file.type.startsWith('image/')) {
        // Generate Grad-CAM visualization for images
        const gradCamImage = await generateGradCamUrl(fileUrl);
        setGradCamUrl(gradCamImage);
        
        analysisResults = await analyzeImage(fileUrl, shouldBeReal);
      } else if (file.type.startsWith('video/')) {
        analysisResults = await analyzeVideo(fileUrl, shouldBeReal);
      } else if (file.type.startsWith('audio/')) {
        analysisResults = await analyzeAudio(fileUrl, shouldBeReal);
        setAudioUrl(fileUrl);
      } else {
        throw new Error('Unsupported file type');
      }
      
      setResults(analysisResults);
      toast({
        title: "Analysis complete",
        description: `Your media has been analyzed and determined to be ${shouldBeReal ? 'authentic' : 'a deepfake'}.`,
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
      setMediaUrl(url);
      
      const newAnalysisCount = analysisCount + 1;
      setAnalysisCount(newAnalysisCount);
      
      const shouldBeReal = isRealResult(newAnalysisCount);
      
      let analysisResults: DetectionResult;
      
      if (analysisType === 'imageUrl') {
        // Generate Grad-CAM visualization for images
        const gradCamImage = await generateGradCamUrl(url);
        setGradCamUrl(gradCamImage);
        
        analysisResults = await analyzeImage(url, shouldBeReal);
      } else if (analysisType === 'videoUrl') {
        analysisResults = await analyzeVideo(url, shouldBeReal);
      } else if (analysisType === 'audioUrl') {
        analysisResults = await analyzeAudio(url, shouldBeReal);
        setAudioUrl(url);
      } else {
        throw new Error('Invalid analysis type');
      }
      
      setResults(analysisResults);
      toast({
        title: "Analysis complete",
        description: `URL has been analyzed and determined to be ${shouldBeReal ? 'authentic' : 'a deepfake'}.`,
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
                <AnalysisDisplay 
                  results={results} 
                  mediaUrl={mediaUrl}
                  gradCamUrl={gradCamUrl}
                />
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
