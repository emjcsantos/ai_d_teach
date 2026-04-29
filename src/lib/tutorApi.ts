import type { Lesson, LessonProgress, LessonStep, TutorTurn } from "../types/lesson";

const DEFAULT_REPOSITORY_URL = "http://127.0.0.1:8787";

function getRepositoryBaseUrl() {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  return (env?.VITE_AI_D_TEACH_REPOSITORY_URL ?? DEFAULT_REPOSITORY_URL).replace(/\/$/, "");
}

export async function requestTutorTurn({
  lesson,
  currentStep,
  message,
  progress,
}: {
  lesson: Lesson;
  currentStep: LessonStep;
  message: string;
  progress: LessonProgress;
}): Promise<TutorTurn> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(`${getRepositoryBaseUrl()}/api/tutor`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ lesson, currentStep, message, progress }),
    });

    if (!response.ok) {
      throw new Error(`Tutor request failed: ${response.status}`);
    }

    const payload = (await response.json()) as { tutorTurn?: TutorTurn };

    if (!payload.tutorTurn) {
      throw new Error("Tutor response did not include a tutor turn.");
    }

    return payload.tutorTurn;
  } finally {
    window.clearTimeout(timeout);
  }
}
