export type Coordinate = {
  q: number;
  r: number;
};

export type GameState = {
  state: "initial" | "playing" | "victory" | "defeat";
  revealed: Set<string>;
  flagged: Set<string>;
  mines: Set<string>;
  level: number;
  rings: number;
  firstClick: boolean;
  totalCells: number;
};

export function coordToString({ q, r }: Coordinate): string {
  return `${q},${r}`;
}

export function stringToCoord(str: string): Coordinate {
  const [q, r] = str.split(",").map(Number);
  return { q, r };
}

export class GameLogic {
  private state: GameState;

  constructor(rings: number, minePercentage: number = 0.2) {
    this.state = {
      state: "initial",
      revealed: new Set(),
      flagged: new Set(),
      mines: new Set(),
      level: 1,
      rings,
      firstClick: true,
      totalCells: 0,
    };
    this.generateMines(rings, minePercentage);
  }

  private getNeighbors({ q, r }: Coordinate): Coordinate[] {
    return [
      { q: q + 1, r }, // East
      { q: q + 1, r: r - 1 }, // Southeast
      { q, r: r - 1 }, // Southwest
      { q: q - 1, r }, // West
      { q: q - 1, r: r + 1 }, // Northwest
      { q, r: r + 1 }, // Northeast
    ];
  }

  private isValidCell({ q, r }: Coordinate): boolean {
    const maxDist = Math.max(Math.abs(q), Math.abs(r), Math.abs(-q - r));
    return maxDist < this.state.rings;
  }

  private countNeighborMines(coord: Coordinate): number {
    return this.getNeighbors(coord).filter((n) =>
      this.state.mines.has(coordToString(n))
    ).length;
  }

  private generateMines(
    rings: number,
    percentage: number,
    safeCoord?: Coordinate
  ) {
    this.state.mines.clear();

    // Setup safe zone if provided
    const safeZone = new Set<string>();
    if (safeCoord) {
      safeZone.add(coordToString(safeCoord));
      this.getNeighbors(safeCoord).forEach((n) =>
        safeZone.add(coordToString(n))
      );
    }

    // Generate all possible coordinates
    const coords: Coordinate[] = [];
    for (let q = -rings + 1; q < rings; q++) {
      for (let r = -rings + 1; r < rings; r++) {
        const coord = { q, r };
        const key = coordToString(coord);
        if (this.isValidCell(coord) && !safeZone.has(key)) {
          coords.push(coord);
        }
      }
    }

    // Calculate mine count
    const totalHexes = coords.length + safeZone.size;
    const mineCount = Math.floor(totalHexes * percentage);
    this.state.totalCells = totalHexes - mineCount;

    // Place mines
    while (this.state.mines.size < mineCount && coords.length > 0) {
      const idx = Math.floor(Math.random() * coords.length);
      const coord = coords[idx];
      coords.splice(idx, 1);

      if (this.tryPlaceMine(coord)) {
        this.state.mines.add(coordToString(coord));
      }
    }
  }

  private tryPlaceMine(coord: Coordinate): boolean {
    const coordStr = coordToString(coord);
    this.state.mines.add(coordStr);

    // Check for isolation
    const wouldIsolateCell = this.getNeighbors(coord).every((n) =>
      this.state.mines.has(coordToString(n))
    );

    const wouldIsolateMine = this.getNeighbors(coord).every(
      (n) =>
        this.state.mines.has(coordToString(n)) ||
        this.getNeighbors(n).every((nn) =>
          this.state.mines.has(coordToString(nn))
        )
    );

    this.state.mines.delete(coordStr);
    return !wouldIsolateCell && !wouldIsolateMine;
  }

  private floodFill(coord: Coordinate) {
    this.getNeighbors(coord).forEach((n) => {
      const key = coordToString(n);
      if (this.isValidCell(n) && !this.state.revealed.has(key)) {
        this.state.revealed.add(key);
        if (!this.state.mines.has(key) && this.countNeighborMines(n) === 0) {
          this.floodFill(n);
        }
      }
    });
  }

  private checkVictory(): boolean {
    const revealedNonMines = Array.from(this.state.revealed).filter(
      (coord) => !this.state.mines.has(coord)
    ).length;

    const correctlyFlaggedMines = Array.from(this.state.flagged).filter(
      (coord) => this.state.mines.has(coord)
    ).length;

    return (
      revealedNonMines === this.state.totalCells &&
      correctlyFlaggedMines === this.state.mines.size
    );
  }

  // Public methods for game interaction
  revealCell(coord: Coordinate): void {
    if (this.state.state === "victory" || this.state.state === "defeat") return;

    const key = coordToString(coord);
    if (this.state.revealed.has(key)) return;

    if (this.state.firstClick) {
      this.state.firstClick = false;
      this.state.state = "playing";
      if (this.state.mines.has(key) || this.countNeighborMines(coord) !== 0) {
        this.generateMines(this.state.rings, 0.2, coord);
      }
    }

    this.state.revealed.add(key);

    if (this.state.mines.has(key)) {
      this.state.state = "defeat";
      // Reveal all mines
      this.state.mines.forEach((m) => this.state.revealed.add(m));
      return;
    }

    if (this.countNeighborMines(coord) === 0) {
      this.floodFill(coord);
    }

    if (this.checkVictory()) {
      this.state.state = "victory";
    }
  }

  toggleFlag(coord: Coordinate): void {
    if (this.state.state === "victory" || this.state.state === "defeat") return;

    const key = coordToString(coord);
    if (this.state.revealed.has(key)) return;

    if (this.state.flagged.has(key)) {
      this.state.flagged.delete(key);
    } else {
      this.state.flagged.add(key);
    }

    if (this.checkVictory()) {
      this.state.state = "victory";
    }
  }

  // Public getters
  getState(): GameState["state"] {
    return this.state.state;
  }

  isMine(coord: Coordinate): boolean {
    return this.state.mines.has(coordToString(coord));
  }

  isRevealed(coord: Coordinate): boolean {
    return this.state.revealed.has(coordToString(coord));
  }

  isFlagged(coord: Coordinate): boolean {
    return this.state.flagged.has(coordToString(coord));
  }

  getNumber(coord: Coordinate): number {
    return this.isMine(coord) ? 0 : this.countNeighborMines(coord);
  }

  getLevel(): number {
    return this.state.level;
  }

  nextLevel(): void {
    this.state = {
      ...this.state,
      state: "initial",
      revealed: new Set(),
      flagged: new Set(),
      mines: new Set(),
      level: this.state.level + 1,
      firstClick: true,
    };
    this.generateMines(
      this.state.rings,
      Math.min(0.2 + (this.state.level - 1) * 0.05, 0.4)
    );
  }

  resetLevel(): void {
    this.state = {
      ...this.state,
      state: "initial",
      revealed: new Set(),
      flagged: new Set(),
      mines: new Set(),
      firstClick: true,
    };
    this.generateMines(
      this.state.rings,
      Math.min(0.2 + (this.state.level - 1) * 0.05, 0.4)
    );
  }
}
