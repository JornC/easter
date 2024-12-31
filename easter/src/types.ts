import type { Map } from "ol";

export interface GameInstance {
  activate: (map: Map) => void;
  deactivate: () => void;
}

export interface WindowGame {
  available: boolean;
  instance: GameInstance;
}

declare global {
  interface Window {
    __MAP_GAME__: WindowGame;
  }
}
