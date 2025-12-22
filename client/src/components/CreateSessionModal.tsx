import { useState } from "react";
import { useStartSimplification } from "@/hooks/use-simplify";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, BookOpen } from "lucide-react";

export function CreateSessionModal({ children }: { children?: React.ReactNode }) {
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState<"Beginner" | "Intermediate" | "Advanced">("Beginner");
  const [open, setOpen] = useState(false);
  const startSession = useStartSimplification();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    
    startSession.mutate(
      { topic, level },
      {
        onSuccess: () => setOpen(false),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="lg" className="w-full md:w-auto gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all hover:scale-105">
            <Sparkles className="w-4 h-4" />
            Start Learning
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl border-border shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display font-bold text-primary flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-accent" />
            New Explanation
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            What complex topic do you want to master today?
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="topic" className="text-sm font-semibold">Topic</Label>
            <Input
              id="topic"
              placeholder="e.g. Quantum Physics, French Revolution..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="h-12 rounded-xl border-2 focus-visible:ring-offset-0 focus-visible:border-primary transition-all"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="level" className="text-sm font-semibold">Complexity Level</Label>
            <Select value={level} onValueChange={(val: any) => setLevel(val)}>
              <SelectTrigger className="h-12 rounded-xl border-2">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border">
                <SelectItem value="Beginner" className="cursor-pointer">
                  <span className="font-semibold text-green-600">Beginner</span> (Explain like I'm 5)
                </SelectItem>
                <SelectItem value="Intermediate" className="cursor-pointer">
                  <span className="font-semibold text-blue-600">Intermediate</span> (High School)
                </SelectItem>
                <SelectItem value="Advanced" className="cursor-pointer">
                  <span className="font-semibold text-purple-600">Advanced</span> (College/Expert)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 rounded-xl text-lg font-semibold shadow-md"
            disabled={!topic.trim() || startSession.isPending}
          >
            {startSession.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Preparing Lesson...
              </>
            ) : (
              "Simplify It!"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
