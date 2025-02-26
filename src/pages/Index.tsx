
import { useState } from "react";
import Header from "@/components/Header";
import UploadZone from "@/components/UploadZone";
import AnalysisDisplay from "@/components/AnalysisDisplay";
import AnalysisOptions, { AnalysisType } from "@/components/AnalysisOptions";
import { motion } from "framer-motion";
import { toast } from "@/components/ui/use-toast";
import { analyzeImage } from "@/services/detectionService";

const Index = () => {
  const [analysisType, setAnalysisType] = useState<AnalysisType | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalysisTypeSelect = (type: AnalysisType) => {
    setAnalysisType(type);
  };

  const handleFileAnalysis = async (files: File[]) => {
    if (files.length === 0) return;
    
    setIsAnalyzing(true);
    try {
      // Convert file to URL for analysis
      const fileUrl = URL.createObjectURL(files[0]);
      await analyzeImage(fileUrl);
      
      toast({
        title: "Analysis complete",
        description: "Your media has been successfully analyzed.",
      });
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: "There was an error analyzing your media.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4">
        <Header />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="max-w-6xl mx-auto space-y-8"
        >
          <AnalysisOptions onSelect={handleAnalysisTypeSelect} />
          {analysisType && (
            <>
              <UploadZone />
              <AnalysisDisplay />
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
