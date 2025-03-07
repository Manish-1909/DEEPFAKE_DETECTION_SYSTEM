
import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from './ui/badge';

interface ConfidenceMeterProps {
  confidence: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const ConfidenceMeter = ({ confidence, showLabel = true, size = 'md' }: ConfidenceMeterProps) => {
  const getConfidenceLevel = (score: number) => {
    if (score >= 90) return { label: 'High Confidence', className: 'bg-red-50 text-red-700' };
    if (score >= 60) return { label: 'Medium Confidence', className: 'bg-yellow-50 text-yellow-700' };
    return { label: 'Low Confidence', className: 'bg-green-50 text-green-700' };
  };

  const confidenceLevel = getConfidenceLevel(confidence);
  
  const getGradient = () => {
    if (confidence < 30) return 'bg-gradient-to-r from-green-300 to-green-500';
    if (confidence < 70) return 'bg-gradient-to-r from-yellow-300 to-yellow-500';
    return 'bg-gradient-to-r from-red-300 to-red-500';
  };
  
  const getHeight = () => {
    switch (size) {
      case 'sm': return 'h-2';
      case 'lg': return 'h-4';
      default: return 'h-3';
    }
  };
  
  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="flex items-center justify-between mb-1">
          <span className={size === 'lg' ? "text-3xl font-semibold" : "text-xl font-medium"}>
            {confidence.toFixed(1)}%
          </span>
          <Badge variant="outline" className={confidenceLevel.className}>
            {confidenceLevel.label}
          </Badge>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${getHeight()}`}>
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

export default ConfidenceMeter;
