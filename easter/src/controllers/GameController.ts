import type { GameInstance } from "../types";
import { Map } from "ol";
import { GridConfig, HexGrid, defaultColors } from "../game/grid/HexGrid";
import { GameState } from "../game/state/GameState";
import { GameInteraction } from "../game/interaction/GameInteraction";
import { GameUI } from "../game/ui/GameUI";

export class GameController implements GameInstance {
  private map: Map | null = null;
  private grid: HexGrid | null = null;
  private state: GameState | null = null;
  private interaction: GameInteraction | null = null;
  private ui: GameUI | null = null;

  activate(map: Map, onExit: Function): void {
    this.map = map;
    this.state = new GameState(8, 0.2);

    const levelConfig: GridConfig = {
      center: [185000, 460000] as [number, number],
      rings: 8,
      hexSize: 100,
      colors: defaultColors,
    };

    this.grid = new HexGrid(map, levelConfig, this.state, onExit);
    this.interaction = new GameInteraction(map);
    this.ui = new GameUI();

    // Initialize game components
  }

  deactivate(): void {
    // Properly dispose of the grid
    if (this.grid) {
      this.grid.dispose();
    }
    // Reset all components
    this.grid = null;
    this.state = null;
    this.interaction = null;
    this.ui = null;
    this.map = null;
  }
}
