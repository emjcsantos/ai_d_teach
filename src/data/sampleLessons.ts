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
        title: "One Part Of A Whole",
        narration: "A fraction tells us how many equal parts of a whole we are talking about.",
        prompt: "Select one slice and say: one out of four equal parts.",
        teacherTasks: [
          {
            id: "fraction-one-fourth",
            kind: "select_fraction_count",
            instruction: "Click 1/4 of the pizza.",
            targetCount: 1,
            success: "Yes. 1/4 means 1 out of 4 equal parts.",
            hint: "Choose one slice only.",
          },
        ],
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
        prompt: "Tap selected, then tap equal, to learn what each number counts.",
        teacherTasks: [
          {
            id: "fraction-selected-token",
            kind: "tap_formula_token",
            instruction: "Tap selected in the formula. It tells how many parts you picked.",
            target: "selected",
            success: "Yes. Selected parts is the top number idea.",
            hint: "Look for the word that means the parts you picked.",
          },
          {
            id: "fraction-equal-token",
            kind: "tap_formula_token",
            instruction: "Tap equal in the formula. It tells how many parts make the whole.",
            target: "equal",
            success: "Yes. Equal parts is the bottom number idea.",
            hint: "Look for the word that tells all parts have the same size.",
          },
        ],
        visual: {
          kind: "formula_board",
          formula: "selected parts / equal parts = fraction",
          explanation: "One selected slice out of four equal slices is one fourth.",
        },
      },
      {
        id: "fraction-build",
        title: "Build More Fractions",
        narration: "Now use the top and bottom numbers to build more fractions with the pizza.",
        prompt: "Select the number of slices the teacher asks for.",
        teacherTasks: [
          {
            id: "fraction-two-fourths",
            kind: "select_fraction_count",
            instruction: "Click 2/4 of the pizza.",
            targetCount: 2,
            success: "Yes. 2/4 means 2 out of 4 equal parts.",
            hint: "Choose two slices.",
          },
          {
            id: "fraction-three-fourths",
            kind: "select_fraction_count",
            instruction: "Click 3/4 of the pizza.",
            targetCount: 3,
            success: "Yes. 3/4 means 3 out of 4 equal parts.",
            hint: "Choose three slices.",
          },
          {
            id: "fraction-four-fourths",
            kind: "select_fraction_count",
            instruction: "Click the whole pizza: 4/4.",
            targetCount: 4,
            success: "Great. The whole pizza is selected.",
            hint: "Choose every slice.",
          },
        ],
        visual: {
          kind: "fraction_pizza",
          parts: 4,
          highlight: 2,
          label: "2/4",
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
      {
        id: "fraction-q2",
        prompt: "What does the top number in a fraction count?",
        choices: ["Selected parts", "All equal parts", "Pizza flavor"],
        answer: "Selected parts",
        explanation: "The top number counts how many parts are selected.",
      },
      {
        id: "fraction-q3",
        prompt: "If 3 out of 4 equal slices are selected, what fraction is shown?",
        choices: ["3/4", "4/3", "1/4"],
        answer: "3/4",
        explanation: "Three selected slices out of four equal slices is 3/4.",
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
        teacherTasks: [
          {
            id: "photo-energy-source",
            kind: "tap_cycle_node",
            instruction: "Tap the energy source plants use.",
            target: "Sunlight",
            success: "Correct. Sunlight gives the plant energy.",
            hint: "Look for the part that shines on the plant.",
          },
          {
            id: "photo-plant-input",
            kind: "tap_cycle_node",
            instruction: "Tap one input the plant takes in.",
            target: "Water",
            success: "Yes. Water is one thing the plant takes in.",
            hint: "Look for something roots can take in.",
          },
          {
            id: "photo-plant-output",
            kind: "tap_cycle_node",
            instruction: "Tap something the plant makes or releases.",
            target: "Oxygen",
            success: "Yes. Plants release oxygen into the air.",
            hint: "Look for the gas plants release.",
          },
        ],
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
        prompt: "Tap the word that means plant sugar.",
        teacherTasks: [
          {
            id: "photo-glucose-card",
            kind: "tap_word_card",
            instruction: "Tap the word that means plant sugar.",
            target: "Glucose",
            success: "Correct. Glucose is a sugar plants make for energy.",
            hint: "Find the card that talks about sugar.",
          },
        ],
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
      {
        id: "photo-q2",
        prompt: "Which is something a plant takes in during photosynthesis?",
        choices: ["Water", "Plastic", "Music"],
        answer: "Water",
        explanation: "Plants take in water as one ingredient for photosynthesis.",
      },
      {
        id: "photo-q3",
        prompt: "Which gas do plants release during photosynthesis?",
        choices: ["Oxygen", "Smoke", "Helium"],
        answer: "Oxygen",
        explanation: "Plants release oxygen while making food.",
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
