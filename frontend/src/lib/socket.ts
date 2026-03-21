import { io } from "socket.io-client";
import { socketURL } from "./env";

export const socket = io(socketURL ?? "/", {
  autoConnect: false,
  withCredentials: true,
});
