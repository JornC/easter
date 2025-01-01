const STORAGE_KEY = "easter_game_progress";

export class ProgressManager {
  private maxUnlockedLevel: number;

  constructor() {
    const stored = localStorage.getItem(STORAGE_KEY);
    this.maxUnlockedLevel = stored ? parseInt(stored) : 1;
  }

  public isLevelUnlocked(level: number): boolean {
    return level <= this.maxUnlockedLevel;
  }

  public unlockNextLevel(): void {
    this.maxUnlockedLevel++;
    localStorage.setItem(STORAGE_KEY, this.maxUnlockedLevel.toString());
  }

  public getMaxUnlockedLevel(): number {
    return this.maxUnlockedLevel;
  }

  public reset(): void {
    this.maxUnlockedLevel = 1;
    localStorage.setItem(STORAGE_KEY, "1");
  }
}
