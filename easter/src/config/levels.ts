import { GridColors } from "../game/grid/HexGrid";

const blueColors: GridColors = {
  outerRingFill: "#64b5f6",
  outerRingBorder: "#42a5f5",
  innerFill: "#bbdefb",
  innerBorder: "#64b5f6",
  innerHover: "#42a5f5",
  revealedFill: "#bbdefbaa",
};

const purpleColors: GridColors = {
  outerRingFill: "#ab47bc",
  outerRingBorder: "#9c27b0",
  innerFill: "#e1bee7",
  innerBorder: "#ab47bc",
  innerHover: "#9c27b0",
  revealedFill: "#e1bee7aa",
};

const orangeColors: GridColors = {
  outerRingFill: "#fb8c00",
  outerRingBorder: "#f57c00",
  innerFill: "#ffe0b2",
  innerBorder: "#fb8c00",
  innerHover: "#f57c00",
  revealedFill: "#ffe0b2aa",
};

const tealColors: GridColors = {
  outerRingFill: "#26a69a",
  outerRingBorder: "#00897b",
  innerFill: "#b2dfdb",
  innerBorder: "#26a69a",
  innerHover: "#00897b",
  revealedFill: "#b2dfdbaa",
};

export interface LevelConfig {
  rings: number;
  minePercentage: number;
  center: [number, number];
  hexSize: number;
  colors: GridColors;
}

export interface LocalityConfig {
  levels: LevelConfig[];
}

export const LOCALITIES: Record<"NL" | "UK", LocalityConfig> = {
  NL: {
    levels: [
      {
        rings: 5,
        minePercentage: 0.15,
        center: [182932, 461370],
        hexSize: 100,
        colors: blueColors,
      },
      {
        rings: 7,
        minePercentage: 0.18,
        center: [154641, 462552],
        hexSize: 100,
        colors: purpleColors,
      },
      {
        rings: 10,
        minePercentage: 0.2,
        center: [209268, 461102],
        hexSize: 100,
        colors: orangeColors,
      },
      {
        rings: 14,
        minePercentage: 0.22,
        center: [190190, 442243],
        hexSize: 100,
        colors: tealColors,
      },
    ],
  },
  UK: {
    levels: [
      {
        rings: 5,
        minePercentage: 0.15,
        center: [150853, 533333],
        hexSize: 400,
        colors: blueColors,
      },
      {
        rings: 7,
        minePercentage: 0.18,
        center: [319106, 176791],
        hexSize: 400,
        colors: purpleColors,
      },
      {
        rings: 10,
        minePercentage: 0.2,
        center: [326179, 673887],
        hexSize: 400,
        colors: orangeColors,
      },
      {
        rings: 14,
        minePercentage: 0.22,
        center: [460744, 451988],
        hexSize: 400,
        colors: tealColors,
      },
    ],
  },
};
