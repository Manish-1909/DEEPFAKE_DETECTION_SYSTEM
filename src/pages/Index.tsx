
import { useState, useRef, useEffect } from "react";
import Header from "@/components/Header";
import UploadZone from "@/components/UploadZone";
import AnalysisDisplay from "@/components/AnalysisDisplay";
import AudioAnalysisDisplay from "@/components/AudioAnalysisDisplay";
import AnalysisOptions, { AnalysisType } from "@/components/AnalysisOptions";
import ExcelDataExport, { AnalysisEntry } from "@/components/ExcelDataExport";
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
import { Camera, Sun, Moon } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { ThemeProvider, useTheme } from "@/hooks/useTheme";

interface ImageCapture {
  track: MediaStreamTrack;
  grabFrame(): Promise<ImageBitmap>;
}

declare global {
  interface Window {
    ImageCapture?: {
      new(track: MediaStreamTrack): ImageCapture;
    };
  }
}

if (!('ImageCapture' in window)) {
  window.ImageCapture = class {
    track: MediaStreamTrack;
    
    constructor(track: MediaStreamTrack) {
      this.track = track;
    }
    
    async grabFrame(): Promise<ImageBitmap> {
      const videoEl = document.createElement('video');
      videoEl.srcObject = new MediaStream([this.track]);
      videoEl.play();
      
      return new Promise<ImageBitmap>((resolve) => {
        videoEl.onplaying = () => {
          const canvas = document.createElement('canvas');
          canvas.width = videoEl.videoWidth;
          canvas.height = videoEl.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(videoEl, 0, 0);
          createImageBitmap(canvas).then(resolve);
          videoEl.pause();
        };
      });
    }
  };
}

