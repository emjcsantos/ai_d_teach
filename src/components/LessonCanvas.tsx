import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Play, Square } from "lucide-react";
import { canSpeak, speak, stopSpeaking } from "../lib/textToSpeech";
import type { LessonActivityTask, LessonStep, LessonVisual } from "../types/lesson";

export type CanvasPracticeState = {
  complete: boolean;
  active: boolean;
  prompt: string;
};

export type CanvasActivityAttempt = {
  stepId: string;
  taskId: string;
  taskKind: LessonActivityTask["kind"];
  response: string;
  correct: boolean;
};

export type LessonCanvasProps = {
  step: LessonStep;
  onPracticeStateChange?: (state: CanvasPracticeState) => void;
  onActivityAttempt?: (attempt: CanvasActivityAttempt) => void;
  voiceRate: number;
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

type FractionScenario = {
  id: string;
  instruction: string;
  success: string;
  hint?: string;
  target: number;
};

function buildFractionScenarios(
  parts: number,
  highlightedCount: number,
  practiceTargets?: number[],
  teacherTasks?: Extract<LessonActivityTask, { kind: "select_fraction_count" }>[],
) {
  if (teacherTasks?.length) {
    return teacherTasks.map<FractionScenario>((task) => ({
      id: task.id,
      instruction: task.instruction,
      success: task.success,
      hint: task.hint,
      target: task.targetCount,
    }));
  }

  const validTargets = (practiceTargets?.length ? practiceTargets : [highlightedCount]).filter(
    (target, index, values) => target >= 1 && target <= parts && values.indexOf(target) === index,
  );
  const targets = validTargets.length ? validTargets : [clampInteger(highlightedCount, 1, parts)];

  return targets.map<FractionScenario>((target) => {
    const label = `${target}/${parts}`;
    const instruction =
      target === parts
        ? `Click the whole pizza: ${label}.`
        : `Click ${label} of the pizza.`;
    const success =
      target === parts
        ? "Great. The whole pizza is selected."
        : `Yes. ${label} means ${target} out of ${parts} equal parts.`;

    return { id: `fraction-${target}-${parts}`, instruction, success, target };
  });
}

function getTasksForKind<TKind extends LessonActivityTask["kind"]>(
  step: LessonStep,
  kind: TKind,
) {
  return (step.teacherTasks ?? []).filter(
    (task): task is Extract<LessonActivityTask, { kind: TKind }> => task.kind === kind,
  );
}

function InstructorTaskCard({
  current,
  instruction,
  total,
  voiceRate,
}: {
  current: number;
  instruction: string;
  total: number;
  voiceRate: number;
}) {
  const [speechAvailable, setSpeechAvailable] = useState(false);
  const [isReadingInstruction, setIsReadingInstruction] = useState(false);

  useEffect(() => {
    setSpeechAvailable(canSpeak());
  }, []);

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  useEffect(() => {
    setIsReadingInstruction(false);
  }, [instruction]);

  function toggleInstructionVoice() {
    if (isReadingInstruction) {
      stopSpeaking();
      setIsReadingInstruction(false);
      return;
    }

    setIsReadingInstruction(true);
    speak(instruction, {
      rate: voiceRate,
      onEnd: () => setIsReadingInstruction(false),
    });
  }

  return (
    <section className="instructor-card" aria-live="polite">
      <div>
        <span>Teacher task</span>
        <strong>{instruction}</strong>
      </div>
      <div className="instructor-card__controls">
        <button
          type="button"
          className="instructor-voice"
          disabled={!speechAvailable}
          onClick={toggleInstructionVoice}
          title={speechAvailable ? "Read teacher task aloud" : "Browser speech is unavailable"}
        >
          {isReadingInstruction ? <Square size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
          <span>{isReadingInstruction ? "Stop" : "Read"}</span>
        </button>
        <div className="instructor-progress" aria-label={`Scenario ${current + 1} of ${total}`}>
          {Array.from({ length: total }, (_, index) => (
            <span
              key={index}
              className={[
                "instructor-progress__dot",
                index < current ? "is-done" : "",
                index === current ? "is-current" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FractionPizza({
  visual,
  tasks,
  onPracticeStateChange,
  onActivityAttempt,
  voiceRate,
}: {
  visual: Extract<LessonVisual, { kind: "fraction_pizza" }>;
  tasks: Extract<LessonActivityTask, { kind: "select_fraction_count" }>[];
  onPracticeStateChange?: (state: CanvasPracticeState) => void;
  onActivityAttempt?: (attempt: Omit<CanvasActivityAttempt, "stepId">) => void;
  voiceRate: number;
}) {
  const parts = clampInteger(visual.parts, 1, 16);
  const highlightedCount = clampInteger(visual.highlight, 0, parts);
  const scenarios = useMemo(
    () => buildFractionScenarios(parts, Math.max(1, highlightedCount), visual.practiceTargets, tasks),
    [highlightedCount, parts, tasks, visual.practiceTargets],
  );
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [selectedSlices, setSelectedSlices] = useState<Set<number>>(() => new Set());
  const safeScenarioIndex = clampInteger(scenarioIndex, 0, scenarios.length - 1);
  const scenario = scenarios[safeScenarioIndex];
  const selectedCount = selectedSlices.size;
  const matchesTarget = selectedCount === scenario.target;
  const isLastScenario = safeScenarioIndex === scenarios.length - 1;
  const practiceComplete = matchesTarget && isLastScenario;
  const targetLabel = `${scenario.target}/${parts}`;

  useEffect(() => {
    setScenarioIndex(0);
    setSelectedSlices(new Set());
  }, [parts, highlightedCount, visual.practiceTargets]);

  useEffect(() => {
    onPracticeStateChange?.({
      active: true,
      complete: practiceComplete,
      prompt: scenario.instruction,
    });
  }, [onPracticeStateChange, practiceComplete, scenario.instruction]);

  function reportFractionAttempt(nextSelectedCount: number) {
    onActivityAttempt?.({
      taskId: scenario.id,
      taskKind: "select_fraction_count",
      response: `${nextSelectedCount}/${parts}`,
      correct: nextSelectedCount === scenario.target,
    });
  }

  function toggleSlice(index: number) {
    setSelectedSlices((current) => {
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      reportFractionAttempt(next.size);
      return next;
    });
  }

  function moveToNextScenario() {
    if (!matchesTarget || isLastScenario) {
      return;
    }

    setScenarioIndex((current) => clampInteger(current + 1, 0, scenarios.length - 1));
    setSelectedSlices(new Set());
  }

  return (
    <div className="canvas-visual canvas-visual--fraction">
      <InstructorTaskCard
        current={safeScenarioIndex}
        instruction={scenario.instruction}
        total={scenarios.length}
        voiceRate={voiceRate}
      />

      <div className="fraction-workbench">
        <svg
          role="img"
          aria-label={`${targetLabel} pizza fraction model`}
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
            {targetLabel}
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
            ? scenario.success
            : selectedCount < scenario.target
              ? scenario.hint ??
                `Keep going. Select ${scenario.target - selectedCount} more part${
                  scenario.target - selectedCount === 1 ? "" : "s"
                }.`
              : `Too many parts. Unclick ${selectedCount - scenario.target} part${
                  selectedCount - scenario.target === 1 ? "" : "s"
                }.`}
        </p>
        {matchesTarget && !isLastScenario ? (
          <button type="button" className="canvas-callout__action" onClick={moveToNextScenario}>
            Next challenge
          </button>
        ) : null}
        {practiceComplete ? <p className="canvas-callout__complete">All fraction challenges complete.</p> : null}
      </aside>
    </div>
  );
}

function WordCards({
  visual,
  tasks,
  onPracticeStateChange,
  onActivityAttempt,
  voiceRate,
}: {
  visual: Extract<LessonVisual, { kind: "word_cards" }>;
  tasks: Extract<LessonActivityTask, { kind: "tap_word_card" }>[];
  onPracticeStateChange?: (state: CanvasPracticeState) => void;
  onActivityAttempt?: (attempt: Omit<CanvasActivityAttempt, "stepId">) => void;
  voiceRate: number;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [taskIndex, setTaskIndex] = useState(0);
  const safeTaskIndex = clampInteger(taskIndex, 0, Math.max(0, tasks.length - 1));
  const task = tasks[safeTaskIndex];
  const taskSignature = tasks.map((item) => item.id).join("|");

  useEffect(() => {
    setSelectedIndex(0);
    setTaskIndex(0);
  }, [taskSignature, visual.words]);

  if (visual.words.length === 0) {
    return <p className="canvas-empty">No vocabulary cards for this step yet.</p>;
  }

  const safeSelectedIndex = clampInteger(selectedIndex, 0, visual.words.length - 1);
  const selectedWord = visual.words[safeSelectedIndex];
  const selectedMatchesTask =
    Boolean(task) && selectedWord.term.trim().toLowerCase() === task.target.trim().toLowerCase();
  const isLastTask = safeTaskIndex === tasks.length - 1;
  const practiceComplete = Boolean(task) && selectedMatchesTask && isLastTask;

  useEffect(() => {
    onPracticeStateChange?.({
      active: tasks.length > 0,
      complete: practiceComplete,
      prompt: task?.instruction ?? "",
    });
  }, [onPracticeStateChange, practiceComplete, task?.instruction, tasks.length]);

  function chooseWord(index: number) {
    const word = visual.words[index];
    const correct = Boolean(task) && word.term.trim().toLowerCase() === task.target.trim().toLowerCase();
    setSelectedIndex(index);
    if (task) {
      onActivityAttempt?.({
        taskId: task.id,
        taskKind: "tap_word_card",
        response: word.term,
        correct,
      });
    }
  }

  function moveToNextTask() {
    if (selectedMatchesTask && !isLastTask) {
      setTaskIndex((current) => clampInteger(current + 1, 0, tasks.length - 1));
    }
  }

  return (
    <div className="canvas-visual canvas-visual--words">
      {task ? (
        <InstructorTaskCard
          current={safeTaskIndex}
          instruction={task.instruction}
          total={tasks.length}
          voiceRate={voiceRate}
        />
      ) : null}
      <div className="word-card-grid" aria-label="Vocabulary cards">
        {visual.words.map((word, index) => {
          const selected = safeSelectedIndex === index;
          return (
            <button
              key={`${word.term}-${index}`}
              type="button"
              aria-pressed={selected}
              className={selected ? "study-word-card is-selected" : "study-word-card"}
              onClick={() => chooseWord(index)}
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
        <p>
          {task
            ? selectedMatchesTask
              ? task.success
              : task.hint ?? selectedWord.meaning
            : selectedWord.meaning}
        </p>
        {task && selectedMatchesTask && !isLastTask ? (
          <button type="button" className="canvas-callout__action" onClick={moveToNextTask}>
            Next task
          </button>
        ) : null}
      </aside>
    </div>
  );
}

function ScienceCycle({
  visual,
  tasks,
  onPracticeStateChange,
  onActivityAttempt,
  voiceRate,
}: {
  visual: Extract<LessonVisual, { kind: "science_cycle" }>;
  tasks: Extract<LessonActivityTask, { kind: "tap_cycle_node" }>[];
  onPracticeStateChange?: (state: CanvasPracticeState) => void;
  onActivityAttempt?: (attempt: Omit<CanvasActivityAttempt, "stepId">) => void;
  voiceRate: number;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [taskIndex, setTaskIndex] = useState(0);
  const safeTaskIndex = clampInteger(taskIndex, 0, Math.max(0, tasks.length - 1));
  const task = tasks[safeTaskIndex];
  const taskSignature = tasks.map((item) => item.id).join("|");

  useEffect(() => {
    setSelectedIndex(0);
    setTaskIndex(0);
  }, [taskSignature, visual.nodes]);

  if (visual.nodes.length === 0) {
    return <p className="canvas-empty">No cycle nodes for this step yet.</p>;
  }

  const total = visual.nodes.length;
  const safeSelectedIndex = clampInteger(selectedIndex, 0, total - 1);
  const selectedNode = visual.nodes[safeSelectedIndex];
  const selectedMatchesTask =
    Boolean(task) && selectedNode.trim().toLowerCase() === task.target.trim().toLowerCase();
  const isLastTask = safeTaskIndex === tasks.length - 1;
  const practiceComplete = Boolean(task) && selectedMatchesTask && isLastTask;

  useEffect(() => {
    onPracticeStateChange?.({
      active: tasks.length > 0,
      complete: practiceComplete,
      prompt: task?.instruction ?? "",
    });
  }, [onPracticeStateChange, practiceComplete, task?.instruction, tasks.length]);

  function chooseNode(index: number) {
    const node = visual.nodes[index];
    const correct = Boolean(task) && node.trim().toLowerCase() === task.target.trim().toLowerCase();
    setSelectedIndex(index);
    if (task) {
      onActivityAttempt?.({
        taskId: task.id,
        taskKind: "tap_cycle_node",
        response: node,
        correct,
      });
    }
  }

  function moveToNextTask() {
    if (selectedMatchesTask && !isLastTask) {
      setTaskIndex((current) => clampInteger(current + 1, 0, tasks.length - 1));
    }
  }

  return (
    <div className="canvas-visual canvas-visual--cycle">
      {task ? (
        <InstructorTaskCard
          current={safeTaskIndex}
          instruction={task.instruction}
          total={tasks.length}
          voiceRate={voiceRate}
        />
      ) : null}
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
              onClick={() => chooseNode(index)}
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
          {task
            ? selectedMatchesTask
              ? task.success
              : task.hint ?? "Try another part in the cycle."
            : `Step ${safeSelectedIndex + 1} of ${total}. Tap another part to follow the process.`}
        </p>
        {task && selectedMatchesTask && !isLastTask ? (
          <button type="button" className="canvas-callout__action" onClick={moveToNextTask}>
            Next task
          </button>
        ) : null}
      </aside>
    </div>
  );
}

function FormulaBoard({
  visual,
  tasks,
  onPracticeStateChange,
  onActivityAttempt,
  voiceRate,
}: {
  visual: Extract<LessonVisual, { kind: "formula_board" }>;
  tasks: Extract<LessonActivityTask, { kind: "tap_formula_token" }>[];
  onPracticeStateChange?: (state: CanvasPracticeState) => void;
  onActivityAttempt?: (attempt: Omit<CanvasActivityAttempt, "stepId">) => void;
  voiceRate: number;
}) {
  const formulaParts = useMemo(
    () => visual.formula.match(/[A-Za-z0-9]+|[^A-Za-z0-9\s]+/g) ?? [visual.formula],
    [visual.formula],
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [taskIndex, setTaskIndex] = useState(0);
  const [taskWasTried, setTaskWasTried] = useState(false);
  const safeTaskIndex = clampInteger(taskIndex, 0, Math.max(0, tasks.length - 1));
  const task = tasks[safeTaskIndex];
  const taskSignature = tasks.map((item) => item.id).join("|");

  useEffect(() => {
    setSelectedIndex(0);
    setTaskIndex(0);
    setTaskWasTried(false);
  }, [taskSignature, visual.formula]);

  const safeSelectedIndex = clampInteger(selectedIndex, 0, formulaParts.length - 1);
  const selectedToken = formulaParts[safeSelectedIndex];
  const selectedTokenMatchesTask =
    Boolean(task) &&
    taskWasTried &&
    selectedToken.trim().toLowerCase() === task.target.trim().toLowerCase();
  const isLastTask = safeTaskIndex === tasks.length - 1;
  const practiceComplete = Boolean(task) && selectedTokenMatchesTask && isLastTask;

  useEffect(() => {
    onPracticeStateChange?.({
      active: tasks.length > 0,
      complete: practiceComplete,
      prompt: task?.instruction ?? "",
    });
  }, [onPracticeStateChange, practiceComplete, task?.instruction, tasks.length]);

  function chooseToken(index: number, token: string) {
    const correct = Boolean(task) && token.trim().toLowerCase() === task.target.trim().toLowerCase();
    setSelectedIndex(index);
    setTaskWasTried(true);
    if (task) {
      onActivityAttempt?.({
        taskId: task.id,
        taskKind: "tap_formula_token",
        response: token,
        correct,
      });
    }
  }

  function moveToNextTask() {
    if (!selectedTokenMatchesTask || isLastTask) {
      return;
    }

    setTaskIndex((current) => clampInteger(current + 1, 0, tasks.length - 1));
    setTaskWasTried(false);
  }

  return (
    <div className="canvas-visual canvas-visual--formula">
      {task ? (
        <InstructorTaskCard
          current={safeTaskIndex}
          instruction={task.instruction}
          total={tasks.length}
          voiceRate={voiceRate}
        />
      ) : null}
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
                onClick={() => {
                  chooseToken(index, part);
                }}
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
          <p>
            {task
              ? selectedTokenMatchesTask
                ? task.success
                : `Tap ${task.target} in the formula.`
              : visual.explanation}
          </p>
          {task && selectedTokenMatchesTask && !isLastTask ? (
            <button type="button" className="formula-task-next" onClick={moveToNextTask}>
              Next task
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function renderVisual(
  step: LessonStep,
  voiceRate: number,
  onPracticeStateChange?: (state: CanvasPracticeState) => void,
  onActivityAttempt?: (attempt: CanvasActivityAttempt) => void,
) {
  const visual = step.visual;
  const reportActivityAttempt = (attempt: Omit<CanvasActivityAttempt, "stepId">) => {
    onActivityAttempt?.({ ...attempt, stepId: step.id });
  };

  switch (visual.kind) {
    case "fraction_pizza":
      return (
        <FractionPizza
          visual={visual}
          tasks={getTasksForKind(step, "select_fraction_count")}
          voiceRate={voiceRate}
          onPracticeStateChange={onPracticeStateChange}
          onActivityAttempt={reportActivityAttempt}
        />
      );
    case "word_cards":
      return (
        <WordCards
          visual={visual}
          tasks={getTasksForKind(step, "tap_word_card")}
          voiceRate={voiceRate}
          onPracticeStateChange={onPracticeStateChange}
          onActivityAttempt={reportActivityAttempt}
        />
      );
    case "science_cycle":
      return (
        <ScienceCycle
          visual={visual}
          tasks={getTasksForKind(step, "tap_cycle_node")}
          voiceRate={voiceRate}
          onPracticeStateChange={onPracticeStateChange}
          onActivityAttempt={reportActivityAttempt}
        />
      );
    case "formula_board":
      return (
        <FormulaBoard
          visual={visual}
          tasks={
            getTasksForKind(step, "tap_formula_token").length
              ? getTasksForKind(step, "tap_formula_token")
              : (visual.tasks ?? []).map((task, index) => ({
                  id: `formula-${index + 1}`,
                  kind: "tap_formula_token",
                  ...task,
                }))
          }
          voiceRate={voiceRate}
          onPracticeStateChange={onPracticeStateChange}
          onActivityAttempt={reportActivityAttempt}
        />
      );
    default: {
      const unreachable: never = visual;
      return unreachable;
    }
  }
}

export function LessonCanvas({
  step,
  onPracticeStateChange,
  onActivityAttempt,
  voiceRate,
}: LessonCanvasProps) {
  return (
    <section className="lesson-canvas" aria-labelledby={`lesson-step-${step.id}`}>
      <header className="lesson-canvas__header">
        <span>Interactive canvas</span>
        <h2 id={`lesson-step-${step.id}`}>{step.title}</h2>
      </header>
      <div className="lesson-canvas__stage">
        {renderVisual(step, voiceRate, onPracticeStateChange, onActivityAttempt)}
      </div>
    </section>
  );
}

export default LessonCanvas;
