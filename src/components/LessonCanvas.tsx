import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { LessonStep, LessonVisual } from "../types/lesson";

export type LessonCanvasProps = {
  step: LessonStep;
};

const canvasStyles = {
  shell: {
    border: "1px solid #d5d9e2",
    borderRadius: 8,
    background: "#ffffff",
    color: "#182230",
    padding: 20,
    minHeight: 360,
    display: "flex",
    flexDirection: "column",
    gap: 16,
    boxShadow: "0 10px 30px rgba(16, 24, 40, 0.08)",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  eyebrow: {
    color: "#526070",
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 24,
    lineHeight: 1.2,
    margin: 0,
  },
  visualArea: {
    flex: 1,
    display: "grid",
    placeItems: "center",
    minHeight: 250,
  },
  button: {
    border: "1px solid #c9d1df",
    borderRadius: 8,
    background: "#ffffff",
    color: "#182230",
    cursor: "pointer",
    font: "inherit",
  },
  selectedButton: {
    borderColor: "#1f6feb",
    background: "#e9f2ff",
    color: "#0f3e8a",
  },
} satisfies Record<string, CSSProperties>;

const palette = ["#1f6feb", "#0e9384", "#db8b00", "#c11574", "#6941c6", "#0086c9"];

function clampInteger(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.floor(Number.isFinite(value) ? value : min)));
}

