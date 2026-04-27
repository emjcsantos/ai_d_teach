import { useEffect, useMemo, useState } from "react";
import type { Lesson, LessonProgress, QuizQuestion } from "../types/lesson";

export type QuizPanelProps = {
  lesson: Lesson;
  progress: LessonProgress;
  onAnswer: (questionId: string, selected: string, correct: boolean) => void;
  onComplete: () => void;
};

type QuizFeedback = {
  selected: string;
  correct: boolean;
};

function buildLatestAttempts(progress: LessonProgress) {
  return progress.quizAttempts.reduce<Record<string, QuizFeedback>>((attempts, attempt) => {
    attempts[attempt.questionId] = {
      selected: attempt.selected,
      correct: attempt.correct,
    };
    return attempts;
  }, {});
}

function getChoiceClass(feedback: QuizFeedback | undefined, choice: string) {
  if (!feedback || feedback.selected !== choice) {
    return "quiz-panel__choice";
  }

  return feedback.correct ? "quiz-panel__choice is-correct" : "quiz-panel__choice is-incorrect";
}

export function QuizPanel({ lesson, progress, onAnswer, onComplete }: QuizPanelProps) {
  const [localFeedback, setLocalFeedback] = useState<Record<string, QuizFeedback>>({});

  useEffect(() => {
    setLocalFeedback({});
  }, [lesson.id, progress.lessonId]);

  const savedFeedback = useMemo(
    () => (progress.lessonId === lesson.id ? buildLatestAttempts(progress) : {}),
    [lesson.id, progress],
  );
  const feedbackByQuestionId = { ...savedFeedback, ...localFeedback };
  const answeredCount = lesson.quiz.filter((question) => feedbackByQuestionId[question.id]).length;
  const correctCount = lesson.quiz.filter(
    (question) => feedbackByQuestionId[question.id]?.correct,
  ).length;
  const hasQuestions = lesson.quiz.length > 0;
  const isComplete = hasQuestions && answeredCount === lesson.quiz.length;

  function handleAnswer(question: QuizQuestion, selected: string) {
    const correct = selected === question.answer;

    setLocalFeedback((current) => ({
      ...current,
      [question.id]: { selected, correct },
    }));
    onAnswer(question.id, selected, correct);
  }

  return (
    <section className="quiz-panel" aria-labelledby="quiz-panel-title">
      <header className="quiz-panel__header">
        <h2 id="quiz-panel-title">Quiz</h2>
        <span className="quiz-panel__score">
          {correctCount}/{lesson.quiz.length}
        </span>
      </header>

      {hasQuestions ? (
        <ol className="quiz-panel__questions">
          {lesson.quiz.map((question) => {
            const feedback = feedbackByQuestionId[question.id];

            return (
              <li key={question.id} className="quiz-panel__question">
                <fieldset>
                  <legend>{question.prompt}</legend>
                  <div className="quiz-panel__choices">
                    {question.choices.map((choice) => (
                      <button
                        key={choice}
                        type="button"
                        className={getChoiceClass(feedback, choice)}
                        aria-pressed={feedback?.selected === choice}
                        onClick={() => handleAnswer(question, choice)}
                      >
                        {choice}
                      </button>
                    ))}
                  </div>
                </fieldset>

                {feedback ? (
                  <p
                    className={
                      feedback.correct
                        ? "quiz-panel__feedback is-correct"
                        : "quiz-panel__feedback is-incorrect"
                    }
                    role="status"
                  >
                    {feedback.correct
                      ? `Correct. ${question.explanation}`
                      : `Try again. The answer is ${question.answer}. ${question.explanation}`}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="quiz-panel__empty">No quiz questions yet.</p>
      )}

      <button
        type="button"
        className="quiz-panel__complete"
        disabled={hasQuestions && !isComplete}
        onClick={onComplete}
      >
        Complete Quiz
      </button>
    </section>
  );
}

export default QuizPanel;
