import type { Map } from "ol";
import { defineHex, Grid, Orientation, spiral } from "honeycomb-grid";
import { Polygon } from "ol/geom";
import { Feature } from "ol";
import { createOL, OLComponents } from "./ol-wrapper";
import { GameState } from "../state/GameState";

declare const ol: any;

export interface GridConfig {
  center: [number, number];
  rings: number;
  hexSize: number;
  colors: {
    outerRingFill: string;
    outerRingBorder: string;
    innerFill: string;
    innerBorder: string;
    innerHover: string;
    revealedFill: string;
  };
}

export const defaultColors = {
  outerRingFill: "#3392e0",
  outerRingBorder: "#ffffff",
  innerFill: "#84bff0",
  innerBorder: "#3392e0",
  innerHover: "#cc6666",
  revealedFill: "#ffffff33",
} as const;

export class HexGrid {
  private map: Map;
  private layer: any;
  private config: GridConfig;
  private state: GameState | null = null;
  private onGameOver: Function;
  private OL: OLComponents;

  constructor(
    map: Map,
    config: GridConfig = {
      center: [185000, 460000],
      rings: 5,
      hexSize: 100,
      colors: defaultColors,
    },
    state: GameState,
    onGameOver: Function
  ) {
    this.map = map;
    this.config = config;
    this.state = state;
    this.onGameOver = onGameOver;

    this.OL = createOL(ol);
    this.layer = new this.OL.Vector.layer({
      source: new this.OL.Vector.source(),
      declutter: false,
      style: new this.OL.Style.base({
        stroke: new this.OL.Style.stroke({
          color: "blue",
          width: 2,
        }),
        fill: new this.OL.Style.fill({
          color: "rgba(0, 0, 255, 0.1)",
        }),
      }),
    });
    this.map.addLayer(this.layer);

    this.createGrid();
    this.zoomToGrid();
  }

  private createGrid() {
    const Hex = defineHex({
      dimensions: this.config.hexSize,
      orientation: Orientation.FLAT,
    });

    const grid = new Grid(Hex, spiral({ radius: this.config.rings }));

    // Calculate offset to center the grid on the target location
    const [centerX, centerY] = this.config.center;
    const gridWidthMeters = this.config.rings * this.config.hexSize * 1.5;
    const gridHeightMeters =
      this.config.rings * this.config.hexSize * Math.sqrt(3);
    const offsetX = centerX - gridWidthMeters / 2;
    const offsetY = centerY - gridHeightMeters / 2;

    grid.forEach((hex) => {
      const isOuterRing =
        Math.max(Math.abs(hex.q), Math.abs(hex.r), Math.abs(-hex.q - hex.r)) ===
        this.config.rings;

      const feature = new Feature({
        geometry: new Polygon([
          [
            ...hex.corners.map((corner) => [
              offsetX + corner.x,
              offsetY + corner.y,
            ]),
            [offsetX + hex.corners[0].x, offsetY + hex.corners[0].y],
          ], // Close polygon
        ]),
        isOuterRing: isOuterRing,
        hex: hex,
      });

      this.styleHex(feature);
      this.layer.getSource()?.addFeature(feature);
    });

    // Add hover interaction
    let hoveredFeature: Feature | null = null;

    this.map.on("pointermove", (e) => {
      const feature = this.map.forEachFeatureAtPixel(e.pixel, (f) => f);

      // Reset previous hover
      if (hoveredFeature) {
        this.styleHex(hoveredFeature);
        hoveredFeature = null;
      }

      // Apply new hover
      if (feature instanceof Feature && !feature.get("isOuterRing")) {
        hoveredFeature = feature;
        this.styleHex(feature, true);
      }

      this.map.render();
    });

    // Remove hover when leaving map
    this.map.getViewport().addEventListener("mouseout", () => {
      if (hoveredFeature) {
        this.styleHex(hoveredFeature);
        hoveredFeature = null;
        this.map.render();
      }
    });

    // Add click handler
    this.map.on("click", (e) => {
      const feature = this.map.forEachFeatureAtPixel(e.pixel, (f) => f);
      if (feature instanceof Feature && !feature.get("isOuterRing")) {
        this.handleHexClick(feature);
      }
    });

    // Add right-click handler
    this.map.getViewport().addEventListener("contextmenu", (e) => {
      e.preventDefault(); // Prevent default context menu

      const pixel = this.map.getEventPixel(e);
      const feature = this.map.forEachFeatureAtPixel(pixel, (f) => f);

      if (feature instanceof Feature && !feature.get("isOuterRing")) {
        this.handleRightClick(feature);
      }
    });
  }

