import { useState, type FormEvent } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { useNavigate } from "react-router-dom";

function App() {
  const [error, setError] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const navigate = useNavigate();

  async function handleJoinRoom(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const gameId = formData.get("gameId");
    navigate(`/game/${gameId}`);
  }

  async function handleCreateRoom() {
    const res = await fetch("/api/createroom", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: username }),
    });
    if (!res.ok) {
      setError("Error occured");
    }
    const data = await res.json();
    if (!data.success) {
      setError(data.message);
    }
    navigate(`/game/${data.gameId}?username=${username}`);
  }

  return (
    <form
      onSubmit={(e) => handleJoinRoom(e)}
      className="h-screen w-screen flex flex-col gap-2 items-center justify-center"
    >
      <h1 className="text-3xl font-semibold my-6">Hangman Game</h1>
      <Input
        placeholder="Enter your name"
        className="w-1/3"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <Input name="gameId" placeholder="Enter room code" className="w-1/3" />
      <div className="flex justify-between w-1/3 py-2">
        <Button className="bg-blue-700" type="submit">
          Join Room
        </Button>
        <Button
          className="bg-blue-700"
          type="button"
          onClick={handleCreateRoom}
        >
          Create Room
        </Button>
      </div>
      {error.length > 0 && <span className="text-red-600">{error}</span>}
    </form>
  );
}

export default App;
