export class GameState {
  private mines: Set<string> = new Set(); // Store mine locations as "q,r"
  private revealed: Set<string> = new Set(); // Track revealed cells
  private rings: number; // Add this to track grid size
  private isGameOver: boolean = false; // Track game state
  private flagged: Set<string> = new Set(); // Add this to track flagged cells
  private firstClick: boolean = true;
  private totalCells: number = 0;
  private level: number = 1;
  private hasWon: boolean = false;

  constructor(rings: number, minePercentage: number = 0.2) {
    this.rings = rings;
    this.generateMines(rings, this.getMinePercentage());
  }

  private getMinePercentage(): number {
    // Increase difficulty with each level
    return Math.min(0.2 + (this.level - 1) * 0.05, 0.4); // Cap at 40%
  }

  private generateMines(rings: number, percentage: number) {
    console.time("generateMines");

    // Get all possible hex coordinates within rings
    console.time("generateCoords");
    const coords: [number, number][] = [];
    for (let q = -rings + 1; q < rings; q++) {
      for (let r = -rings + 1; r < rings; r++) {
        if (Math.max(Math.abs(q), Math.abs(r), Math.abs(-q - r)) < rings) {
          coords.push([q, r]);
        }
      }
    }
    console.timeEnd("generateCoords");

    console.time("placeMines");
    let totalTries = 0;
    const mineCount = Math.floor(coords.length * percentage);
    console.log(
      `Attempting to place ${mineCount} mines in ${coords.length} cells`
    );

    for (let i = 0; i < mineCount; i++) {
      let placed = false;
      let tries = 0;
      while (!placed && coords.length > 0) {
        tries++;
        totalTries++;

        const idx = Math.floor(Math.random() * coords.length);
        const [q, r] = coords[idx];

        if (this.tryPlaceMine(q, r)) {
          this.mines.add(`${q},${r}`);
          coords.splice(idx, 1);
          placed = true;
          console.log(`Placed mine ${i + 1}/${mineCount} after ${tries} tries`);
        } else {
          coords.splice(idx, 1);
        }
      }
    }
    console.timeEnd("placeMines");
    console.log(`Total placement attempts: ${totalTries}`);

    // Store total non-mine cells for victory check
    this.totalCells = coords.length;

    console.timeEnd("generateMines");
  }

  private getNeighborPattern(q: number, r: number): string {
    return this.getNeighbors(q, r)
      .map(([nq, nr]) => (this.mines.has(`${nq},${nr}`) ? "1" : "0"))
      .join("");
  }

  private countNeighborMines(q: number, r: number): number {
    const neighbors = [
      [q + 1, r],
      [q + 1, r - 1],
      [q, r - 1],
      [q - 1, r],
      [q - 1, r + 1],
      [q, r + 1],
    ];

    return neighbors.filter(([nq, nr]) => this.mines.has(`${nq},${nr}`)).length;
  }

  isMine(q: number, r: number): boolean {
    return this.mines.has(`${q},${r}`);
  }

  getNumber(q: number, r: number): number {
    // Always calculate dynamically
    if (this.isMine(q, r)) return 0; // Mines don't have numbers
    return this.countNeighborMines(q, r);
  }

  revealCell(q: number, r: number): boolean {
    if (this.firstClick) {
      this.firstClick = false;
      // Regenerate mines if this cell or its neighbors would be a mine
      // or if it's not a 0 (to ensure a good starting area)
      if (this.isMine(q, r) || this.getNumber(q, r) !== 0) {
        this.regenerateMines(q, r);
      }
    }

    // Return whether the game is over
    if (this.isGameOver || this.isRevealed(q, r)) return false;

    this.revealed.add(`${q},${r}`);

    // Check if we hit a mine
    if (this.isMine(q, r)) {
      this.gameOver();
      return true;
    }

    // If it's a 0, flood fill to reveal neighbors
    if (this.getNumber(q, r) === 0) {
      this.floodFill(q, r);
    }

    // Check for victory after each reveal
    this.checkVictory();

    return this.isGameOver;
  }

  private isValidCell(q: number, r: number): boolean {
    // Check if the cell is within bounds and not in outer ring
    const maxDist = Math.max(Math.abs(q), Math.abs(r), Math.abs(-q - r));
    return maxDist < this.rings;
  }

