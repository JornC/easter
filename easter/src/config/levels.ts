import { GridColors } from "../game/grid/HexGrid";

const blueColors: GridColors = {
  outerRingFill: "#64b5f6",
  outerRingBorder: "#42a5f5",
  innerFill: "#bbdefb",
  innerBorder: "#64b5f6",
  innerHover: "#42a5f5",
  revealedFill: "#e3f2fd",
};

const purpleColors: GridColors = {
  outerRingFill: "#ab47bc",
  outerRingBorder: "#9c27b0",
  innerFill: "#e1bee7",
  innerBorder: "#ab47bc",
  innerHover: "#9c27b0",
  revealedFill: "#f3e5f5",
};

const orangeColors: GridColors = {
  outerRingFill: "#fb8c00",
  outerRingBorder: "#f57c00",
  innerFill: "#ffe0b2",
  innerBorder: "#fb8c00",
  innerHover: "#f57c00",
  revealedFill: "#fff3e0",
};

const tealColors: GridColors = {
  outerRingFill: "#26a69a",
  outerRingBorder: "#00897b",
  innerFill: "#b2dfdb",
  innerBorder: "#26a69a",
  innerHover: "#00897b",
  revealedFill: "#e0f2f1",
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
        center: [155200, 463197],
        hexSize: 100,
        colors: purpleColors,
      },
      {
        rings: 10,
        minePercentage: 0.2,
        center: [210012, 461961],
        hexSize: 100,
        colors: orangeColors,
      },
      {
        rings: 14,
        minePercentage: 0.22,
        center: [191214, 443479],
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
        center: [530000, 180000],
        hexSize: 400,
        colors: blueColors,
      },
      {
        rings: 7,
        minePercentage: 0.18,
        center: [510000, 170000],
        hexSize: 400,
        colors: purpleColors,
      },
      {
        rings: 10,
        minePercentage: 0.2,
        center: [540000, 160000],
        hexSize: 400,
        colors: orangeColors,
      },
      {
        rings: 14,
        minePercentage: 0.22,
        center: [520000, 190000],
        hexSize: 400,
        colors: tealColors,
      },
    ],
  },
};
