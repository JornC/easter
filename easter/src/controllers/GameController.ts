import type { Map } from "ol";
import { HexGrid, GridConfig, defaultColors } from "../game/grid/HexGrid";
import { GameState } from "../game/state/GameState";
import { LOCALITIES, LocalityConfig } from "../config/levels";
import { GamePanel } from "../game/ui/GamePanel";

export class GameController {
  private grid: HexGrid | null = null;
  private state: GameState | null = null;
  private locality: LocalityConfig | null = null;
  private panel: GamePanel | null = null;
  private onExitCallback: Function | null = null;

  activate(map: Map, locality: "NL" | "UK", onExit: Function) {
    this.onExitCallback = onExit;
    this.locality = LOCALITIES[locality];
    if (!this.locality) {
      throw new Error(`Unknown locality: ${locality}`);
    }

    const level = this.locality.levels[0];
    this.state = new GameState(level.rings, level.minePercentage);

    const gridConfig: GridConfig = {
      center: level.center,
      rings: level.rings,
      hexSize: level.hexSize,
      colors: defaultColors,
    };

    this.panel = new GamePanel(
      () => {
        if (this.onExitCallback) {
          this.onExitCallback();
        }
      },
      () => this.retryLevel(),
      () => this.nextLevel()
    );
    this.panel.updateLevel(1);

    this.grid = new HexGrid(map, gridConfig, this.state, () =>
      this.handleGameOver()
    );
  }

  private handleGameOver() {
    if (this.panel && this.state) {
      const isVictory = this.state.hasWonLevel();
      this.panel.setGameOver(isVictory);
    }
  }

  private nextLevel() {
    if (this.state && this.locality && this.grid) {
      const nextLevelIndex = this.state.getLevel();
      if (nextLevelIndex < this.locality.levels.length) {
        const level = this.locality.levels[nextLevelIndex];
        this.state.nextLevel();

        // Update grid with new level config
        const gridConfig: GridConfig = {
          center: level.center,
          rings: level.rings,
          hexSize: level.hexSize,
          colors: defaultColors,
        };

        this.grid.resetGrid(gridConfig);
        this.panel?.updateLevel(this.state.getLevel());
        this.panel?.clearGameOver();
      }
    }
  }

  private retryLevel() {
    if (this.state && this.panel) {
      this.state.resetState();
      this.grid?.updateHexStyles();
      this.panel.clearGameOver();
    }
  }

  deactivate() {
    // Only cleanup, don't call onExitCallback
    if (this.grid) {
      this.grid.dispose();
      this.grid = null;
    }
    if (this.panel) {
      this.panel.dispose();
      this.panel = null;
    }
    this.state = null;
    this.locality = null;
    this.onExitCallback = null;
  }
}
