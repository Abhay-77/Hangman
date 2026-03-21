import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { RoomDetail } from "../../../backend/index";
import { Button } from "@/components/ui/button";
import { socket } from "../lib/socket";

const Room = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const username = decodeURIComponent(searchParams.get("username")!);
  const [room, setRoom] = useState<RoomDetail>();
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const isHost = useMemo(() => room?.host === username, [room?.host, username]);
  const players = room?.players ?? [];
  const statusLabel =
    room?.status === "live" ? "Round in progress" : "Lobby is arming";
  const statusColor =
    room?.status === "live"
      ? "text-rose-300 bg-rose-500/10 border-rose-400/30"
      : "text-emerald-200 bg-emerald-400/10 border-emerald-400/30";

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("join-room", id);

    const handleRoomChange = (r: RoomDetail) => setRoom(r);

    socket.on("room-change", handleRoomChange);

    const handleStartGameEmit = () => {
      navigate(`/game/${id}?username=${encodeURIComponent(username)}`);
    };

    socket.on("start-game", handleStartGameEmit);

    return () => {
      socket.off("start-game", handleStartGameEmit);
      socket.off("room-change", handleRoomChange);
    };
  }, [id, navigate, username]);

  useEffect(() => {
    async function getRoom() {
      const res = await fetch(`/api/getroom/${id}`);
      if (!res.ok) {
        setError("Unable to load lobby. Refresh to try again.");
        return;
      }
      const data = await res.json();
      if (!data.success) {
        setError(data.message);
        navigate("/");
        return;
      }
      setRoom(data.room);
    }
    getRoom();
  }, [id, navigate]);

  useEffect(() => {
    if (
      username &&
      room &&
      !room.players.some((p) => p.username === username)
    ) {
      navigate("/");
    }
  }, [room, username, navigate]);

  function handleStartGame(): void {
    socket.emit("start-game", id);
  }

  async function handleLeaveRoom() {
    const res = await fetch("/api/leaveroom", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: username, id: id }),
    });
    if (!res.ok) {
      setError("Error! Try again");
      return;
    }
    const data = await res.json();
    if (!data.success) {
      setError(data.message);
      return;
    }
    navigate("/");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 px-4 py-10 text-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/5 bg-white/5 px-6 py-4 backdrop-blur">
          <div>
            <p className="text-xs uppercase tracking-[0.5rem] text-cyan-200/80">
              Lobby online
            </p>
            <h1 className="text-3xl font-semibold text-white">Room {id}</h1>
          </div>
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-5 py-2 text-sm text-slate-200">
            <span className="text-slate-400">Signed in as</span>
            <span className="text-lg font-semibold text-white">{username}</span>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.4fr,0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-lg">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3rem] text-cyan-200/80">
                  Room code
                </p>
                <p className="text-4xl font-semibold tracking-[0.6rem] text-white">
                  {id}
                </p>
              </div>
              <span
                className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.4rem] ${statusColor}`}
              >
                {statusLabel}
              </span>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
                <p className="text-xs uppercase tracking-[0.3rem] text-amber-200/80">
                  Host
                </p>
                <p className="text-2xl font-semibold text-white">
                  {room?.host ?? "—"}
                </p>
                <p className="text-sm text-slate-400">
                  Controls the word and round pacing.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
                <p className="text-xs uppercase tracking-[0.3rem] text-emerald-200/80">
                  Players
                </p>
                <p className="text-2xl font-semibold text-white">
                  {players.length}
                </p>
                <p className="text-sm text-slate-400">
                  Need at least two players to make it fun.
                </p>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <Button
                disabled={!isHost}
                onClick={handleStartGame}
                className="h-12 flex-1 rounded-2xl bg-gradient-to-r from-emerald-400 to-lime-300 text-base font-semibold text-slate-900 disabled:opacity-50"
              >
                {isHost ? "Start next round" : "Waiting for host"}
              </Button>
              <Button
                onClick={handleLeaveRoom}
                className="h-12 flex-1 rounded-2xl border border-white/20 bg-transparent text-base font-semibold text-white hover:border-rose-400"
                variant="outline"
              >
                Leave lobby
              </Button>
            </div>
            {error && (
              <p className="mt-4 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </p>
            )}
          </div>

          <aside className="rounded-3xl border border-white/10 bg-slate-950/40 p-6 backdrop-blur">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-white">Crew roster</h2>
              <span className="text-xs uppercase tracking-[0.4rem] text-slate-400">
                Live
              </span>
            </div>
            <div className="mt-6 grid gap-4">
              {players.length > 0 ? (
                players.map((player) => (
                  <div
                    key={player.userId}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="text-lg font-semibold text-white">
                        {player.username}
                      </p>
                      <p className="text-xs uppercase tracking-[0.3rem] text-slate-400">
                        {player.userId}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 text-[0.65rem] font-semibold uppercase tracking-widest text-white">
                      {player.username === room?.host && (
                        <span className="rounded-full bg-amber-400/20 px-3 py-1 text-amber-200">
                          Host
                        </span>
                      )}
                      {player.username === username && (
                        <span className="rounded-full bg-cyan-400/20 px-3 py-1 text-cyan-200">
                          You
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-6 text-center text-sm text-slate-400">
                  Waiting for adventurers to join this lobby.
                </div>
              )}
            </div>

            <div className="mt-8 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-4 text-sm text-cyan-100">
              Tip: hosts can swap the secret word between rounds for surprise
              rematches.
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
};

export default Room;
