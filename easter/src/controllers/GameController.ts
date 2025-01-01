import type { Map } from "ol";
import { HexGrid, GridConfig, defaultColors } from "../game/grid/HexGrid";
import { GameLogic } from "../game/state/GameState";
import { LOCALITIES, LocalityConfig } from "../config/levels";
import { GamePanel } from "../game/ui/GamePanel";

export class GameController {
  private grid: HexGrid | null = null;
  private gameLogic: GameLogic | null = null;
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
    this.gameLogic = new GameLogic(level.rings, level.minePercentage);

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

    this.grid = new HexGrid(map, gridConfig, this.gameLogic, () =>
      this.handleGameOver()
    );
  }

  private handleGameOver() {
    if (this.panel && this.gameLogic) {
      const isVictory = this.gameLogic.getState() === "victory";
      this.panel.setGameOver(isVictory);
    }
  }

  private nextLevel() {
    if (this.gameLogic && this.locality && this.grid) {
      const nextLevelIndex = this.gameLogic.getLevel();
      if (nextLevelIndex < this.locality.levels.length) {
        const level = this.locality.levels[nextLevelIndex];
        this.gameLogic.nextLevel();

        const gridConfig: GridConfig = {
          center: level.center,
          rings: level.rings,
          hexSize: level.hexSize,
          colors: defaultColors,
        };

        this.grid.resetGrid(gridConfig);
        this.panel?.updateLevel(this.gameLogic.getLevel());
        this.panel?.clearGameOver();
      }
    }
  }

  private retryLevel() {
    if (this.gameLogic && this.panel) {
      this.gameLogic.resetLevel();
      this.grid?.updateHexStyles();
      this.panel.clearGameOver();
    }
  }

  deactivate() {
    if (this.grid) {
      this.grid.dispose();
      this.grid = null;
    }
    if (this.panel) {
      this.panel.dispose();
      this.panel = null;
    }
    this.gameLogic = null;
    this.locality = null;
    this.onExitCallback = null;
  }
}
