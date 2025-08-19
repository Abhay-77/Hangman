import express from "express";
import type { Request, Response } from "express";
import { nanoid } from "nanoid";
import { createServer } from "node:http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const PORT = process.env.PORT || 3000;

app.use(express.json());

type GameStatus = "waiting" | "live";
export type RoomDetail = {
  roomId: string;
  players: string[];
  word: string | null;
  status: GameStatus;
  host: string;
};

const rooms: RoomDetail[] = [];

app.post("/api/createroom", async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const id = nanoid(6).toUpperCase();
    rooms.push({
      roomId: id,
      players: [body.username],
      word: null,
      status: "waiting",
      host: body.username,
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
    if (room.players.includes(username)) {
      res.json({ success: 0, message: "Name already exists in room." });
      return;
    }
    room.players.push(username);
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
});

app.post("/api/leaveroom", (req, res) => {
  try {
    const { username, id } = req.body;
    const room = rooms.find((r) => r.roomId === id);
    if (room.players.includes(username)) {
      room.players.splice(room.players.indexOf(username), 1);
    }
    io.to(id).emit("room-change",room);
    res.json({success:1,message:"Player removed"})
  } catch (error) {
    console.error(error)
    res.json({success:0,message:"Player couldn't be removed"})
  }
});

server.listen(PORT, () => {
  console.log("Server started on port", PORT);
});
