import type { Map } from "ol";
import { defineHex, Grid, Orientation, spiral } from "honeycomb-grid";
import { Polygon } from "ol/geom";
import { Feature } from "ol";
import { createOL, OLComponents } from "./ol-wrapper";
import { GameLogic, Coordinate } from "../state/GameState";

declare const ol: any;

export interface GridColors {
  outerRingFill: string;
  outerRingBorder: string;
  innerFill: string;
  innerBorder: string;
  innerHover: string;
  revealedFill: string;
}

export interface GridConfig {
  center: [number, number];
  rings: number;
  hexSize: number;
  colors: GridColors;
}

export const colorSchemes = {
  blue: {
    outerRingFill: "#3392e0",
    outerRingBorder: "#ffffff",
    innerFill: "#84bff0",
    innerBorder: "#3392e0",
    innerHover: "#cc6666",
    revealedFill: "#ffffff33",
  },
  green: {
    outerRingFill: "#4CAF50",
    outerRingBorder: "#ffffff",
    innerFill: "#81C784",
    innerBorder: "#4CAF50",
    innerHover: "#cc6666",
    revealedFill: "#ffffff33",
  },
  purple: {
    outerRingFill: "#9C27B0",
    outerRingBorder: "#ffffff",
    innerFill: "#CE93D8",
    innerBorder: "#9C27B0",
    innerHover: "#cc6666",
    revealedFill: "#ffffff33",
  },
  orange: {
    outerRingFill: "#FF9800",
    outerRingBorder: "#ffffff",
    innerFill: "#FFB74D",
    innerBorder: "#FF9800",
    innerHover: "#cc6666",
    revealedFill: "#ffffff33",
  },
  teal: {
    outerRingFill: "#009688",
    outerRingBorder: "#ffffff",
    innerFill: "#4DB6AC",
    innerBorder: "#009688",
    innerHover: "#cc6666",
    revealedFill: "#ffffff33",
  },
} as const;

export const defaultColors = colorSchemes.blue;

export class HexGrid {
  private map: Map;
  private layer: any;
  private config: GridConfig;
  private gameLogic: GameLogic;
  private onGameOver: Function;
  private OL: OLComponents;
  private clickListener: any;
  private moveListener: any;
  private outListener: any;
  private contextListener: any;

  constructor(
    map: Map,
    config: GridConfig = {
      center: [185000, 460000],
      rings: 5,
      hexSize: 100,
      colors: defaultColors,
    },
    gameLogic: GameLogic,
    onGameOver: Function
  ) {
    this.map = map;
    this.config = config;
    this.gameLogic = gameLogic;
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
    this.setupEventListeners();
    this.zoomToGrid();
  }

  private setupEventListeners() {
    // Add hover interaction
    let hoveredFeature: Feature | null = null;

    this.moveListener = (e: any) => {
      const feature = this.map.forEachFeatureAtPixel(e.pixel, (f: any) => f);

      if (hoveredFeature) {
        this.styleHex(hoveredFeature);
        hoveredFeature = null;
      }

      if (feature instanceof Feature && !feature.get("isOuterRing")) {
        hoveredFeature = feature;
        this.styleHex(feature, true);
      }

      this.map.render();
    };

    this.outListener = () => {
      if (hoveredFeature) {
        this.styleHex(hoveredFeature);
        hoveredFeature = null;
        this.map.render();
      }
    };

    this.clickListener = (e: any) => {
      const feature = this.map.forEachFeatureAtPixel(e.pixel, (f: any) => f);
      if (feature instanceof Feature && !feature.get("isOuterRing")) {
        this.handleHexClick(feature);
      }
    };

    this.contextListener = (e: any) => {
      e.preventDefault();
      const pixel = this.map.getEventPixel(e);
      const feature = this.map.forEachFeatureAtPixel(pixel, (f: any) => f);

      if (feature instanceof Feature && !feature.get("isOuterRing")) {
        this.handleRightClick(feature);
      }
    };

    this.map.on("pointermove", this.moveListener);
    this.map.getViewport().addEventListener("mouseout", this.outListener);
    this.map.on("click", this.clickListener);
    this.map
      .getViewport()
      .addEventListener("contextmenu", this.contextListener);
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
          ],
        ]),
        isOuterRing: isOuterRing,
        hex: hex,
      });

      this.styleHex(feature);
      this.layer.getSource()?.addFeature(feature);
    });
  }

  private styleHex(feature: Feature, isHovered: boolean = false) {
    const isOuterRing = feature.get("isOuterRing");
    const hex = feature.get("hex");

    if (!hex) return;

    if (!isOuterRing) {
      const coord: Coordinate = { q: hex.q, r: hex.r };
      const isMine = this.gameLogic.isMine(coord);
      const number = this.gameLogic.getNumber(coord);
      const isRevealed = this.gameLogic.isRevealed(coord);
      const isFlagged = this.gameLogic.isFlagged(coord);
      const gameState = this.gameLogic.getState();

      const style = new this.OL.Style.base({
        stroke: new this.OL.Style.stroke({
          color: this.config.colors.innerBorder,
          width: isHovered ? 3 : 2,
        }),
        fill: new this.OL.Style.fill({
          color: isRevealed
            ? isMine
              ? "#ff0000"
              : this.config.colors.revealedFill
            : isHovered
            ? this.config.colors.innerHover
            : this.config.colors.innerFill,
        }),
        text:
          isRevealed || (gameState === "defeat" && isMine && !isFlagged)
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

      if (gameState === "victory") {
        style.setZIndex(10);
      }

      return style;
    }

    const style = new this.OL.Style.base({
      stroke: new this.OL.Style.stroke({
        color: this.config.colors.outerRingBorder,
        width: isHovered ? 3 : 2,
      }),
      fill: new this.OL.Style.fill({
        color: this.config.colors.outerRingFill,
      }),
    });

    feature.setStyle(style);
    return style;
  }

  private handleHexClick(feature: Feature) {
    const hex = feature.get("hex");
    const coord: Coordinate = { q: hex.q, r: hex.r };

    const prevState = this.gameLogic.getState();
    this.gameLogic.revealCell(coord);
    const newState = this.gameLogic.getState();

    this.updateAllHexStyles();

    if (
      newState !== prevState &&
      (newState === "victory" || newState === "defeat")
    ) {
      this.onGameOver();
    }
  }

  private handleRightClick(feature: Feature) {
    const hex = feature.get("hex");
    const coord: Coordinate = { q: hex.q, r: hex.r };

    const prevState = this.gameLogic.getState();
    this.gameLogic.toggleFlag(coord);
    const newState = this.gameLogic.getState();

    this.updateAllHexStyles();

    if (newState !== prevState && newState === "victory") {
      this.onGameOver();
    }
  }

  private updateAllHexStyles(): void {
    this.layer
      .getSource()
      ?.getFeatures()
      .forEach((f: Feature) => {
        if (!f.get("isOuterRing")) {
          this.styleHex(f);
        }
      });
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

  dispose() {
    if (this.map) {
      // Remove event listeners
      this.map.un("pointermove", this.moveListener);
      this.map.getViewport().removeEventListener("mouseout", this.outListener);
      this.map.un("click", this.clickListener);
      this.map
        .getViewport()
        .removeEventListener("contextmenu", this.contextListener);

      // Remove layer
      this.map.removeLayer(this.layer);

      // Clear source
      this.layer.getSource().clear();
      this.layer = null;
    }
  }

  public resetGrid(config: GridConfig): void {
    this.layer.getSource()?.clear();
    this.config = config;
    this.createGrid();
  }

  public updateHexStyles(): void {
    this.updateAllHexStyles();
  }
}
