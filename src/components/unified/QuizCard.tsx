"use client";

import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface QuizData {
  id?: string;
  topic?: string;
  questions: QuizQuestion[];
}

interface QuizCardProps {
  quiz: QuizData;
  onSubmit?: (quizId: string, answers: { questionIndex: number; answer: number }[], questions: QuizQuestion[]) => void;
}

export function QuizCard({ quiz, onSubmit }: QuizCardProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(quiz.questions.length).fill(null));
  const [submitted, setSubmitted] = useState(false);

  const question = quiz.questions[currentQ];
  const isAnswered = answers[currentQ] !== null;

  const handleSelect = (optionIdx: number) => {
    if (submitted) return;
    const newAnswers = [...answers];
    newAnswers[currentQ] = optionIdx;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    if (onSubmit && quiz.id) {
      onSubmit(quiz.id, answers.map((a, i) => ({ questionIndex: i, answer: a ?? -1 })), quiz.questions);
    }
  };

  const score = submitted
    ? answers.filter((a, i) => a === quiz.questions[i].correctAnswer).length
    : 0;

  if (submitted) {
    return (
      <div className="bg-[var(--bg-surface)] rounded-xl p-5 border border-[var(--border-color)] mt-2">
        <div className="text-center mb-4">
          <p className="text-2xl font-bold text-[var(--accent)]">{score}/{quiz.questions.length}</p>
          <p className="text-sm text-[var(--text-secondary)]">
            {score === quiz.questions.length ? "Perfect score!" : score >= quiz.questions.length * 0.7 ? "Good job!" : "Keep practicing!"}
          </p>
        </div>
        <div className="space-y-3">
          {quiz.questions.map((q, i) => (
            <div key={i} className="flex items-start gap-2">
              {answers[i] === q.correctAnswer
                ? <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                : <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              }
              <p className="text-xs text-[var(--text-secondary)]">{q.question}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-surface)] rounded-xl p-5 border border-[var(--border-color)] mt-2">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-[var(--text-muted)]">Question {currentQ + 1}/{quiz.questions.length}</span>
        {quiz.topic && <span className="text-xs text-[var(--accent)] bg-[var(--accent-muted)] px-2 py-0.5 rounded-full">{quiz.topic}</span>}
      </div>

      <p className="text-sm font-medium text-[var(--text-primary)] mb-4">{question.question}</p>

      <div className="space-y-2">
        {question.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors border ${
              answers[currentQ] === i
                ? "border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--text-primary)]"
                : "border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
            }`}
          >
            <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
            {opt}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
          disabled={currentQ === 0}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] disabled:opacity-30"
        >
          Previous
        </button>

        {currentQ < quiz.questions.length - 1 ? (
          <button
            onClick={() => setCurrentQ(currentQ + 1)}
            disabled={!isAnswered}
            className="px-4 py-1.5 text-xs rounded-lg bg-[var(--accent)] text-white disabled:opacity-30"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={answers.some(a => a === null)}
            className="px-4 py-1.5 text-xs rounded-lg bg-[var(--accent)] text-white disabled:opacity-30"
          >
            Submit Quiz
          </button>
        )}
      </div>
    </div>
  );
}
