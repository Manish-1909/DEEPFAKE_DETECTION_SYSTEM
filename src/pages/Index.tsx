
import { useState } from "react";
import Header from "@/components/Header";
import UploadZone from "@/components/UploadZone";
import AnalysisDisplay from "@/components/AnalysisDisplay";
import AnalysisOptions, { AnalysisType } from "@/components/AnalysisOptions";
import { motion } from "framer-motion";
import { toast } from "@/components/ui/use-toast";
import { DetectionResult, analyzeImage } from "@/services/detectionService";

const Index = () => {
  const [analysisType, setAnalysisType] = useState<AnalysisType | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<DetectionResult | null>(null);

  const handleAnalysisTypeSelect = (type: AnalysisType) => {
    setAnalysisType(type);
    setResults(null); // Reset results when switching modes
    toast({
      title: "Mode changed",
      description: `Switched to ${type} mode`,
    });
  };

  const handleFileAnalysis = async (files: File[]) => {
    if (files.length === 0) return;
    
    setIsAnalyzing(true);
    try {
      // Convert file to URL for analysis
      const fileUrl = URL.createObjectURL(files[0]);
      const analysisResults = await analyzeImage(fileUrl);
      setResults(analysisResults);
      
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
      setResults(null);
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
              <UploadZone 
                analysisType={analysisType} 
                onFileSelect={handleFileAnalysis}
                isAnalyzing={isAnalyzing}
              />
              {results && <AnalysisDisplay results={results} />}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
