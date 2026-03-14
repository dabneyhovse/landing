import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  fetchQuizData,
  startQuiz,
  submitAnswer,
  resetQuiz,
  type QuizAttempt,
  type QuizQuestion,
  type AnswerResult,
} from "@/lib/api/frotator";
import { ArrowLeft } from "lucide-react";
import type { Route } from "./FrotatorApp";

type Phase = "loading" | "landing" | "playing" | "finished" | "already-taken";

interface Props {
  navigate: (route: Route) => void;
  user: {
    sub: string;
    name: string;
    preferred_username: string;
    picture?: string;
  };
}

export default function QuizPage({ navigate, user }: Props) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [leaderboard, setLeaderboard] = useState<QuizAttempt[]>([]);
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [feedback, setFeedback] = useState<AnswerResult | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchQuizData();
      setLeaderboard(data.leaderboard);
      if (data.attempt?.completedAt) {
        setAttempt(data.attempt);
        setPhase("already-taken");
      } else if (data.attempt) {
        setAttempt(data.attempt);
        setQuestion(data.currentQuestion);
        setPhase("playing");
      } else {
        setPhase("landing");
      }
    } catch {
      setError("Failed to load quiz data");
      setPhase("landing");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleStart = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const data = await startQuiz();
      setAttempt(data.attempt);
      setQuestion(data.currentQuestion);
      setLeaderboard(data.leaderboard);
      setPhase("playing");
    } catch (e: any) {
      setError(e.message?.includes("409") ? "You already have an attempt" : "Failed to start quiz");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswer = async (choice: string) => {
    if (submitting || feedback) return;
    setSubmitting(true);
    setError(null);
    setSelectedAnswer(choice);
    try {
      const result = await submitAnswer(choice);
      setFeedback(result);
      setTimeout(() => {
        setAttempt((a) =>
          a
            ? { ...a, score: result.score, currentIndex: result.currentIndex }
            : a,
        );
        if (result.nextQuestion) {
          setQuestion(result.nextQuestion);
          setFeedback(null);
          setSelectedAnswer(null);
        } else {
          setAttempt((a) =>
            a ? { ...a, completedAt: new Date().toISOString() } : a,
          );
          setPhase("finished");
          // Refetch leaderboard
          fetchQuizData().then((d) => setLeaderboard(d.leaderboard)).catch(() => {});
        }
        setSubmitting(false);
      }, 1500);
    } catch {
      setError("Failed to submit answer");
      setSubmitting(false);
    }
  };

  const handleReset = async () => {
    try {
      await resetQuiz();
      setAttempt(null);
      setQuestion(null);
      setFeedback(null);
      setError(null);
      setPhase("landing");
      setLeaderboard([]);
      load();
    } catch {
      setError("Failed to reset quiz");
    }
  };

  const pct = (score: number, total: number) =>
    total > 0 ? Math.round((score / total) * 100) : 0;

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        className="mb-4"
        onClick={() => navigate({ page: "home" })}
      >
        <ArrowLeft className="size-4" /> Back
      </Button>

      <h1 className="mb-4 text-3xl font-heading text-center">Frosh Quiz</h1>

      {error && (
        <p className="mb-4 text-center text-sm text-destructive">{error}</p>
      )}

      {phase === "loading" && (
        <p className="text-center text-muted-foreground">Loading...</p>
      )}

      {phase === "landing" && (
        <Card className="mx-auto max-w-md py-4">
          <CardHeader>
            <CardTitle>Test Your Knowledge</CardTitle>
            <CardDescription>
              You'll be shown a frosh photo and asked to pick the correct name
              from 6 choices. You only get one attempt, so make it count!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleStart} disabled={submitting} className="w-full">
              {submitting ? "Starting..." : "Start Quiz"}
            </Button>
          </CardContent>
        </Card>
      )}

      {phase === "playing" && attempt && question && (
        <div className="mx-auto max-w-md space-y-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Question {attempt.currentIndex + 1} of {attempt.total}
            </span>
            <span>Score: {attempt.score}</span>
          </div>

          <div className="h-2 rounded-full bg-border overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{
                width: `${(attempt.currentIndex / attempt.total) * 100}%`,
              }}
            />
          </div>

          <Card className="py-0 overflow-hidden">
            <div
              className="aspect-square w-full bg-cover bg-center bg-muted"
              style={{ backgroundImage: `url(${question.image})` }}
            />
            <CardContent className="py-4">
              <p className="mb-3 text-sm font-medium text-center">
                Who is this?
              </p>
              <div className="grid grid-cols-2 gap-2">
                {question.choices.map((choice, idx) => {
                  const isCorrect = feedback && choice === feedback.correctAnswer;
                  const isWrongPick =
                    feedback && !feedback.correct && choice === selectedAnswer;
                  return (
                    <Button
                      key={`${idx}-${choice}`}
                      variant="outline"
                      size="sm"
                      disabled={!!feedback}
                      className={
                        isCorrect
                          ? "bg-green-600 hover:bg-green-600 text-white border-green-600"
                          : isWrongPick
                            ? "bg-destructive hover:bg-destructive text-destructive-foreground border-destructive"
                            : ""
                      }
                      onClick={() => handleAnswer(choice)}
                    >
                      <span className="truncate">{choice}</span>
                    </Button>
                  );
                })}
              </div>
              {feedback && (
                <p
                  className={`mt-3 text-center text-sm font-medium ${feedback.correct ? "text-green-600" : "text-destructive"}`}
                >
                  {feedback.correct
                    ? "Correct!"
                    : `Wrong — it's ${feedback.correctAnswer}`}
                </p>
              )}
            </CardContent>
          </Card>
          <Button variant="outline" size="sm" className="w-full" onClick={handleReset}>
            Reset (dev only)
          </Button>
        </div>
      )}

      {phase === "finished" && attempt && (
        <div className="mx-auto max-w-md space-y-4">
          <Card className="py-4">
            <CardHeader>
              <CardTitle className="text-center">Quiz Complete!</CardTitle>
              <CardDescription className="text-center text-lg">
                You scored{" "}
                <span className="font-bold text-foreground">
                  {attempt.score}/{attempt.total}
                </span>{" "}
                ({pct(attempt.score, attempt.total)}%)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="w-full" onClick={handleReset}>
                Reset (dev only)
              </Button>
            </CardContent>
          </Card>
          <Leaderboard entries={leaderboard} currentUserId={user.sub} />
        </div>
      )}

      {phase === "already-taken" && attempt && (
        <div className="mx-auto max-w-md space-y-4">
          <Card className="py-4">
            <CardHeader>
              <CardTitle className="text-center">Already Taken</CardTitle>
              <CardDescription className="text-center text-lg">
                Your score:{" "}
                <span className="font-bold text-foreground">
                  {attempt.score}/{attempt.total}
                </span>{" "}
                ({pct(attempt.score, attempt.total)}%)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="w-full" onClick={handleReset}>
                Reset (dev only)
              </Button>
            </CardContent>
          </Card>
          <Leaderboard entries={leaderboard} currentUserId={user.sub} />
        </div>
      )}

      {phase === "landing" && (
        <div className="mx-auto mt-4 max-w-md">
          <Leaderboard entries={leaderboard} currentUserId={user.sub} />
        </div>
      )}
    </div>
  );
}

function Leaderboard({
  entries,
  currentUserId,
}: {
  entries: QuizAttempt[];
  currentUserId: string;
}) {
  return (
    <Card className="py-4">
      <CardHeader>
        <CardTitle className="text-lg">Leaderboard</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 && (
          <p className="text-sm text-muted-foreground text-center">No scores yet. Be the first!</p>
        )}
        <div className="space-y-2">
          {entries.map((entry, idx) => (
            <div
              key={entry.id}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                entry.userId === currentUserId
                  ? "bg-primary/10 font-medium"
                  : ""
              }`}
            >
              <span className="w-6 text-center font-heading text-muted-foreground">
                {idx + 1}
              </span>
              <Avatar className="size-6">
                <AvatarImage src={entry.userPicture || undefined} />
                <AvatarFallback>
                  {entry.userName?.[0]?.toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
              <span className="flex-1 truncate">{entry.userName}</span>
              <span className="text-muted-foreground">
                {entry.score}/{entry.total} (
                {entry.total > 0
                  ? Math.round((entry.score / entry.total) * 100)
                  : 0}
                %)
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
