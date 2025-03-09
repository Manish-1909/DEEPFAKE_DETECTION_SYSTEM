
import React from 'react';
import { Copyright as CopyrightIcon } from 'lucide-react';

const Copyright = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-1">
      <CopyrightIcon className="w-3 h-3" />
      <span>{currentYear} Deepfake Detector. All rights reserved.</span>
    </div>
  );
};

export default Copyright;
