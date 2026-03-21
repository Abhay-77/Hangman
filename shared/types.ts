export type RoomStatus = "waiting" | "live";

export type Player = {
  username: string;
  userId: string;
};

export type RoomDetail = {
  roomId: string;
  players: Player[];
  word: string | null;
  status: RoomStatus;
  host: string;
  guessedLetters: string[];
  wrongGuesses: number;
  gameOver: boolean;
  word_chooser?: string;
};

export type GameState = {
  guessedLetters: string[];
  wrongGuesses: number;
  wordLength: number;
  gameOver: boolean;
  maskedWord: string;
};
