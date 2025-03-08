import { pipeline } from "@huggingface/transformers";

export interface DetectionResult {
  confidence: number;
  isManipulated: boolean;
  classification: string;
  riskLevel: string;
  analysis: {
    framewiseConfidence?: { timestamp: number; confidence: number }[];
    suspiciousFrames?: { timestamp: number; confidence: number }[];
    faceConsistency: number;
    lightingConsistency: number;
    artifactsScore: number;
    heatmapData?: {
      regions: {
        x: number;
        y: number;
        intensity: number;
        radius: number;
      }[];
      overallIntensity: number;
    };
    audioAnalysis?: {
      pitchConsistency: number;
      frequencyDistortion: number;
      artificialPatterns: number;
      suspiciousSegments: {
        timestamp: number;
        duration: number;
        confidence: number;
        type: string;
      }[];
    };
  };
  metadata: {
    type: 'image' | 'video' | 'audio';
    resolution?: string;
    duration?: number;
    frameCount?: number;
  };
}

let detector: any = null;
let audioDetector: any = null;

// Store of already classified sources for consistency
const classificationCache = new Map<string, boolean>();

export const initializeDetector = async () => {
  if (!detector) {
    console.log('Initializing detector...');
    detector = await pipeline(
      "image-classification",
      "Xenova/mosaic-base",
      { /* Using default options, removed 'quantized' which caused the error */ }
    );
    console.log('Detector initialized successfully');
  }
  return detector;
};

export const initializeAudioDetector = async () => {
  if (!audioDetector) {
    console.log('Initializing audio detector...');
    try {
      audioDetector = await pipeline(
        "audio-classification",
        "Xenova/audio-deepfake-detection-base",
        {}
      );
      console.log('Audio detector initialized successfully');
    } catch (error) {
      console.error('Failed to initialize audio detector, using mock implementation:', error);
      // Mock implementation for demo purposes
      audioDetector = {
        async classify() {
          return generateMockAudioClassification();
        }
      };
    }
  }
  return audioDetector;
};

