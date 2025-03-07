
import { useState } from 'react';
import { Camera, Image, Video, Link2, Video as VideoIcon, Headphones, Music } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { toast } from './ui/use-toast';

export type AnalysisType = 'image' | 'video' | 'webcam' | 'imageUrl' | 'videoUrl' | 'audio' | 'audioUrl';

interface AnalysisOptionsProps {
  onSelect: (type: AnalysisType) => void;
}

const AnalysisOptions = ({ onSelect }: AnalysisOptionsProps) => {
  const [selected, setSelected] = useState<AnalysisType | null>(null);

  const handleSelect = (type: AnalysisType) => {
    setSelected(type);
    onSelect(type);
    toast({
      title: 'Mode selected',
      description: `Switched to ${type} analysis mode`,
    });
  };

  const options = [
    { type: 'image' as AnalysisType, icon: Image, label: 'Process image file' },
    { type: 'video' as AnalysisType, icon: VideoIcon, label: 'Process video file' },
    { type: 'audio' as AnalysisType, icon: Headphones, label: 'Process audio file' },
    { type: 'webcam' as AnalysisType, icon: Camera, label: 'Capture live webcam' },
    { type: 'imageUrl' as AnalysisType, icon: Link2, label: 'Analyze image URL' },
    { type: 'videoUrl' as AnalysisType, icon: Video, label: 'Analyze video URL' },
    { type: 'audioUrl' as AnalysisType, icon: Music, label: 'Analyze audio URL' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <div className="text-center space-y-3">
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent"
        >
          AI BASED DEEPFAKE DETECTION SYSTEM
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-muted-foreground max-w-2xl mx-auto"
        >
          Protect yourself from disinformation with our advanced AI-powered deepfake detection. 
          Upload or link to media files to verify their authenticity with confidence.
        </motion.p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {options.map(({ type, icon: Icon, label }) => (
          <motion.div
            key={type}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 * options.findIndex(opt => opt.type === type) }}
          >
            <Button
              variant={selected === type ? "default" : "outline"}
              className={`w-full h-full p-6 flex flex-col items-center gap-4 ${
                selected === type ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-muted/50'
              }`}
              onClick={() => handleSelect(type)}
            >
              <Icon className={`w-8 h-8 ${selected === type ? 'text-primary-foreground' : 'text-primary'}`} />
              <span className="text-sm text-center">{label}</span>
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AnalysisOptions;
