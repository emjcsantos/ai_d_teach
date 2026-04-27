export type GradeLevel = "K" | "1" | "2" | "3" | "4" | "5" | "6";

export type Difficulty = "gentle" | "standard" | "challenge";

export type LessonVisual =
  | {
      kind: "fraction_pizza";
      parts: number;
      highlight: number;
      label: string;
    }
  | {
      kind: "word_cards";
      words: Array<{ term: string; meaning: string }>;
    }
  | {
      kind: "science_cycle";
      title: string;
      nodes: string[];
    }
  | {
      kind: "formula_board";
      formula: string;
      explanation: string;
    };

export type LessonStep = {
  id: string;
  title: string;
  narration: string;
  prompt?: string;
  visual: LessonVisual;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  choices: string[];
  answer: string;
  explanation: string;
};

export type TutorMode = "explain" | "hint" | "check" | "encourage" | "advance";

export type TutorUnderstanding = "not_checked" | "emerging" | "solid";

export type TutorNextAction = "answer" | "try_canvas" | "continue" | "review" | "quiz";

export type TutorTurn = {
  reply: string;
  mode: TutorMode;
  understanding: TutorUnderstanding;
  nextAction: TutorNextAction;
  canContinue: boolean;
};

export type ChatMessage = {
  id: string;
  role: "student" | "tutor";
  text: string;
  createdAt: string;
  stepId?: string;
  tutorMode?: TutorMode;
  tutorUnderstanding?: TutorUnderstanding;
  tutorNextAction?: TutorNextAction;
};

export type TutorSignal = {
  id: string;
  stepId: string;
  studentMessage: string;
  mode: TutorMode;
  understanding: TutorUnderstanding;
  nextAction: TutorNextAction;
  canContinue: boolean;
  createdAt: string;
};

export type Lesson = {
  id: string;
  schemaVersion: 1;
  topic: string;
  gradeLevel: GradeLevel;
  difficulty: Difficulty;
  createdAt: string;
  updatedAt: string;
  source: "sample" | "local-template" | "imported" | "api";
  version: number;
  status: "draft" | "ready" | "needs-review";
  summary: string;
  steps: LessonStep[];
  quiz: QuizQuestion[];
};

export type LessonProgress = {
  lessonId: string;
  completedAt?: string;
  currentStepId?: string;
  quizAttempts: Array<{
    questionId: string;
    selected: string;
    correct: boolean;
    answeredAt: string;
  }>;
  teacherNotes: string[];
  studentNotes: string[];
  improvementNotes: string[];
  chatMessages: ChatMessage[];
  tutorSignals: TutorSignal[];
};
