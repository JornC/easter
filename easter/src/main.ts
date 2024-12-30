import { GameController } from "./controllers/GameController";

// Initialize the global object
window.__MAP_GAME__ = {
  available: true,
  instance: new GameController(),
};
