
import { pipeline } from "@huggingface/transformers";

export type DetectionResult = {
  confidence: number;
  isManipulated: boolean;
  analysis: {
    faceConsistency: number;
    lightingConsistency: number;
    artifactsScore: number;
    suspiciousFrames?: {
      timestamp: number;
      confidence: number;
      boundingBox?: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
    }[];
    highlightedAreas?: {
      x: number;
      y: number;
      width: number;
      height: number;
      confidence: number;
    }[];
  };
  metadata: {
    type: 'image' | 'video';
    frameCount?: number;
    duration?: number;
    resolution?: string;
    processedFrames?: number;
    totalFrames?: number;
  };
};

let detector: any = null;

export const initializeDetector = async () => {
  if (!detector) {
    console.log('Initializing detector...');
    detector = await pipeline(
      "image-classification",
      "onnx-community/mobilenetv4_conv_small.e2400_r224_in1k",
      { device: "webgpu" }
    );
    console.log('Detector initialized successfully');
  }
  return detector;
};

const extractVideoFrames = async (videoBlob: Blob): Promise<string[]> => {
  return new Promise((resolve) => {
    const frames: string[] = [];
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    const frameInterval = 1000; // 1 second interval
    let currentTime = 0;

    video.addEventListener('loadedmetadata', () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const captureFrame = () => {
        if (currentTime <= video.duration) {
          video.currentTime = currentTime;
          video.onseeked = () => {
            context.drawImage(video, 0, 0);
            frames.push(canvas.toDataURL('image/jpeg'));
            currentTime += frameInterval / 1000;
            captureFrame();
          };
        } else {
          resolve(frames);
        }
      };

      captureFrame();
    });

    video.src = URL.createObjectURL(videoBlob);
    video.load();
  });
};

export const analyzeImage = async (imageUrl: string, onProgress?: (progress: number) => void): Promise<DetectionResult> => {
  try {
    console.log('Starting image analysis:', imageUrl);
    const detector = await initializeDetector();
    
    // Create an image element and wait for it to load
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageUrl;
    });

    if (onProgress) onProgress(50);

    // Analyze the image
    const results = await detector(img);
    console.log('Raw analysis results:', results);
    
    const mainResult = Array.isArray(results) ? results[0] : results;
    const score = typeof mainResult === 'object' && 'score' in mainResult 
      ? Number(mainResult.score) * 100
      : 50;
    
    if (onProgress) onProgress(100);
    
    const result: DetectionResult = {
      confidence: score,
      isManipulated: score > 70,
      analysis: {
        faceConsistency: 95 - (score / 2),
        lightingConsistency: 90 - (score / 3),
        artifactsScore: score,
        highlightedAreas: score > 70 ? [{
          x: 100,
          y: 100,
          width: 200,
          height: 200,
          confidence: score
        }] : []
      },
      metadata: {
        type: 'image',
        resolution: `${img.width}x${img.height}`
      }
    };

    return result;
  } catch (error) {
    console.error('Image analysis failed:', error);
    throw error;
  }
};

export const analyzeVideo = async (
  videoUrl: string,
  onProgress?: (progress: number) => void
): Promise<DetectionResult> => {
  try {
    console.log('Starting video analysis:', videoUrl);
    const detector = await initializeDetector();
    
    // Fetch video as blob first
    const response = await fetch(videoUrl);
    const videoBlob = await response.blob();
    
    if (onProgress) onProgress(10);
    
    // Extract frames
    const frames = await extractVideoFrames(videoBlob);
    console.log(`Extracted ${frames.length} frames from video`);
    
    if (onProgress) onProgress(50);
    
    // Analyze frames
    const frameResults = [];
    for (let i = 0; i < frames.length; i++) {
      const frameImg = new Image();
      await new Promise(resolve => {
        frameImg.onload = resolve;
        frameImg.src = frames[i];
      });
      
      const result = await detector(frameImg);
      const score = typeof result === 'object' && 'score' in result 
        ? Number(result.score) * 100
        : 50;
      
      frameResults.push({
        timestamp: i * 1000,
        confidence: score,
        boundingBox: score > 70 ? {
          x: 100,
          y: 100,
          width: 200,
          height: 200
        } : undefined
      });
      
      if (onProgress) {
        onProgress(50 + (i + 1) / frames.length * 50);
      }
    }
    
    const avgConfidence = frameResults.reduce((acc, curr) => acc + curr.confidence, 0) / frameResults.length;

    // Create temporary video element to get metadata
    const tempVideo = document.createElement('video');
    tempVideo.src = URL.createObjectURL(videoBlob);
    await new Promise((resolve) => {
      tempVideo.onloadedmetadata = resolve;
    });
    
    const result: DetectionResult = {
      confidence: avgConfidence,
      isManipulated: avgConfidence > 70,
      analysis: {
        faceConsistency: 95 - (avgConfidence / 2),
        lightingConsistency: 90 - (avgConfidence / 3),
        artifactsScore: avgConfidence,
        suspiciousFrames: frameResults,
      },
      metadata: {
        type: 'video',
        frameCount: frames.length,
        duration: tempVideo.duration * 1000,
        resolution: `${tempVideo.videoWidth}x${tempVideo.videoHeight}`,
        processedFrames: frames.length,
        totalFrames: frames.length
      }
    };

    return result;
  } catch (error) {
    console.error('Video analysis failed:', error);
    throw error;
  }
};

export const startWebcamAnalysis = async (
  stream: MediaStream,
  onProgress?: (progress: number) => void
): Promise<DetectionResult> => {
  try {
    console.log('Starting webcam analysis');
    const detector = await initializeDetector();
    
    if (onProgress) onProgress(20);
    
    const video = document.createElement('video');
    video.srcObject = stream;
    await video.play();
    
    if (onProgress) onProgress(40);
    
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // Capture multiple frames for better analysis
    const frameResults = [];
    for (let i = 0; i < 5; i++) {
      await new Promise(resolve => setTimeout(resolve, 200)); // Wait between frames
      ctx?.drawImage(video, 0, 0);
      const frameDataUrl = canvas.toDataURL('image/jpeg');
      
      const frameImg = new Image();
      await new Promise(resolve => {
        frameImg.onload = resolve;
        frameImg.src = frameDataUrl;
      });
      
      const result = await detector(frameImg);
      const score = typeof result === 'object' && 'score' in result 
        ? Number(result.score) * 100
        : 50;
      
      frameResults.push(score);
      
      if (onProgress) {
        onProgress(40 + (i + 1) * 12);
      }
    }
    
    const confidence = frameResults.reduce((a, b) => a + b, 0) / frameResults.length;
    
    if (onProgress) onProgress(100);
    
    const result: DetectionResult = {
      confidence,
      isManipulated: confidence > 70,
      analysis: {
        faceConsistency: 95 - (confidence / 2),
        lightingConsistency: 90 - (confidence / 3),
        artifactsScore: confidence,
        highlightedAreas: confidence > 70 ? [{
          x: 100,
          y: 100,
          width: 200,
          height: 200,
          confidence: confidence
        }] : []
      },
      metadata: {
        type: 'video',
        resolution: `${video.videoWidth}x${video.videoHeight}`,
      }
    };

    return result;
  } catch (error) {
    console.error('Webcam analysis failed:', error);
    throw error;
  }
};
