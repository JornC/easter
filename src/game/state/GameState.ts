private checkVictory(): void {
  // Check if all non-mine cells are revealed
  let revealedNonMines = 0;
  this.revealed.forEach((coord) => {
    if (!this.mines.has(coord)) {
      revealedNonMines++;
    }
  });

  // Check if all mines are flagged
  let correctlyFlaggedMines = 0;
  this.flagged.forEach((coord) => {
    if (this.mines.has(coord)) {
      correctlyFlaggedMines++;
    }
  });

  console.log("Victory Check:", {
    revealedNonMines,
    totalCells: this.totalCells,
    correctlyFlaggedMines,
    totalMines: this.mines.size,
    revealed: Array.from(this.revealed),
    flagged: Array.from(this.flagged),
    mines: Array.from(this.mines),
  });

  // Victory if all non-mines revealed AND all mines flagged
  if (
    revealedNonMines === this.totalCells &&
    correctlyFlaggedMines === this.mines.size
  ) {
    this.hasWon = true;
    this.isGameOver = true;  // Set game over state on victory
    console.log(`Level ${this.level} completed!`);
  }
}

private isValidCell(q: number, r: number): boolean {
  const maxDist = Math.max(Math.abs(q), Math.abs(r), Math.abs(-q - r));
  return maxDist <= this.rings - 1;  // Changed to include all valid cells
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
  if (this.isGameOver || this.isRevealed(q, r)) return this.isGameOver;

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