  private floodFill(q: number, r: number) {
    const neighbors = this.getNeighbors(q, r);

    neighbors.forEach(([nq, nr]) => {
      // Add boundary check before revealing
      if (this.isValidCell(nq, nr) && !this.isRevealed(nq, nr)) {
        this.revealed.add(`${nq},${nr}`);

        // If this neighbor is also a 0, continue flood fill
        if (!this.isMine(nq, nr) && this.getNumber(nq, nr) === 0) {
          this.floodFill(nq, nr);
        }
      }
    });
  }

  private getNeighbors(q: number, r: number): [number, number][] {
    return [
      [q + 1, r], // East
      [q + 1, r - 1], // Southeast
      [q, r - 1], // Southwest
      [q - 1, r], // West
      [q - 1, r + 1], // Northwest
      [q, r + 1], // Northeast
    ];
  }

  isRevealed(q: number, r: number): boolean {
    return this.revealed.has(`${q},${r}`);
  }

  private gameOver() {
    this.isGameOver = true;
    // Reveal all mines
    this.mines.forEach((coord) => {
      this.revealed.add(coord);
    });
  }

  getGameOver(): boolean {
    return this.isGameOver;
  }

  toggleFlag(q: number, r: number): void {
    const key = `${q},${r}`;
    if (this.flagged.has(key)) {
      this.flagged.delete(key);
    } else {
      this.flagged.add(key);
    }
  }

  isFlagged(q: number, r: number): boolean {
    return this.flagged.has(`${q},${r}`);
  }

  private tryPlaceMine(q: number, r: number): boolean {
    // Temporarily add mine
    this.mines.add(`${q},${r}`);

    // Check if this would create an isolated cell or mine
    const neighbors = this.getNeighbors(q, r);

    // Check if all neighbors would be mines (creating an isolated cell)
    const wouldIsolateCell = neighbors.every(([nq, nr]) =>
      this.mines.has(`${nq},${nr}`)
    );

    // Check if all neighbors of this mine would also be mines
    const wouldIsolateMine = neighbors.every(
      ([nq, nr]) =>
        this.mines.has(`${nq},${nr}`) ||
        this.getNeighbors(nq, nr).every(([nnq, nnr]) =>
          this.mines.has(`${nnq},${nnr}`)
        )
    );

    // Remove temporary mine
    this.mines.delete(`${q},${r}`);

    // Reject if it would create either type of isolation
    return !wouldIsolateCell && !wouldIsolateMine;
  }

  private regenerateMines(safeQ: number, safeR: number) {
    // Clear existing mines and numbers
    this.mines.clear();

    // Get safe zone (clicked cell and its neighbors)
    const safeZone = new Set<string>();
    safeZone.add(`${safeQ},${safeR}`);
    this.getNeighbors(safeQ, safeR).forEach(([q, r]) => {
      safeZone.add(`${q},${r}`);
    });

    // Generate new mines avoiding safe zone
    const coords: [number, number][] = [];
    for (let q = -this.rings + 1; q < this.rings; q++) {
      for (let r = -this.rings + 1; r < this.rings; r++) {
        if (
          Math.max(Math.abs(q), Math.abs(r), Math.abs(-q - r)) < this.rings &&
          !safeZone.has(`${q},${r}`)
        ) {
          coords.push([q, r]);
        }
      }
    }

    // Place mines using the class method
    const mineCount = Math.floor(coords.length * this.getMinePercentage());
    for (let i = 0; i < mineCount; i++) {
      let placed = false;
      while (!placed && coords.length > 0) {
        const idx = Math.floor(Math.random() * coords.length);
        const [q, r] = coords[idx];

        if (this.tryPlaceMine(q, r)) {
          this.mines.add(`${q},${r}`);
          coords.splice(idx, 1);
          placed = true;
        } else {
          coords.splice(idx, 1);
        }
      }
    }

    // Store total non-mine cells for victory check
    this.totalCells = coords.length;
  }

  private checkVictory(): void {
    // Count revealed non-mine cells
    let revealedCount = 0;
    this.revealed.forEach((coord) => {
      if (!this.mines.has(coord)) {
        revealedCount++;
      }
    });

    if (revealedCount === this.totalCells) {
      this.hasWon = true;
      console.log(`Level ${this.level} completed!`);
    }
  }

  hasWonLevel(): boolean {
    return this.hasWon;
  }

  nextLevel(): void {
    this.level++;
    this.reset();
  }

  private reset(): void {
    this.mines.clear();
    this.revealed.clear();
    this.flagged.clear();
    this.isGameOver = false;
    this.hasWon = false;
    this.firstClick = true;
    this.generateMines(this.rings, this.getMinePercentage());
  }

  getLevel(): number {
    return this.level;
  }
}