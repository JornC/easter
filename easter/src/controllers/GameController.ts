import type { Map } from "ol";
import { HexGrid, GridConfig } from "../game/grid/HexGrid";
import { GameState } from "../game/state/GameState";
import { LOCALITIES, LocalityConfig } from "../config/levels";

export class GameController {
  private grid: HexGrid | null = null;
  private state: GameState | null = null;
  private locality: LocalityConfig | null = null;

  activate(map: Map, locality: "NL" | "UK", onExit: Function) {
    // Get locality config
    this.locality = LOCALITIES[locality];
    if (!this.locality) {
      throw new Error(`Unknown locality: ${locality}`);
    }

    // Create initial game state with first level
    const level = this.locality.levels[0];
    this.state = new GameState(level.rings, level.minePercentage);

    // Create grid with locality-specific config
    const gridConfig: GridConfig = {
      center: level.center,
      rings: level.rings,
      hexSize: level.hexSize,
      colors: {
        outerRingFill: "#3392e0",
        outerRingBorder: "#ffffff",
        innerFill: "#84bff0",
        innerBorder: "#3392e0",
        innerHover: "#cc6666",
        revealedFill: "#ffffff33",
      },
    };

    this.grid = new HexGrid(map, gridConfig, this.state, onExit);
  }

  deactivate() {
    this.grid?.dispose();
    this.grid = null;
    this.state = null;
    this.locality = null;
  }
}
