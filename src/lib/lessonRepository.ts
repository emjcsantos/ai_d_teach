import { sampleLessons } from "../data/sampleLessons";
import type { Lesson } from "../types/lesson";

const LESSONS_KEY = "ai-d-teach.lessons.v1";

export function loadLessons(): Lesson[] {
  const stored = window.localStorage.getItem(LESSONS_KEY);

  if (!stored) {
    saveLessons(sampleLessons);
    return sampleLessons;
  }

  try {
    const parsed = JSON.parse(stored) as Lesson[];
    return Array.isArray(parsed) ? parsed : sampleLessons;
  } catch {
    return sampleLessons;
  }
}

export function saveLessons(lessons: Lesson[]) {
  window.localStorage.setItem(LESSONS_KEY, JSON.stringify(lessons));
}

export function upsertLesson(lesson: Lesson): Lesson[] {
  const lessons = loadLessons();
  const existingIndex = lessons.findIndex((candidate) => candidate.id === lesson.id);
  const nextLessons =
    existingIndex >= 0
      ? lessons.map((candidate) => (candidate.id === lesson.id ? lesson : candidate))
      : [lesson, ...lessons];

  saveLessons(nextLessons);
  return nextLessons;
}

export function findReusableLesson(topic: string, gradeLevel: string) {
  const normalizedTopic = topic.trim().toLowerCase();

  return loadLessons().find(
    (lesson) =>
      lesson.topic.trim().toLowerCase() === normalizedTopic && lesson.gradeLevel === gradeLevel,
  );
}

