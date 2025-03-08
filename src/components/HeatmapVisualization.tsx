
import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, Search, Download } from 'lucide-react';
import { Button } from './ui/button';

interface HeatmapRegion {
  x: number;
  y: number;
  intensity: number;
  radius: number;
}

interface HeatmapData {
  regions: HeatmapRegion[];
  overallIntensity: number;
}

interface HeatmapVisualizationProps {
  heatmapData: HeatmapData;
  mediaType: 'image' | 'video' | 'audio';
  frameInfo?: {
    timestamp: number;
  };
  gradCamUrl?: string | null;
  frameImageUrl?: string | null;
  isDeepfake?: boolean;
}

const HeatmapVisualization = ({ 
  heatmapData, 
  mediaType, 
  frameInfo, 
  gradCamUrl,
  frameImageUrl,
  isDeepfake = true
}: HeatmapVisualizationProps) => {
  const [hoveredRegion, setHoveredRegion] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showGradCam, setShowGradCam] = useState(true);
  
  // Treat audio as image for visualization purposes
  const visualizableMediaType = mediaType === 'audio' ? 'image' : mediaType;
  
  const HEATMAP_COLORS = [
    'rgba(0, 255, 0, 0.2)',   // Lowest intensity (green)
    'rgba(255, 255, 0, 0.6)', // Medium intensity (yellow)
    'rgba(255, 0, 0, 0.8)'    // Highest intensity (red)
  ];
  
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.5, 1));
  };

  const handleRegionHover = useCallback((index: number | null) => {
    setHoveredRegion(index);
  }, []);
  
  const getIntensityColor = (intensity: number) => {
    if (intensity < 0.3) return HEATMAP_COLORS[0];
    if (intensity < 0.7) return HEATMAP_COLORS[1];
    return HEATMAP_COLORS[2];
  };
  
  const toggleGradCam = () => {
    setShowGradCam(!showGradCam);
  };
  
  // Determine which image to display
  const displayImageUrl = showGradCam ? gradCamUrl : frameImageUrl || gradCamUrl;
  
  // For reporting accuracy ranges based on confidence
  const getConfidenceRange = (intensity: number) => {
    if (intensity > 0.85) return "Very High";
    if (intensity > 0.7) return "High";
    if (intensity > 0.5) return "Moderate";
    if (intensity > 0.3) return "Low";
    return "Very Low";
  };
  
  console.log("HeatmapVisualization rendering with:", {
    mediaType,
    visualizableMediaType,
    hasGradCam: !!gradCamUrl,
    hasFrameImage: !!frameImageUrl,
    showingGradCam: showGradCam,
    isDeepfake
  });
  
  return (
    <div className="relative aspect-video max-w-3xl mx-auto rounded-lg overflow-hidden bg-gray-200 border border-gray-300 dark:bg-gray-800 dark:border-gray-700">
      {/* Classification Banner */}
      <div className={`absolute top-0 left-0 right-0 z-10 py-1 text-center text-white text-sm font-semibold ${isDeepfake ? 'bg-red-500' : 'bg-green-500'}`}>
        {isDeepfake ? 'DEEPFAKE DETECTED' : 'AUTHENTIC CONTENT'}
      </div>
      
      {/* GradCAM View or Frame Image */}
      {displayImageUrl ? (
        <div 
          className="w-full h-full"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center', transition: 'transform 0.3s ease' }}
        >
          <img 
            src={displayImageUrl} 
            alt={showGradCam ? "Grad-CAM visualization" : "Frame image"} 
            className="w-full h-full object-contain"
          />
        </div>
      ) : (
        <div 
          className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center', transition: 'transform 0.3s ease' }}
        >
          {visualizableMediaType === 'image' ? 'Image Analysis' : `Frame at ${(frameInfo?.timestamp || 0) / 1000}s`}
        </div>
      )}
      
      {/* Zoom and visualization controls */}
      <div className="absolute top-10 right-2 flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleZoomIn} 
          className="bg-white/80 hover:bg-white dark:bg-black/50 dark:hover:bg-black/70"
          disabled={zoomLevel >= 3}
        >
          <ZoomIn size={16} />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleZoomOut}
          className="bg-white/80 hover:bg-white dark:bg-black/50 dark:hover:bg-black/70"
          disabled={zoomLevel <= 1}
        >
          <Search size={16} />
        </Button>
        {gradCamUrl && frameImageUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={toggleGradCam}
            className="bg-white/80 hover:bg-white text-xs dark:bg-black/50 dark:hover:bg-black/70"
          >
            {showGradCam ? "Show Frame" : "Show Grad-CAM"}
          </Button>
        )}
      </div>
      
      {/* Render each heatmap region with interactive hover effect */}
      {!showGradCam && heatmapData.regions.map((region, index) => (
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
      
      {/* Highlight info for hovered region */}
      {hoveredRegion !== null && heatmapData.regions[hoveredRegion] && (
        <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs p-2 rounded-md">
          <div>Manipulation probability: {(heatmapData.regions[hoveredRegion].intensity * 100).toFixed(1)}%</div>
          <div>Confidence: {getConfidenceRange(heatmapData.regions[hoveredRegion].intensity)}</div>
        </div>
      )}
      
      {/* Overall heatmap gradient overlay */}
      {!showGradCam && (
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
      )}
      
      {/* Explanation */}
      {gradCamUrl && showGradCam && (
        <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs p-2 rounded-md max-w-xs">
          {visualizableMediaType === 'video' && frameInfo ? (
            <>Frame at {(frameInfo.timestamp / 1000).toFixed(1)}s: Grad-CAM highlights potential manipulation.</>
          ) : (
            <>Grad-CAM highlights regions that most influenced the model's decision with warmer colors showing manipulated areas.</>
          )}
        </div>
      )}
      {frameImageUrl && !showGradCam && (
        <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs p-2 rounded-md max-w-xs">
          Actual frame from video with highlighted suspicious regions.
        </div>
      )}
    </div>
  );
};

export default HeatmapVisualization;
