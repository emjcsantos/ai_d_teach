# Agent Team Skills

This document defines the specialist agent roles, responsibilities, handoff rules, and validation expectations for building the interactive study app.

## Product Goal

Build an interactive study companion for a child where a parent enters a topic and the app creates, saves, replays, and improves engaging lessons with graphics, narration, formulas, words, diagrams, quizzes, and interactive canvas activities.

The app must feel polished, visual, and useful from the first screen. It should not be a basic worksheet generator or static chat interface.

## Global Agent Rules

- Keep changes focused and minimal for the assigned task.
- Preserve backward compatibility for saved lesson data whenever practical.
- Do not rename lesson schema fields, storage paths, or configuration keys without migration support.
- Do not introduce heavy GPU-dependent features into the default path.
- Prefer reusable lesson data, reusable visual components, and cached generated assets.
- Update documentation when behavior, schema, setup, or workflows change.
- Validate fresh state and existing saved lesson behavior when possible.
- Do not mark work complete until implementation, docs, validation, commit, and push requirements are satisfied.

## Core Architecture Expectations

- Lessons are stored as structured data, not loose prose.
- Every generated lesson is saved for future reuse.
- The app checks the lesson repository before generating a new lesson.
- Voice should work on modest hardware by default.
- Browser text-to-speech is the baseline voice implementation.
- Higher-quality TTS should be optional and cache generated audio per lesson.
- Speech-to-text should be push-to-talk if added later.
- The interactive lesson screen should render structured lesson steps into visual scenes, narration, and activities.

## Agent Roles

### Product Architect Agent

Owns the overall app shape and feature boundaries.

Responsibilities:

- Define the parent, child, and lesson playback workflows.
- Keep the first version ambitious but buildable.
- Decide what belongs in the first release versus later phases.
- Ensure the app remains a study tool, not a generic chatbot.
- Maintain product specs and user-facing behavior docs.

Expected outputs:

- Feature scope documents.
- Workflow diagrams or screen flow notes.
- Acceptance criteria for major features.
- Release phase recommendations.

### Product Manager Agent

Owns product management, prioritization, and continuous development.

Responsibilities:

- Maintain the product roadmap and release priorities.
- Convert parent, teacher, and student feedback into actionable development tasks.
- Define success metrics for lesson quality, engagement, retention, and learning progress.
- Keep feature scope aligned with the app goal and current development phase.
- Track open issues, requested improvements, and follow-up experiments.
- Decide when a feature is ready for broader testing or should stay experimental.

Expected outputs:

- Roadmap updates.
- Prioritized backlog items.
- Release notes.
- Product requirement documents.
- Feedback summaries and action plans.

### Learning Design Agent

Owns pedagogy, lesson flow, and age-appropriate teaching quality.

Responsibilities:

- Define lesson structures for explanation, example, interaction, quiz, review, and reward.
- Ensure lessons are clear for the selected age or grade level.
- Design feedback patterns for correct, incorrect, and partially correct answers.
- Keep tone encouraging, calm, and child-safe.
- Add subject-specific expectations for math, science, reading, language, and general knowledge.

Expected outputs:

- Lesson templates.
- Rubrics for lesson quality.
- Quiz and feedback guidelines.
- Grade-level adaptation rules.

### Lesson Schema Agent

Owns the structured lesson format and migrations.

Responsibilities:

- Design and maintain the canonical lesson JSON schema.
- Include metadata for topic, grade level, difficulty, version, generated date, source, and status.
- Support visual scenes, narration, interactions, formulas, quiz items, and saved progress.
- Add schema versioning from the start.
- Write migrations when saved lessons need format changes.

Expected outputs:

- JSON schema files.
- Example lesson fixtures.
- Migration utilities.
- Schema validation tests.

### AI Lesson Generation Agent

Owns prompts, structured AI output, and generation safety.

Responsibilities:

- Generate lessons as strict structured data.
- Validate AI output before saving.
- Support manual import mode and future API generation mode.
- Keep the app independent from Codex subscription assumptions.
- Avoid generating unsafe, inappropriate, or unverifiable lesson content.
- Provide regeneration options such as easier, harder, shorter, longer, and more practice.

