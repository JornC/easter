export type Coordinate = {
  q: number;
  r: number;
};

export function coordToString({ q, r }: Coordinate): string {
  return `${q},${r}`;
}

export function stringToCoord(str: string): Coordinate {
  const [q, r] = str.split(",").map(Number);
  return { q, r };
}

const STEP_INTERVAL_MS = 500; // 2 steps per second

export class GameOfLifeLogic {
  private aliveCells: Set<string>;
  private intervalId: number | null = null;
  private onUpdate: () => void;
  private running: boolean = false;

  constructor(onUpdate: () => void) {
    this.aliveCells = new Set();
    this.onUpdate = onUpdate;
  }

  isRunning(): boolean {
    return this.running;
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

  private countAliveNeighbors(coord: Coordinate): number {
    return this.getNeighbors(coord).filter((n) =>
      this.aliveCells.has(coordToString(n)),
    ).length;
  }

  toggleCell(coord: Coordinate): void {
    const key = coordToString(coord);
    if (this.aliveCells.has(key)) {
      this.aliveCells.delete(key);
    } else {
      this.aliveCells.add(key);
    }
    this.onUpdate();
  }

  setCell(coord: Coordinate, alive: boolean): void {
    const key = coordToString(coord);
    if (alive) {
      this.aliveCells.add(key);
    } else {
      this.aliveCells.delete(key);
    }
    this.onUpdate();
  }

  step(): void {
    if (this.aliveCells.size === 0) return;

    // Collect all cells to check: alive cells + their neighbors
    const cellsToCheck = new Set<string>();
    for (const key of this.aliveCells) {
      cellsToCheck.add(key);
      const coord = stringToCoord(key);
      for (const neighbor of this.getNeighbors(coord)) {
        cellsToCheck.add(coordToString(neighbor));
      }
    }

    // Apply rules to compute next generation
    // Using hexagonal rule 3,5/2:
    // - Birth: exactly 2 neighbors
    // - Survival: 3 or 5 neighbors
    const nextGeneration = new Set<string>();

    for (const key of cellsToCheck) {
      const coord = stringToCoord(key);
      const aliveNeighbors = this.countAliveNeighbors(coord);
      const isAlive = this.aliveCells.has(key);

      if (isAlive) {
        // Living cells: survive with 3 or 5 neighbors
        if (aliveNeighbors === 3 || aliveNeighbors === 5) {
          nextGeneration.add(key);
        }
      } else {
        // Dead cells: birth with exactly 2 neighbors
        if (aliveNeighbors === 2) {
          nextGeneration.add(key);
        }
      }
    }

    this.aliveCells = nextGeneration;
    this.onUpdate();
  }

  start(): void {
    if (this.intervalId !== null) return;
    this.running = true;
    this.intervalId = window.setInterval(() => this.step(), STEP_INTERVAL_MS);
  }

  stop(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.running = false;
  }

  toggle(): void {
    if (this.running) {
      this.stop();
    } else {
      this.start();
    }
  }

  clear(): void {
    this.aliveCells.clear();
    this.onUpdate();
  }

  isAlive(coord: Coordinate): boolean {
    return this.aliveCells.has(coordToString(coord));
  }

  getAliveCells(): Set<string> {
    return this.aliveCells;
  }

  getCellsToRender(): Set<string> {
    // Return alive cells + buffer rings around them
    const BUFFER_RINGS = 3;
    const cells = new Set<string>();

    for (const key of this.aliveCells) {
      cells.add(key);
      const coord = stringToCoord(key);
      this.addCellsInRadius(coord, BUFFER_RINGS, cells);
    }
    return cells;
  }

  private addCellsInRadius(
    center: Coordinate,
    radius: number,
    cells: Set<string>,
  ): void {
    // Add all cells within 'radius' rings of center
    for (let q = -radius; q <= radius; q++) {
      for (
        let r = Math.max(-radius, -q - radius);
        r <= Math.min(radius, -q + radius);
        r++
      ) {
        const coord = { q: center.q + q, r: center.r + r };
        cells.add(coordToString(coord));
      }
    }
  }

  dispose(): void {
    this.stop();
    this.aliveCells.clear();
  }
}
