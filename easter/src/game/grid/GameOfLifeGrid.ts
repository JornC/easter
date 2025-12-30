import type { Map as OLMap } from "ol";
import { Polygon } from "ol/geom";
import { Feature } from "ol";
import { createOL, OLComponents } from "./ol-wrapper";
import {
  GameOfLifeLogic,
  Coordinate,
  stringToCoord,
} from "../state/GameOfLifeState";

export type PatternName = "glider" | "diagonal" | "hexagon" | "triangle" | "line" | "spark";

export const PATTERNS: Record<PatternName, Coordinate[]> = {
  glider: [
    { q: -3, r: 1 },
    { q: -1, r: 0 },
    { q: 1, r: -1 },
    { q: 3, r: -2 },
    { q: -2, r: 2 },
    { q: 2, r: 0 },
    { q: -1, r: 3 },
    { q: 1, r: 2 },
    { q: -1, r: -2 },
    { q: 1, r: -3 },
  ],
  diagonal: [
    // Diagonal stripe (10 cells)
    { q: -2, r: 2 }, { q: -1, r: 1 }, { q: 0, r: 0 }, { q: 1, r: -1 }, { q: 2, r: -2 },
    { q: -1, r: 2 }, { q: 0, r: 1 }, { q: 1, r: 0 }, { q: 2, r: -1 }, { q: 3, r: -2 },
  ],
  hexagon: [
    // Hexagon ring (6 cells)
    { q: 1, r: 0 }, { q: 0, r: 1 }, { q: -1, r: 1 },
    { q: -1, r: 0 }, { q: 0, r: -1 }, { q: 1, r: -1 },
  ],
  triangle: [
    // Filled triangle (10 cells)
    { q: 0, r: 0 },
    { q: -1, r: 1 }, { q: 0, r: 1 },
    { q: -2, r: 2 }, { q: -1, r: 2 }, { q: 0, r: 2 },
    { q: -3, r: 3 }, { q: -2, r: 3 }, { q: -1, r: 3 }, { q: 0, r: 3 },
  ],
  line: [
    // Straight line (6 cells)
    { q: -2, r: 0 }, { q: -1, r: 0 }, { q: 0, r: 0 },
    { q: 1, r: 0 }, { q: 2, r: 0 }, { q: 3, r: 0 },
  ],
  spark: [
    // Sparse pattern - each cell has ~2-3 neighbors
    { q: 0, r: 0 },
    { q: 2, r: 0 }, { q: -2, r: 0 },
    { q: 1, r: 1 }, { q: -1, r: -1 },
    { q: 1, r: -1 }, { q: -1, r: 1 },
  ],
};

declare const ol: any;

export interface GameOfLifeColors {
  alive: string;
  dead: string;
  border: string;
}

export interface GameOfLifeGridConfig {
  hexSize: number;
  colors: GameOfLifeColors;
}

export class GameOfLifeGrid {
  private map: OLMap;
  private layer: any;
  private config: GameOfLifeGridConfig;
  private gameLogic: GameOfLifeLogic;
  private OL: OLComponents;
  private featureCache: globalThis.Map<string, Feature> = new globalThis.Map();
  private sideLength: number;
  private clickListener: any;
  private pointerDownListener: any;
  private pointerMoveListener: any;
  private pointerUpListener: any;
  private isDrawing: boolean = false;
  private lastDrawnCell: string | null = null;
  private drawMode: boolean = true; // true = draw alive, false = erase
  private selectedPattern: PatternName = "glider";

  constructor(map: OLMap, config: GameOfLifeGridConfig, gameLogic: GameOfLifeLogic) {
    this.map = map;
    this.config = config;
    this.gameLogic = gameLogic;

    // Calculate hex dimensions (same formula as HexGrid for AERIUS alignment)
    const targetArea = Math.pow(this.config.hexSize, 2);
    this.sideLength = Math.sqrt((2 * targetArea) / (3 * Math.sqrt(3)));

    this.OL = createOL(ol);
    this.layer = new this.OL.Vector.layer({
      source: new this.OL.Vector.source(),
      declutter: false,
    });
    this.map.addLayer(this.layer);

    this.setupEventListeners();
    this.updateGrid();
  }

  private setupEventListeners() {
    const viewport = this.map.getViewport();

    // Click to toggle single cell (only when not using Ctrl)
    this.clickListener = (e: any) => {
      if (e.originalEvent.ctrlKey || e.originalEvent.metaKey) return; // Skip if Ctrl/Cmd is held (drag mode)

      const [x, y] = e.coordinate;
      const hexCoord = this.mapToHex(x, y);

      // Shift+click to draw selected pattern
      if (e.originalEvent.shiftKey) {
        this.drawPattern(hexCoord);
        return;
      }

      this.gameLogic.toggleCell(hexCoord);
    };

    // Ctrl+drag (or Cmd+drag on Mac) to draw multiple cells
    this.pointerDownListener = (e: PointerEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      this.isDrawing = true;
      this.lastDrawnCell = null;

      const pixel = this.map.getEventPixel(e);
      const coord = this.map.getCoordinateFromPixel(pixel);
      if (coord) {
        const hexCoord = this.mapToHex(coord[0], coord[1]);
        const key = `${hexCoord.q},${hexCoord.r}`;
        // Determine draw mode based on first cell clicked
        this.drawMode = !this.gameLogic.isAlive(hexCoord);
        this.gameLogic.setCell(hexCoord, this.drawMode);
        this.lastDrawnCell = key;
      }
    };

    this.pointerMoveListener = (e: PointerEvent) => {
      if (!this.isDrawing) return;

      const pixel = this.map.getEventPixel(e);
      const coord = this.map.getCoordinateFromPixel(pixel);
      if (coord) {
        const hexCoord = this.mapToHex(coord[0], coord[1]);
        const key = `${hexCoord.q},${hexCoord.r}`;
        // Only draw if we moved to a new cell
        if (key !== this.lastDrawnCell) {
          this.gameLogic.setCell(hexCoord, this.drawMode);
          this.lastDrawnCell = key;
        }
      }
    };

    this.pointerUpListener = () => {
      this.isDrawing = false;
      this.lastDrawnCell = null;
    };

    this.map.on("click", this.clickListener);
    viewport.addEventListener("pointerdown", this.pointerDownListener);
    viewport.addEventListener("pointermove", this.pointerMoveListener);
    viewport.addEventListener("pointerup", this.pointerUpListener);
    viewport.addEventListener("pointerleave", this.pointerUpListener);
  }

