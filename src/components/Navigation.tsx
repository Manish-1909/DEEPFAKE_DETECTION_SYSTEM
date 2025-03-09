
import { Home, Info, Shield, Lock, BookOpen } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "./ui/dropdown-menu";
import { Link } from "react-router-dom";

interface NavigationProps {
  className?: string;
}

const Navigation = ({ className }: NavigationProps) => {
  return (
    <nav className={`flex items-center gap-2 ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            Our application serves as a comprehensive tool for detecting manipulated media across various formats including images, videos, and audio.
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Info className="w-4 h-4 mr-2" />
            About
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            Our application leverages advanced AI algorithms to detect deepfakes and manipulated media with high accuracy, providing detailed visualization and analysis reports.
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Shield className="w-4 h-4 mr-2" />
            Verified
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            All analysis results undergo rigorous validation through multiple AI models to ensure accuracy and reliability in detecting manipulated media.
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Lock className="w-4 h-4 mr-2" />
            Secure
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            Your data is protected with industry-standard encryption. We do not store your media files after analysis is complete.
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <BookOpen className="w-4 h-4 mr-2" />
            Documentation
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            Comprehensive documentation explaining our detection methodologies, analysis metrics, and how to interpret the results for different media types.
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
};

export default Navigation;
