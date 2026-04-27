import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { Difficulty, GradeLevel, Lesson } from "../types/lesson";

export type LessonComposerProps = {
  lessons: Lesson[];
  onCreateLesson: (topic: string, gradeLevel: GradeLevel, difficulty: Difficulty) => void;
  onSelectLesson: (lesson: Lesson) => void;
};

const gradeLevels: GradeLevel[] = ["K", "1", "2", "3", "4", "5", "6"];

const difficulties: Array<{ value: Difficulty; label: string }> = [
  { value: "gentle", label: "Gentle" },
  { value: "standard", label: "Standard" },
  { value: "challenge", label: "Challenge" },
];

function normalizeTopic(topic: string) {
  return topic.trim().toLowerCase();
}

function lessonDateLabel(lesson: Lesson) {
  return new Date(lesson.updatedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function LessonComposer({
  lessons,
  onCreateLesson,
  onSelectLesson,
}: LessonComposerProps) {
  const [topic, setTopic] = useState("");
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>("3");
  const [difficulty, setDifficulty] = useState<Difficulty>("standard");

  const trimmedTopic = topic.trim();
  const reusableLessons = useMemo(() => {
    const normalizedTopic = normalizeTopic(topic);

    if (!normalizedTopic) {
      return [];
    }

    return lessons
      .filter(
        (lesson) =>
          normalizeTopic(lesson.topic) === normalizedTopic && lesson.gradeLevel === gradeLevel,
      )
      .sort((left, right) => right.version - left.version);
  }, [gradeLevel, lessons, topic]);

  const preferredLesson = reusableLessons[0];
  const canSubmit = trimmedTopic.length > 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    if (preferredLesson) {
      onSelectLesson(preferredLesson);
      return;
    }

    onCreateLesson(trimmedTopic, gradeLevel, difficulty);
  }

  function handleCreateLesson() {
    if (canSubmit) {
      onCreateLesson(trimmedTopic, gradeLevel, difficulty);
    }
  }

  return (
    <section className="lesson-composer" aria-labelledby="lesson-composer-title">
      <header className="lesson-composer__header">
        <h2 id="lesson-composer-title">Lesson Composer</h2>
      </header>

      <form className="lesson-composer__form" onSubmit={handleSubmit}>
        <label className="lesson-composer__field">
          <span>Topic</span>
          <input
            type="text"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="Fractions, photosynthesis, vocabulary..."
          />
        </label>

        <label className="lesson-composer__field">
          <span>Grade</span>
          <select
            value={gradeLevel}
            onChange={(event) => setGradeLevel(event.target.value as GradeLevel)}
          >
            {gradeLevels.map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>
        </label>

        <label className="lesson-composer__field">
          <span>Difficulty</span>
          <select
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value as Difficulty)}
          >
            {difficulties.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="lesson-composer__actions">
          <button type="submit" disabled={!canSubmit}>
            {preferredLesson ? "Use Matching Lesson" : "Create Lesson"}
          </button>
          {preferredLesson ? (
            <button type="button" disabled={!canSubmit} onClick={handleCreateLesson}>
              Create New Version
            </button>
          ) : null}
        </div>
      </form>

      {reusableLessons.length > 0 ? (
        <div className="lesson-composer__matches" aria-label="Reusable lessons">
          <h3>Reusable Lessons</h3>
          <ul>
            {reusableLessons.map((lesson) => (
              <li key={lesson.id}>
                <button type="button" onClick={() => onSelectLesson(lesson)}>
                  <span>{lesson.topic}</span>
                  <small>
                    Grade {lesson.gradeLevel} | {lesson.status} | {lesson.source} | v
                    {lesson.version} | {lessonDateLabel(lesson)}
                  </small>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

export default LessonComposer;