function getFractionPath(index: number, total: number) {
  const center = 100;
  const radius = 86;

  if (total === 1) {
    return `M ${center - radius} ${center} A ${radius} ${radius} 0 1 0 ${
      center + radius
    } ${center} A ${radius} ${radius} 0 1 0 ${center - radius} ${center} Z`;
  }

  const startAngle = (index / total) * Math.PI * 2 - Math.PI / 2;
  const endAngle = ((index + 1) / total) * Math.PI * 2 - Math.PI / 2;
  const startX = center + radius * Math.cos(startAngle);
  const startY = center + radius * Math.sin(startAngle);
  const endX = center + radius * Math.cos(endAngle);
  const endY = center + radius * Math.sin(endAngle);
  const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

  return `M ${center} ${center} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
}

function FractionPizza({ visual }: { visual: Extract<LessonVisual, { kind: "fraction_pizza" }> }) {
  const parts = clampInteger(visual.parts, 1, 16);
  const highlightedCount = clampInteger(visual.highlight, 0, parts);
  const initialSelection = useMemo(
    () => new Set(Array.from({ length: highlightedCount }, (_, index) => index)),
    [highlightedCount],
  );
  const [selectedSlices, setSelectedSlices] = useState<Set<number>>(initialSelection);

  useEffect(() => {
    setSelectedSlices(initialSelection);
  }, [initialSelection]);

  function toggleSlice(index: number) {
    setSelectedSlices((current) => {
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  const selectedCount = selectedSlices.size;

  return (
    <div style={fractionStyles.layout}>
      <svg
        role="img"
        aria-label={`${visual.label} pizza fraction model`}
        viewBox="0 0 200 200"
        style={fractionStyles.svg}
      >
        <circle cx="100" cy="100" r="90" fill="#f7c66b" />
        <circle cx="100" cy="100" r="78" fill="none" stroke="#b86b24" strokeWidth="2" />
        {Array.from({ length: parts }, (_, index) => {
          const isSelected = selectedSlices.has(index);
          return (
            <path
              key={index}
              d={getFractionPath(index, parts)}
              fill={isSelected ? "#ef6820" : "#ffd98a"}
              stroke="#8f4f16"
              strokeWidth={isSelected ? 3 : 1.5}
              tabIndex={0}
              role="button"
              aria-pressed={isSelected}
              aria-label={`Slice ${index + 1} of ${parts}`}
              onClick={() => toggleSlice(index)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  toggleSlice(index);
                }
              }}
              style={{ cursor: "pointer", outline: "none" }}
            />
          );
        })}
        <circle cx="100" cy="100" r="34" fill="#fff9e8" stroke="#8f4f16" strokeWidth="2" />
        <text
          x="100"
          y="106"
          textAnchor="middle"
          fill="#682d08"
          fontSize="22"
          fontWeight="700"
        >
          {visual.label}
        </text>
      </svg>
      <div style={fractionStyles.panel}>
        <strong>
          {selectedCount}/{parts} selected
        </strong>
        <span>{selectedCount === highlightedCount ? "Matches the lesson highlight." : "Tap slices to compare fractions."}</span>
      </div>
    </div>
  );
}

const fractionStyles = {
  layout: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "minmax(180px, 260px) minmax(160px, 1fr)",
    alignItems: "center",
    gap: 20,
  },
  svg: {
    width: "100%",
    maxWidth: 260,
    aspectRatio: "1 / 1",
  },
  panel: {
    borderLeft: "4px solid #ef6820",
    padding: "12px 0 12px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    color: "#344054",
  },
} satisfies Record<string, CSSProperties>;

function WordCards({ visual }: { visual: Extract<LessonVisual, { kind: "word_cards" }> }) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [visual.words]);

  if (visual.words.length === 0) {
    return <p style={emptyStyles.message}>No vocabulary cards for this step yet.</p>;
  }

  const safeSelectedIndex = clampInteger(selectedIndex, 0, visual.words.length - 1);
  const selectedWord = visual.words[safeSelectedIndex];

  return (
    <div style={wordCardStyles.layout}>
      <div style={wordCardStyles.cards} aria-label="Vocabulary cards">
        {visual.words.map((word, index) => {
          const selected = safeSelectedIndex === index;
          return (
            <button
              key={`${word.term}-${index}`}
              type="button"
              aria-pressed={selected}
              onClick={() => setSelectedIndex(index)}
              style={{
                ...canvasStyles.button,
                ...(selected ? canvasStyles.selectedButton : {}),
                ...wordCardStyles.card,
              }}
            >
              <span style={wordCardStyles.term}>{word.term}</span>
              <span style={wordCardStyles.cardHint}>Card {index + 1}</span>
            </button>
          );
        })}
      </div>
      <div style={wordCardStyles.definition} aria-live="polite">
        <span style={wordCardStyles.definitionLabel}>Meaning</span>
        <strong style={wordCardStyles.definitionTerm}>{selectedWord.term}</strong>
        <p style={wordCardStyles.definitionText}>{selectedWord.meaning}</p>
      </div>
    </div>
  );
}

const wordCardStyles = {
  layout: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "minmax(180px, 1fr) minmax(220px, 1.15fr)",
    gap: 18,
    alignItems: "stretch",
  },
  cards: {
    display: "grid",
    gap: 10,
  },
  card: {
    minHeight: 82,
    padding: 14,
    textAlign: "left",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: 8,
  },
  term: {
    fontSize: 20,
    fontWeight: 800,
    lineHeight: 1.2,
    overflowWrap: "anywhere",
  },
  cardHint: {
    color: "#667085",
    fontSize: 13,
    fontWeight: 700,
  },
  definition: {
    border: "1px solid #d5d9e2",
    borderRadius: 8,
    background: "#f8fafc",
    padding: 18,
    minHeight: 190,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 8,
  },
  definitionLabel: {
    color: "#526070",
    fontSize: 13,
    fontWeight: 800,
    textTransform: "uppercase",
  },
  definitionTerm: {
    color: "#0f3e8a",
    fontSize: 26,
    lineHeight: 1.2,
    overflowWrap: "anywhere",
  },
  definitionText: {
    color: "#344054",
    fontSize: 17,
    lineHeight: 1.5,
    margin: 0,
  },
} satisfies Record<string, CSSProperties>;

function ScienceCycle({ visual }: { visual: Extract<LessonVisual, { kind: "science_cycle" }> }) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [visual.nodes]);

  if (visual.nodes.length === 0) {
    return <p style={emptyStyles.message}>No cycle nodes for this step yet.</p>;
  }

  const total = visual.nodes.length;
  const safeSelectedIndex = clampInteger(selectedIndex, 0, total - 1);
  const selectedNode = visual.nodes[safeSelectedIndex];

  return (
    <div style={cycleStyles.layout}>
      <div style={cycleStyles.diagram} aria-label={`${visual.title} cycle`}>
        {visual.nodes.map((node, index) => {
          const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
          const left = 50 + 36 * Math.cos(angle);
          const top = 50 + 36 * Math.sin(angle);
          const selected = safeSelectedIndex === index;

          return (
            <button
              key={`${node}-${index}`}
              type="button"
              aria-pressed={selected}
              onClick={() => setSelectedIndex(index)}
              style={{
                ...cycleStyles.node,
                left: `${left}%`,
                top: `${top}%`,
                borderColor: selected ? "#0e9384" : "#c9d1df",
                background: selected ? "#e6f7f4" : "#ffffff",
                color: selected ? "#0b4f48" : "#182230",
              }}
            >
              {node}
            </button>
          );
        })}
        <div style={cycleStyles.center}>
          <strong>{visual.title}</strong>
          <span>Cycle</span>
        </div>
      </div>
      <div style={cycleStyles.detail} aria-live="polite">
        <span style={cycleStyles.detailLabel}>Selected part</span>
        <strong style={cycleStyles.detailTitle}>{selectedNode}</strong>
        <span>
          Step {safeSelectedIndex + 1} of {total}
        </span>
      </div>
    </div>
  );
}

const cycleStyles = {
  layout: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "minmax(260px, 360px) minmax(180px, 1fr)",
    alignItems: "center",
    gap: 22,
  },
  diagram: {
    position: "relative",
    width: "100%",
    maxWidth: 360,
    aspectRatio: "1 / 1",
    borderRadius: "50%",
    border: "2px dashed #9aa6b2",
    background: "radial-gradient(circle, #f8fafc 0 44%, transparent 45%)",
  },
  node: {
    position: "absolute",
    transform: "translate(-50%, -50%)",
    minWidth: 98,
    maxWidth: 128,
    minHeight: 54,
    padding: "8px 10px",
    border: "2px solid #c9d1df",
    borderRadius: 8,
    cursor: "pointer",
    font: "inherit",
    fontWeight: 800,
    lineHeight: 1.15,
    textAlign: "center",
    overflowWrap: "anywhere",
    boxShadow: "0 8px 18px rgba(16, 24, 40, 0.08)",
  },
  center: {
    position: "absolute",
    inset: "35%",
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    alignContent: "center",
    gap: 2,
    color: "#344054",
    textAlign: "center",
  },
  detail: {
    borderLeft: "4px solid #0e9384",
    padding: "12px 0 12px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    color: "#344054",
  },
  detailLabel: {
    color: "#526070",
    fontSize: 13,
    fontWeight: 800,
    textTransform: "uppercase",
  },
  detailTitle: {
    color: "#0b4f48",
    fontSize: 28,
    lineHeight: 1.15,
    overflowWrap: "anywhere",
  },
} satisfies Record<string, CSSProperties>;

function FormulaBoard({ visual }: { visual: Extract<LessonVisual, { kind: "formula_board" }> }) {
  const formulaParts = useMemo(
    () => visual.formula.match(/[A-Za-z0-9]+|[^A-Za-z0-9\s]+/g) ?? [visual.formula],
    [visual.formula],
  );
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [visual.formula]);

  const safeSelectedIndex = clampInteger(selectedIndex, 0, formulaParts.length - 1);

  return (
    <div style={formulaStyles.board}>
      <div style={formulaStyles.formula} aria-label="Formula">
        {formulaParts.map((part, index) => {
          const selected = safeSelectedIndex === index;
          const color = palette[index % palette.length];

          return (
            <button
              key={`${part}-${index}`}
              type="button"
              aria-pressed={selected}
              onClick={() => setSelectedIndex(index)}
              style={{
                ...formulaStyles.part,
                borderColor: selected ? color : "#d5d9e2",
                background: selected ? `${color}1a` : "#ffffff",
                color: selected ? color : "#182230",
              }}
            >
              {part}
            </button>
          );
        })}
      </div>
      <div style={formulaStyles.explanation}>
        <span style={formulaStyles.label}>Explanation</span>
        <p style={formulaStyles.text}>{visual.explanation}</p>
      </div>
    </div>
  );
}

const formulaStyles = {
  board: {
    width: "100%",
    border: "1px solid #29394d",
    borderRadius: 8,
    background: "#172033",
    color: "#ffffff",
    padding: 18,
    display: "grid",
    gap: 16,
  },
  formula: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  part: {
    minHeight: 44,
    border: "2px solid #d5d9e2",
    borderRadius: 8,
    padding: "8px 12px",
    cursor: "pointer",
    font: "inherit",
    fontSize: 18,
    fontWeight: 800,
    overflowWrap: "anywhere",
  },
  explanation: {
    borderTop: "1px solid rgba(255, 255, 255, 0.18)",
    paddingTop: 14,
    display: "grid",
    gap: 6,
  },
  label: {
    color: "#b9c0cc",
    fontSize: 13,
    fontWeight: 800,
    textTransform: "uppercase",
  },
  text: {
    margin: 0,
    color: "#f3f6fb",
    fontSize: 17,
    lineHeight: 1.5,
  },
} satisfies Record<string, CSSProperties>;

const emptyStyles = {
  message: {
    color: "#526070",
    margin: 0,
  },
} satisfies Record<string, CSSProperties>;

function renderVisual(visual: LessonVisual) {
  switch (visual.kind) {
    case "fraction_pizza":
      return <FractionPizza visual={visual} />;
    case "word_cards":
      return <WordCards visual={visual} />;
    case "science_cycle":
      return <ScienceCycle visual={visual} />;
    case "formula_board":
      return <FormulaBoard visual={visual} />;
    default: {
      const unreachable: never = visual;
      return unreachable;
    }
  }
}

export function LessonCanvas({ step }: LessonCanvasProps) {
  return (
    <section style={canvasStyles.shell} aria-labelledby={`lesson-step-${step.id}`}>
      <div style={canvasStyles.header}>
        <span style={canvasStyles.eyebrow}>Lesson canvas</span>
        <h2 id={`lesson-step-${step.id}`} style={canvasStyles.title}>
          {step.title}
        </h2>
      </div>
      <div style={canvasStyles.visualArea}>{renderVisual(step.visual)}</div>
    </section>
  );
}

export default LessonCanvas;
