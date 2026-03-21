import { useState, type FormEvent } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "./lib/env";

function App() {
  const [error, setError] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [roomCode, setRoomCode] = useState<string>("");
  const navigate = useNavigate();

  async function handleJoinRoom(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!username.trim() || !roomCode.trim()) {
      setError("Enter both a display name and room code to continue.");
      return;
    }
    const normalizedCode = roomCode.trim().toUpperCase();
    const res = await fetch(apiUrl("/api/addplayer"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username.trim(),
        gameId: normalizedCode,
      }),
    });
    if (!res.ok) {
      setError("Unable to reach the lobby server. Try again.");
      return;
    }
    const data = await res.json();
    if (!data.success) {
      setError(data.message);
      return;
    }
    setError("");
    navigate(
      `/room/${normalizedCode}?username=${encodeURIComponent(username.trim())}`,
    );
  }

  async function handleCreateRoom() {
    if (!username.trim()) {
      setError("Choose a display name before creating a room.");
      return;
    }
    const res = await fetch(apiUrl("/api/createroom"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: username.trim() }),
    });
    if (!res.ok) {
      setError("Error creating the room. Please retry.");
      return;
    }
    const data = await res.json();
    if (!data.success) {
      setError(data.message);
      return;
    }
    setError("");
    navigate(
      `/room/${data.roomId}?username=${encodeURIComponent(username.trim())}`,
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-slate-50 px-4 py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <header className="space-y-2 text-center">
          <p className="text-sm uppercase tracking-[0.6rem] text-cyan-200/70">
            Co-op hangman arena
          </p>
          <h1 className="text-4xl font-semibold text-white md:text-5xl">
            Host, share, and survive the rope.
          </h1>
          <p className="text-base text-slate-300 md:text-lg">
            Spin up a private lobby or join an existing arena in seconds. Every
            letter matters.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.4fr,0.8fr]">
          <form
            onSubmit={(e) => handleJoinRoom(e)}
            className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-indigo-500/10 backdrop-blur-lg"
          >
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3rem] text-cyan-200/80">
                  Join a lobby
                </p>
                <h2 className="text-3xl font-semibold text-white">
                  Enter your details
                </h2>
              </div>
              <label className="space-y-2 text-sm">
                <span className="text-slate-300">Display name</span>
                <Input
                  placeholder="eg. CipherFox"
                  className="h-12 border-white/20 bg-white/10 text-base font-medium placeholder:text-slate-400"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-slate-300">Room code</span>
                <Input
                  name="gameId"
                  placeholder="6-letter code"
                  className="h-12 border-white/20 bg-white/10 text-base font-semibold tracking-[0.5rem] placeholder:tracking-normal placeholder:text-slate-400 uppercase"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                />
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  className="h-12 flex-1 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 text-lg font-semibold text-slate-900 transition hover:shadow-[0_10px_35px_rgba(56,189,248,0.4)]"
                  type="submit"
                >
                  Join Room
                </Button>
                <Button
                  className="h-12 flex-1 rounded-2xl border border-white/30 bg-transparent text-lg font-semibold text-white hover:border-cyan-400"
                  type="button"
                  onClick={handleCreateRoom}
                >
                  Create New Room
                </Button>
              </div>
              {error && (
                <p className="rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </p>
              )}
            </div>
          </form>

          <aside className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-6 backdrop-blur">
            <div className="space-y-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3rem] text-cyan-200/80">
                  Game flow
                </p>
                <h3 className="text-2xl font-semibold text-white">
                  Two ways to play
                </h3>
              </div>
              <div className="flex flex-col gap-4 text-sm text-slate-200">
                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="text-xs uppercase tracking-widest text-emerald-300">
                    Host
                  </p>
                  <p className="text-lg font-semibold text-white">
                    Generate a code & share
                  </p>
                  <p className="text-slate-300">
                    You set the word and control the pacing of each round.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="text-xs uppercase tracking-widest text-amber-300">
                    Join
                  </p>
                  <p className="text-lg font-semibold text-white">
                    Enter the code & guess
                  </p>
                  <p className="text-slate-300">
                    Coordinate letters, watch mistakes, and try to outsmart the
                    host.
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-cyan-400/40 bg-cyan-400/10 p-4 text-sm text-cyan-100">
                Pro tip: keep your mic on a call for faster decisions and less
                duplicated letters.
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

export default App;
