export class GamePanel {
  private container: HTMLDivElement;
  private onExit: Function;
  private onRetry: Function;
  private onNextLevel: Function;
  private buttonContainer: HTMLDivElement;

  constructor(onExit: Function, onRetry: Function, onNextLevel: Function) {
    this.onExit = onExit;
    this.onRetry = onRetry;
    this.onNextLevel = onNextLevel;

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
  }

  private createPanel(): HTMLDivElement {
    const panel = document.createElement("div");
    panel.style.cssText = `
      position: fixed;
      left: 2rem;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(255, 255, 255, 0.95);
      padding: 1.5rem;
      border-radius: 1rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      font-family: 'Arial', sans-serif;
      min-width: 200px;
      border: 2px solid #3392e0;
      backdrop-filter: blur(10px);
    `;

    const title = document.createElement("h2");
    title.textContent = "Level 1";
    title.style.cssText = `
      margin: 0 0 1rem 0;
      color: #3392e0;
      font-size: 1.5rem;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 2px;
    `;

    const status = document.createElement("div");
    status.id = "game-status";
    status.style.cssText = `
      margin: 0.5rem 0;
      text-align: center;
      font-size: 1.1rem;
      min-height: 1.5rem;
      color: #666;
    `;

    this.buttonContainer = document.createElement("div");
    this.buttonContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 0.8rem;
    `;

    const retryButton = document.createElement("button");
    retryButton.textContent = "🔄 Retry Level";
    retryButton.onclick = () => this.onRetry();
    retryButton.style.cssText = this.getButtonStyle();

    const exitButton = document.createElement("button");
    exitButton.textContent = "❌ Exit Game";
    exitButton.onclick = () => this.onExit();
    exitButton.style.cssText = this.getButtonStyle("#ff4444");

    this.buttonContainer.appendChild(retryButton);
    this.buttonContainer.appendChild(exitButton);

    panel.appendChild(title);
    panel.appendChild(status);
    panel.appendChild(this.buttonContainer);

    return panel;
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
      transition: transform 0.1s, opacity 0.1s;
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
    const title = this.container.querySelector("h2");
    if (title) {
      title.textContent = `Level ${level}`;
    }
  }

  setGameOver(isVictory: boolean) {
    const status = this.container.querySelector("#game-status");
    if (status) {
      if (isVictory) {
        status.textContent = "🎉 VICTORY!";
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

        // Remove existing next level button if any
        const existingNextButton =
          this.buttonContainer.querySelector("[data-next-level]");
        if (existingNextButton) {
          existingNextButton.remove();
        }

        // Add Next Level button
        const nextLevelButton = document.createElement("button");
        nextLevelButton.textContent = "⭐ Next Level";
        nextLevelButton.dataset.nextLevel = "true";
        nextLevelButton.onclick = () => this.onNextLevel();
        nextLevelButton.style.cssText = this.getButtonStyle("#4CAF50");

        // Insert at the top of button container
        this.buttonContainer.insertBefore(
          nextLevelButton,
          this.buttonContainer.firstChild
        );
      } else {
        status.textContent = "💥 Game Over!";
        status.style.color = "#f44336";
      }
    }
  }

  clearGameOver() {
    const status = this.container.querySelector("#game-status");
    if (status) {
      status.textContent = "";
      status.style.cssText = "";
    }

    // Remove next level button if exists
    const nextLevelButton =
      this.buttonContainer.querySelector("[data-next-level]");
    if (nextLevelButton) {
      nextLevelButton.remove();
    }
  }

  dispose() {
    this.container.remove();
  }
}
