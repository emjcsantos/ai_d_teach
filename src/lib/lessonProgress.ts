import type { LessonProgress } from "../types/lesson";

const PROGRESS_KEY = "ai-d-teach.progress.v1";

function loadAllProgress(): Record<string, LessonProgress> {
  const stored = window.localStorage.getItem(PROGRESS_KEY);

  if (!stored) {
    return {};
  }

  try {
    const parsed = JSON.parse(stored) as Record<string, LessonProgress>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveAllProgress(progress: Record<string, LessonProgress>) {
  window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

function createEmptyProgress(lessonId: string): LessonProgress {
  return {
    lessonId,
    quizAttempts: [],
    teacherNotes: [],
    studentNotes: [],
    improvementNotes: [],
    chatMessages: [],
  };
}

function normalizeProgress(lessonId: string, progress?: Partial<LessonProgress>): LessonProgress {
  const emptyProgress = createEmptyProgress(lessonId);

  return {
    ...emptyProgress,
    ...progress,
    lessonId,
    quizAttempts: Array.isArray(progress?.quizAttempts) ? progress.quizAttempts : [],
    teacherNotes: Array.isArray(progress?.teacherNotes) ? progress.teacherNotes : [],
    studentNotes: Array.isArray(progress?.studentNotes) ? progress.studentNotes : [],
    improvementNotes: Array.isArray(progress?.improvementNotes) ? progress.improvementNotes : [],
    chatMessages: Array.isArray(progress?.chatMessages) ? progress.chatMessages : [],
  };
}

export function getLessonProgress(lessonId: string): LessonProgress {
  const progress = loadAllProgress();

  return normalizeProgress(lessonId, progress[lessonId]);
}

export function updateLessonProgress(lessonProgress: LessonProgress) {
  const progress = loadAllProgress();
  saveAllProgress({ ...progress, [lessonProgress.lessonId]: lessonProgress });
}