  private styleHex(feature: Feature, isHovered: boolean = false) {
    const isOuterRing = feature.get("isOuterRing");
    const hex = feature.get("hex");

    // Early return if this isn't one of our hex features
    if (!hex) {
      return;
    }

    if (!isOuterRing && this.state) {
      const isMine = this.state.isMine(hex.q, hex.r);
      const number = this.state.getNumber(hex.q, hex.r);
      const isRevealed = this.state.isRevealed(hex.q, hex.r);
      const isGameOver = this.state.getGameOver();
      const isFlagged = this.state.isFlagged(hex.q, hex.r);

      const style = new this.OL.Style.base({
        stroke: new this.OL.Style.stroke({
          color: isOuterRing
            ? this.config.colors.outerRingBorder
            : this.config.colors.innerBorder,
          width: isHovered ? 3 : 2,
        }),
        fill: new this.OL.Style.fill({
          color: isOuterRing
            ? this.config.colors.outerRingFill
            : isRevealed
            ? isMine
              ? "#ff0000"
              : this.config.colors.revealedFill
            : isHovered
            ? this.config.colors.innerHover
            : this.config.colors.innerFill,
        }),
        text:
          isRevealed || (isGameOver && isMine)
            ? new this.OL.Style.text({
                text: isMine ? "💣" : number > 0 ? number.toString() : "",
                font: "bold 24px Arial",
                fill: new this.OL.Style.fill({
                  color: isMine ? "#ffffff" : "#000000",
                }),
                stroke: new this.OL.Style.stroke({
                  color: "#ffffff",
                  width: 3,
                }),
                textAlign: "center",
                textBaseline: "middle",
              })
            : isFlagged
            ? new this.OL.Style.text({
                text: "❌",
                font: "bold 24px Arial",
                fill: new this.OL.Style.fill({ color: "#ff0000" }),
                stroke: new this.OL.Style.stroke({
                  color: "#ffffff",
                  width: 3,
                }),
                textAlign: "center",
                textBaseline: "middle",
              })
            : undefined,
      });

      feature.setStyle(style);

      // Add victory animation if won
      if (this.state?.hasWonLevel()) {
        style.setZIndex(10); // Bring to front during victory
        // Could add more visual effects here
      }

      return style;
    }

    const style = new this.OL.Style.base({
      stroke: new this.OL.Style.stroke({
        color: isOuterRing
          ? this.config.colors.outerRingBorder
          : this.config.colors.innerBorder,
        width: isHovered ? 3 : 2,
      }),
      fill: new this.OL.Style.fill({
        color: isOuterRing
          ? this.config.colors.outerRingFill
          : isHovered
          ? this.config.colors.innerHover
          : this.config.colors.innerFill,
      }),
    });

    feature.setStyle(style);
    return style;
  }

  private handleHexClick(feature: Feature) {
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
      this.onGameOver(); // Call the game over handler instead of onExit
    }
  }

  private zoomToGrid() {
    const source = this.layer.getSource();
    if (source) {
      const extent = source.getExtent();
      this.map.getView().fit(extent, {
        padding: [50, 50, 50, 50],
        duration: 1000,
      });
    }
  }

  private handleRightClick(feature: Feature) {
    if (!this.state) return;

    const hex = feature.get("hex");
    if (!this.state.isRevealed(hex.q, hex.r)) {
      this.state.toggleFlag(hex.q, hex.r);
      this.styleHex(feature);
    }
  }

  refreshGrid() {
    this.layer.getSource()?.clear();
    this.createGrid();
  }

  dispose() {
    if (this.map) {
      this.map.removeLayer(this.layer);
    }
  }

  public resetGrid(config: GridConfig): void {
    this.layer.getSource()?.clear();
    this.config = config;
    this.createGrid();
  }

  public updateHexStyles(): void {
    this.layer
      .getSource()
      ?.getFeatures()
      .forEach((f: Feature) => {
        if (!f.get("isOuterRing")) {
          this.styleHex(f);
        }
      });
  }
}
