
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldCheck, Menu, Info, FileText, Code, HelpCircle } from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Header = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAboutDialogOpen, setIsAboutDialogOpen] = useState(false);

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
              AI BASED DEEPFAKE DETECTION SYSTEM
            </h1>
            <p className="text-xs text-muted-foreground">
              WITH MULTIPLE FEATURES
            </p>
          </div>
        </motion.div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-sm flex items-center gap-1">
                  <Info className="w-4 h-4" />
                  How It Works
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>How DEEP DETECTIVES Works</DialogTitle>
                  <DialogDescription>
                    Learn how our deepfake detection system operates
                  </DialogDescription>
                </DialogHeader>
                
                <Tabs defaultValue="process">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="process">Detection Process</TabsTrigger>
                    <TabsTrigger value="api">API Access</TabsTrigger>
                    <TabsTrigger value="verification">Verification System</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="process" className="space-y-4 mt-4">
                    <div className="rounded-lg overflow-hidden border">
                      <div className="bg-primary/10 p-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Info className="w-5 h-5 text-primary" />
                          Detection Process
                        </h3>
                      </div>
                      <div className="p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2">For Videos:</h4>
                            <ul className="list-disc pl-5 space-y-2 text-sm">
                              <li>Frame-by-frame analysis to detect inconsistencies</li>
                              <li>Temporal coherence evaluation across video sequences</li>
                              <li>Facial landmark tracking for unnatural movements</li>
                              <li>Detection of compression artifacts specific to deepfakes</li>
                              <li>Audio-visual synchronization assessment</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">For Audio:</h4>
                            <ul className="list-disc pl-5 space-y-2 text-sm">
                              <li>Spectral analysis to identify synthetic patterns</li>
                              <li>Voice continuity and natural speech pattern verification</li>
                              <li>Identification of AI voice generation artifacts</li>
                              <li>Background noise consistency analysis</li>
                              <li>Detection of unnatural transitions or cuts</li>
                            </ul>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <h4 className="font-medium mb-2">Our Advanced Systems:</h4>
                          <p className="text-sm">
                            DEEP DETECTIVES uses state-of-the-art neural networks trained on massive datasets of 
                            both authentic and manipulated media. The system performs multi-layered analysis:
                          </p>
                          <ol className="list-decimal pl-5 space-y-1 mt-2 text-sm">
                            <li>Media preprocessing and enhancement</li>
                            <li>Feature extraction for key indicators</li>
                            <li>Multiple specialized detection models evaluation</li>
                            <li>Ensemble decision making for higher accuracy</li>
                            <li>Confidence scoring with explainable results</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="api" className="space-y-4 mt-4">
                    <div className="rounded-lg overflow-hidden border">
                      <div className="bg-primary/10 p-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Code className="w-5 h-5 text-primary" />
                          API Access
                        </h3>
                      </div>
                      <div className="p-4 space-y-4">
                        <p className="text-sm">
                          Our deepfake detection API provides developers with programmatic access to our
                          advanced detection capabilities. Integrate our technology into your own applications,
                          platforms, or content moderation systems.
                        </p>
                        
                        <div className="bg-muted p-3 rounded-md">
                          <h4 className="font-medium text-sm mb-2">Example API Request:</h4>
                          <pre className="text-xs overflow-x-auto">
{`POST /api/analyze
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{
  "mediaUrl": "https://example.com/media/video.mp4",
  "mediaType": "video",
  "analysisMode": "comprehensive"
}`}
                          </pre>
                        </div>
                        
                        <h4 className="font-medium text-sm mt-4">API Features:</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li>RESTful endpoints for all media types</li>
                          <li>Webhook support for asynchronous processing</li>
                          <li>Detailed JSON response with confidence scores</li>
                          <li>Batch processing capabilities</li>
                          <li>Customizable analysis parameters</li>
                          <li>Enterprise-grade security and rate limiting</li>
                        </ul>
                        
                        <div className="mt-4 flex items-center justify-between border-t pt-3">
                          <span className="text-sm font-medium">Ready to integrate?</span>
                          <Button size="sm" className="gap-1">
                            <FileText className="w-4 h-4" />
                            API Documentation
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="verification" className="space-y-4 mt-4">
                    <div className="rounded-lg overflow-hidden border">
                      <div className="bg-primary/10 p-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-primary" />
                          Verification System
                        </h3>
                      </div>
                      <div className="p-4 space-y-4">
                        <p className="text-sm">
                          Our "Verified" badge indicates content that has passed our rigorous 
                          deepfake detection process with high confidence. When you see this badge, 
                          you can trust that the content has been analyzed and found to be authentic.
                        </p>
                        
                        <div className="bg-green-50 border border-green-100 rounded-lg p-3 flex items-start gap-3">
                          <ShieldCheck className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                          <div>
                            <h4 className="font-medium text-green-800">What "Verified" Means:</h4>
                            <ul className="list-disc pl-5 space-y-1 mt-1 text-sm text-green-700">
                              <li>Content has been analyzed by DEEP DETECTIVES</li>
                              <li>No significant manipulation indicators were found</li>
                              <li>Authenticity confidence score exceeds 95%</li>
                              <li>All security checks have been passed</li>
                            </ul>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <h4 className="font-medium mb-2">Verification Process:</h4>
                          <ol className="list-decimal pl-5 space-y-1 text-sm">
                            <li>Media is submitted through our platform or API</li>
                            <li>Our detection system performs comprehensive analysis</li>
                            <li>Results undergo secondary verification checks</li>
                            <li>If authentic, content receives the "Verified" badge</li>
                            <li>Verification status can be publicly validated via our API</li>
                          </ol>
                        </div>
                        
                        <div className="flex items-center justify-between border-t pt-3 mt-4">
                          <span className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                            <span className="text-sm font-medium">Trust & Transparency</span>
                          </span>
                          <p className="text-xs text-muted-foreground">
                            Verification results available for 90 days
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isAboutDialogOpen} onOpenChange={setIsAboutDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-sm">
                  About
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>About This Application</DialogTitle>
                  <DialogDescription>
                    Learn more about our AI-powered deepfake detection system
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <p className="text-sm">
                    This advanced AI-based deepfake detection system provides comprehensive analysis of various media types
                    to help identify potential digital manipulations. Our system uses state-of-the-art machine learning
                    algorithms trained on thousands of real and fake examples to deliver high-accuracy results.
                  </p>
                  
                  <div className="rounded-lg overflow-hidden border">
                    <div className="bg-primary/10 p-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <HelpCircle className="w-5 h-5 text-primary" />
                        Key Features
                      </h3>
                    </div>
                    <div className="p-4 space-y-3">
                      <ul className="list-disc pl-5 space-y-2 text-sm">
                        <li><strong>Multi-media Support:</strong> Analyze images, videos, audio files, and URLs</li>
                        <li><strong>Real-time Analysis:</strong> Process media directly from your webcam</li>
                        <li><strong>Detailed Reporting:</strong> Generate comprehensive PDF reports with visual evidence</li>
                        <li><strong>Advanced Visualization:</strong> View heatmaps of manipulated regions</li>
                        <li><strong>High Accuracy:</strong> Benefit from our continuously improved detection models</li>
                        <li><strong>Transparent Results:</strong> Understand why content is flagged as manipulated</li>
                      </ul>
                    </div>
                  </div>
                  
                  <p className="text-sm">
                    Developed to combat the growing problem of deepfakes, this tool helps journalists, content moderators,
                    individuals, and organizations verify the authenticity of digital content in an era where AI-generated
                    media is becoming increasingly sophisticated and prevalent.
                  </p>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button variant="ghost" size="sm" className="text-sm">
              API
            </Button>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <ShieldCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Verified</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Verified Content System</DialogTitle>
                <DialogDescription>
                  Our verification system helps you identify authentic content
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <ShieldCheck className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-green-800">The Verified Badge</h4>
                    <p className="text-sm text-green-700 mt-1">
                      When content displays our "Verified" badge, it has passed our rigorous
                      analysis and has been determined to be authentic with high confidence.
                      Look for this badge when evaluating media trustworthiness.
                    </p>
                  </div>
                </div>
                <p className="text-sm">
                  Our verification process uses advanced AI technology to analyze content
                  for signs of manipulation. Verified content has been found to have no
                  significant indicators of deepfake technology.
                </p>
                <Button className="w-full">Learn More About Verification</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
