import type { Map } from "ol";
import { HexGrid, GridConfig } from "../game/grid/HexGrid";
import { GameLogic } from "../game/state/GameState";
import { LOCALITIES, LocalityConfig } from "../config/levels";
import { GamePanel } from "../game/ui/GamePanel";
import { ProgressManager } from "../game/state/Progress";

export class GameController {
  private grid: HexGrid | null = null;
  private gameLogic: GameLogic | null = null;
  private locality: LocalityConfig | null = null;
  private panel: GamePanel | null = null;
  private onExitCallback: Function | null = null;
  private map: Map | null = null;
  private progress: ProgressManager;

  constructor() {
    this.progress = new ProgressManager();
  }

  activate(map: Map, locality: "NL" | "UK", onExit: Function) {
    this.onExitCallback = onExit;
    this.locality = LOCALITIES[locality];
    this.map = map;
    if (!this.locality) {
      throw new Error(`Unknown locality: ${locality}`);
    }

    const level = this.locality.levels[0];
    this.gameLogic = new GameLogic(level.rings, level.minePercentage);

    const gridConfig: GridConfig = {
      center: level.center,
      rings: level.rings,
      hexSize: level.hexSize,
      colors: level.colors,
    };

    this.panel = new GamePanel(
      () => {
        if (this.onExitCallback) {
          this.onExitCallback();
        }
      },
      (level: number) => this.selectLevel(level - 1),
      this.locality.levels.length,
      this.progress.getMaxUnlockedLevel()
    );

    this.grid = new HexGrid(map, gridConfig, this.gameLogic, () =>
      this.handleGameOver()
    );
  }

  private handleGameOver() {
    if (this.panel && this.gameLogic && this.locality) {
      const isVictory = this.gameLogic.getState() === "victory";
      this.panel.setGameOver(isVictory);

      if (isVictory) {
        const currentLevel = this.gameLogic.getLevel();
        if (
          currentLevel === this.progress.getMaxUnlockedLevel() &&
          currentLevel < this.locality.levels.length
        ) {
          this.progress.unlockNextLevel();
          this.panel.unlockNextLevel();
        }
      }
    }
  }

  private selectLevel(levelIndex: number) {
    if (!this.locality || !this.map) return;

    // Validate level is unlocked
    if (levelIndex >= this.progress.getMaxUnlockedLevel()) return;

    const level = this.locality.levels[levelIndex];
    if (!level) return;

    // Cleanup old grid first
    if (this.grid) {
      this.grid.dispose();
      this.grid = null;
    }

    // Create new game logic for selected level
    this.gameLogic = new GameLogic(
      level.rings,
      level.minePercentage,
      levelIndex + 1
    );

    const gridConfig: GridConfig = {
      center: level.center,
      rings: level.rings,
      hexSize: level.hexSize,
      colors: level.colors,
    };

    // Create new grid with new game logic
    this.grid = new HexGrid(this.map, gridConfig, this.gameLogic, () =>
      this.handleGameOver()
    );

    // Update UI
    this.panel?.clearGameOver();
    this.panel?.updateLevel(levelIndex + 1);
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
    this.map = null;
  }
}
