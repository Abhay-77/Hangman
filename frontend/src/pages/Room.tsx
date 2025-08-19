import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { RoomDetail } from "../../../backend/index";
import { Button } from "@/components/ui/button";
import { io } from "socket.io-client";

const Game = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const username = decodeURIComponent(searchParams.get("username")!);
  const [room, setRoom] = useState<RoomDetail>();
  const [error, setError] = useState("");
  const navigate = useNavigate();

  
  useEffect(() => {
    const socket = io();
    socket.emit("join-room", id);

    socket.on("room-change", (r) => {
      setRoom(r);
    });

    return () => {
      socket.disconnect()
    };
  }, [id]);

  useEffect(() => {
    async function getRoom() {
      const res = await fetch(`/api/getroom/${id}`);
      if (!res.ok) {
        setError("An error occured.Refresh the page");
        return;
      }
      const data = await res.json();
      if (!data.success) {
        setError(data.message);
        navigate("/");
      }
      setRoom(data.room);
    }
    getRoom();
  }, [id]);

  useEffect(() => {
    if (username && room && !room?.players.includes(username)) {
      navigate("/");
    }
  }, [room,username,navigate]);

  function handleStartGame(): void {
    console.log("Game started");
  }

  async function handleLeaveRoom() {
    const res = await fetch("/api/leaveroom", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: username,id:id }),
    });
    if (!res.ok) {
      setError("Error!Try again")
      return
    }
    const data = await res.json()
    if (!data.success) {
      setError(data.message)
      return
    }
    navigate("/")
  }

  return (
    <section className="h-screen w-screen flex flex-col">
      <div className="flex p-4 justify-between">
        <h1 className="">Hangman</h1>
        <h1 className="">{username}</h1>
      </div>
      <section className="flex flex-1 justify-center items-center flex-col">
        <div className="">
          <h1 className="">Room Code: {id}</h1>
          <h1 className="">Players</h1>
          <ol type="1" className="">
            {room?.players.map((player) => (
                <li className="" key={player}>
                  {player}
                  {player === room.host && <>{" (host)"}</>}
                  {player === username && <>{" (You)"}</>}
                </li>
              ))}
          </ol>
          <Button disabled={username != room?.host} onClick={handleStartGame}>
            Start Game
          </Button>
          <Button disabled={username == room?.host} onClick={handleLeaveRoom}>
            Leave Room
          </Button>
          <span className="">{error}</span>
        </div>
      </section>
    </section>
  );
};

export default Game;
