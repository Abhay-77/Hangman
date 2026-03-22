import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { RoomDetail, GameState } from "@shared/types";
import { Button } from "@/components/ui/button";
import { socket } from "../lib/socket";
import { Input } from "@/components/ui/input";
import { apiUrl } from "@/lib/env";

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
  const isHost = room?.host === username;
  const isWordChooser = room?.word_chooser === username;
  const waitingOnChooser =
    !roundReady && !!room?.word_chooser && !isWordChooser;
  const turnReminder = useMemo(() => {
    if (gameState?.gameOver) {
      return winStatus || "Round complete.";
    }
    if (!roundReady) {
      if (isWordChooser) {
        return "Submit a word to start this round.";
      }
      if (waitingOnChooser) {
        return `Waiting on ${room?.word_chooser ?? "the chooser"} to set the word.`;
      }
      return "A random player will set the word shortly.";
    }
    if (isWordChooser) {
      return "You set the word—just observe this round.";
    }
    return "Punch in letters to keep the team alive.";
  }, [
    gameState?.gameOver,
    winStatus,
    roundReady,
    isWordChooser,
    waitingOnChooser,
    room?.word_chooser,
  ]);
  const displayResult = gameState?.gameOver
    ? winStatus || "Round complete."
    : "";
  const resultTone =
    winStatus === "You win!"
      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
      : winStatus === "You lose."
        ? "border-rose-400/40 bg-rose-400/10 text-rose-200"
        : "border-cyan-400/30 bg-cyan-400/10 text-cyan-100";

  useEffect(() => {
    async function getRoom() {
      const res = await fetch(apiUrl(`/api/getroom/${id}`));
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
      const res = await fetch(apiUrl(`/api/getgamestate/${id}`));
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
    socket.on("word-rejected", (message: string) => alert(message));
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
    socket.emit("start-game", id);
  }

  const guessedDisplay = gameState?.guessedLetters ?? [];
  const maskedWord = (gameState?.maskedWord || "").replace(/\s+/g, "  ");

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 px-3 py-4 text-slate-50 md:h-screen md:overflow-hidden">
      <div className="mx-auto flex min-h-full max-w-5xl flex-col gap-4 md:h-full">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/5 bg-white/5 px-5 py-3 backdrop-blur">
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.3rem] text-cyan-200/80">
              Room {id}
            </p>
            <h1 className="text-2xl font-semibold text-white">Live Round</h1>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs text-slate-200">
            <span className="text-slate-400">Player</span>
            <span className="text-base font-semibold text-white">
              {username}
            </span>
          </div>
        </header>

        <div className="md:hidden rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm shadow-lg shadow-slate-900/30">
          <div className="flex items-center justify-between text-[0.6rem] uppercase tracking-[0.35rem] text-slate-400">
            <span>Lives</span>
            <span className="text-xl font-semibold tracking-[0.2rem] text-white">
              {remainingLives}
            </span>
          </div>
          {displayResult && (
            <p
              className={`mt-3 rounded-2xl border px-3 py-2 text-center text-xs font-semibold ${resultTone}`}
            >
              {displayResult}
            </p>
          )}
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.25rem] text-cyan-200/80">
            Turn status
          </p>
          <p className="text-base text-white">{turnReminder}</p>
          {isWordChooser && (
            <p className="mt-2 text-xs text-amber-200">
              {roundReady
                ? "Keyboard stays locked for you this round."
                : "You're on deck to set the word."}
            </p>
          )}
        </div>

        <section className="grid flex-1 grid-cols-1 gap-4 overflow-visible lg:grid-cols-2">
          <div className="flex min-h-0 flex-col rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.25rem] text-slate-400">
                  Remaining lives
                </p>
                <p className="text-3xl font-semibold text-white">
                  {remainingLives}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[0.65rem] uppercase tracking-[0.25rem] text-slate-400">
                  Errors
                </p>
                <p className="text-3xl font-semibold text-rose-300">
                  {gameState?.wrongGuesses ?? 0}
                </p>
              </div>
            </div>

            {gameState?.gameOver && (
              <div
                className={`mt-3 rounded-2xl border px-4 py-2 text-center text-sm font-semibold ${resultTone}`}
              >
                Game over · {displayResult}
              </div>
            )}

            <div className="mt-3 flex flex-1 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/40">
              <HangmanSVG wrongGuesses={gameState?.wrongGuesses || 0} />
            </div>

            {roundReady && (
              <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                <p className="text-xs uppercase tracking-[0.35rem] text-cyan-200/70">
                  Secret word
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-[0.5rem] text-white">
                  {maskedWord || "_ _ _"}
                </p>
                <p className="mt-2 text-[0.65rem] uppercase tracking-[0.3rem] text-slate-400">
                  Length · {gameState?.wordLength ?? 0}
                </p>
              </div>
            )}

            <div className="mt-3 hidden rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300 md:block">
              <p className="uppercase tracking-[0.3rem] text-[0.6rem] text-slate-500">
                Guessed letters
              </p>
              <div className="mt-2 flex flex-wrap gap-2 overflow-y-auto">
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

            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                onClick={handleNextGame}
                className="h-10 flex-1 rounded-2xl bg-gradient-to-r from-cyan-400 to-indigo-500 text-xs font-semibold uppercase tracking-[0.3rem] text-slate-900 disabled:opacity-40"
                disabled={!gameState?.gameOver || !isHost}
              >
                Start rematch
              </Button>
              {error && (
                <p className="flex-1 rounded-2xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                  {error}
                </p>
              )}
            </div>
          </div>

          <div className="flex min-h-0 flex-col rounded-2xl border border-white/10 bg-slate-950/40 md:p-4 backdrop-blur">
            {roundReady ? (
              <>
                <div className="hidden md:block">
                  <p className="text-xs uppercase tracking-[0.3rem] text-cyan-200/70">
                    Letter grid
                  </p>
                  <h2 className="text-xl font-semibold text-white">
                    Punch in guesses
                  </h2>
                  {isWordChooser && (
                    <span className="mt-2 inline-flex items-center rounded-full border border-amber-400/30 bg-amber-400/15 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.3rem] text-amber-100">
                      Chooser · Keyboard locked
                    </span>
                  )}
                </div>
                {room?.word_chooser != username && 
                <div className="flex-1 overflow-hidden">
                  <Keyboard
                    onLetterPress={onLetterPress}
                    gameOver={gameState?.gameOver || false}
                    guessedLetters={guessedDisplay}
                    disabled={isWordChooser}
                  />
                </div>}
              </>
            ) : (
              <div className="space-y-4">
                <div className="hidden md:block">
                  <p className="text-xs uppercase tracking-[0.3rem] text-amber-300/80">
                    Chooser phase
                  </p>
                  <h2 className="text-xl font-semibold text-white">
                    Drop the secret word
                  </h2>
                  <p className="text-sm text-slate-400">
                    {isWordChooser
                      ? "You're up! Submit a word to launch the round."
                      : waitingOnChooser
                        ? `Waiting on ${room?.word_chooser} (randomly selected) to set the next word.`
                        : "A random player will be asked to set the word to begin."}
                  </p>
                  {isWordChooser && (
                    <div className="mt-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3rem] text-amber-100">
                      You are the word chooser this round
                    </div>
                  )}
                </div>
                <form
                  className="space-y-3"
                  onSubmit={handleWordSubmit}
                  hidden={!isWordChooser}
                >
                  <Input
                    type="text"
                    className="h-11 border-white/15 bg-white/10 text-base font-semibold tracking-[0.35rem] uppercase placeholder:tracking-normal placeholder:text-slate-500"
                    placeholder="Type the mystery word"
                    name="word"
                    autoComplete="off"
                  />
                  <Button
                    type="submit"
                    className="w-full rounded-2xl bg-gradient-to-r from-amber-300 to-orange-400 text-sm font-semibold text-slate-900"
                    disabled={!isWordChooser}
                  >
                    Set word & begin
                  </Button>
                </form>
              </div>
            )}

            <div className="mt-4 hidden rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300 md:block">
              <p className="uppercase tracking-[0.3rem] text-[0.6rem] text-slate-500">
                Players
              </p>
              <p className="mt-1 text-base font-semibold text-white">
                {room?.players.map((p) => p.username).join(", ")}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

