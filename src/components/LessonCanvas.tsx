import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { LessonStep, LessonVisual } from "../types/lesson";

export type LessonCanvasProps = {
  step: LessonStep;
};

const tokenPalette = ["#1c8a8a", "#e7664c", "#6e6fbf", "#5e9f58", "#b76b1d", "#2e6fba"];

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
  const matchesTarget = selectedCount === highlightedCount;

  return (
    <div className="canvas-visual canvas-visual--fraction">
      <div className="fraction-workbench">
        <svg
          role="img"
          aria-label={`${visual.label} pizza fraction model`}
          viewBox="0 0 200 200"
          className="fraction-pizza-svg"
        >
          <circle cx="100" cy="100" r="92" className="fraction-crust" />
          <circle cx="100" cy="100" r="78" className="fraction-guide" />
          {Array.from({ length: parts }, (_, index) => {
            const isSelected = selectedSlices.has(index);
            return (
              <path
                key={index}
                d={getFractionPath(index, parts)}
                className={isSelected ? "fraction-slice is-selected" : "fraction-slice"}
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
              />
            );
          })}
          <circle cx="100" cy="100" r="35" className="fraction-center" />
          <text x="100" y="107" textAnchor="middle" className="fraction-label">
            {visual.label}
          </text>
        </svg>

        <div className="fraction-meter" aria-label={`${selectedCount} of ${parts} slices selected`}>
          {Array.from({ length: parts }, (_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Toggle fraction bar part ${index + 1}`}
              aria-pressed={selectedSlices.has(index)}
                className={
                  selectedSlices.has(index)
                    ? "fraction-meter__part is-selected"
                    : "fraction-meter__part"
                }
              onClick={() => toggleSlice(index)}
            />
          ))}
        </div>
      </div>

      <aside className={matchesTarget ? "canvas-callout is-success" : "canvas-callout"}>
        <span className="canvas-callout__label">Fraction target</span>
        <strong>
          {selectedCount}/{parts}
        </strong>
        <p>
          {matchesTarget
            ? "Great match. The selected parts line up with the lesson."
            : "Tap slices or bars until the model matches the target."}
        </p>
      </aside>
    </div>
  );
}

function WordCards({ visual }: { visual: Extract<LessonVisual, { kind: "word_cards" }> }) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [visual.words]);

  if (visual.words.length === 0) {
    return <p className="canvas-empty">No vocabulary cards for this step yet.</p>;
  }

  const safeSelectedIndex = clampInteger(selectedIndex, 0, visual.words.length - 1);
  const selectedWord = visual.words[safeSelectedIndex];

  return (
    <div className="canvas-visual canvas-visual--words">
      <div className="word-card-grid" aria-label="Vocabulary cards">
        {visual.words.map((word, index) => {
          const selected = safeSelectedIndex === index;
          return (
            <button
              key={`${word.term}-${index}`}
              type="button"
              aria-pressed={selected}
              className={selected ? "study-word-card is-selected" : "study-word-card"}
              onClick={() => setSelectedIndex(index)}
            >
              <span className="study-word-card__term">{word.term}</span>
              <span className="study-word-card__hint">Reveal meaning</span>
            </button>
          );
        })}
      </div>

      <aside className="word-meaning-card" aria-live="polite">
        <span>Meaning</span>
        <strong>{selectedWord.term}</strong>
        <p>{selectedWord.meaning}</p>
      </aside>
    </div>
  );
}

function ScienceCycle({ visual }: { visual: Extract<LessonVisual, { kind: "science_cycle" }> }) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [visual.nodes]);

  if (visual.nodes.length === 0) {
    return <p className="canvas-empty">No cycle nodes for this step yet.</p>;
  }

  const total = visual.nodes.length;
  const safeSelectedIndex = clampInteger(selectedIndex, 0, total - 1);
  const selectedNode = visual.nodes[safeSelectedIndex];

  return (
    <div className="canvas-visual canvas-visual--cycle">
      <div className="science-cycle" aria-label={`${visual.title} cycle`}>
        <div className="science-cycle__track" />
        {visual.nodes.map((node, index) => {
          const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
          const left = 50 + 37 * Math.cos(angle);
          const top = 50 + 37 * Math.sin(angle);
          const selected = safeSelectedIndex === index;

          return (
            <button
              key={`${node}-${index}`}
              type="button"
              aria-pressed={selected}
              className={selected ? "science-cycle__node is-selected" : "science-cycle__node"}
              onClick={() => setSelectedIndex(index)}
              style={{ left: `${left}%`, top: `${top}%` }}
            >
              {node}
            </button>
          );
        })}
        <div className="science-cycle__center">
          <strong>{visual.title}</strong>
          <span>flow</span>
        </div>
      </div>

      <aside className="canvas-callout">
        <span className="canvas-callout__label">Selected part</span>
        <strong>{selectedNode}</strong>
        <p>
          Step {safeSelectedIndex + 1} of {total}. Tap another part to follow the process.
        </p>
      </aside>
    </div>
  );
}

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
  const selectedToken = formulaParts[safeSelectedIndex];

  return (
    <div className="canvas-visual canvas-visual--formula">
      <div className="formula-workbench">
        <div className="formula-token-row" aria-label="Formula tokens">
          {formulaParts.map((part, index) => {
            const selected = safeSelectedIndex === index;
            return (
              <button
                key={`${part}-${index}`}
                type="button"
                aria-pressed={selected}
                className={selected ? "formula-token is-selected" : "formula-token"}
                onClick={() => setSelectedIndex(index)}
                style={{ "--token-color": tokenPalette[index % tokenPalette.length] } as CSSProperties}
              >
                {part}
              </button>
            );
          })}
        </div>
        <div className="formula-explainer">
          <span>Focus piece</span>
          <strong>{selectedToken}</strong>
          <p>{visual.explanation}</p>
        </div>
      </div>
    </div>
  );
}

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
    <section className="lesson-canvas" aria-labelledby={`lesson-step-${step.id}`}>
      <header className="lesson-canvas__header">
        <span>Interactive canvas</span>
        <h2 id={`lesson-step-${step.id}`}>{step.title}</h2>
      </header>
      <div className="lesson-canvas__stage">{renderVisual(step.visual)}</div>
    </section>
  );
}

export default LessonCanvas;
