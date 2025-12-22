import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuiz, useSubmitQuiz } from "@/hooks/use-quiz";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, ArrowLeft, CheckCircle, XCircle, Trophy } from "lucide-react";
import { Link } from "wouter";

export default function QuizPage() {
  const [, params] = useRoute("/quiz/:id");
  const [, navigate] = useLocation();
  const quizId = parseInt(params?.id || "0");
  const { data: quiz, isLoading } = useQuiz(quizId);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<any>(null);
  const submitMutation = useSubmitQuiz();

  const handleSubmit = () => {
    submitMutation.mutate(
      { quizId, answers },
      {
        onSuccess: (result) => {
          setResults(result);
          setSubmitted(true);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!quiz) {
    return (
      <Layout>
        <div className="text-center py-20">Quiz not found</div>
      </Layout>
    );
  }

  if (submitted && results) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Results Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-accent/20 rounded-full mb-4">
              <Trophy className="w-10 h-10 text-accent" />
            </div>
            <h1 className="text-4xl font-bold">Quiz Complete!</h1>
            <div className="text-6xl font-bold text-primary">{results.percentage}%</div>
            <p className="text-lg text-muted-foreground">
              You scored {results.score} out of {results.total}
            </p>
          </div>

          {/* Results Detail */}
          <div className="space-y-4">
            {results.results.map((result: any, idx: number) => (
              <Card key={idx} className="p-6 border-l-4" style={{
                borderLeftColor: result.isCorrect ? '#22c55e' : '#ef4444'
              }}>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {result.isCorrect ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold mb-2">{result.question}</p>
                    <div className="space-y-1 text-sm">
                      <p className={result.isCorrect ? "text-green-600" : "text-gray-600"}>
                        Your answer: <span className="font-semibold">{result.userAnswer}</span>
                      </p>
                      {!result.isCorrect && (
                        <p className="text-blue-600">
                          Correct answer: <span className="font-semibold">{result.correctAnswer}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-center pt-6">
            <Link href="/">
              <Button variant="outline" className="rounded-xl">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <Button 
              onClick={() => navigate("/")}
              className="rounded-xl bg-primary hover:bg-primary/90"
            >
              Try Another Quiz
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-border pb-6">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{quiz.topic}</h1>
            <p className="text-muted-foreground mt-1">
              {quiz.difficulty} Level • {quiz.questions?.length || 0} Questions
            </p>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {quiz.questions?.map((q: any, idx: number) => (
            <Card key={q.id} className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold flex-shrink-0 text-sm">
                  {idx + 1}
                </div>
                <h3 className="text-lg font-semibold flex-1">{q.question}</h3>
              </div>

              <RadioGroup value={answers[q.id] || ""} onValueChange={(val) => setAnswers(prev => ({ ...prev, [q.id]: val }))}>
                <div className="space-y-3 pl-12">
                  {q.options?.map((option: string, optIdx: number) => (
                    <div key={optIdx} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/50 cursor-pointer transition-all">
                      <RadioGroupItem value={option} id={`${q.id}-${optIdx}`} />
                      <label htmlFor={`${q.id}-${optIdx}`} className="flex-1 cursor-pointer">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </Card>
          ))}
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 justify-center pt-6">
          <Link href="/">
            <Button variant="outline" className="rounded-xl">Cancel</Button>
          </Link>
          <Button
            onClick={handleSubmit}
            disabled={Object.keys(answers).length !== (quiz.questions?.length || 0) || submitMutation.isPending}
            className="rounded-xl bg-primary hover:bg-primary/90 px-8"
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              `Submit Quiz (${Object.keys(answers).length}/${quiz.questions?.length || 0} answered)`
            )}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
