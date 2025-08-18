import type { FormEvent } from "react";
import { Button } from "./components/ui/button"
import { Input } from "./components/ui/input"

function App() {

  async function handleJoinRoom(e:FormEvent) {
    e.preventDefault()
    console.log("Join Room")
  }

  async function handleCreateRoom() {
    console.log("Create Room")
  }

  return (
    <form onSubmit={(e)=>handleJoinRoom(e)} className="h-screen w-screen flex flex-col gap-2 items-center justify-center">
      <h1 className="text-3xl font-semibold my-6">Hangman Game</h1>
      <Input placeholder="Enter your name" className="w-1/3" />
      <Input placeholder="Enter room code" className="w-1/3" />
      <div className="flex justify-between w-1/3 py-2">
        <Button className="bg-blue-700" type="submit">Join Room</Button>
        <Button className="bg-blue-700" type="button" onClick={handleCreateRoom}>Create Room</Button>
      </div>
    </form>
  );
}

export default App
