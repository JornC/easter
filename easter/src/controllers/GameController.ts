import type { Map } from "ol";
import { HexGrid, GridConfig } from "../game/grid/HexGrid";
import { GameLogic } from "../game/state/GameState";
import { LOCALITIES, LocalityConfig, GAME_OF_LIFE_CONFIG } from "../config/levels";
import { GamePanel, GameType } from "../game/ui/GamePanel";
import { ProgressManager } from "../game/state/Progress";
import { GameOfLifeLogic } from "../game/state/GameOfLifeState";
import { GameOfLifeGrid, PatternName } from "../game/grid/GameOfLifeGrid";

export class GameController {
  private grid: HexGrid | null = null;
  private gameLogic: GameLogic | null = null;
  private locality: LocalityConfig | null = null;
  private panel: GamePanel | null = null;
  private onExitCallback: Function | null = null;
  private map: Map | null = null;
  private progress: ProgressManager;
  private localityKey: "NL" | "UK" = "NL";

  // Game of Life specific
  private lifeLogic: GameOfLifeLogic | null = null;
  private lifeGrid: GameOfLifeGrid | null = null;
  private currentGameType: GameType = "life";

  constructor() {
    this.progress = new ProgressManager();
  }

  activate(map: Map, locality: "NL" | "UK", onExit: Function) {
    this.onExitCallback = onExit;
    this.localityKey = locality;
    this.locality = LOCALITIES[locality];
    this.map = map;
    if (!this.locality) {
      throw new Error(`Unknown locality: ${locality}`);
    }

    // Create the panel first (always needed)
    this.panel = new GamePanel(
      () => {
        if (this.onExitCallback) {
          this.onExitCallback();
        }
      },
      (level: number) => this.selectLevel(level - 1),
      this.locality.levels.length,
      this.progress.getMaxUnlockedLevel(),
      (game: GameType) => this.switchGame(game),
      () => this.clearLife(),
      () => this.toggleLife(),
      (pattern: PatternName) => this.selectPattern(pattern),
      this.currentGameType
    );

    // Start with Game of Life by default
    this.activateGameOfLife();
  }

  private activateGameOfLife() {
    if (!this.map) return;

    const config = GAME_OF_LIFE_CONFIG[this.localityKey];

    this.lifeLogic = new GameOfLifeLogic(() => {
      this.lifeGrid?.updateGrid();
    });

    this.lifeGrid = new GameOfLifeGrid(this.map, config, this.lifeLogic);

    // Start paused - user clicks Play to start
    this.panel?.setPlaying(false);
  }

  private toggleLife() {
    if (this.lifeLogic) {
      this.lifeLogic.toggle();
      this.panel?.setPlaying(this.lifeLogic.isRunning());
    }
  }

  private selectPattern(pattern: PatternName) {
    if (this.lifeGrid) {
      this.lifeGrid.setPattern(pattern);
    }
  }

  private activateMinesweeper() {
    if (!this.map || !this.locality) return;

    const level = this.locality.levels[0];
    this.gameLogic = new GameLogic(level.rings, level.minePercentage);

    const gridConfig: GridConfig = {
      center: level.center,
      rings: level.rings,
      hexSize: level.hexSize,
      colors: level.colors,
    };

    this.grid = new HexGrid(this.map, gridConfig, this.gameLogic, () =>
      this.handleGameOver()
    );
  }

  private switchGame(game: GameType) {
    if (game === this.currentGameType) return;

    // Dispose current game
    if (this.currentGameType === "life") {
      this.disposeGameOfLife();
    } else {
      this.disposeMinesweeper();
    }

    // Activate new game
    this.currentGameType = game;
    if (game === "life") {
      this.activateGameOfLife();
    } else {
      this.activateMinesweeper();
    }
  }

  private disposeGameOfLife() {
    if (this.lifeLogic) {
      this.lifeLogic.dispose();
      this.lifeLogic = null;
    }
    if (this.lifeGrid) {
      this.lifeGrid.dispose();
      this.lifeGrid = null;
    }
  }

  private disposeMinesweeper() {
    if (this.grid) {
      this.grid.dispose();
      this.grid = null;
    }
    this.gameLogic = null;
  }

  private clearLife() {
    if (this.lifeLogic) {
      this.lifeLogic.clear();
    }
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
    this.disposeGameOfLife();
    this.disposeMinesweeper();

    if (this.panel) {
      this.panel.dispose();
      this.panel = null;
    }

    this.locality = null;
    this.onExitCallback = null;
    this.map = null;
  }
}
