
import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldCheck, Menu } from 'lucide-react';
import { Button } from './ui/button';

const Header = () => {
  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="py-4 mb-8"
    >
      <div className="flex items-center justify-between">
        <motion.div 
          className="flex items-center gap-2"
          whileHover={{ scale: 1.03 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              DeepGuard AI
            </h1>
            <p className="text-xs text-muted-foreground">
              Advanced Deepfake Detection System
            </p>
          </div>
        </motion.div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex gap-2">
            <Button variant="ghost" size="sm" className="text-sm">
              How It Works
            </Button>
            <Button variant="ghost" size="sm" className="text-sm">
              About
            </Button>
            <Button variant="ghost" size="sm" className="text-sm">
              API
            </Button>
          </div>
          <Button variant="outline" size="sm" className="gap-1">
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Verified</span>
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
