
import { Header } from "@/components/Header";
import { UploadZone } from "@/components/UploadZone";
import { AnalysisDisplay } from "@/components/AnalysisDisplay";
import { motion } from "framer-motion";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4">
        <Header />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="max-w-6xl mx-auto"
        >
          <UploadZone />
          <AnalysisDisplay />
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
