export interface GameInstance {
  activate: (mapElementId: string) => void;
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
