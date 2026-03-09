# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A web-based chat interface powered by an LLM (Claude API). The app allows users to send messages and receive AI-generated responses in a conversational UI.

## Stack

- **Frontend**: HTML/CSS/JS (or a framework like React/Vue if added later)
- **LLM**: Anthropic Claude API (`claude-sonnet-4-6` as the default model)
- **Backend**: Node.js/Express (or similar) to proxy API calls and keep the API key server-side

## Key Conventions

- The API key must never be exposed to the frontend — all Claude API calls go through a backend route.
- Use the `claude-sonnet-4-6` model ID by default unless a specific model is required.
- Chat history should be maintained in a `messages` array and sent with each request (multi-turn conversation format).

## Common Commands

These will be filled in once the project is scaffolded. Expected commands:

```bash
npm install       # Install dependencies
npm run dev       # Start dev server
npm run build     # Build for production
npm start         # Start production server
```

## Architecture

```
/
├── public/          # Static frontend assets (HTML, CSS, client JS)
├── src/
│   ├── server.js    # Express server, API proxy route
│   └── ...
├── .env             # API key (never committed)
└── package.json
```

The frontend sends chat messages to a local backend endpoint (e.g. `POST /api/chat`). The backend appends the message to the conversation history, calls the Anthropic API, and streams or returns the response to the client.
