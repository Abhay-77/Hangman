import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { RoomDetail, GameState } from "../../../backend/index";
import { Button } from "@/components/ui/button";
import { socket } from "../lib/socket";

const Game = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const username = decodeURIComponent(searchParams.get("username")!);
  const [room, setRoom] = useState<RoomDetail>();
  const [gameState, setGameState] = useState<GameState>();
  const [error, setError] = useState("");
  const navigate = useNavigate();

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
    async function getGameState() {
      const res = await fetch(`/api/getgamestate/${id}`);
      if (!res.ok) {
        setError("An error occured.Refresh the page");
        return;
      }
      const data = await res.json();
      if (!data.success) {
        setError(data.message);
        navigate("/");
      }
      setGameState(data.gameState);
    }
    getRoom();
    getGameState();
    const handleGameStateUpdate = (g: GameState) => setGameState(g);
    socket.on("gamestate-update", handleGameStateUpdate);
    return () => {
      socket.off("gamestate-update", handleGameStateUpdate);
    };
  }, [id]);
  useEffect(() => {
    if (username && room && !room?.players.includes(username)) {
      navigate("/");
    }
  }, [room, username, navigate]);

  function onLetterPress(letter: string): void {
    socket.emit("letterpress-handle", letter, id);
  }
  return (
    <section className="h-screen w-screen flex flex-col items-center">
      {gameState?.wordLength != 0 ? (
        <>
          {gameState?.gameOver && (
            <div className="text-red-600 text-3xl font-semibold">Game Over</div>
          )}
          <HangmanSVG wrongGuesses={gameState?.wrongGuesses || 0} />
          <div className="">
            Guessed letters: {gameState?.guessedLetters.toString()}
          </div>
          <Keyboard
            onLetterPress={onLetterPress}
            gameOver={gameState?.gameOver || false}
            guessedLetters={gameState?.guessedLetters || []}
          />
        </>
      ) : (
        <form className="bg-black">Enter word</form>
      )}
    </section>
  );
};
const HangmanSVG: React.FC<{ wrongGuesses: number }> = ({ wrongGuesses }) => (
  <svg width="200" height="250" className="mx-auto">
    {/* Gallows */}
    <line x1="20" y1="230" x2="180" y2="230" stroke="black" strokeWidth="4" />
    <line x1="50" y1="20" x2="50" y2="230" stroke="black" strokeWidth="4" />
    <line x1="50" y1="20" x2="120" y2="20" stroke="black" strokeWidth="4" />
    <line x1="120" y1="20" x2="120" y2="50" stroke="black" strokeWidth="4" />

    {/* Head */}
    {wrongGuesses > 0 && (
      <circle
        cx="120"
        cy="70"
        r="20"
        stroke="black"
        strokeWidth="4"
        fill="none"
      />
    )}
    {/* Body */}
    {wrongGuesses > 1 && (
      <line x1="120" y1="90" x2="120" y2="150" stroke="black" strokeWidth="4" />
    )}
    {/* Left Arm */}
    {wrongGuesses > 2 && (
      <line x1="120" y1="100" x2="90" y2="130" stroke="black" strokeWidth="4" />
    )}
    {/* Right Arm */}
    {wrongGuesses > 3 && (
      <line
        x1="120"
        y1="100"
        x2="150"
        y2="130"
        stroke="black"
        strokeWidth="4"
      />
    )}
    {/* Left Leg */}
    {wrongGuesses > 4 && (
      <line
        x1="120"
        y1="150"
        x2="100"
        y2="190"
        stroke="black"
        strokeWidth="4"
      />
    )}
    {/* Right Leg */}
    {wrongGuesses > 5 && (
      <line
        x1="120"
        y1="150"
        x2="140"
        y2="190"
        stroke="black"
        strokeWidth="4"
      />
    )}
  </svg>
);
const Keyboard: React.FC<{
  onLetterPress: (letter: string) => void;
  guessedLetters: string[];
  gameOver: boolean;
}> = ({ onLetterPress, guessedLetters, gameOver }) => {
  const lettersLines: string[] = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
  return (
    <div className="w-[30rem] bg-gray-500">
      {lettersLines.map((letters, i) => (
        <div key={i} className="flex justify-center">
          {letters.split("").map((letter) => (
            <Button
              key={letter}
              onClick={() => onLetterPress(letter)}
              disabled={guessedLetters.includes(letter) || gameOver}
              className="bg-gray-400 disabled:bg-gray-800 m-1 size-10 rounded items-center text-xl justify-center font-semibold flex "
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