  // Convert map coordinates to hex coordinates
  // For flat-top hexagons:
  // q = (2/3 * x) / size
  // r = (-1/3 * x + sqrt(3)/3 * y) / size
  private mapToHex(x: number, y: number): Coordinate {
    const size = this.sideLength;
    const q = ((2 / 3) * x) / size;
    const r = ((-1 / 3) * x + (Math.sqrt(3) / 3) * y) / size;
    return this.hexRound(q, r);
  }

  // Round fractional hex coordinates to nearest hex
  private hexRound(q: number, r: number): Coordinate {
    const s = -q - r;

    let rq = Math.round(q);
    let rr = Math.round(r);
    const rs = Math.round(s);

    const qDiff = Math.abs(rq - q);
    const rDiff = Math.abs(rr - r);
    const sDiff = Math.abs(rs - s);

    if (qDiff > rDiff && qDiff > sDiff) {
      rq = -rr - rs;
    } else if (rDiff > sDiff) {
      rr = -rq - rs;
    }

    return { q: rq, r: rr };
  }

  // Convert hex coordinates to map center point
  private hexToMap(coord: Coordinate): [number, number] {
    const size = this.sideLength;
    const x = size * (3 / 2) * coord.q;
    const y = size * ((Math.sqrt(3) / 2) * coord.q + Math.sqrt(3) * coord.r);
    return [x, y];
  }

  // Get the 6 corners of a hexagon in map coordinates
  private getHexCorners(coord: Coordinate): [number, number][] {
    const [cx, cy] = this.hexToMap(coord);
    const corners: [number, number][] = [];

    for (let i = 0; i < 6; i++) {
      const angleDeg = 60 * i; // Flat-top: start at 0 degrees
      const angleRad = (Math.PI / 180) * angleDeg;
      corners.push([
        cx + this.sideLength * Math.cos(angleRad),
        cy + this.sideLength * Math.sin(angleRad),
      ]);
    }

    return corners;
  }

  private createHexFeature(coord: Coordinate): Feature {
    const corners = this.getHexCorners(coord);
    const feature = new Feature({
      geometry: new Polygon([[...corners, corners[0]]]), // Close the polygon
      coord: coord,
    });
    return feature;
  }

  private styleFeature(feature: Feature, isAlive: boolean): void {
    const style = new this.OL.Style.base({
      stroke: new this.OL.Style.stroke({
        color: this.config.colors.border,
        width: 2,
      }),
      fill: new this.OL.Style.fill({
        color: isAlive ? this.config.colors.alive : this.config.colors.dead,
      }),
    });
    feature.setStyle(style);
  }

  updateGrid(): void {
    const cellsToRender = this.gameLogic.getCellsToRender();
    const source = this.layer.getSource();

    // Remove features that are no longer needed
    const keysToRemove: string[] = [];
    for (const [key, feature] of this.featureCache) {
      if (!cellsToRender.has(key)) {
        source.removeFeature(feature);
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      this.featureCache.delete(key);
    }

    // Add or update features
    for (const key of cellsToRender) {
      const coord = stringToCoord(key);
      const isAlive = this.gameLogic.isAlive(coord);

      let feature = this.featureCache.get(key);
      if (!feature) {
        feature = this.createHexFeature(coord);
        this.featureCache.set(key, feature);
        source.addFeature(feature);
      }

      this.styleFeature(feature, isAlive);
    }

    this.map.render();
  }

  // Draw the selected pattern at the given center coordinate
  private drawPattern(center: Coordinate): void {
    const offsets = PATTERNS[this.selectedPattern];
    for (const offset of offsets) {
      const coord = {
        q: center.q + offset.q,
        r: center.r + offset.r,
      };
      this.gameLogic.setCell(coord, true);
    }
  }

  setPattern(pattern: PatternName): void {
    this.selectedPattern = pattern;
  }

  getPattern(): PatternName {
    return this.selectedPattern;
  }

  dispose(): void {
    if (this.map) {
      const viewport = this.map.getViewport();
      this.map.un("click", this.clickListener);
      viewport.removeEventListener("pointerdown", this.pointerDownListener);
      viewport.removeEventListener("pointermove", this.pointerMoveListener);
      viewport.removeEventListener("pointerup", this.pointerUpListener);
      viewport.removeEventListener("pointerleave", this.pointerUpListener);
      this.map.removeLayer(this.layer);
      this.layer.getSource().clear();
      this.layer = null;
    }
    this.featureCache.clear();
  }
}
