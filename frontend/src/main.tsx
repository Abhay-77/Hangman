import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Room from "./pages/Room.tsx";
import Game from "./pages/Game.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
    <Routes>
      <Route element={<App/>} path="/" />
      <Route element={<Room/>} path="/room/:id" />
      <Route element={<Game/>} path="/game/:id" />
    </Routes>
    </BrowserRouter>
  </StrictMode>
);