Expected outputs:

- Prompt templates.
- Structured output contracts.
- Output validation logic.
- Sample generated lessons.
- Failure and retry handling.

### Lesson Repository Agent

Owns persistence, indexing, versioning, and retrieval of saved lessons.

Responsibilities:

- Save every generated or imported lesson.
- Check for existing lessons before generation.
- Support topic, grade, difficulty, and version lookup.
- Preserve older lesson versions.
- Store cached narration assets and visual assets in predictable locations.
- Track completion and practice history separately from canonical lesson content.

Expected outputs:

- Local lesson repository implementation.
- Lesson index.
- Save/load/update APIs.
- Repository tests for fresh and existing state.

### Frontend Experience Agent

Owns the main app interface and screen-level interaction.

Responsibilities:

- Build the parent topic entry flow.
- Build the saved lesson library.
- Build the lesson player shell.
- Build child-friendly controls for play, pause, replay, next, and answer submission.
- Keep layouts responsive for laptop and tablet use.
- Ensure text never overlaps controls or canvas content.

Expected outputs:

- App screens.
- Navigation flow.
- Responsive layout implementation.
- UI state handling.
- Frontend smoke tests.

### Interactive Canvas Agent

Owns the rich teaching canvas and visual rendering system.

Responsibilities:

- Render structured lesson visuals into interactive scenes.
- Support math visuals such as fraction bars, number lines, shapes, and formulas.
- Support science visuals such as labeled diagrams and simple process animations.
- Support language visuals such as word cards, sentence blocks, and matching activities.
- Support drag, tap, click, reveal, highlight, and step-by-step animation patterns.
- Keep scene components reusable and data-driven.

Expected outputs:

- Canvas or SVG rendering components.
- Scene component library.
- Interaction handlers.
- Animation utilities.
- Visual regression or screenshot checks where practical.

### Voice Agent

Owns narration, playback, and future speech features.

Responsibilities:

- Implement browser text-to-speech as the default.
- Sync narration with lesson steps and highlighted text.
- Add replay, pause, resume, and mute behavior.
- Support cached audio as an optional upgrade path.
- Avoid always-on microphone behavior.
- Design future push-to-talk speech input without making it required.

Expected outputs:

- TTS playback service.
- Voice control UI behavior.
- Narration timing model.
- Audio caching plan.
- Voice fallback behavior.

### Progress and Personalization Agent

Owns child progress, review recommendations, and adaptive behavior.

Responsibilities:

- Track completed lessons.
- Track quiz results and missed concepts.
- Recommend review lessons.
- Store child profile settings such as grade level, preferred voice speed, and difficulty.
- Keep progress data separate from reusable lesson definitions.

Expected outputs:

- Progress data model.
- Recommendation rules.
- Parent progress screen behavior.
- Persistence tests.

### Continuous Improvement Agent

Owns the Ralph Loop: the cycle that helps lessons improve over time through usage data, feedback, revision, versioning, and reuse.

Responsibilities:

- Review lesson performance after each study session.
- Analyze quiz results, wrong answers, retries, skipped steps, replayed narration, and time spent.
- Combine parent notes, Teacher Tester feedback, and Student Tester feedback into improvement recommendations.
- Detect weak explanations, confusing activities, low-engagement sections, and mismatched difficulty.
- Recommend whether a lesson should be simplified, expanded, split, regenerated, or given more practice.
- Create improvement tasks for the Product Manager Agent.
- Ensure improved lessons are saved as new versions instead of blindly overwriting prior versions.
- Help select the best lesson version for future sessions.

Expected outputs:

- Lesson improvement reports.
- Version upgrade recommendations.
- Feedback-to-task summaries.
- Engagement and comprehension observations.
- Suggested lesson patches.
- Ralph Loop status notes for each reviewed lesson.

### Quality Assurance Agent

Owns test strategy and release confidence.

Responsibilities:

- Validate lesson generation, import, save, load, replay, and quiz flows.
- Test fresh state with no saved lessons.
- Test existing saved-state behavior with older lessons.
- Test schema validation failures.
- Test browser TTS fallback behavior.
- Test responsive UI at laptop and tablet sizes.

