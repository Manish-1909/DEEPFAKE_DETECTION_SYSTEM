
import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

const Header = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="py-6 text-center"
    >
      <div className="flex items-center justify-center gap-3 mb-4">
        <AlertTriangle className="h-10 w-10 text-red-500" />
        <h1 className="text-4xl font-bold tracking-tighter">
          <span className="text-primary">DEEP</span> 
          <span className="text-red-500">DETECTIVES</span>
        </h1>
      </div>
      <p className="text-muted-foreground max-w-2xl mx-auto text-center dark:text-gray-400">
        Advanced AI-powered deepfake detection for images, videos, and audio. 
        Protect yourself against synthetic media manipulation with state-of-the-art analysis.
      </p>
    </motion.header>
  );
};

export default Header;
