const now = new Date().toISOString();

export const sampleLessons = [
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
    summary: "Use a pizza, formula thinking, and a quick check to learn parts of a whole.",
    steps: [
      {
        id: "fraction-whole",
        title: "A Whole Can Split",
        narration: "A fraction tells us how many equal parts of a whole we are talking about.",
        prompt: "Look at the highlighted slice and tell ChatGPT what one fourth means.",
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
        prompt: "Ask ChatGPT why the bottom number is four.",
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
        prompt: "Ask ChatGPT to explain one part of the cycle.",
        visual: {
          kind: "science_cycle",
          title: "Photosynthesis",
          nodes: ["Sunlight", "Water", "Carbon dioxide", "Sugar", "Oxygen"],
        },
      },
      {
        id: "photo-words",
        title: "Key Words",
        narration: "Photosynthesis has important words. Learn them like puzzle pieces.",
        prompt: "Choose one word and ask ChatGPT for an example.",
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

