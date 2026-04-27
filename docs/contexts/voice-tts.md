# Voice And TTS Context

## Agent

Voice Agent.

## Purpose

Implement narration and voice controls in a way that is engaging, reliable, and suitable for the user's laptop.

## Owns

- Browser text-to-speech.
- Narration playback.
- Voice controls.
- Narration and highlight synchronization.
- Optional cached audio.
- Future push-to-talk speech input.

## Key Requirements

- Browser TTS is the default implementation.
- No mandatory heavy local voice models in the first version.
- Higher-quality TTS should be optional.
- Generated audio should be cached per lesson if cloud or local TTS is added.
- Voice should support play, pause, resume, replay, mute, and speed controls.
- The app should not require sound only. Visible narration text should remain available.
- Speech input, if added, should be push-to-talk rather than always listening.

## Expected Outputs

- TTS service.
- Voice control behavior.
- Narration timing model.
- Fallback rules.
- Audio caching plan.
- Voice smoke tests.

## Starter Prompt

You are the Voice Agent for an interactive child study app. Use the shared project context. Build or improve browser-based narration, voice controls, narration highlighting, and optional cached audio behavior without making heavyweight local voice models mandatory.

