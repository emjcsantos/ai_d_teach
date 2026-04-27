# ChatGPT App Prototype

AI D Teach can run as a ChatGPT App through the OpenAI Apps SDK pattern:

- ChatGPT acts as the tutor brain.
- The AI D Teach MCP server exposes lesson tools.
- The lesson widget renders an interactive canvas inside ChatGPT.

This lets the child converse with ChatGPT while the app provides structured lesson visuals, quiz interactions, and lesson state.

## Current Prototype

The first ChatGPT App prototype includes:

- `start_lesson`: finds or creates a lesson and renders the lesson canvas.
- `record_quiz_answer`: records quiz attempts from the widget.
- `record_feedback`: stores teacher, student, or improvement feedback.
- `public/lesson-widget.html`: iframe UI for ChatGPT.
- `server/apps-sdk-server.mjs`: MCP server exposed at `/mcp`.

The server currently stores lessons and progress in memory. This is enough for local development and connector testing, but production should use durable storage.

## Run Locally

Install dependencies:

```powershell
npm.cmd install
```

Start the MCP server:

```powershell
npm.cmd run chatgpt:app
```

By default, the server listens at:

```text
http://localhost:8787/mcp
```

## Connect To ChatGPT During Development

ChatGPT needs a public HTTPS URL for local development. Use a tunnel such as `ngrok`:

```powershell
ngrok http 8787
```

Then use the generated URL with `/mcp`:

```text
https://your-subdomain.ngrok.app/mcp
```

In ChatGPT:

1. Enable Developer Mode under Settings -> Apps & Connectors -> Advanced settings.
2. Go to Settings -> Connectors.
3. Create a connector.
4. Paste the HTTPS `/mcp` URL.
5. Open a new chat.
6. Add the connector from the More menu.
7. Ask: `Start a lesson about fractions for grade 3.`

## How The ChatGPT Version Differs From The Standalone App

Standalone app:

- Runs at `localhost:5173`.
- Uses local browser storage.
- Has a local tutor brain fallback.

ChatGPT App:

- Runs through ChatGPT.
- Uses ChatGPT as the conversational tutor.
- Uses the MCP server for lesson tools.
- Renders the interactive lesson canvas as an iframe component.

## Next Production Steps

- Replace in-memory server state with durable lesson storage.
- Share lesson schema between the standalone app and MCP server.
- Add authentication if the connector is used beyond local testing.
- Add more tools for lesson versioning and Ralph Loop improvements.
- Add automated MCP protocol tests.

