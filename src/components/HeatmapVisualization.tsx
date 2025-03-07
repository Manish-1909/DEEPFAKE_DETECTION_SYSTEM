
import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, Search } from 'lucide-react';
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
  mediaType: 'image' | 'video';
  frameInfo?: {
    timestamp: number;
  };
}

const HeatmapVisualization = ({ heatmapData, mediaType, frameInfo }: HeatmapVisualizationProps) => {
  const [hoveredRegion, setHoveredRegion] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  const HEATMAP_COLORS = [
    'rgba(0, 255, 0, 0.1)',   // Lowest intensity (green)
    'rgba(255, 255, 0, 0.5)', // Medium intensity (yellow)
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
  
  return (
    <div className="relative aspect-video max-w-3xl mx-auto rounded-lg overflow-hidden bg-gray-200 border border-gray-300">
      <div 
        className="w-full h-full flex items-center justify-center text-gray-500"
        style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center', transition: 'transform 0.3s ease' }}
      >
        {mediaType === 'image' ? 'Image Analysis' : `Frame at ${(frameInfo?.timestamp || 0) / 1000}s`}
      </div>
      
      {/* Zoom controls */}
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
      
      {/* Render each heatmap region with interactive hover effect */}
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
      
      {/* Highlight info for hovered region */}
      {hoveredRegion !== null && heatmapData.regions[hoveredRegion] && (
        <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs p-2 rounded-md">
          Manipulation probability: {(heatmapData.regions[hoveredRegion].intensity * 100).toFixed(1)}%
        </div>
      )}
      
      {/* Overall heatmap gradient overlay */}
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

export default HeatmapVisualization;
