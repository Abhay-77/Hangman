const express = require("express");

const app = express();
const PORT = process.env.PORT | 3000;

app.use(express.json());

const rooms = [];

app.post("/api/createroom", (req, res) => {
  res.send("Created a room");
});

app.listen(PORT, () => {
  console.log("Server started");
});
