import { GameController } from "./controllers/GameController";

window.__MAP_GAME__ = {
  available: true,
  instance: new GameController(),
};