// Generate a hash from the source URL to ensure consistent classification
// Instead of using crypto library which doesn't work in browser, use a simple hash function
const getSourceHash = (source: string): string => {
  let hash = 0;
  if (source.length === 0) return hash.toString(16);
  
  for (let i = 0; i < source.length; i++) {
    const char = source.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Convert to hex string and ensure it's positive
  return (hash >>> 0).toString(16);
};

// Determine if a source should be classified as manipulated based on its hash
// This ensures consistent classification for the same source
const shouldClassifyAsManipulated = (source: string): boolean => {
  if (classificationCache.has(source)) {
    return classificationCache.get(source)!;
  }
  
  const hash = getSourceHash(source);
  // Use the first 8 chars of the hash as a number and determine if it should be manipulated
  // Approximately 40% manipulated, 60% real (based on hash distribution)
  const hashValue = parseInt(hash.substring(0, 6), 16);
  const isManipulated = hashValue % 100 < 40; // 40% chance to be manipulated
  
  // Cache the result for consistency
  classificationCache.set(source, isManipulated);
  return isManipulated;
};

// Generate confidence scores based on classification
const generateConfidenceScore = (isManipulated: boolean): number => {
  if (isManipulated) {
    // For deepfake: 75-95% confidence to ensure high confidence for manipulated content
    return 75 + Math.random() * 20;
  } else {
    // For real: 5-25% confidence (low manipulation score for real content)
    return 5 + Math.random() * 20;
  }
};

// Generate realistic and varied sub-scores
const generateAnalysisSubScores = (isManipulated: boolean): { 
  faceConsistency: number, 
  lightingConsistency: number, 
  artifactsScore: number 
} => {
  if (isManipulated) {
    // For deepfakes - lower consistency scores, higher artifacts
    const faceConsistency = 30 + Math.random() * 25; // 30-55%
    const lightingConsistency = 20 + Math.random() * 30; // 20-50%
    const artifactsScore = 70 + Math.random() * 25; // 70-95%
    
    return { faceConsistency, lightingConsistency, artifactsScore };
  } else {
    // For real media - higher consistency scores, lower artifacts
    const faceConsistency = 85 + Math.random() * 15; // 85-100%
    const lightingConsistency = 80 + Math.random() * 20; // 80-100%
    const artifactsScore = 5 + Math.random() * 15; // 5-20%
    
    return { faceConsistency, lightingConsistency, artifactsScore };
  }
};

// Generate graphical heatmap data based on manipulation status
const generateHeatmapData = (isManipulated: boolean) => {
  if (!isManipulated) {
    // For authentic content, minimal intensity
    return {
      regions: [
        { x: 50, y: 50, intensity: 0.10, radius: 25 }
      ],
      overallIntensity: 0.05
    };
  }
  
  // For manipulated content, generate several significant hotspots
  const regionCount = 4 + Math.floor(Math.random() * 3); // 4-6 regions
  const regions = Array.from({ length: regionCount }, (_, i) => {
    return {
      x: 10 + Math.floor(Math.random() * 80), // 10-90% of width
      y: 10 + Math.floor(Math.random() * 80), // 10-90% of height
      intensity: 0.65 + Math.random() * 0.35, // 0.65-1.0 intensity
      radius: 20 + Math.floor(Math.random() * 25) // 20-45 radius
    };
  });
  
  return {
    regions,
    overallIntensity: 0.75 + Math.random() * 0.25 // 0.75-1.0 overall intensity
  };
};

// Generate framewise confidence for videos
const generateFramewiseConfidence = (frameCount: number, isManipulated: boolean): number[] => {
  // Create a realistic pattern
  const baseConfidence = isManipulated ? 75 + Math.random() * 20 : 5 + Math.random() * 20;
  
  return Array.from({ length: frameCount }, (_, i) => {
    // Add some variability to each frame
    const variability = Math.random() * 10 - 5; // +/- 5%
    
    if (isManipulated) {
      return Math.min(98, Math.max(70, baseConfidence + variability));
    } else {
      return Math.min(30, Math.max(1, baseConfidence + variability));
    }
  });
};

// Generate suspicious frames with realistic confidence values
const generateSuspiciousFrames = (frameCount: number, isManipulated: boolean): any[] => {
  if (!isManipulated) {
    return []; // No suspicious frames for authentic videos
  }
  
  // For deepfakes, add suspicious frames
  const framesToAdd = Math.ceil(frameCount * 0.6); // About 60% of frames are suspicious
  
  return Array.from({ length: framesToAdd }, (_, index) => {
    const frameIndex = Math.floor(Math.random() * frameCount);
    const confidence = 75 + Math.random() * 20; // 75-95% confidence
    
    return {
      timestamp: frameIndex * 1000,
      confidence
    };
  }).sort((a, b) => a.timestamp - b.timestamp); // Sort by timestamp
};

// Generate varied audio analysis
const generateMockAudioClassification = () => {
  const isSynthetic = Math.random() < 0.4; // 40% synthetic
  const score = isSynthetic ? 75 + Math.random() * 20 : 5 + Math.random() * 20;
  
  return [
    {
      label: isSynthetic ? 'synthetic_speech' : 'natural_speech',
      score: score / 100
    },
    {
      label: isSynthetic ? 'natural_speech' : 'synthetic_speech',
      score: 1 - (score / 100)
    }
  ];
};

// Generate audio suspicious segments with realistic patterns
const generateAudioSuspiciousSegments = (audioDuration: number, isManipulated: boolean): any[] => {
  if (!isManipulated) {
    return []; // No suspicious segments for authentic audio
  }
  
  const segmentCount = Math.floor(3 + Math.random() * 4); // 3-6 segments
  const baseConfidence = 75 + Math.random() * 20; // 75-95% confidence for manipulated audio
  
  const suspiciousSegments = Array.from({ length: segmentCount }, (_, i) => {
    const timestamp = Math.floor(Math.random() * audioDuration);
    const duration = 600 + Math.floor(Math.random() * 1500); // 0.6-2.1s duration
    const segmentConfidence = baseConfidence + (Math.random() - 0.5) * 10;
    
    return {
      timestamp,
      duration,
      confidence: Math.max(70, Math.min(98, segmentConfidence)),
      type: ['pitch_shift', 'unnatural_pause', 'rhythm_anomaly', 'voice_inconsistency', 'formant_deviation'][Math.floor(Math.random() * 5)]
    };
  }).sort((a, b) => a.timestamp - b.timestamp); // Sort by timestamp
  
  return suspiciousSegments;
};

const getClassificationCategory = (confidence: number): 'highly_authentic' | 'likely_authentic' | 'possibly_manipulated' | 'highly_manipulated' => {
  if (confidence < 20) return 'highly_authentic';
  if (confidence < 40) return 'likely_authentic';
  if (confidence < 80) return 'possibly_manipulated';
  return 'highly_manipulated';
};

const getRiskLevel = (confidence: number): 'low' | 'medium' | 'high' => {
  if (confidence < 30) return 'low';
  if (confidence < 70) return 'medium';
  return 'high';
};

// Helper to generate realistic looking results based on whether we want 
// a real or fake detection
const generateResult = (mediaType: 'image' | 'video' | 'audio', shouldBeReal: boolean = false): DetectionResult => {
  // Base confidence value (will be high for fakes, low for real)
  const baseConfidence = shouldBeReal ? 15 + Math.random() * 15 : 75 + Math.random() * 20;
  
  const commonAnalysis = {
    faceConsistency: shouldBeReal ? 85 + Math.random() * 10 : 40 + Math.random() * 30,
    lightingConsistency: shouldBeReal ? 80 + Math.random() * 15 : 35 + Math.random() * 35,
    artifactsScore: shouldBeReal ? 10 + Math.random() * 20 : 60 + Math.random() * 30,
  };
  
  // Classification based on confidence
  let classification: 'highly_authentic' | 'likely_authentic' | 'possibly_manipulated' | 'highly_manipulated';
  let riskLevel: 'low' | 'medium' | 'high';
  
  if (baseConfidence < 25) {
    classification = 'highly_authentic';
    riskLevel = 'low';
  } else if (baseConfidence < 50) {
    classification = 'likely_authentic';
    riskLevel = 'low';
  } else if (baseConfidence < 75) {
    classification = 'possibly_manipulated';
    riskLevel = 'medium';
  } else {
    classification = 'highly_manipulated';
    riskLevel = 'high';
  }

  // Create heatmap data - more regions and higher intensity for fakes
  const heatmapRegionsCount = shouldBeReal ? 2 + Math.floor(Math.random() * 3) : 4 + Math.floor(Math.random() * 5);
  const regions = Array.from({ length: heatmapRegionsCount }, () => ({
    x: 20 + Math.random() * 60, // Keep regions within center-ish area
    y: 20 + Math.random() * 60,
    intensity: shouldBeReal ? 0.1 + Math.random() * 0.2 : 0.5 + Math.random() * 0.4,
    radius: 15 + Math.random() * 20
  }));

  const mediaSpecificData: any = {};
  
  // Add specific data for different media types
  if (mediaType === 'video') {
    const duration = 5000 + Math.floor(Math.random() * 10000); // 5-15 seconds
    const frameRate = 30;
    const frameCount = Math.floor(duration / 1000 * frameRate);
    
    // Generate framewise confidence data
    const framewiseConfidence = [];
    const frameInterval = duration / 20; // 20 data points for the graph
    
    for (let i = 0; i < 20; i++) {
      // Add some variation to make it look realistic
      const variation = Math.random() * 15 - 7.5; // +/- 7.5%
      const adjustedConfidence = Math.max(5, Math.min(95, baseConfidence + variation));
      
      framewiseConfidence.push({
        timestamp: i * frameInterval,
        confidence: adjustedConfidence
      });
    }
    
    // Generate suspicious frames - more for fakes, fewer for real
    const suspiciousFramesCount = shouldBeReal ? 1 + Math.floor(Math.random() * 2) : 3 + Math.floor(Math.random() * 4);
    const suspiciousFrames = Array.from({ length: suspiciousFramesCount }, (_, i) => ({
      timestamp: Math.floor(Math.random() * duration),
      confidence: shouldBeReal ? 20 + Math.random() * 30 : 65 + Math.random() * 30
    })).sort((a, b) => a.timestamp - b.timestamp);
    
    mediaSpecificData.framewiseConfidence = framewiseConfidence;
    mediaSpecificData.suspiciousFrames = suspiciousFrames;
    mediaSpecificData.metadata = {
      type: 'video',
      resolution: '1920x1080',
      frameCount,
      duration
    };
  } else if (mediaType === 'audio') {
    const duration = 8000 + Math.floor(Math.random() * 12000); // 8-20 seconds
    
    // Generate framewise confidence data for audio segments
    const framewiseConfidence = [];
    const segmentInterval = duration / 15; // 15 data points for the graph
    
    for (let i = 0; i < 15; i++) {
      // Add some variation to make it look realistic
      const variation = Math.random() * 12 - 6; // +/- 6%
      const adjustedConfidence = Math.max(5, Math.min(95, baseConfidence + variation));
      
      framewiseConfidence.push({
        timestamp: i * segmentInterval,
        confidence: adjustedConfidence
      });
    }
    
    // Generate suspicious segments - more for fakes, fewer for real
    const suspiciousSegmentsCount = shouldBeReal ? 1 + Math.floor(Math.random() * 2) : 3 + Math.floor(Math.random() * 3);
    const suspiciousFrames = Array.from({ length: suspiciousSegmentsCount }, (_, i) => ({
      timestamp: Math.floor(Math.random() * duration),
      confidence: shouldBeReal ? 20 + Math.random() * 30 : 65 + Math.random() * 30
    })).sort((a, b) => a.timestamp - b.timestamp);
    
    mediaSpecificData.framewiseConfidence = framewiseConfidence;
    mediaSpecificData.suspiciousFrames = suspiciousFrames;
    mediaSpecificData.metadata = {
      type: 'audio',
      duration
    };
  } else {
    // Image specific data
    mediaSpecificData.metadata = {
      type: 'image',
      resolution: '2048x1536'
    };
  }
  
  // Return the complete result
  return {
    confidence: baseConfidence,
    isManipulated: !shouldBeReal,
    classification,
    riskLevel,
    analysis: {
      ...commonAnalysis,
      ...mediaSpecificData,
      heatmapData: {
        regions,
        overallIntensity: shouldBeReal ? 0.2 : 0.7
      }
    },
    metadata: mediaSpecificData.metadata || {
      type: mediaType
    }
  };
};

export const analyzeImage = async (imageUrl: string, shouldBeReal: boolean = false): Promise<DetectionResult> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));
  return generateResult('image', shouldBeReal);
};

export const analyzeVideo = async (videoUrl: string, shouldBeReal: boolean = false): Promise<DetectionResult> => {
  // Simulate longer processing time for videos
  await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));
  return generateResult('video', shouldBeReal);
};

export const analyzeAudio = async (audioUrl: string, shouldBeReal: boolean = false): Promise<DetectionResult> => {
  // Simulate processing time for audio
  await new Promise(resolve => setTimeout(resolve, 2500 + Math.random() * 1500));
  return generateResult('audio', shouldBeReal);
};

export const startWebcamAnalysis = async (stream: MediaStream, shouldBeReal: boolean = false): Promise<DetectionResult> => {
  // Simulate processing
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));
  return generateResult('video', shouldBeReal);
};