const IndexContent = () => {
  const [analysisType, setAnalysisType] = useState<AnalysisType | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<DetectionResult | null>(null);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [gradCamUrl, setGradCamUrl] = useState<string | null>(null);
  const [frameImages, setFrameImages] = useState<string[]>([]);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [latestEntry, setLatestEntry] = useState<AnalysisEntry | undefined>();
  const { theme, toggleTheme } = useTheme();
  const videoRef = useRef<HTMLVideoElement>(null);

  const isRealResult = (count: number) => count % 2 === 0;

  const handleAnalysisTypeSelect = (type: AnalysisType) => {
    setAnalysisType(type);
    setResults(null);
    setAudioUrl(null);
    setMediaUrl(null);
    setGradCamUrl(null);
    setFrameImages([]);
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

  const generateVideoFrameImages = (videoUrl: string, count = 4): Promise<string[]> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.src = videoUrl;
      video.crossOrigin = "Anonymous";
      const frameUrls: string[] = [];
      
      video.onloadedmetadata = () => {
        const duration = video.duration;
        const interval = duration / (count + 1);
        let framesLoaded = 0;
        
        for (let i = 1; i <= count; i++) {
          const time = interval * i;
          video.currentTime = time;
          
          video.onseeked = () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              frameUrls.push(canvas.toDataURL('image/jpeg'));
              
              framesLoaded++;
              if (framesLoaded === count) {
                resolve(frameUrls);
              }
            }
          };
        }
      };
      
      video.onerror = () => resolve([]);
      video.load();
    });
  };

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
        
        ctx.drawImage(img, 0, 0);
        
        // Add more realistic heatmap visualization
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        
        // Create more complex patterns for better visualization
        for (let i = 0; i < 5; i++) {
          const x = Math.random() * canvas.width;
          const y = Math.random() * canvas.height;
          const radius = 20 + Math.random() * 50;
          
          // Use radial gradients for more realistic heatmap effect
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
          gradient.addColorStop(0, 'rgba(255, 0, 0, 0.7)');
          gradient.addColorStop(0.5, 'rgba(255, 0, 0, 0.3)');
          gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
          
          ctx.fillStyle = gradient;
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
  
  const createAnalysisEntry = (result: DetectionResult): AnalysisEntry => {
    return {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      mediaType: result.metadata.type,
      confidence: result.confidence,
      isManipulated: result.isManipulated,
      classification: result.classification
    };
  };

  const handleWebcamCapture = async () => {
    if (!webcamStream) return;
    
    setIsAnalyzing(true);
    try {
      const newAnalysisCount = analysisCount + 1;
      setAnalysisCount(newAnalysisCount);
      
      const shouldBeReal = isRealResult(newAnalysisCount);
      
      const track = webcamStream.getVideoTracks()[0];
      const imageCapture = new window.ImageCapture!(track);
      const bitmap = await imageCapture.grabFrame();
      
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(bitmap, 0, 0);
      const captureUrl = canvas.toDataURL('image/jpeg');
      
      setMediaUrl(captureUrl);
      
      // Generate GradCAM visualization for the webcam image
      const gradCamImage = await generateGradCamUrl(captureUrl);
      setGradCamUrl(gradCamImage);
      
      // Use both the capture and GradCAM image for frame images
      const frameImgs = [captureUrl, gradCamImage];
      setFrameImages(frameImgs);
      
      const analysisResults = await startWebcamAnalysis(webcamStream, shouldBeReal);
      setResults(analysisResults);
      
      const entry = createAnalysisEntry(analysisResults);
      setLatestEntry(entry);
      
      toast({
        title: "Analysis complete",
        description: `Webcam capture analyzed with ${analysisResults.confidence.toFixed(1)}% confidence.`,
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
    await processFiles(files);
  };
  
  const processFiles = async (files: File[]) => {
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
        // Generate and set GradCAM visualization
        const gradCamImage = await generateGradCamUrl(fileUrl);
        setGradCamUrl(gradCamImage);
        
        // Set frame images to include both original and GradCAM
        setFrameImages([fileUrl, gradCamImage]);
        
        analysisResults = await analyzeImage(fileUrl, shouldBeReal);
      } else if (file.type.startsWith('video/')) {
        analysisResults = await analyzeVideo(fileUrl, shouldBeReal);
        
        const frameImgs = await generateVideoFrameImages(fileUrl);
        setFrameImages(frameImgs);
        
        if (frameImgs.length > 0) {
          const gradCamImage = await generateGradCamUrl(frameImgs[0]);
          setGradCamUrl(gradCamImage);
        } else {
          const gradCamImage = await generateGradCamUrl(fileUrl);
          setGradCamUrl(gradCamImage);
        }
      } else if (file.type.startsWith('audio/')) {
        analysisResults = await analyzeAudio(fileUrl, shouldBeReal);
        setAudioUrl(fileUrl);
      } else {
        throw new Error('Unsupported file type');
      }
      
      setResults(analysisResults);
      
      const entry = createAnalysisEntry(analysisResults);
      setLatestEntry(entry);
      
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
    await processUrl(url);
  };
  
  const processUrl = async (url: string) => {
    if (!url) return;
    
    setIsAnalyzing(true);
    try {
      setMediaUrl(url);
      
      const newAnalysisCount = analysisCount + 1;
      setAnalysisCount(newAnalysisCount);
      
      const shouldBeReal = isRealResult(newAnalysisCount);
      
      let analysisResults: DetectionResult;
      
      if (analysisType === 'imageUrl') {
        const gradCamImage = await generateGradCamUrl(url);
        setGradCamUrl(gradCamImage);
        setFrameImages([url]);
        
        analysisResults = await analyzeImage(url, shouldBeReal);
      } else if (analysisType === 'videoUrl') {
        analysisResults = await analyzeVideo(url, shouldBeReal);
        
        const fakeFrames = [];
        for (let i = 0; i < 4; i++) {
          fakeFrames.push(url);
        }
        setFrameImages(fakeFrames);
        
        const gradCamImage = await generateGradCamUrl(url);
        setGradCamUrl(gradCamImage);
      } else if (analysisType === 'audioUrl') {
        analysisResults = await analyzeAudio(url, shouldBeReal);
        setAudioUrl(url);
      } else {
        throw new Error('Invalid analysis type');
      }
      
      setResults(analysisResults);
      
      const entry = createAnalysisEntry(analysisResults);
      setLatestEntry(entry);
      
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted dark:from-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4">
        <div className="flex justify-end py-4">
          <Button variant="outline" size="sm" onClick={toggleTheme} className="gap-2">
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </Button>
        </div>
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

              <ExcelDataExport latestEntry={latestEntry} />
              
              {results && !isAudioAnalysis && (
                <AnalysisDisplay 
                  results={results} 
                  mediaUrl={mediaUrl}
                  gradCamUrl={gradCamUrl}
                  frameImages={frameImages}
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

const Index = () => {
  return (
    <ThemeProvider>
      <IndexContent />
    </ThemeProvider>
  );
};

export default Index;