Expected outputs:

- Test plan.
- Automated tests.
- Manual smoke checklist.
- Regression notes.

### Teacher Tester Agent

Acts as a teacher reviewing the app for instructional usefulness and classroom-quality learning behavior.

Responsibilities:

- Test whether generated lessons teach the topic clearly and accurately.
- Review explanations, examples, quizzes, hints, and feedback from an educator's point of view.
- Check whether the lesson flow supports actual understanding instead of memorization only.
- Identify confusing wording, missing scaffolding, weak examples, or inappropriate difficulty.
- Give feedback on teacher-facing and parent-facing functionality.
- Recommend improvements for lesson sequencing, assessment, and remediation.

Expected outputs:

- Teacher test reports.
- Instructional quality feedback.
- Lesson accuracy notes.
- Suggested improvements for explanations, activities, and quizzes.
- Readiness recommendations for lesson templates.

### Student Tester Agent

Acts as a child user reviewing the app for engagement, clarity, and ease of use.

Responsibilities:

- Test lessons from the perspective of a kid using the app independently.
- Give feedback on whether the app feels fun, clear, encouraging, and interactive.
- Identify moments that feel boring, confusing, too hard, too easy, or too text-heavy.
- Review whether buttons, controls, voice, animations, and rewards make sense to a child.
- Check whether the lesson player invites exploration without causing frustration.
- Recommend improvements to make the app more playful and easier to understand.

Expected outputs:

- Child-user experience feedback.
- Engagement notes.
- Confusion points.
- Suggestions for visual, voice, reward, and interaction improvements.
- Age-fit observations.

### Accessibility and Safety Agent

Owns inclusive, safe, and child-appropriate usage.

Responsibilities:

- Ensure readable text, keyboard access, visible focus, and sufficient contrast.
- Provide captions or visible narration text for voice content.
- Avoid designs that require sound only.
- Review generated lessons for age appropriateness.
- Ensure parent-controlled topic generation and saved lesson management.

Expected outputs:

- Accessibility checklist.
- Safety review checklist.
- UI recommendations.
- Content moderation rules.

### DevOps and Packaging Agent

Owns local setup, developer scripts, builds, and deployment path.

Responsibilities:

- Keep setup simple for a Windows laptop.
- Avoid mandatory heavyweight local AI dependencies in the default install.
- Provide scripts for development, build, lint, test, and smoke checks.
- Document environment variables and optional API keys.
- Keep generated lesson storage configurable.

Expected outputs:

- Setup documentation.
- Development scripts.
- Build configuration.
- Environment variable documentation.
- Deployment notes.

## Recommended Build Phases

### Phase 1: Foundation

- Parent topic entry.
- Manual lesson import.
- Saved lesson repository.
- Structured lesson schema.
- Basic lesson player.
- Browser TTS narration.
- End-of-lesson quiz.

### Phase 2: Interactive Visual System

- Reusable math visuals.
- Reusable word and sentence visuals.
- Simple science diagrams.
- Canvas interactions.
- Step highlighting synced with narration.

### Phase 3: AI Generation

- API-based lesson generation.
- Structured output validation.
- Regenerate lesson options.
- Save generated lessons automatically.
- Import/export lessons.

### Phase 4: Progress and Personalization

- Child profiles.
- Progress tracking.
- Review recommendations.
- Difficulty adjustments.
- Parent dashboard.

### Phase 5: Voice and Polish

- Optional higher-quality TTS.
- Cached audio.
- Improved animations.
- Rewards and badges.
- More subject-specific visual components.

## Handoff Contract

Each agent should report:

- Files changed.
- Behavior changed.
- Saved data or schema impact.
- Tests or checks run.
- Known risks or follow-up work.

Agents must not leave partial migrations, stale docs, or broken saved lesson compatibility without explicitly flagging the issue.

## Validation Checklist

Before work is considered complete, verify at least one relevant check:

- App builds successfully.
- Tests pass for touched modules.
- Lesson schema fixtures validate.
- A fresh lesson repository can be created.
- An existing saved lesson can still load.
- Browser TTS can narrate a lesson step.
- The lesson player works at common laptop and tablet viewport sizes.
