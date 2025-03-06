
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Link, FileVideo, FileImage, Headphones } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { toast } from './ui/use-toast';
import { AnalysisType } from './AnalysisOptions';

interface UploadZoneProps {
  analysisType: AnalysisType;
  onFileSelect: (files: File[]) => void;
  onUrlSubmit: (url: string) => void;
  isAnalyzing: boolean;
}

const UploadZone = ({ analysisType, onFileSelect, onUrlSubmit, isAnalyzing }: UploadZoneProps) => {
  const [url, setUrl] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFiles(acceptedFiles);
      onFileSelect(acceptedFiles);
      toast({
        title: 'Files added successfully',
        description: `${acceptedFiles.length} files have been added for analysis.`,
      });
    }
  }, [onFileSelect]);

  const getAcceptConfig = () => {
    if (analysisType.includes('image')) {
      return { 'image/*': ['.jpeg', '.jpg', '.png'] };
    } else if (analysisType.includes('video')) {
      return { 'video/*': ['.mp4', '.webm', '.mov', '.avi'] };
    } else if (analysisType.includes('audio')) {
      return { 'audio/*': ['.mp3', '.wav', '.ogg', '.aac', '.flac'] };
    } else {
      return {};
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: getAcceptConfig(),
    maxFiles: 1,
    disabled: isAnalyzing
  });

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url) {
      onUrlSubmit(url);
      setUrl('');
      toast({
        title: 'URL added successfully',
        description: 'The URL has been added for analysis.',
      });
    }
  };

  const getAcceptedFileTypes = () => {
    if (analysisType.includes('image')) return 'JPG, PNG';
    if (analysisType.includes('video')) return 'MP4, WEBM, MOV, AVI';
    if (analysisType.includes('audio')) return 'MP3, WAV, OGG, AAC, FLAC';
    return '';
  };

  const getFileIcon = () => {
    if (analysisType.includes('image')) return <FileImage className="w-12 h-12 text-primary mx-auto mb-4" />;
    if (analysisType.includes('video')) return <FileVideo className="w-12 h-12 text-primary mx-auto mb-4" />;
    if (analysisType.includes('audio')) return <Headphones className="w-12 h-12 text-primary mx-auto mb-4" />;
    return <Upload className="w-12 h-12 text-primary mx-auto mb-4" />;
  };

  return (
    <div className="space-y-8 w-full max-w-3xl mx-auto p-6">
      {!analysisType.includes('Url') && analysisType !== 'webcam' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div
            {...getRootProps()}
            className={`glassmorphism rounded-xl p-10 text-center cursor-pointer transition-all duration-300 
              ${isDragActive ? 'border-primary border-2' : 'border-dashed border-2 border-gray-300'}
              ${isAnalyzing ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <input {...getInputProps()} />
            <motion.div
              animate={{ scale: isDragActive ? 1.02 : 1 }}
              transition={{ duration: 0.2 }}
            >
              {getFileIcon()}
              <h3 className="text-xl font-semibold mb-2">
                {isDragActive ? 'Drop files here' : `Drop ${analysisType} here`}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                or click to select files
              </p>
              <p className="text-xs text-gray-400">
                Supports {getAcceptedFileTypes()}
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="space-y-4"
      >
        <form onSubmit={handleUrlSubmit} className="flex gap-4">
          <div className="flex-1">
            <Input
              type="url"
              placeholder={`Enter ${analysisType.replace('Url', '')} URL for analysis`}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="input-focus"
              disabled={isAnalyzing || !analysisType.includes('Url')}
            />
          </div>
          <Button 
            type="submit" 
            className="bg-primary hover:bg-primary/90"
            disabled={isAnalyzing || !url || !analysisType.includes('Url')}
          >
            <Link className="w-4 h-4 mr-2" />
            Analyze URL
          </Button>
        </form>
      </motion.div>

      {files.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <h4 className="font-semibold">Files to analyze:</h4>
          {files.map((file, index) => (
            <div
              key={index}
              className="glassmorphism p-4 rounded-lg flex items-center justify-between"
            >
              <span className="text-sm truncate flex-1">{file.name}</span>
              <span className="text-xs text-gray-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default UploadZone;
