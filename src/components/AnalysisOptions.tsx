
import { useState } from 'react';
import { Camera, Image, Video, Link2, Video as VideoIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { toast } from './ui/use-toast';

export type AnalysisType = 'image' | 'video' | 'webcam' | 'imageUrl' | 'videoUrl';

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
    { type: 'image' as AnalysisType, icon: Image, label: 'Process online image' },
    { type: 'video' as AnalysisType, icon: VideoIcon, label: 'Process online video' },
    { type: 'webcam' as AnalysisType, icon: Camera, label: 'Capture live webcam' },
    { type: 'imageUrl' as AnalysisType, icon: Link2, label: 'Analyze image URL' },
    { type: 'videoUrl' as AnalysisType, icon: Video, label: 'Analyze video URL' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-8">Deepfake Detection System</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {options.map(({ type, icon: Icon, label }) => (
          <motion.div
            key={type}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant={selected === type ? "default" : "outline"}
              className="w-full h-full p-6 flex flex-col items-center gap-4"
              onClick={() => handleSelect(type)}
            >
              <Icon className="w-8 h-8" />
              <span className="text-sm text-center">{label}</span>
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AnalysisOptions;
