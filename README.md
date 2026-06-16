# Hangman — Real-time Multiplayer

A concise showcase of a Hangman game built with a TypeScript frontend and a Node.js backend, demonstrating real-time multiplayer implementation and game-development skills.

**Highlights**

- Real-time multiplayer using Socket.IO for low-latency events and room-based gameplay.
- Server-authoritative game logic with client-side UI and reconnection handling.
- Clear separation of frontend and backend with shared TypeScript types.

## Project Structure

- **Frontend**: React + Vite application (see [frontend/package.json](frontend/package.json)). Key files:
  - **Socket client**: [frontend/src/lib/socket.ts](frontend/src/lib/socket.ts)
  - **Environment**: [frontend/src/lib/env.ts](frontend/src/lib/env.ts)
  - **Room UI (join/start game)**: [frontend/src/pages/Room.tsx](frontend/src/pages/Room.tsx)
  - **Game UI**: [frontend/src/pages/Game.tsx](frontend/src/pages/Game.tsx)
- **Backend**: Node server using Socket.IO (see [backend/package.json](backend/package.json)). Key files:
  - **Server entry**: [backend/index.ts](backend/index.ts)
- **Shared types**: [shared/types.ts](shared/types.ts)

## Multiplayer & Implementation Notes (what to show off)

- Uses `socket.io` / `socket.io-client` for real-time events and room handling.
- Common events implemented in the codebase include `join-room`, `start-game`, `room-change`, and `new-game` (see [frontend/src/pages/Room.tsx](frontend/src/pages/Room.tsx)).
- Server accepts connections and manages sockets via `io.on("connection", ...)` (see [backend/index.ts](backend/index.ts)).
- Type-safe messages are coordinated with shared TypeScript `types.ts` to reduce runtime errors and speed up development.
- Architecture showcases key game-development skills:
  - Real-time synchronization and event design for multiplayer gameplay.
  - Room-based session management for isolated game instances.
  - Server-side game authority to prevent client desync and cheating.
  - Graceful reconnection and client lifecycle handling.

## Running Locally

Install dependencies and run both apps (from project root):

```bash
cd backend
npm install
npm run dev

# in a separate terminal
cd frontend
npm install
npm run dev
```

Open the frontend URL printed by Vite to create or join rooms and test multiplayer behavior across multiple browser windows or devices.

## Tips for Demonstration

- Show two browser windows joining the same room and starting a game to demonstrate real-time updates.
- Point out server logs in `backend/index.ts` where new connections and game events are logged.
- Explain event flow: client emits `join-room` → server updates room state → server emits `room-change` / `new-game` → clients update UI.

## Next Steps (optional)

- Add recording of game history or per-player stats persisted to a DB.
- Add automated tests for critical server events and room lifecycle.
- Add a small demo script that spawns multiple simulated clients to test scale.

---

If you want, I can also add a short demo GIF/recording, CI badges, or a CONTRIBUTING section. Which would you like next?
