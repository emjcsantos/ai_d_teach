import { useMemo } from "react";
import type { Lesson } from "../types/lesson";

export type LessonLibraryProps = {
  lessons: Lesson[];
  activeLessonId?: string;
  onSelectLesson: (lesson: Lesson) => void;
};

function formatStatus(status: Lesson["status"]) {
  return status
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function formatSource(source: Lesson["source"]) {
  return source
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function formatUpdatedAt(updatedAt: string) {
  return new Date(updatedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function LessonLibrary({ lessons, activeLessonId, onSelectLesson }: LessonLibraryProps) {
  const sortedLessons = useMemo(
    () =>
      [...lessons].sort(
        (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
      ),
    [lessons],
  );

  return (
    <section className="lesson-library" aria-labelledby="lesson-library-title">
      <header className="lesson-library__header">
        <h2 id="lesson-library-title">Lesson Library</h2>
        <span className="lesson-library__count">{lessons.length}</span>
      </header>

      {sortedLessons.length > 0 ? (
        <ul className="lesson-library__list">
          {sortedLessons.map((lesson) => {
            const isActive = lesson.id === activeLessonId;

            return (
              <li key={lesson.id}>
                <button
                  type="button"
                  className={isActive ? "lesson-library__item is-active" : "lesson-library__item"}
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => onSelectLesson(lesson)}
                >
                  <span className="lesson-library__item-header">
                    <strong>{lesson.topic}</strong>
                    <span>v{lesson.version}</span>
                  </span>
                  <span className="lesson-library__summary">{lesson.summary}</span>
                  <span className="lesson-library__metadata">
                    <span>Grade {lesson.gradeLevel}</span>
                    <span>{lesson.difficulty}</span>
                    <span>{formatStatus(lesson.status)}</span>
                    <span>{formatSource(lesson.source)}</span>
                    <span>{formatUpdatedAt(lesson.updatedAt)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="lesson-library__empty">No saved lessons yet.</p>
      )}
    </section>
  );
}

export default LessonLibrary;
