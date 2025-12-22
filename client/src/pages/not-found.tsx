import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-md mx-auto">
        <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-12 h-12 text-destructive" />
        </div>
        
        <h1 className="text-4xl font-display font-bold text-foreground">404</h1>
        <h2 className="text-xl font-medium text-muted-foreground">Page not found</h2>
        
        <p className="text-muted-foreground">
          The learning path you're looking for doesn't exist or has been moved.
        </p>
        
        <Link href="/">
          <Button size="lg" className="w-full mt-4 rounded-xl">
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
