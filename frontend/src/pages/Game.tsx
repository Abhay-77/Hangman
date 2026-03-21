import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { RoomDetail, GameState } from "../../../backend/index";
import { Button } from "@/components/ui/button";
import { socket } from "../lib/socket";
import { Input } from "@/components/ui/input";

const Game = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const username = decodeURIComponent(searchParams.get("username")!);
  const [room, setRoom] = useState<RoomDetail>();
  const [gameState, setGameState] = useState<GameState>();
  const [error, setError] = useState("");
  const [winStatus, setWinStatus] = useState("");
  const navigate = useNavigate();

  const roundReady = (gameState?.wordLength ?? 0) > 0;
  const remainingLives = useMemo(
    () => Math.max(0, 6 - (gameState?.wrongGuesses ?? 0)),
    [gameState?.wrongGuesses],
  );

  useEffect(() => {
    async function getRoom() {
      const res = await fetch(`/api/getroom/${id}`);
      if (!res.ok) {
        setError("An error occurred. Refresh to try again.");
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
    async function getGameState() {
      const res = await fetch(`/api/getgamestate/${id}`);
      if (!res.ok) {
        setError("Unable to fetch current round state.");
        return;
      }
      const data = await res.json();
      if (!data.success) {
        setError(data.message);
        navigate("/");
        return;
      }
      setGameState(data.gameState);
    }
    getRoom();
    getGameState();
    const handleGameStateUpdate = (g: GameState) => setGameState(g);
    socket.on("gamestate-update", handleGameStateUpdate);
    socket.on("word-set", (updatedRoom: RoomDetail, newState: GameState) => {
      setRoom(updatedRoom);
      setGameState(newState);
      setWinStatus("");
    });
    socket.on("word-rejected", (message: string) => {
      alert(message);
    });
    socket.on("win-status", () => setWinStatus("You win!"));
    socket.on("lose-status", () => setWinStatus("You lose."));
    socket.on("new-game", (updatedRoom: RoomDetail) => {
      setRoom(updatedRoom);
      setGameState({
        guessedLetters: [],
        wrongGuesses: 0,
        wordLength: updatedRoom.word?.length || 0,
        gameOver: false,
        maskedWord: "",
      });
      setWinStatus("");
    });
    return () => {
      socket.off("gamestate-update", handleGameStateUpdate);
      socket.off("word-rejected");
      socket.off("word-set");
      socket.off("win-status");
      socket.off("lose-status");
      socket.off("new-game");
    };
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

  function onLetterPress(letter: string): void {
    socket.emit("letterpress-handle", letter, id);
  }

  function handleWordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const word = (formData.get("word") as string)?.trim();
    if (!word) return;
    socket.emit("wordsubmit-handle", word, id);
    e.currentTarget.reset();
  }

  function handleNextGame(): void {
    if (!room || !gameState?.gameOver) {
      alert("Round still in progress.");
      return;
    }
    socket.emit("nextgame-handle", id);
  }

  const guessedDisplay = gameState?.guessedLetters ?? [];
  const maskedWord = (gameState?.maskedWord || "").replace(/\s+/g, "  ");

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 px-4 py-10 text-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/5 bg-white/5 px-6 py-4 backdrop-blur">
          <div>
            <p className="text-xs uppercase tracking-[0.5rem] text-cyan-200/80">
              Room {id}
            </p>
            <h1 className="text-3xl font-semibold text-white">Live Round</h1>
          </div>
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-5 py-2 text-sm text-slate-200">
            <span className="text-slate-400">Player</span>
            <span className="text-lg font-semibold text-white">{username}</span>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.3fr,0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3rem] text-slate-400">
                  Remaining lives
                </p>
                <p className="text-4xl font-semibold text-white">
                  {remainingLives}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.3rem] text-slate-400">
                  Errors
                </p>
                <p className="text-4xl font-semibold text-rose-300">
                  {gameState?.wrongGuesses ?? 0}
                </p>
              </div>
            </div>

            {gameState?.gameOver && (
              <div className="mt-6 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-center text-lg font-semibold text-cyan-100">
                Game over · {winStatus || "round complete"}
              </div>
            )}

            <div className="mt-8 rounded-3xl border border-white/10 bg-slate-950/40 p-6">
              <HangmanSVG wrongGuesses={gameState?.wrongGuesses || 0} />
            </div>

            {roundReady && (
              <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
                <p className="text-sm uppercase tracking-[0.6rem] text-cyan-200/70">
                  Secret word
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-[0.8rem] text-white">
                  {maskedWord || "_ _ _"}
                </p>
                <p className="mt-4 text-xs uppercase tracking-[0.5rem] text-slate-400">
                  Length · {gameState?.wordLength ?? 0}
                </p>
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-4">
              <Button
                onClick={handleNextGame}
                className="h-12 flex-1 rounded-2xl bg-gradient-to-r from-cyan-400 to-indigo-500 text-base font-semibold text-slate-900 disabled:opacity-40"
                disabled={!gameState?.gameOver}
              >
                Start rematch
              </Button>
              {error && (
                <p className="flex-1 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </p>
              )}
            </div>
          </div>

          <aside className="rounded-3xl border border-white/10 bg-slate-950/40 p-6 backdrop-blur">
            {roundReady ? (
              <div className="space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.4rem] text-cyan-200/70">
                    Letter grid
                  </p>
                  <h2 className="text-2xl font-semibold text-white">
                    Punch in your guesses
                  </h2>
                </div>
                <Keyboard
                  onLetterPress={onLetterPress}
                  gameOver={gameState?.gameOver || false}
                  guessedLetters={guessedDisplay}
                  disabled={room?.word_chooser === socket.id}
                />
                <div>
                  <p className="text-xs uppercase tracking-[0.4rem] text-slate-400">
                    Guessed letters
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {guessedDisplay.length > 0 ? (
                      guessedDisplay.map((letter) => (
                        <span
                          key={letter}
                          className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm font-semibold tracking-[0.3rem]"
                        >
                          {letter}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-400">
                        No letters played yet.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.4rem] text-amber-300/80">
                    Host phase
                  </p>
                  <h2 className="text-2xl font-semibold text-white">
                    Drop the secret word
                  </h2>
                  <p className="text-sm text-slate-400">
                    Only the host can submit the word. Everyone else waits at
                    the keyboard.
                  </p>
                </div>
                <form className="space-y-3" onSubmit={handleWordSubmit}>
                  <Input
                    type="text"
                    className="h-12 border-white/20 bg-white/10 text-lg font-semibold tracking-[0.6rem] uppercase placeholder:tracking-normal placeholder:text-slate-500"
                    placeholder="Type the mystery word"
                    name="word"
                    autoComplete="off"
                  />
                  <Button
                    type="submit"
                    className="w-full rounded-2xl bg-gradient-to-r from-amber-300 to-orange-400 text-base font-semibold text-slate-900"
                    disabled={
                      room?.word_chooser !== socket.id &&
                      room?.host !== username
                    }
                  >
                    Set word & begin
                  </Button>
                </form>
              </div>
            )}
            {room && (
              <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                <p className="uppercase tracking-[0.4rem] text-xs text-slate-500">
                  Players
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {room.players.map((p) => p.username).join(", ")}
                </p>
              </div>
            )}
          </aside>
        </section>
      </div>
    </main>
  );
};
const HangmanSVG: React.FC<{ wrongGuesses: number }> = ({ wrongGuesses }) => (
  <svg width="220" height="260" className="mx-auto text-white">
    {/* Gallows */}
    <line
      x1="20"
      y1="230"
      x2="180"
      y2="230"
      stroke="currentColor"
      strokeWidth="4"
    />
    <line
      x1="50"
      y1="20"
      x2="50"
      y2="230"
      stroke="currentColor"
      strokeWidth="4"
    />
    <line
      x1="50"
      y1="20"
      x2="140"
      y2="20"
      stroke="currentColor"
      strokeWidth="4"
    />
    <line
      x1="140"
      y1="20"
      x2="140"
      y2="50"
      stroke="currentColor"
      strokeWidth="4"
    />

    {/* Head */}
    {wrongGuesses > 0 && (
      <circle
        cx="140"
        cy="70"
        r="20"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
    )}
    {/* Body */}
    {wrongGuesses > 1 && (
      <line
        x1="140"
        y1="90"
        x2="140"
        y2="150"
        stroke="currentColor"
        strokeWidth="4"
      />
    )}
    {/* Left Arm */}
    {wrongGuesses > 2 && (
      <line
        x1="140"
        y1="110"
        x2="110"
        y2="140"
        stroke="currentColor"
        strokeWidth="4"
      />
    )}
    {/* Right Arm */}
    {wrongGuesses > 3 && (
      <line
        x1="140"
        y1="110"
        x2="170"
        y2="140"
        stroke="currentColor"
        strokeWidth="4"
      />
    )}
    {/* Left Leg */}
    {wrongGuesses > 4 && (
      <line
        x1="140"
        y1="150"
        x2="120"
        y2="200"
        stroke="currentColor"
        strokeWidth="4"
      />
    )}
    {/* Right Leg */}
    {wrongGuesses > 5 && (
      <line
        x1="140"
        y1="150"
        x2="160"
        y2="200"
        stroke="currentColor"
        strokeWidth="4"
      />
    )}
  </svg>
);
const Keyboard: React.FC<{
  onLetterPress: (letter: string) => void;
  guessedLetters: string[];
  gameOver: boolean;
  disabled: boolean;
}> = ({ onLetterPress, guessedLetters, gameOver, disabled }) => {
  const lettersLines: string[] = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-inner">
      {lettersLines.map((letters, i) => (
        <div key={i} className="flex justify-center gap-2 py-1">
          {letters.split("").map((letter) => (
            <Button
              key={letter}
              onClick={() => onLetterPress(letter)}
              disabled={guessedLetters.includes(letter) || gameOver || disabled}
              className="size-12 rounded-2xl border border-white/15 bg-gradient-to-br from-slate-800 to-slate-900 text-lg font-semibold tracking-[0.3rem] text-white disabled:border-white/5 disabled:bg-slate-800/40"
            >
              {letter}
            </Button>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Game;
