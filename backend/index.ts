import express from "express";
import type {Request,Response} from "express"
import { nanoid } from "nanoid";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

type GameStatus = "waiting" | "live";
export type RoomDetail = {
  roomId: string;
  players: string[];
  word: string | null;
  status: GameStatus;
};

const rooms: RoomDetail[] = [];

app.post("/api/createroom", async (req:Request, res:Response) => {
  try {
    const body = req.body;
    const id = nanoid(6).toUpperCase();
    rooms.push({
      roomId: id,
      players: [body.username],
      word: null,
      status: "waiting",
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
      res.json({success:0,message:"No such room exists"})
    }
    res.json({ success: 1, message: "Room found", room: room });
  } catch (error) {
    console.error(error);
  }
});

app.listen(PORT, () => {
  console.log("Server started on port", PORT);
});
