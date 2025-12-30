import { PatternName } from "../grid/GameOfLifeGrid";

export type GameType = "life" | "minesweeper";

export class GamePanel {
  private container: HTMLDivElement;
  private onExit: Function;
  private buttonContainer!: HTMLDivElement;
  private currentLevel: number = 1;
  private numLevels: number;
  private maxUnlockedLevel: number;
  private onSelectLevel: (level: number) => void;
  private onSelectGame: (game: GameType) => void;
  private onClear: () => void;
  private onTogglePlay: () => void;
  private onSelectPattern: (pattern: PatternName) => void;
  private currentGame: GameType;
  private isPlaying: boolean = false;
  private playButton: HTMLButtonElement | null = null;
  private currentPattern: PatternName = "glider";

  constructor(
    onExit: Function,
    onSelectLevel: (level: number) => void,
    numLevels: number,
    maxUnlockedLevel: number,
    onSelectGame: (game: GameType) => void,
    onClear: () => void,
    onTogglePlay: () => void,
    onSelectPattern: (pattern: PatternName) => void,
    currentGame: GameType = "life"
  ) {
    this.onExit = onExit;
    this.numLevels = numLevels;
    this.maxUnlockedLevel = maxUnlockedLevel;
    this.onSelectLevel = onSelectLevel;
    this.onSelectGame = onSelectGame;
    this.onClear = onClear;
    this.onTogglePlay = onTogglePlay;
    this.onSelectPattern = onSelectPattern;
    this.currentGame = currentGame;

    // Add keyframe animation for victory pulse
    const style = document.createElement("style");
    style.textContent = `
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
    `;
    document.head.appendChild(style);

    this.container = this.createPanel();
    document.body.appendChild(this.container);

    this.updateGameControls();
  }

  private createPanel(): HTMLDivElement {
    const panel = document.createElement("div");
    panel.style.cssText = `
      position: fixed;
      right: 4rem;
      bottom: 4rem;
      background: rgba(255, 255, 255, 0.95);
      padding: 1.5rem;
      border-radius: 1rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      font-family: 'Arial', sans-serif;
      min-width: 200px;
      border: 2px solid #3392e0;
      backdrop-filter: blur(10px);
      display: flex;
      flex-direction: column;
      gap: 0.8rem;
      z-index: 1;
    `;

    // Game selector
    const gameSelector = this.createGameSelector();

    const status = document.createElement("div");
    status.id = "game-status";

    this.buttonContainer = document.createElement("div");
    this.buttonContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 0.8rem;
      margin-bottom: 0.8rem;
    `;

    const exitButton = document.createElement("button");
    exitButton.textContent = "Exit Game";
    exitButton.onclick = () => this.onExit();
    exitButton.style.cssText = this.getButtonStyle("#666");
    exitButton.style.width = "100%";

    panel.appendChild(gameSelector);
    panel.appendChild(status);
    panel.appendChild(this.buttonContainer);
    panel.appendChild(exitButton);

    return panel;
  }

  private createGameSelector(): HTMLDivElement {
    const container = document.createElement("div");
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      margin-bottom: 0.5rem;
      padding-bottom: 0.8rem;
      border-bottom: 1px solid #ddd;
    `;

    const label = document.createElement("label");
    label.textContent = "Game:";
    label.style.cssText = `
      font-size: 0.9rem;
      font-weight: bold;
      color: #333;
    `;

    const select = document.createElement("select");
    select.id = "game-selector";
    select.style.cssText = `
      padding: 0.6rem;
      border: 1px solid #3392e0;
      border-radius: 0.3rem;
      background: white;
      color: #333;
      font-size: 0.9rem;
      cursor: pointer;
    `;

    const lifeOption = document.createElement("option");
    lifeOption.value = "life";
    lifeOption.textContent = "Game of Life";
    lifeOption.selected = this.currentGame === "life";

    const minesweeperOption = document.createElement("option");
    minesweeperOption.value = "minesweeper";
    minesweeperOption.textContent = "Minesweeper";
    minesweeperOption.selected = this.currentGame === "minesweeper";

    select.appendChild(lifeOption);
    select.appendChild(minesweeperOption);

    select.onchange = (e) => {
      const selectedGame = (e.target as HTMLSelectElement).value as GameType;
      this.currentGame = selectedGame;
      this.updateGameControls();
      this.onSelectGame(selectedGame);
    };

    container.appendChild(label);
    container.appendChild(select);

    return container;
  }

  private updateGameControls(): void {
    this.buttonContainer.innerHTML = "";
    this.clearGameOver();

    if (this.currentGame === "life") {
      this.createLifeControls();
    } else {
      this.createLevelButtons();
    }
  }

