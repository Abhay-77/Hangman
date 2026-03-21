import express from "express";
import type { Request, Response } from "express";
import { nanoid } from "nanoid";
import { createServer } from "node:http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import type { GameState, RoomDetail } from "../shared/types";

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const PORT = process.env.PORT || 3000;
dotenv.config();

const maxGuesses = 6;

app.use(
  cors({
    origin: process.env.URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
  }),
);
app.use(express.json());

const rooms: RoomDetail[] = [];

app.post("/api/createroom", async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const id = nanoid(6).toUpperCase();
    rooms.push({
      roomId: id,
      players: [{ username: body.username, userId: nanoid(8) }],
      word: "",
      status: "waiting",
      host: body.username,
      gameOver: false,
      guessedLetters: [],
      wrongGuesses: 0,
    });
    res.json({ roomId: id, message: "Room created successfully", success: 1 });
  } catch (error) {
    console.error(error);
    res.json({ message: "Error occured", success: 0 });
  }
});

app.get("/api/getroom/:id", (req, res) => {
  try {
    const { id } = req.params;
    const room = rooms.find((r) => r.roomId === id);
    if (!room) {
      res.json({ success: 0, message: "No such room exists" });
      return;
    }
    res.json({ success: 1, message: "Room found", room: room });
  } catch (error) {
    console.error(error);
  }
});

app.post("/api/addplayer", (req, res) => {
  try {
    const { username, gameId } = req.body;
    const room = rooms.find((r) => r.roomId === gameId);
    if (!room) {
      res.json({ success: 0, message: "Such a room does not exist" });
      return;
    }
    if (room.players.some((player) => player.username === username)) {
      res.json({ success: 0, message: "Name already exists in room." });
      return;
    }
    room.players.push({ username, userId: nanoid(8) });
    io.to(gameId).emit("room-change", room);
    res.json({ success: 1, message: "Player added to room" });
  } catch (error) {
    res.json({ success: 0, message: "An error occured!Try again." });
    console.error(error);
  }
});

io.on("connection", (socket) => {
  console.log("New user connected", socket.id);
  socket.on("join-room", (roomId) => {
    console.log("Someone joined room", roomId);
    socket.join(roomId);
  });
  socket.on("disconnect", () => {
    // socket.leave(roomId)
    console.log("Someone left the room");
  });
  socket.on("start-game", (roomId) => {
    io.to(roomId).emit("start-game");
  });
  socket.on("letterpress-handle", (letter, roomId) => {
    const room = rooms.find((r) => r.roomId == roomId);
    if (!room) return;

    if (!room.guessedLetters.includes(letter)) {
      room.guessedLetters.push(letter);
      if (!room.word.includes(letter)) {
        room.wrongGuesses += 1;
      }
    }

    room.gameOver = room.wrongGuesses >= maxGuesses;
    const gameWon = room.word
      .split("")
      .every((ch) => room.guessedLetters.includes(ch));

    if (gameWon) {
      room.gameOver = true;
      io.to(roomId).except(room.word_chooser).emit("win-status");
      io.to(room.word_chooser).emit("lose-status");
    }
    if (room.gameOver) {
      io.to(roomId).emit("game-over");
    }

    const gameState: GameState = {
      guessedLetters: room.guessedLetters,
      wrongGuesses: room.wrongGuesses,
      wordLength: room.word.length,
      gameOver: room.gameOver,
      maskedWord: masked(room.word, room.guessedLetters),
    };

    io.to(roomId).emit("gamestate-update", gameState);
  });

  socket.on("nextgame-handle", (roomId: string) => {
    const room = rooms.find((r) => r.roomId == roomId);
    if (!room) return;
    room.word = null;
    room.gameOver = false;
    room.status = "waiting";
    room.guessedLetters = [];
    room.wrongGuesses = 0;
    io.to(roomId).emit("new-game", room);
  });

  socket.on("wordsubmit-handle", (word: string, roomId: string) => {
    const room = rooms.find((r) => r.roomId == roomId);
    if (!room) return;
    if (room.status === "live" && !room.gameOver) {
      socket.emit("word-rejected", "Round is still in progress");
      return;
    }
    room.word = word.toUpperCase();
    room.status = "live";
    const gameState: GameState = {
      guessedLetters: [],
      wrongGuesses: 0,
      wordLength: room.word.length,
      gameOver: false,
      maskedWord: masked(room.word, []),
    };

    room.word_chooser = socket.id;

    io.to(roomId).emit("word-set", room, gameState);
  });
});

app.get("/api/getgamestate/:id", (req, res) => {
  try {
    const { id } = req.params;
    const room = rooms.find((r) => r.roomId == id);
    if (!room) {
      res.json({ success: 0, message: "Room not found" });
    }
    const gameState: GameState = {
      guessedLetters: room.guessedLetters,
      wrongGuesses: room.wrongGuesses,
      wordLength: room.word.length,
      gameOver: room.gameOver,
      maskedWord: masked(room.word, room.guessedLetters),
    };
    res.json({ success: 1, message: "Gamestate found", gameState: gameState });
  } catch (e) {}
});

app.post("/api/leaveroom", (req, res) => {
  try {
    const { username, id } = req.body;
    const room = rooms.find((r) => r.roomId === id);
    if (!room) {
      res.json({ success: 0, message: "Room not found" });
      return;
    }
    const playerIndex = room.players.findIndex(
      (player) => player.username === username,
    );
    if (playerIndex !== -1) {
      room.players.splice(playerIndex, 1);
    }
    io.to(id).emit("room-change", room);
    res.json({ success: 1, message: "Player removed" });
  } catch (error) {
    console.error(error);
    res.json({ success: 0, message: "Player couldn't be removed" });
  }
});

function masked(word: string, guessedLetters: string[]): string {
  if (!word) {
    return "";
  }
  const masked_word = word
    .split("")
    .map((ch) => (guessedLetters.includes(ch) ? ch : "_"))
    .join(" ");
  return masked_word;
}

server.listen(PORT, () => {
  console.log("Server started on port", PORT);
});
