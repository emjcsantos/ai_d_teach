import type { Difficulty, GradeLevel, Lesson } from "../types/lesson";

const now = new Date().toISOString();

export const sampleLessons: Lesson[] = [
  {
    id: "sample-fractions-grade-3",
    schemaVersion: 1,
    topic: "Fractions",
    gradeLevel: "3",
    difficulty: "standard",
    createdAt: now,
    updatedAt: now,
    source: "sample",
    version: 1,
    status: "ready",
    summary: "Use a pizza, fraction bar thinking, and a short quiz to learn parts of a whole.",
    steps: [
      {
        id: "fraction-whole",
        title: "A Whole Can Split",
        narration: "A fraction tells us how many equal parts of a whole we are talking about.",
        prompt: "Click the highlighted slice and say: one out of four equal parts.",
        visual: {
          kind: "fraction_pizza",
          parts: 4,
          highlight: 1,
          label: "1/4",
        },
      },
      {
        id: "fraction-formula",
        title: "Top And Bottom",
        narration:
          "The top number counts selected parts. The bottom number counts all equal parts.",
        visual: {
          kind: "formula_board",
          formula: "selected parts / equal parts = fraction",
          explanation: "One selected slice out of four equal slices is one fourth.",
        },
      },
    ],
    quiz: [
      {
        id: "fraction-q1",
        prompt: "If a pizza has 4 equal slices and you choose 1 slice, what fraction is chosen?",
        choices: ["1/4", "4/1", "1/2"],
        answer: "1/4",
        explanation: "One chosen slice out of four equal slices is 1/4.",
      },
    ],
  },
  {
    id: "sample-photosynthesis-grade-4",
    schemaVersion: 1,
    topic: "Photosynthesis",
    gradeLevel: "4",
    difficulty: "standard",
    createdAt: now,
    updatedAt: now,
    source: "sample",
    version: 1,
    status: "ready",
    summary: "Follow sunlight, water, and carbon dioxide as plants make food.",
    steps: [
      {
        id: "photo-cycle",
        title: "Plant Food Factory",
        narration:
          "Plants use sunlight, water, and carbon dioxide to make sugar for energy and release oxygen.",
        prompt: "Tap each bubble in the cycle to read what the plant uses or makes.",
        visual: {
          kind: "science_cycle",
          title: "Photosynthesis",
          nodes: ["Sunlight", "Water", "Carbon dioxide", "Sugar", "Oxygen"],
        },
      },
      {
        id: "photo-words",
        title: "Key Words",
        narration: "Photosynthesis has a few important words. Learn them like puzzle pieces.",
        visual: {
          kind: "word_cards",
          words: [
            { term: "Chlorophyll", meaning: "Green pigment that helps leaves catch sunlight." },
            { term: "Glucose", meaning: "A sugar plants make for energy." },
            { term: "Oxygen", meaning: "A gas plants release into the air." },
          ],
        },
      },
    ],
    quiz: [
      {
        id: "photo-q1",
        prompt: "Which energy source helps plants make food?",
        choices: ["Sunlight", "Moonlight", "Sand"],
        answer: "Sunlight",
        explanation: "Plants use sunlight as energy during photosynthesis.",
      },
    ],
  },
];

export function createStarterLesson(
  topic: string,
  gradeLevel: GradeLevel,
  difficulty: Difficulty,
): Lesson {
  const idBase = topic
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const createdAt = new Date().toISOString();
  const isMath = /fraction|multiply|division|algebra|number|math|formula/i.test(topic);
  const isScience = /plant|photo|space|planet|water|science|animal|energy/i.test(topic);

  return {
    id: `${idBase || "lesson"}-grade-${gradeLevel}-${Date.now()}`,
    schemaVersion: 1,
    topic,
    gradeLevel,
    difficulty,
    createdAt,
    updatedAt: createdAt,
    source: "local-template",
    version: 1,
    status: "needs-review",
    summary: `A starter lesson for ${topic}. It can be improved later through the Ralph Loop.`,
    steps: [
      {
        id: "intro",
        title: `Meet ${topic}`,
        narration: `Today we are learning about ${topic}. We will look, listen, try an activity, and answer a quick question.`,
        prompt: "Press play, then explore the picture.",
        visual: isMath
          ? {
              kind: "formula_board",
              formula: `${topic} = idea + example + practice`,
              explanation: "Start with the idea, watch an example, then try it yourself.",
            }
          : isScience
            ? {
                kind: "science_cycle",
                title: topic,
                nodes: ["Observe", "Ask", "Connect", "Explain"],
              }
            : {
                kind: "word_cards",
                words: [
                  { term: topic, meaning: "The main idea we are learning today." },
                  { term: "Example", meaning: "A clear case that helps the idea make sense." },
                  { term: "Practice", meaning: "A small challenge to check understanding." },
                ],
              },
      },
      {
        id: "practice",
        title: "Try It",
        narration: `Now try using ${topic} in your own words. A good answer can be simple and clear.`,
        prompt: `What is one thing you now know about ${topic}?`,
        visual: {
          kind: "word_cards",
          words: [
            { term: "I notice", meaning: "Say what you see." },
            { term: "I think", meaning: "Say what it means." },
            { term: "I can try", meaning: "Use the idea once." },
          ],
        },
      },
    ],
    quiz: [
      {
        id: "starter-q1",
        prompt: `What should you do when learning ${topic}?`,
        choices: ["Look, listen, and practice", "Skip the examples", "Guess without trying"],
        answer: "Look, listen, and practice",
        explanation: "Looking, listening, and practicing helps new ideas stick.",
      },
    ],
  };
}

