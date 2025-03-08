
import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Database, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from './ui/use-toast';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

// Define the type for our stored analysis entries
export interface AnalysisEntry {
  id: string;
  timestamp: string;
  mediaType: string;
  confidence: number;
  isManipulated: boolean;
  classification: string;
}

interface ExcelDataExportProps {
  latestEntry?: AnalysisEntry;
}

const ExcelDataExport = ({ latestEntry }: ExcelDataExportProps) => {
  const [entries, setEntries] = useState<AnalysisEntry[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Load entries from localStorage on component mount
  useEffect(() => {
    const storedEntries = localStorage.getItem('analysisEntries');
    if (storedEntries) {
      setEntries(JSON.parse(storedEntries));
    }
  }, []);
  
  // Update entries when a new analysis is completed
  useEffect(() => {
    if (latestEntry) {
      const updatedEntries = [...entries, latestEntry];
      setEntries(updatedEntries);
      localStorage.setItem('analysisEntries', JSON.stringify(updatedEntries));
      
      toast({
        title: "Analysis logged",
        description: "Results have been saved to your secure local data store.",
      });
    }
  }, [latestEntry]);
  
  const downloadExcel = () => {
    // Create CSV content
    const headers = ["ID", "Timestamp", "Media Type", "Confidence", "Manipulated", "Classification"];
    const csvContent = [
      headers.join(','),
      ...entries.map(entry => [
        entry.id,
        entry.timestamp,
        entry.mediaType,
        entry.confidence,
        entry.isManipulated ? 'Yes' : 'No',
        entry.classification
      ].join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `deepfake_analysis_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Excel export complete",
      description: "Your analysis data has been exported successfully.",
    });
  };
  
  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/5 backdrop-blur-sm border rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-medium">Data Security & Privacy</h3>
            <p className="text-sm text-muted-foreground">
              {entries.length} analysis records stored locally
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={() => setIsDialogOpen(true)}
          >
            <CheckCircle2 className="w-4 h-4" />
            View Data
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            className="gap-2"
            onClick={downloadExcel}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export to Excel
          </Button>
        </div>
      </motion.div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Secure Analysis Records</DialogTitle>
            <DialogDescription>
              All data is stored locally on your device for maximum privacy.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Media Type</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Classification</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length > 0 ? (
                  entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{new Date(entry.timestamp).toLocaleString()}</TableCell>
                      <TableCell className="capitalize">{entry.mediaType}</TableCell>
                      <TableCell>{entry.confidence.toFixed(1)}%</TableCell>
                      <TableCell>
                        <span className={entry.isManipulated ? 'text-red-500' : 'text-green-500'}>
                          {entry.isManipulated ? 'Manipulated' : 'Authentic'}
                        </span>
                      </TableCell>
                      <TableCell>{entry.classification.replace(/_/g, ' ')}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No records found. Complete your first analysis to begin tracking.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          <DialogFooter>
            <Button 
              variant="default" 
              onClick={downloadExcel} 
              className="gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export to Excel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ExcelDataExport;
