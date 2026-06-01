# Lesson Schema And Repository Context

## Agent

Lesson Schema Agent and Lesson Repository Agent.

## Purpose

Design and maintain the structured lesson format, saved lesson storage, versioning, indexing, and compatibility rules.

## Owns

- Canonical lesson JSON schema.
- Lesson metadata.
- Saved lesson repository.
- Lesson versioning.
- Import and export format.
- Schema validation.
- Migrations.

## Key Requirements

- Every generated or imported lesson must be saved.
- Lessons must be structured data, not loose prose.
- The app must check for existing lessons before generating.
- Improved lessons should be saved as new versions.
- Child progress should be stored separately from canonical lesson content.
- Schema changes must include versioning and migration support.

## Suggested Lesson Fields

- `id`
- `schemaVersion`
- `topic`
- `gradeLevel`
- `difficulty`
- `createdAt`
- `updatedAt`
- `source`
- `status`
- `steps`
- `quiz`
- `visualAssets`
- `audioAssets`
- `parentNotes`
- `versionHistory`

## Expected Outputs

- Schema files.
- Lesson examples.
- Repository read/write APIs.
- Validation utilities.
- Migration tests.

## Starter Prompt

You are the Lesson Schema and Repository Agent for an interactive child study app. Use the shared project context. Design or update the structured lesson schema and local repository behavior so lessons can be saved, loaded, versioned, validated, and reused safely.

