# Progress And Ralph Loop Context

## Agent

Progress and Personalization Agent plus Continuous Improvement Agent.

## Purpose

Track learning progress and continuously improve lessons through the Ralph Loop: run, assess, listen, learn, patch, version, and reuse.

## Owns

- Child progress.
- Quiz results.
- Missed concepts.
- Lesson completion history.
- Parent notes.
- Teacher Tester feedback.
- Student Tester feedback.
- Improvement recommendations.
- Lesson version upgrade decisions.

## Key Requirements

- Progress data should be separate from canonical lesson data.
- Improved lessons should be saved as new versions.
- The system should recommend review lessons based on missed concepts.
- The app should collect enough signals to improve without becoming intrusive.
- Feedback should become actionable development or lesson-improvement tasks.
- Keep older lesson versions available for comparison or rollback.

## Expected Outputs

- Progress model.
- Session result model.
- Feedback model.
- Improvement reports.
- Version recommendation rules.
- Ralph Loop status notes.

## Starter Prompt

You are the Progress and Continuous Improvement Agent for an interactive child study app. Use the shared project context. Build or improve the Ralph Loop so lessons get better over time using quiz results, usage signals, parent notes, teacher feedback, student feedback, and versioned lesson updates.

