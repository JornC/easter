export class GamePanel {
  private container: HTMLDivElement;
  private onExit: Function;
  private buttonContainer!: HTMLDivElement;
  private currentLevel: number = 1;
  private numLevels: number;
  private maxUnlockedLevel: number;
  private onSelectLevel: (level: number) => void;

  constructor(
    onExit: Function,
    onSelectLevel: (level: number) => void,
    numLevels: number,
    maxUnlockedLevel: number
  ) {
    this.onExit = onExit;
    this.numLevels = numLevels;
    this.maxUnlockedLevel = maxUnlockedLevel;
    this.onSelectLevel = onSelectLevel;

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

    // Create level buttons
    this.createLevelButtons();
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

    panel.appendChild(status);
    panel.appendChild(this.buttonContainer);
    panel.appendChild(exitButton);

    return panel;
  }

  private createLevelButtons() {
    // Clear existing buttons
    this.buttonContainer.innerHTML = "";

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
      &:hover {
        transform: scale(1.02);
        opacity: 0.9;
      }
      &:active {
        transform: scale(0.98);
      }
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
    this.createLevelButtons();
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

  dispose() {
    this.container.remove();
  }
}
