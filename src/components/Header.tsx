
import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Shield } from 'lucide-react';

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
        <Shield className="h-9 w-9 text-blue-500" />
      </div>
      <h2 className="text-2xl font-semibold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500">
        ML-based Deepfake Detection System with Multiple Features
      </h2>
      <p className="text-muted-foreground max-w-2xl mx-auto text-center dark:text-gray-400">
        Advanced AI-powered deepfake detection for images, videos, and audio. 
        Protect yourself against synthetic media manipulation with state-of-the-art analysis and enhanced data security and privacy.
      </p>
    </motion.header>
  );
};

export default Header;
