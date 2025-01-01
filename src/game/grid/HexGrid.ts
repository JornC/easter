if (!this.state) return;

const hex = feature.get("hex");
const isGameOver = this.state.revealCell(hex.q, hex.r);

// Refresh all features since multiple cells might have been revealed
this.layer
  .getSource()
  ?.getFeatures()
  .forEach((f: Feature) => {
    if (!f.get("isOuterRing")) {
      this.styleHex(f);
    }
  });

if (isGameOver || this.state.hasWonLevel()) {
  // Game over - either hit a mine or won
  this.onGameOver();
}
