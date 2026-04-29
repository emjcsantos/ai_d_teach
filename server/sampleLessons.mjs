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
    summary: "Use a pizza, fraction bar thinking, and a short quiz to learn parts of a whole.",
    steps: [
      {
        id: "fraction-whole",
        title: "One Part Of A Whole",
        narration: "A fraction tells us how many equal parts of a whole we are talking about.",
        prompt: "Select one slice and say: one out of four equal parts.",
        visual: {
          kind: "fraction_pizza",
          parts: 4,
          highlight: 1,
          label: "1/4",
          practiceTargets: [1],
        },
      },
      {
        id: "fraction-formula",
        title: "Top And Bottom",
        narration:
          "The top number counts selected parts. The bottom number counts all equal parts.",
        prompt: "Tap selected, then tap equal, to learn what each number counts.",
        visual: {
          kind: "formula_board",
          formula: "selected parts / equal parts = fraction",
          explanation: "One selected slice out of four equal slices is one fourth.",
          tasks: [
            {
              instruction: "Tap selected in the formula. It tells how many parts you picked.",
              target: "selected",
              success: "Yes. Selected parts is the top number idea.",
            },
            {
              instruction: "Tap equal in the formula. It tells how many parts make the whole.",
              target: "equal",
              success: "Yes. Equal parts is the bottom number idea.",
            },
          ],
        },
      },
      {
        id: "fraction-build",
        title: "Build More Fractions",
        narration: "Now use the top and bottom numbers to build more fractions with the pizza.",
        prompt: "Select the number of slices the teacher asks for.",
        visual: {
          kind: "fraction_pizza",
          parts: 4,
          highlight: 2,
          label: "2/4",
          practiceTargets: [2, 3, 4],
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
