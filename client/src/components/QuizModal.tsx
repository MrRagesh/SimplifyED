import { useState } from "react";
import { useCreateQuiz } from "@/hooks/use-quiz";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface QuizModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQuizCreated?: (quizId: number) => void;
  topic?: string;
}

export function QuizModal({ open, onOpenChange, onQuizCreated, topic: defaultTopic }: QuizModalProps) {
  const [topic, setTopic] = useState(defaultTopic || "");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const createMutation = useCreateQuiz();

  const handleCreate = async () => {
    if (!topic || !difficulty) return;
    
    createMutation.mutate(
      { topic, difficulty },
      {
        onSuccess: (quiz) => {
          onOpenChange(false);
          onQuizCreated?.(quiz.id);
          setTopic("");
          setDifficulty("Intermediate");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Generate Quiz</DialogTitle>
          <DialogDescription>Test your knowledge with an AI-generated quiz</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <label className="text-sm font-semibold mb-2 block">Topic</label>
            <Input
              placeholder="Enter topic to quiz on..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="rounded-xl h-11"
            />
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Difficulty Level</label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="rounded-xl h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!topic || createMutation.isPending}
              className="rounded-xl"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Quiz"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
