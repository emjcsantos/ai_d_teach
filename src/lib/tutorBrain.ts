import type { Lesson, LessonProgress, LessonStep, QuizQuestion } from "../types/lesson";

type TutorReplyInput = {
  lesson: Lesson;
  currentStep: LessonStep;
  message: string;
  progress: LessonProgress;
};

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function getNextQuizQuestion(lesson: Lesson, progress: LessonProgress): QuizQuestion | undefined {
  const answeredQuestionIds = new Set(progress.quizAttempts.map((attempt) => attempt.questionId));
  return lesson.quiz.find((question) => !answeredQuestionIds.has(question.id)) ?? lesson.quiz[0];
}

function describeVisual(step: LessonStep) {
  const visual = step.visual;

  switch (visual.kind) {
    case "fraction_pizza":
      return `The picture is showing ${visual.highlight} out of ${visual.parts} equal parts, which is labeled ${visual.label}.`;
    case "word_cards":
      return `The cards are showing key words: ${visual.words.map((word) => word.term).join(", ")}.`;
    case "science_cycle":
      return `The cycle connects these parts: ${visual.nodes.join(", ")}.`;
    case "formula_board":
      return `The formula board says: ${visual.formula}. ${visual.explanation}`;
  }
}

function makePracticePrompt(step: LessonStep, lesson: Lesson) {
  return (
    step.prompt ??
    `Try explaining one thing you learned about ${lesson.topic} in your own words.`
  );
}

export function buildTutorReply({ lesson, currentStep, message, progress }: TutorReplyInput) {
  const normalizedMessage = message.trim().toLowerCase();
  const quizQuestion = getNextQuizQuestion(lesson, progress);

  if (!normalizedMessage) {
    return `I'm here with you. Ask me about ${lesson.topic}, request a hint, or ask for a practice question.`;
  }

  if (includesAny(normalizedMessage, ["hint", "help", "stuck", "confused"])) {
    return `Let's slow it down. ${currentStep.narration} ${describeVisual(
      currentStep,
    )} Try this: ${makePracticePrompt(currentStep, lesson)}`;
  }

  if (includesAny(normalizedMessage, ["quiz", "question", "practice", "test me"])) {
    if (!quizQuestion) {
      return `This lesson does not have quiz questions yet. Try telling me one thing you noticed about ${lesson.topic}.`;
    }

    return `Practice time: ${quizQuestion.prompt} Your choices are ${quizQuestion.choices.join(
      ", ",
    )}. Tell me which one you think fits, and I can help you reason it out.`;
  }

  if (includesAny(normalizedMessage, ["answer", "correct", "which one"])) {
    if (!quizQuestion) {
      return `I can help you think it through. Look at the current step and tell me what clue you notice first.`;
    }

    return `The key idea is: ${quizQuestion.explanation} If you want to try again first, compare each choice with the lesson picture.`;
  }

  if (includesAny(normalizedMessage, ["why", "how", "explain", "what is", "what are"])) {
    return `Here is ${lesson.topic} in kid-friendly words: ${lesson.summary} Right now, this step says: ${currentStep.narration} ${describeVisual(
      currentStep,
    )}`;
  }

  if (includesAny(normalizedMessage, ["next", "do now", "what should i do"])) {
    return `Next, focus on this step: ${currentStep.title}. ${makePracticePrompt(
      currentStep,
      lesson,
    )} After that, try the quiz on the side.`;
  }

  if (includesAny(normalizedMessage, ["fun", "bored", "boring", "game"])) {
    return `Let's make it a mini challenge. Find one clue in the picture, say it out loud, then ask me for a practice question about ${lesson.topic}.`;
  }

  return `Good thought. For this lesson, connect your idea back to ${lesson.topic}. The current clue is: ${currentStep.narration} What part should we look at together?`;
}

