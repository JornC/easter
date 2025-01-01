export interface LevelConfig {
  center: [number, number];
  rings: number;
  hexSize: number;
  minePercentage: number;
}

export interface LocalityConfig {
  name: string;
  projection: "EPSG:28992" | "EPSG:27700";
  baseHexSize: number;
  levels: LevelConfig[];
}

export const LOCALITIES: Record<string, LocalityConfig> = {
  NL: {
    name: "Netherlands",
    projection: "EPSG:28992",
    baseHexSize: 100,
    levels: [
      {
        center: [185000, 460000],
        rings: 3,
        hexSize: 100,
        minePercentage: 0.2,
      },
      // Add more Dutch levels
    ],
  },
  UK: {
    name: "United Kingdom",
    projection: "EPSG:27700",
    baseHexSize: 400,
    levels: [
      {
        center: [530000, 180000],
        rings: 3,
        hexSize: 400,
        minePercentage: 0.2,
      },
      // Add more UK levels
    ],
  },
};