const HangmanSVG: React.FC<{ wrongGuesses: number }> = ({ wrongGuesses }) => (
  <svg width="180" height="220" className="mx-auto text-white">
    <line
      x1="20"
      y1="210"
      x2="160"
      y2="210"
      stroke="currentColor"
      strokeWidth="4"
    />
    <line
      x1="40"
      y1="20"
      x2="40"
      y2="210"
      stroke="currentColor"
      strokeWidth="4"
    />
    <line
      x1="40"
      y1="20"
      x2="130"
      y2="20"
      stroke="currentColor"
      strokeWidth="4"
    />
    <line
      x1="130"
      y1="20"
      x2="130"
      y2="45"
      stroke="currentColor"
      strokeWidth="4"
    />

    {wrongGuesses > 0 && (
      <circle
        cx="130"
        cy="65"
        r="18"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
    )}
    {wrongGuesses > 1 && (
      <line
        x1="130"
        y1="83"
        x2="130"
        y2="135"
        stroke="currentColor"
        strokeWidth="4"
      />
    )}
    {wrongGuesses > 2 && (
      <line
        x1="130"
        y1="100"
        x2="105"
        y2="125"
        stroke="currentColor"
        strokeWidth="4"
      />
    )}
    {wrongGuesses > 3 && (
      <line
        x1="130"
        y1="100"
        x2="155"
        y2="125"
        stroke="currentColor"
        strokeWidth="4"
      />
    )}
    {wrongGuesses > 4 && (
      <line
        x1="130"
        y1="135"
        x2="110"
        y2="180"
        stroke="currentColor"
        strokeWidth="4"
      />
    )}
    {wrongGuesses > 5 && (
      <line
        x1="130"
        y1="135"
        x2="150"
        y2="180"
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
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3 shadow-inner">
      {lettersLines.map((letters, i) => (
        <div key={i} className="flex justify-center gap-1.5 py-1">
          {letters.split("").map((letter) => (
            <Button
              key={letter}
              onClick={() => onLetterPress(letter)}
              disabled={guessedLetters.includes(letter) || gameOver || disabled}
              className="size-8 md:size-10 rounded-xl border border-white/15 bg-gradient-to-br from-slate-800 to-slate-900 text-sm font-semibold tracking-[0.2rem] text-white disabled:border-white/5 disabled:bg-slate-800/40"
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
{
  /* Left Leg */
}
