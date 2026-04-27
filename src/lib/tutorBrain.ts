import type { Lesson, LessonProgress, LessonStep, QuizQuestion, TutorTurn } from "../types/lesson";

type TutorReplyInput = {
  lesson: Lesson;
  currentStep: LessonStep;
  message: string;
  progress: LessonProgress;
};

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function normalizeText(text: string) {
  return text.trim().toLowerCase();
}

function countMatches(text: string, words: string[]) {
  return words.filter((word) => word && text.includes(word)).length;
}

function getNextQuizQuestion(lesson: Lesson, progress: LessonProgress): QuizQuestion | undefined {
  const answeredQuestionIds = new Set(progress.quizAttempts.map((attempt) => attempt.questionId));
  return lesson.quiz.find((question) => !answeredQuestionIds.has(question.id)) ?? lesson.quiz[0];
}

function getLatestStepSignal(progress: LessonProgress, stepId: string) {
  return [...progress.tutorSignals].reverse().find((signal) => signal.stepId === stepId);
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

function getVisualClues(step: LessonStep) {
  const visual = step.visual;

  switch (visual.kind) {
    case "fraction_pizza": {
      const clues = [
        visual.label,
        `${visual.highlight}/${visual.parts}`,
        `${visual.highlight} out of ${visual.parts}`,
        `${visual.highlight} of ${visual.parts}`,
        "equal parts",
        "whole",
        "fraction",
      ];

      if (visual.highlight === 1 && visual.parts === 4) {
        clues.push("one fourth", "one quarter", "quarter");
      }

      return clues.map(normalizeText);
    }
    case "word_cards":
      return visual.words.flatMap((word) => [word.term, word.meaning]).map(normalizeText);
    case "science_cycle":
      return [visual.title, ...visual.nodes, "cycle", "flow"].map(normalizeText);
    case "formula_board":
      return [visual.formula, visual.explanation].map(normalizeText);
  }
}

function looksLikeQuestion(text: string) {
  return text.endsWith("?") || includesAny(text, ["why", "how", "what", "explain", "help"]);
}

function looksLikeStudentAnswer(text: string) {
  return text.split(/\s+/).filter(Boolean).length >= 3 && !looksLikeQuestion(text);
}

function assessUnderstanding(message: string, step: LessonStep) {
  const clues = getVisualClues(step);
  const clueMatches = countMatches(message, clues);

  if (clueMatches >= 2 || includesAny(message, ["i understand", "got it", "i get it"])) {
    return "solid" as const;
  }

  if (clueMatches === 1 || looksLikeStudentAnswer(message)) {
    return "emerging" as const;
  }

  return "not_checked" as const;
}

function makeTurn(turn: TutorTurn) {
  return turn;
}

export function buildTutorTurn({ lesson, currentStep, message, progress }: TutorReplyInput) {
  const normalizedMessage = normalizeText(message);
  const quizQuestion = getNextQuizQuestion(lesson, progress);
  const latestSignal = getLatestStepSignal(progress, currentStep.id);
  const understanding = assessUnderstanding(normalizedMessage, currentStep);

  if (!normalizedMessage) {
    return makeTurn({
      reply: `I'm here with you. Tell me what you notice on the canvas, and I will help you move through ${lesson.topic}.`,
      mode: "encourage",
      understanding: "not_checked",
      nextAction: "answer",
      canContinue: false,
    });
  }

  if (includesAny(normalizedMessage, ["hint", "help", "stuck", "confused"])) {
    return makeTurn({
      reply: `Let's slow it down. ${currentStep.narration} ${describeVisual(
        currentStep,
      )} Try the canvas, then tell me one clue you see.`,
      mode: "hint",
      understanding: "emerging",
      nextAction: "try_canvas",
      canContinue: false,
    });
  }

  if (includesAny(normalizedMessage, ["next", "continue", "move on"])) {
    if (latestSignal?.understanding === "solid") {
      return makeTurn({
        reply: `You're ready. Continue to the next step, and I will stay with you there.`,
        mode: "advance",
        understanding: "solid",
        nextAction: "continue",
        canContinue: true,
      });
    }

    return makeTurn({
      reply: `Almost. First tell me one thing the canvas is showing in your own words. Then I can move you forward.`,
      mode: "check",
      understanding: "emerging",
      nextAction: "answer",
      canContinue: false,
    });
  }

  if (includesAny(normalizedMessage, ["quiz", "question", "practice", "test me"])) {
    if (!quizQuestion) {
      return makeTurn({
        reply: `This lesson does not have quiz questions yet. Try telling me one thing you noticed about ${lesson.topic}.`,
        mode: "check",
        understanding: "not_checked",
        nextAction: "answer",
        canContinue: false,
      });
    }

    return makeTurn({
      reply: `Practice time: ${quizQuestion.prompt} Your choices are ${quizQuestion.choices.join(
        ", ",
      )}. Tell me which one fits, and say why.`,
      mode: "check",
      understanding: "not_checked",
      nextAction: "answer",
      canContinue: false,
    });
  }

  if (includesAny(normalizedMessage, ["answer", "correct", "which one"])) {
    if (!quizQuestion) {
      return makeTurn({
        reply: `I can help you think it through. Look at the current step and tell me what clue you notice first.`,
        mode: "hint",
        understanding: "emerging",
        nextAction: "try_canvas",
        canContinue: false,
      });
    }

    return makeTurn({
      reply: `The key idea is: ${quizQuestion.explanation} Now tell me how that connects to the picture.`,
      mode: "explain",
      understanding: "not_checked",
      nextAction: "answer",
      canContinue: false,
    });
  }

  if (includesAny(normalizedMessage, ["why", "how", "explain", "what is", "what are"])) {
    return makeTurn({
      reply: `Here is ${lesson.topic} in kid-friendly words: ${lesson.summary} Right now, this step says: ${currentStep.narration} ${describeVisual(
        currentStep,
      )} Tell me one clue you see on the canvas.`,
      mode: "explain",
      understanding: "not_checked",
      nextAction: "answer",
      canContinue: false,
    });
  }

  if (includesAny(normalizedMessage, ["do now", "what should i do"])) {
    return makeTurn({
      reply: `Focus on this step: ${currentStep.title}. ${makePracticePrompt(
        currentStep,
        lesson,
      )} Tell me your answer here, and I will check if you are ready to continue.`,
      mode: "check",
      understanding: "not_checked",
      nextAction: "answer",
      canContinue: false,
    });
  }

  if (includesAny(normalizedMessage, ["fun", "bored", "boring", "game"])) {
    return makeTurn({
      reply: `Let's make it a mini challenge. Find one clue in the picture, say it out loud, then tell me what it means.`,
      mode: "encourage",
      understanding: "emerging",
      nextAction: "try_canvas",
      canContinue: false,
    });
  }

  if (understanding === "solid") {
    return makeTurn({
      reply: `Yes. You connected the idea to the lesson clue. That shows you understand this step. Continue when you're ready, or ask me one more question.`,
      mode: "advance",
      understanding,
      nextAction: "continue",
      canContinue: true,
    });
  }

  if (understanding === "emerging") {
    return makeTurn({
      reply: `You're close. Connect your answer back to the canvas: ${describeVisual(
        currentStep,
      )} What does that clue tell us?`,
      mode: "check",
      understanding,
      nextAction: "try_canvas",
      canContinue: false,
    });
  }

  return makeTurn({
    reply: `Good thought. For this lesson, connect your idea back to ${lesson.topic}. The current clue is: ${currentStep.narration} What part should we look at together?`,
    mode: "check",
    understanding,
    nextAction: "answer",
    canContinue: false,
  });
}

export function buildTutorReply(input: TutorReplyInput) {
  return buildTutorTurn(input).reply;
}
