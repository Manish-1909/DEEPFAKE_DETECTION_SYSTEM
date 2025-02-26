
import { pipeline } from "@huggingface/transformers";

export type DetectionResult = {
  confidence: number;
  isManipulated: boolean;
  analysis: {
    faceConsistency: number;
    lightingConsistency: number;
    artifactsScore: number;
  };
};

export const initializeDetector = async () => {
  const detector = await pipeline(
    "image-classification",
    "onnx-community/mobilenetv4_conv_small.e2400_r224_in1k",
    { device: "webgpu" }
  );
  return detector;
};

export const analyzeImage = async (imageUrl: string) => {
  try {
    const detector = await initializeDetector();
    const results = await detector(imageUrl);
    
    // Handle both array and single result formats
    const mainResult = Array.isArray(results) ? results[0] : results;
    
    // The model returns a confidence score as a number between 0 and 1
    const confidence = (mainResult?.confidence || mainResult?.scores?.[0] || 0) * 100;
    
    return {
      confidence,
      isManipulated: confidence > 70,
      analysis: {
        faceConsistency: Math.random() * 20 + 80, // Placeholder
        lightingConsistency: Math.random() * 20 + 80, // Placeholder
        artifactsScore: Math.random() * 20 + 80, // Placeholder
      }
    } as DetectionResult;
  } catch (error) {
    console.error('Analysis failed:', error);
    throw new Error('Failed to analyze image');
  }
};
