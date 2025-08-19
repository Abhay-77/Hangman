import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { RoomDetail } from "../../../backend/index";

const Game = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const username = decodeURIComponent(searchParams.get("username")!)
  const [room, setRoom] = useState<RoomDetail>();
  const [error, setError] = useState("");
  const navigate = useNavigate()

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
        navigate("/")
      }
      setRoom(data.room);
    }
    getRoom();
  }, [id]);
  console.log(room)

  return (
    <section className="h-screen w-screen flex flex-col">
      <div className="flex p-4 justify-between">
        <h1 className="">Hangman</h1>
        <h1 className="">{username}</h1>
      </div>
      <section className="flex flex-1 justify-center items-center flex-col">
        <div className="">
          <h1 className="">Room Code: {room?.roomId}</h1>
          <h1 className="">Players</h1>
          <ol className="">
            {room?.players.map((player) => (
              <li className="" key={player} >{player}</li>
            ))}
          </ol>
          <span className="">{error}</span>
        </div>
      </section>
    </section>
  );
};

export default Game;