  private createLifeControls(): void {
    // Instructions
    const instructions = document.createElement("div");
    instructions.style.cssText = `
      font-size: 0.8rem;
      color: #666;
      line-height: 1.4;
      padding: 0.5rem;
      background: #f5f5f5;
      border-radius: 0.3rem;
      margin-bottom: 0.5rem;
    `;
    instructions.innerHTML = `
      <strong>Rules (3,5/2):</strong><br>
      Birth: 2 neighbors<br>
      Survive: 3 or 5 neighbors<br>
      <br>
      <strong>Controls:</strong><br>
      Click to toggle cells<br>
      Ctrl+drag to draw<br>
      Shift+click for pattern
    `;

    // Pattern selector
    const patternContainer = document.createElement("div");
    patternContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      margin-bottom: 0.5rem;
    `;

    const patternLabel = document.createElement("label");
    patternLabel.textContent = "Pattern:";
    patternLabel.style.cssText = `
      font-size: 0.85rem;
      font-weight: bold;
      color: #333;
    `;

    const patternSelect = document.createElement("select");
    patternSelect.style.cssText = `
      padding: 0.5rem;
      border: 1px solid #81c784;
      border-radius: 0.3rem;
      background: white;
      color: #333;
      font-size: 0.85rem;
      cursor: pointer;
    `;

    const patterns: { value: PatternName; label: string }[] = [
      { value: "glider", label: "Glider" },
      { value: "diagonal", label: "Diagonal stripe" },
      { value: "hexagon", label: "Hexagon ring" },
      { value: "triangle", label: "Triangle" },
      { value: "line", label: "Line" },
      { value: "spark", label: "Spark" },
    ];

    patterns.forEach(({ value, label }) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      option.selected = value === this.currentPattern;
      patternSelect.appendChild(option);
    });

    patternSelect.onchange = (e) => {
      const selected = (e.target as HTMLSelectElement).value as PatternName;
      this.currentPattern = selected;
      this.onSelectPattern(selected);
    };

    patternContainer.appendChild(patternLabel);
    patternContainer.appendChild(patternSelect);

    // Play/Pause button
    this.playButton = document.createElement("button");
    this.updatePlayButton();
    this.playButton.onclick = () => {
      this.onTogglePlay();
    };

    // Clear button
    const clearButton = document.createElement("button");
    clearButton.textContent = "Clear";
    clearButton.onclick = () => this.onClear();
    clearButton.style.cssText = this.getButtonStyle("#f44336");

    this.buttonContainer.appendChild(instructions);
    this.buttonContainer.appendChild(patternContainer);
    this.buttonContainer.appendChild(this.playButton);
    this.buttonContainer.appendChild(clearButton);
  }

  private updatePlayButton(): void {
    if (!this.playButton) return;
    this.playButton.textContent = this.isPlaying ? "Pause" : "Play";
    this.playButton.style.cssText = this.getButtonStyle(
      this.isPlaying ? "#ff9800" : "#4CAF50"
    );
  }

  setPlaying(playing: boolean): void {
    this.isPlaying = playing;
    this.updatePlayButton();
  }

  private createLevelButtons() {
    // Create buttons for each available level
    for (let level = 1; level <= this.numLevels; level++) {
      const button = document.createElement("button");
      const isUnlocked = level <= this.maxUnlockedLevel;

      button.textContent = isUnlocked
        ? `Level ${level}`
        : `[Locked] Level ${level}`;

      if (isUnlocked) {
        button.onclick = () => this.onSelectLevel(level);
      }

      button.style.cssText = this.getButtonStyle(
        isUnlocked
          ? level === this.currentLevel
            ? "#3392e0"
            : "#84bff0"
          : "#cccccc"
      );

      button.dataset.level = level.toString();
      button.dataset.unlocked = isUnlocked.toString();
      this.buttonContainer.appendChild(button);
    }
  }

  private getButtonStyle(bgColor: string = "#3392e0"): string {
    return `
      padding: 0.8rem 1.2rem;
      border: none;
      border-radius: 0.5rem;
      background: ${bgColor};
      color: white;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s;
      font-weight: bold;
      text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.2);
    `;
  }

  updateLevel(level: number) {
    this.currentLevel = level;
    // Update button styles
    const buttons =
      this.buttonContainer.querySelectorAll<HTMLButtonElement>("button");
    buttons.forEach((button) => {
      const buttonLevel = parseInt(button.dataset.level || "1");
      const isUnlocked = button.dataset.unlocked === "true";
      button.style.cssText = this.getButtonStyle(
        isUnlocked ? (buttonLevel === level ? "#3392e0" : "#84bff0") : "#cccccc"
      );
    });
  }

  unlockNextLevel() {
    this.maxUnlockedLevel++;
    if (this.currentGame === "minesweeper") {
      this.buttonContainer.innerHTML = "";
      this.createLevelButtons();
    }
  }

  setGameOver(isVictory: boolean) {
    const status = this.container.querySelector<HTMLDivElement>("#game-status");
    if (status) {
      if (isVictory) {
        status.textContent = "VICTORY!";
        status.style.cssText = `
          margin: 0.5rem 0;
          text-align: center;
          font-size: 1.5rem;
          min-height: 1.5rem;
          color: #4CAF50;
          font-weight: bold;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
          animation: pulse 1s infinite;
        `;
      } else {
        status.textContent = "Game Over!";
        status.style.color = "#f44336";
      }
    }
  }

  clearGameOver() {
    const status = this.container.querySelector<HTMLDivElement>("#game-status");
    if (status) {
      status.textContent = "";
      status.style.cssText = "";
    }
  }

  setCurrentGame(game: GameType) {
    this.currentGame = game;
    const selector =
      this.container.querySelector<HTMLSelectElement>("#game-selector");
    if (selector) {
      selector.value = game;
    }
    this.updateGameControls();
  }

  dispose() {
    this.container.remove();
  }
}
