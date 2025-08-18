const express = require("express");
const { nanoid } = require("nanoid");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

type GameStatus = "waiting" | "live";

const rooms: {
  roomId: number;
  players: string[];
  word: string | null;
  status: GameStatus;
}[] = [];

app.post("/api/createroom", (req, res) => {
  try {
    const body = req.body();
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

app.listen(PORT, () => {
  console.log("Server started on port", PORT);
});
